// pickup-point/pickup-point.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { PickupPoint } from './entities/pickup-point.entity';
import { CreatePickupPointDto } from './dto/create-pickup-point.dto';
import { UpdatePickupPointDto } from './dto/update-pickup-point.dto';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/common/types/roles.enum';
import { Hash } from 'src/users/utils/hash';
import { QueryPickupPointDto } from './dto/filter.dto';
import { City } from 'src/wilaya/entities/city.entity';

@Injectable()
export class PickupPointService {
  constructor(
    @InjectRepository(PickupPoint)
    private readonly pickupPointRepository: Repository<PickupPoint>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  /**
   * Create a new pickup point with its admin user
   * Only Hub Admin can create pickup points
   * Returns flattened data compatible with Hub structure
   */
  async create(createPickupPointDto: CreatePickupPointDto, userId: number) {
    // ✅ Vérifier que l'utilisateur existe et récupérer ses infos
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const {
      name,
      address,
      latitude,
      longitude,
      cityId,
      phoneNumber,
      notes,
      isActive,
      email,
      password,
      prenom,
      nom,
      adminPhoneNumber,
      fileName,
    } = createPickupPointDto;

    // ✅ Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email existe déjà');
    }

    // ✅ Vérifier que la ville existe
    const cityExists = await this.cityRepository.findOne({
      where: { id: cityId },
    });

    if (!cityExists) {
      throw new BadRequestException("La ville spécifiée n'existe pas");
    }

    // ✅ Hash password
    const hashedPassword = await Hash.hash(password);

    // ✅ Créer l'admin user
    const adminUser = this.userRepository.create({
      email,
      password: hashedPassword,
      prenom,
      nom,
      fullName: `${prenom || ''} ${nom || ''}`.trim(),
      phoneNumber: adminPhoneNumber || phoneNumber, // Utiliser adminPhoneNumber si fourni, sinon phoneNumber du point
      role: UserRole.PICKUP_POINT_ADMIN,
      imgUrl: fileName || null,
      isEmailVerified: false,
      blocked: false,
    });

    const savedAdmin = await this.userRepository.save(adminUser);

    try {
      // ✅ Créer le pickup point
      const pickupPoint = this.pickupPointRepository.create({
        name,
        address,
        latitude,
        longitude,
        cityId,
        phoneNumber,
        notes,
        adminUserId: savedAdmin.id,
        isActive: isActive !== undefined ? isActive : true,
      });

      const savedPickupPoint = await this.pickupPointRepository.save(
        pickupPoint,
      );

      // ✅ Fetch complete pickup point with relations
      const completePickupPoint = await this.pickupPointRepository.findOne({
        where: { id: savedPickupPoint.id },
        relations: ['admin', 'city', 'city.wilaya'],
      });

      // ✅ Return flattened structure
      return this.flattenPickupPointData(completePickupPoint);
    } catch (error) {
      // ✅ Si la création du pickup point échoue, supprimer l'admin créé
      await this.userRepository.delete(savedAdmin.id);

      // ✅ Re-throw l'erreur
      if (error.code === '23505') {
        // Postgres unique constraint violation
        throw new ConflictException(
          'Un pickup point avec ces informations existe déjà',
        );
      }

      throw new InternalServerErrorException(
        'Erreur lors de la création du Pickup Point: ' + error.message,
      );
    }
  }

