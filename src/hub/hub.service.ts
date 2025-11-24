// hub/hub.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hub } from './entities/hub.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateHubDto } from './dto/create-hub.dto';
import { UpdateHubDto } from './dto/update-hub.dto';
import { UserRole } from 'src/common/types/roles.enum';
import { Hash } from 'src/users/utils/hash';
import { QueryHubDto } from './dto/hub-filters.dto';
import { Like } from 'typeorm';

@Injectable()
export class HubService {
  constructor(
    @InjectRepository(Hub)
    private hubRepository: Repository<Hub>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new hub with its admin user
   * Returns flattened data compatible with old structure
   */
  async create(createHubDto: CreateHubDto) {
    const {
      name,
      address,
      latitude,
      longitude,
      cityId,
      email,
      password,
      prenom,
      nom,
      phoneNumber,
      permissions,
      fileName,
    } = createHubDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await Hash.hash(password);
    // Create admin user first
    const adminUser = this.userRepository.create({
      email,
      password: hashedPassword,
      prenom,
      nom,
      fullName: `${prenom || ''} ${nom || ''}`.trim(),
      phoneNumber,
      role: UserRole.HUB_ADMIN,
      permissions: permissions || [],
      imgUrl: fileName || null,
      isEmailVerified: false,
      blocked: false,
    });

    const savedAdmin = await this.userRepository.save(adminUser);

    // Create hub
    const hub = this.hubRepository.create({
      name,
      address,
      latitude,
      longitude,
      cityId,
      adminUserId: savedAdmin.id,
      isActive: true,
    });

    const savedHub = await this.hubRepository.save(hub);

    // Fetch complete hub with relations
    const completeHub = await this.hubRepository.findOne({
      where: { id: savedHub.id },
      relations: ['admin', 'city', 'city.wilaya'],
    });

    // Return flattened structure (backward compatible)
    return this.flattenHubData(completeHub);
  }

  /**
   * Get all hubs with flattened data
   */

  async findAll(queryDto: QueryHubDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      wilayaCode,
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Search filter (searches in hub name)
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

    const [hubs, total] = await this.hubRepository.findAndCount({
      where,
      relations: ['admin', 'employees', 'city', 'city.wilaya'],
      order: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      data: hubs.map((hub) => this.flattenHubData(hub)),
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
   * Get single hub by ID with flattened data
   */
  async findOne(id: number) {
    const hub = await this.hubRepository.findOne({
      where: { id },
      relations: ['admin', 'employees', 'city', 'city.wilaya'],
    });

    if (!hub) {
      throw new NotFoundException(`Hub with ID ${id} not found`);
    }

    return this.flattenHubData(hub);
  }

  /**
   * Get hub by admin user ID
   */
  async findByAdminUserId(adminUserId: number) {
    const hub = await this.hubRepository.findOne({
      where: { adminUserId },
      relations: ['admin', 'employees', 'city', 'city.wilaya'],
    });

    if (!hub) {
      throw new NotFoundException('Hub not found for this admin');
    }

    return this.flattenHubData(hub);
  }

  /**
   * Update hub and admin data
   */
  async update(id: number, updateHubDto: UpdateHubDto) {
    const hub = await this.hubRepository.findOne({
      where: { id },
      relations: ['admin'],
    });

    if (!hub) {
      throw new NotFoundException(`Hub with ID ${id} not found`);
    }

    const {
      name,
      address,
      latitude,
      longitude,
      cityId,
      isActive,
      email,
      password,
      prenom,
      nom,
      phoneNumber,
      permissions,
      fileName,
    } = updateHubDto;

    // Update hub fields
    if (name !== undefined) hub.name = name;
    if (address !== undefined) hub.address = address;
    if (latitude !== undefined) hub.latitude = latitude;
    if (longitude !== undefined) hub.longitude = longitude;
    if (cityId !== undefined) hub.cityId = cityId;
    if (isActive !== undefined) hub.isActive = isActive;
    hub.updatedAt = new Date();

    await this.hubRepository.save(hub);

    // Update admin user fields
    const adminUser = hub.admin;
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

    if (phoneNumber !== undefined) {
      adminUser.phoneNumber = phoneNumber;
      adminUpdated = true;
    }

    if (permissions !== undefined) {
      adminUser.permissions = permissions;
      adminUpdated = true;
    }

    if (fileName !== undefined) {
      adminUser.imgUrl = fileName;
      adminUpdated = true;
    }

    if (adminUpdated) {
      await this.userRepository.save(adminUser);
    }

    // Fetch updated hub with relations
    const updatedHub = await this.hubRepository.findOne({
      where: { id },
      relations: ['admin', 'employees', 'city', 'city.wilaya'],
    });

    return this.flattenHubData(updatedHub);
  }

  /**
   * Delete hub and its admin user
   */
  async remove(id: number) {
    const hub = await this.hubRepository.findOne({
      where: { id },
      relations: ['admin', 'employees'],
    });

    if (!hub) {
      throw new NotFoundException(`Hub with ID ${id} not found`);
    }

    // Check if hub has employees
    if (hub.employees && hub.employees.length > 0) {
      throw new ConflictException(
        'Cannot delete hub with active employees. Please remove or reassign employees first.',
      );
    }

    const adminUserId = hub.adminUserId;

    // Delete hub first
    await this.hubRepository.remove(hub);

    // Delete admin user
    await this.userRepository.delete(adminUserId);

    return { message: 'Hub and admin user deleted successfully' };
  }

  /**
   * Flatten hub and admin data into single object (backward compatible)
   */
  private flattenHubData(hub: Hub) {
    return {
      // Hub fields
      id: hub.id,
      name: hub.name,
      address: hub.address,
      latitude: hub.latitude,
      longitude: hub.longitude,
      cityId: hub.cityId,
      city: hub.city,
      isActive: hub.isActive,
      createdAt: hub.createdAt,
      updatedAt: hub.updatedAt,

      // Admin user fields (flattened)
      email: hub.admin?.email,
      nom: hub.admin?.nom,
      prenom: hub.admin?.prenom,
      fullName: hub.admin?.fullName,
      phoneNumber: hub.admin?.phoneNumber,
      role: hub.admin?.role,
      permissions: hub.admin?.permissions,
      imgUrl: hub.admin?.imgUrl,
      isEmailVerified: hub.admin?.isEmailVerified,
      blocked: hub.admin?.blocked,

      // Additional info
      adminUserId: hub.adminUserId,
      employeesCount: hub.employees?.length || 0,
    };
  }
}
