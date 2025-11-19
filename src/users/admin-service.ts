import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Hash } from './utils/hash';
import { dateCalculator } from 'src/common/utils/date-calculator';
import { UserRole } from 'src/common/types/roles.enum';
import {
  CreateAdminUserDto,
  UpdateAdminUserDto,
  AdminUserFilterDto,
} from './dto/admin.dto';
import { PaginatedResponse } from 'src/common/utils/paginated-response';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Create any type of user - Only ADMIN can create any user
   */
  async createUser(createAdminUserDto: CreateAdminUserDto): Promise<User> {
    // Check if email already exists
    const userExist = await this.usersRepository.findOneBy({
      email: createAdminUserDto.email,
    });

    if (userExist) {
      throw new BadRequestException({
        fr: 'Cet email est déjà utilisé',
        ar: 'هذا البريد الإلكتروني مستخدم بالفعل',
        en: 'This email is already in use',
      });
    }

    // Validate hubId for HUB_EMPLOYEE
    if (createAdminUserDto.role === UserRole.HUB_EMPLOYEE) {
      if (!createAdminUserDto.hubId) {
        throw new BadRequestException(
          'hubId is required for HUB_EMPLOYEE role',
        );
      }

      const hubAdmin = await this.usersRepository.findOne({
        where: { id: createAdminUserDto.hubId, role: UserRole.HUB_ADMIN },
      });

      if (!hubAdmin) {
        throw new BadRequestException('Invalid hubId: Hub admin not found');
      }
    }

    const hashedPassword = await Hash.hash(createAdminUserDto.password);

    const user = this.usersRepository.create({
      ...createAdminUserDto,
      password: hashedPassword,
    });

    await this.usersRepository.save(user);
    return user;
  }

  /**
   * Get all users with filtering and pagination
   */
  async findAllUsers(
    filterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    const {
      search,
      role,
      blocked,
      isEmailVerified,
      page = 1,
      pageSize = 10,
      orderBy = 'createdAt',
      order = 'DESC',
    } = filterDto;

    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(user.nom) LIKE LOWER(:search) OR LOWER(user.prenom) LIKE LOWER(:search) OR LOWER(user.fullName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Filter by role
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    // Filter by blocked status
    if (blocked !== undefined) {
      const isBlocked = blocked === 'true';
      queryBuilder.andWhere('user.blocked = :blocked', { blocked: isBlocked });
    }

    // Filter by email verified status
    if (isEmailVerified !== undefined) {
      const isVerified = isEmailVerified === 'true';
      queryBuilder.andWhere('user.isEmailVerified = :isEmailVerified', {
        isEmailVerified: isVerified,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering with relations for HUB_EMPLOYEE
    const users = await queryBuilder
      .leftJoinAndSelect('user.hubAdmin', 'hubAdmin')
      .select([
        'user.id',
        'user.email',
        'user.nom',
        'user.prenom',
        'user.fullName',
        'user.role',
        'user.permissions',
        'user.createdAt',
        'user.phoneNumber',
        'user.isEmailVerified',
        'user.imgUrl',
        'user.blocked',
        'user.hubId',
        'hubAdmin.id',
        'hubAdmin.nom',
        'hubAdmin.prenom',
        'hubAdmin.email',
      ])
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(`user.${orderBy}`, order)
      .getMany();

    return new PaginatedResponse(users, total, page, pageSize);
  }

  /**
   * Get all moderators
   */
  async findAllModerators(
    filterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    const filterWithModeratorRole = {
      ...filterDto,
      role: UserRole.MODERATOR,
    };
    return this.findAllUsers(filterWithModeratorRole);
  }

  /**
   * Get all hub admins
   */
  async findAllHubAdmins(
    filterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    const filterWithHubAdminRole = {
      ...filterDto,
      role: UserRole.HUB_ADMIN,
    };
    return this.findAllUsers(filterWithHubAdminRole);
  }

  /**
   * Get all hub employees
   */
  async findAllHubEmployees(
    filterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    const filterWithHubEmployeeRole = {
      ...filterDto,
      role: UserRole.HUB_EMPLOYEE,
    };
    return this.findAllUsers(filterWithHubEmployeeRole);
  }

  /**
   * Get all vendors
   */
  async findAllVendors(
    filterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    const filterWithVendorRole = {
      ...filterDto,
      role: UserRole.VENDOR,
    };
    return this.findAllUsers(filterWithVendorRole);
  }

  /**
   * Get all clients
   */
  async findAllClients(
    filterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    const filterWithClientRole = {
      ...filterDto,
      role: UserRole.CLIENT,
    };
    return this.findAllUsers(filterWithClientRole);
  }

  /**
   * Get all deliverymen
   */
  async findAllDeliverymen(
    filterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    const filterWithDeliverymanRole = {
      ...filterDto,
      role: UserRole.DELIVERYMAN,
    };
    return this.findAllUsers(filterWithDeliverymanRole);
  }

  /**
   * Get all admins
   */
  async findAllAdmins(
    filterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    const filterWithAdminRole = {
      ...filterDto,
      role: UserRole.ADMIN,
    };
    return this.findAllUsers(filterWithAdminRole);
  }

  /**
   * Get a specific user by ID
   */
  async findUserById(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['hubAdmin'],
      select: [
        'id',
        'email',
        'nom',
        'prenom',
        'fullName',
        'role',
        'permissions',
        'createdAt',
        'phoneNumber',
        'isEmailVerified',
        'imgUrl',
        'blocked',
        'hubId',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Update a user
   */
  async updateUser(
    id: number,
    updateAdminUserDto: UpdateAdminUserDto,
  ): Promise<User> {
    const user = await this.findUserById(id);

    // Check if email is being changed and if it's already in use
    if (updateAdminUserDto.email && updateAdminUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOneBy({
        email: updateAdminUserDto.email,
      });
      if (existingUser) {
        throw new BadRequestException({
          fr: 'Cette adresse email est déjà utilisée',
          ar: 'هذا البريد الإلكتروني مستخدم بالفعل',
          en: 'This email address is already in use',
        });
      }
    }

    // Validate hubId for HUB_EMPLOYEE
    if (
      updateAdminUserDto.role === UserRole.HUB_EMPLOYEE ||
      (updateAdminUserDto.hubId && user.role === UserRole.HUB_EMPLOYEE)
    ) {
      if (updateAdminUserDto.hubId) {
        const hubAdmin = await this.usersRepository.findOne({
          where: { id: updateAdminUserDto.hubId, role: UserRole.HUB_ADMIN },
        });

        if (!hubAdmin) {
          throw new BadRequestException('Invalid hubId: Hub admin not found');
        }
      }
    }

    // Hash password if provided
    if (updateAdminUserDto.password) {
      updateAdminUserDto.password = await Hash.hash(
        updateAdminUserDto.password,
      );
    }

    Object.assign(user, updateAdminUserDto);

    return await this.usersRepository.save(user);
  }

  /**
   * Update user status (block/unblock)
   */
  async updateUserStatus(
    id: number,
    blocked: boolean,
  ): Promise<{ message: string }> {
    const user = await this.findUserById(id);

    user.blocked = blocked;
    await this.usersRepository.save(user);

    return {
      message: blocked
        ? 'Utilisateur bloqué avec succès !'
        : 'Utilisateur débloqué avec succès !',
    };
  }

  /**
   * Update user permissions
   */
  async updateUserPermissions(
    id: number,
    permissions: string[],
  ): Promise<User> {
    const user = await this.findUserById(id);

    user.permissions = permissions;
    await this.usersRepository.save(user);

    return user;
  }

  /**
   * Delete a user
   */
  async deleteUser(id: number): Promise<{ message: string }> {
    const user = await this.findUserById(id);

    // Check if user has employees (for HUB_ADMIN)
    if (user.role === UserRole.HUB_ADMIN) {
      const employeeCount = await this.usersRepository.count({
        where: { hubId: id, role: UserRole.HUB_EMPLOYEE },
      });

      if (employeeCount > 0) {
        throw new BadRequestException(
          `Cannot delete hub admin with ${employeeCount} employees. Please reassign or delete employees first.`,
        );
      }
    }

    await this.usersRepository.delete(id);

    return {
      message: 'Utilisateur supprimé avec succès !',
    };
  }

  /**
   * Get system-wide user statistics
   */
  async getUserStatistics(): Promise<{
    total: number;
    admins: number;
    hubAdmins: number;
    moderators: number;
    vendors: number;
    clients: number;
    deliverymen: number;
    hubEmployees: number;
    blocked: number;
    verified: number;
  }> {
    const [
      total,
      admins,
      hubAdmins,
      moderators,
      vendors,
      clients,
      deliverymen,
      hubEmployees,
      blocked,
      verified,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.ADMIN } }),
      this.usersRepository.count({ where: { role: UserRole.HUB_ADMIN } }),
      this.usersRepository.count({ where: { role: UserRole.MODERATOR } }),
      this.usersRepository.count({ where: { role: UserRole.VENDOR } }),
      this.usersRepository.count({ where: { role: UserRole.CLIENT } }),
      this.usersRepository.count({ where: { role: UserRole.DELIVERYMAN } }),
      this.usersRepository.count({ where: { role: UserRole.HUB_EMPLOYEE } }),
      this.usersRepository.count({ where: { blocked: true } }),
      this.usersRepository.count({ where: { isEmailVerified: true } }),
    ]);

    return {
      total,
      admins,
      hubAdmins,
      moderators,
      vendors,
      clients,
      deliverymen,
      hubEmployees,
      blocked,
      verified,
    };
  }

  /**
   * Get employees for a specific hub admin
   */
  async getHubEmployees(
    hubAdminId: number,
    filterDto: AdminUserFilterDto,
  ): Promise<PaginatedResponse<User>> {
    // Verify hub admin exists
    const hubAdmin = await this.usersRepository.findOne({
      where: { id: hubAdminId, role: UserRole.HUB_ADMIN },
    });

    if (!hubAdmin) {
      throw new NotFoundException('Hub admin not found');
    }

    const {
      search,
      blocked,
      isEmailVerified,
      page = 1,
      pageSize = 10,
      orderBy = 'createdAt',
      order = 'DESC',
    } = filterDto;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.hubId = :hubAdminId', { hubAdminId })
      .andWhere('user.role = :role', { role: UserRole.HUB_EMPLOYEE });

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(user.nom) LIKE LOWER(:search) OR LOWER(user.prenom) LIKE LOWER(:search) OR LOWER(user.fullName) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Filter by blocked status
    if (blocked !== undefined) {
      const isBlocked = blocked === 'true';
      queryBuilder.andWhere('user.blocked = :blocked', { blocked: isBlocked });
    }

    // Filter by email verified status
    if (isEmailVerified !== undefined) {
      const isVerified = isEmailVerified === 'true';
      queryBuilder.andWhere('user.isEmailVerified = :isEmailVerified', {
        isEmailVerified: isVerified,
      });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const employees = await queryBuilder
      .select([
        'user.id',
        'user.email',
        'user.nom',
        'user.prenom',
        'user.fullName',
        'user.role',
        'user.permissions',
        'user.createdAt',
        'user.phoneNumber',
        'user.isEmailVerified',
        'user.imgUrl',
        'user.blocked',
        'user.hubId',
      ])
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy(`user.${orderBy}`, order)
      .getMany();

    return new PaginatedResponse(employees, total, page, pageSize);
  }

  /**
   * Bulk update user status
   */
  async bulkUpdateUserStatus(
    userIds: number[],
    blocked: boolean,
  ): Promise<{ message: string; updated: number }> {
    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ blocked })
      .where('id IN (:...userIds)', { userIds })
      .execute();

    return {
      message: `${result.affected} utilisateurs ${
        blocked ? 'bloqués' : 'débloqués'
      } avec succès !`,
      updated: result.affected || 0,
    };
  }

  /**
   * Bulk delete users
   */
  async bulkDeleteUsers(
    userIds: number[],
  ): Promise<{ message: string; deleted: number }> {
    // Check for hub admins with employees
    const hubAdminsWithEmployees = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.hubEmployees', 'employee')
      .where('user.id IN (:...userIds)', { userIds })
      .andWhere('user.role = :role', { role: UserRole.HUB_ADMIN })
      .groupBy('user.id')
      .having('COUNT(employee.id) > 0')
      .getMany();

    if (hubAdminsWithEmployees.length > 0) {
      throw new BadRequestException(
        `Cannot delete hub admins with employees: ${hubAdminsWithEmployees
          .map((h) => h.email)
          .join(', ')}`,
      );
    }

    const result = await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('id IN (:...userIds)', { userIds })
      .execute();

    return {
      message: `${result.affected} utilisateurs supprimés avec succès !`,
      deleted: result.affected || 0,
    };
  }
}