  /**
   * Get all pickup points with flattened data
   * - Pickup Point Admin : seulement son pickup point
   * - Super Admin : tous les pickup points
   */
  async findAll(queryDto: QueryPickupPointDto, currentUser: number) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      wilayaCode,
    } = queryDto;

    const skip = (page - 1) * limit;

    // ✅ Build where clause
    const where: any = {};

    // Search filter (searches in pickup point name)
    if (search) {
      where.name = Like(`%${search}%`);
    }

    // Wilaya filter
    if (wilayaCode) {
      where.city = {
        wilaya: {
          code: wilayaCode,
        },
      };
    }

    const [pickupPoints, total] = await this.pickupPointRepository.findAndCount(
      {
        where,
        relations: ['admin', 'city', 'city.wilaya'],
        order: { [sortBy]: sortOrder },
        skip,
        take: limit,
      },
    );

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: pickupPoints.map((pp) => this.flattenPickupPointData(pp)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  /**
   * Get single pickup point by ID with flattened data
   */
  async findOne(id: number, userId: number) {
    // ✅ Vérifier que l'utilisateur existe et récupérer ses infos
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    const pickupPoint = await this.pickupPointRepository.findOne({
      where: { id },
      relations: ['admin', 'city', 'city.wilaya'],
    });

    if (!pickupPoint) {
      throw new NotFoundException(`Pickup Point with ID ${id} not found`);
    }

    // ✅ Permission check
    if (currentUser) {
      if (currentUser.role === UserRole.PICKUP_POINT_ADMIN) {
        if (pickupPoint.adminUserId !== currentUser.id) {
          throw new ForbiddenException(
            'Vous ne pouvez pas voir ce Pickup Point',
          );
        }
      }
    }

    return this.flattenPickupPointData(pickupPoint);
  }

  /**
   * Get pickup point by admin user ID
   */
  async findByAdminUserId(adminUserId: number) {
    const pickupPoint = await this.pickupPointRepository.findOne({
      where: { adminUserId },
      relations: ['admin', 'city', 'city.wilaya'],
    });

    if (!pickupPoint) {
      throw new NotFoundException('Pickup Point not found for this admin');
    }

    return this.flattenPickupPointData(pickupPoint);
  }

  /**
   * Update pickup point and admin data
   */
  async update(
    id: number,
    updatePickupPointDto: UpdatePickupPointDto,
    userId: number,
  ) {
    // ✅ Vérifier que l'utilisateur existe et récupérer ses infos
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!currentUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const pickupPoint = await this.pickupPointRepository.findOne({
      where: { id },
      relations: ['admin'],
    });

    if (!pickupPoint) {
      throw new NotFoundException(`Pickup Point with ID ${id} not found`);
    }

    // ✅ Permission check

    if (currentUser.role === UserRole.PICKUP_POINT_ADMIN) {
      if (pickupPoint.adminUserId !== currentUser.id) {
        throw new ForbiddenException(
          'Vous ne pouvez pas modifier ce Pickup Point',
        );
      }
    }
    const {
      name,
      address,
      latitude,
      longitude,
      cityId,
      phoneNumber,
      notes,
      isActive,
      email,
      password,
      prenom,
      nom,
      adminPhoneNumber,
      fileName,
    } = updatePickupPointDto;

    // ✅ Update pickup point fields
    if (name !== undefined) pickupPoint.name = name;
    if (address !== undefined) pickupPoint.address = address;
    if (latitude !== undefined) pickupPoint.latitude = latitude;
    if (longitude !== undefined) pickupPoint.longitude = longitude;

    // ✅ FIX: Vérifier que la ville existe si cityId est fourni
    if (cityId !== undefined) {
      const city = await this.cityRepository.findOne({ where: { id: cityId } });
      if (!city) {
        throw new NotFoundException(`City with ID ${cityId} not found`);
      }
      pickupPoint.cityId = cityId;
      pickupPoint.city = city; // ← Mettre à jour la relation aussi
    }

    if (phoneNumber !== undefined) pickupPoint.phoneNumber = phoneNumber;
    if (notes !== undefined) pickupPoint.notes = notes;
    if (isActive !== undefined) pickupPoint.isActive = isActive;
    pickupPoint.updatedAt = new Date();

    await this.pickupPointRepository.save(pickupPoint);

    // ✅ Update admin user fields
    const adminUser = pickupPoint.admin;
    let adminUpdated = false;

    if (email !== undefined && email !== adminUser.email) {
      // Check if new email already exists
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser && existingUser.id !== adminUser.id) {
        throw new ConflictException('Email already exists');
      }
      adminUser.email = email;
      adminUpdated = true;
    }

    if (password !== undefined) {
      adminUser.password = await Hash.hash(password);
      adminUpdated = true;
    }

    if (prenom !== undefined) {
      adminUser.prenom = prenom;
      adminUpdated = true;
    }

    if (nom !== undefined) {
      adminUser.nom = nom;
      adminUpdated = true;
    }

    if (prenom !== undefined || nom !== undefined) {
      adminUser.fullName = `${adminUser.prenom || ''} ${
        adminUser.nom || ''
      }`.trim();
    }

    if (adminPhoneNumber !== undefined) {
      adminUser.phoneNumber = adminPhoneNumber;
      adminUpdated = true;
    }

    if (fileName !== undefined) {
      adminUser.imgUrl = fileName;
      adminUpdated = true;
    }

    if (adminUpdated) {
      await this.userRepository.save(adminUser);
    }

    // ✅ Fetch updated pickup point with relations
    const updatedPickupPoint = await this.pickupPointRepository.findOne({
      where: { id },
      relations: ['admin', 'city', 'city.wilaya'],
    });

    return this.flattenPickupPointData(updatedPickupPoint);
  }

  /**
   * Update pickup point profile by admin user ID (for logged-in pickup point admin)
   */
  async updateProfile(
    adminUserId: number,
    updatePickupPointDto: UpdatePickupPointDto,
  ) {
    // Find pickup point by admin user ID
    const pickupPoint = await this.pickupPointRepository.findOne({
      where: { adminUserId },
      relations: ['admin', 'city', 'city.wilaya'],
    });

    if (!pickupPoint) {
      throw new NotFoundException('Pickup Point not found for this admin user');
    }

    const {
      name,
      address,
      latitude,
      longitude,
      cityId,
      phoneNumber,
      notes,
      isActive,
      email,
      password,
      prenom,
      nom,
      adminPhoneNumber,
      fileName,
    } = updatePickupPointDto;

    // Update pickup point fields
    if (name !== undefined) pickupPoint.name = name;
    if (address !== undefined) pickupPoint.address = address;
    if (latitude !== undefined) pickupPoint.latitude = latitude;
    if (longitude !== undefined) pickupPoint.longitude = longitude;
    if (cityId !== undefined) pickupPoint.cityId = cityId;
    if (phoneNumber !== undefined) pickupPoint.phoneNumber = phoneNumber;
    if (notes !== undefined) pickupPoint.notes = notes;
    if (isActive !== undefined) pickupPoint.isActive = isActive;
    pickupPoint.updatedAt = new Date();

    await this.pickupPointRepository.save(pickupPoint);

    // Update admin user fields
    const adminUser = pickupPoint.admin;
    let adminUpdated = false;

    if (email !== undefined && email !== adminUser.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });
      if (existingUser && existingUser.id !== adminUser.id) {
        throw new ConflictException('Email already exists');
      }
      adminUser.email = email;
      adminUpdated = true;
    }

    if (password !== undefined) {
      adminUser.password = await Hash.hash(password);
      adminUpdated = true;
    }

    if (prenom !== undefined) {
      adminUser.prenom = prenom;
      adminUpdated = true;
    }

    if (nom !== undefined) {
      adminUser.nom = nom;
      adminUpdated = true;
    }

    if (prenom !== undefined || nom !== undefined) {
      adminUser.fullName = `${adminUser.prenom || ''} ${
        adminUser.nom || ''
      }`.trim();
    }

    if (adminPhoneNumber !== undefined) {
      adminUser.phoneNumber = adminPhoneNumber;
      adminUpdated = true;
    }

    if (fileName !== undefined) {
      adminUser.imgUrl = fileName;
      adminUpdated = true;
    }

    if (adminUpdated) {
      await this.userRepository.save(adminUser);
    }

    // Fetch updated pickup point with relations
    const updatedPickupPoint = await this.pickupPointRepository.findOne({
      where: { id: pickupPoint.id },
      relations: ['admin', 'city', 'city.wilaya'],
    });

    return this.flattenPickupPointData(updatedPickupPoint);
  }

  /**
   * Delete pickup point and its admin user
   */
  async remove(id: number, currentUser: User) {
    const pickupPoint = await this.pickupPointRepository.findOne({
      where: { id },
      relations: ['admin'],
    });

    if (!pickupPoint) {
      throw new NotFoundException(`Pickup Point with ID ${id} not found`);
    }

    // ✅ Seul le hub admin peut supprimer
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Seul le Hub Admin peut supprimer un Pickup Point',
      );
    }

    const adminUserId = pickupPoint.adminUserId;

    // Delete pickup point first
    await this.pickupPointRepository.remove(pickupPoint);

    // Delete admin user
    await this.userRepository.delete(adminUserId);

    return { message: 'Pickup Point and admin user deleted successfully' };
  }

  /**
   * Flatten pickup point and admin data into single object (backward compatible with Hub)
   */
  private flattenPickupPointData(pickupPoint: PickupPoint) {
    return {
      // Pickup Point fields
      id: pickupPoint.id,
      name: pickupPoint.name,
      address: pickupPoint.address,
      latitude: pickupPoint.latitude,
      longitude: pickupPoint.longitude,
      cityId: pickupPoint.cityId,
      city: pickupPoint.city,
      phoneNumber: pickupPoint.phoneNumber,
      notes: pickupPoint.notes,
      isActive: pickupPoint.isActive,
      createdAt: pickupPoint.createdAt,
      updatedAt: pickupPoint.updatedAt,

      // Admin user fields (flattened)
      email: pickupPoint.admin?.email,
      nom: pickupPoint.admin?.nom,
      prenom: pickupPoint.admin?.prenom,
      fullName: pickupPoint.admin?.fullName,
      adminPhoneNumber: pickupPoint.admin?.phoneNumber,
      role: pickupPoint.admin?.role,
      imgUrl: pickupPoint.admin?.imgUrl,
      isEmailVerified: pickupPoint.admin?.isEmailVerified,
      blocked: pickupPoint.admin?.blocked,

      // Additional info
      adminUserId: pickupPoint.adminUserId,
    };
  }
}
