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
  CreateTeamMemberDto,
  HubEmployeeFilterDto,
  UpdateTeamMemberDto,
} from './dto/admin.dto';
import { PaginatedResponse } from 'src/common/utils/paginated-response';
import { rmSync } from 'fs';
import path from 'path';
import { AppConfig } from 'src/config/app.config';

@Injectable()
export class HubAdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly appConfig: AppConfig,
  ) {}

  /**
   * Create a new hub employee - Only HUB_ADMIN can create HUB_EMPLOYEE
   */

  // Update the constructor to inject AppConfig

  /**
   * Create a new hub employee - Only HUB_ADMIN can create HUB_EMPLOYEE
   */
  async createHubEmployee(
    createHubEmployeeDto: CreateTeamMemberDto,
    hubAdminId: number,
  ): Promise<User> {
    // Verify that the current user is actually a HUB_ADMIN
    const hubAdmin = await this.usersRepository.findOne({
      where: { id: hubAdminId, role: UserRole.HUB_ADMIN },
    });

    if (!hubAdmin) {
      throw new ForbiddenException('Only HUB_ADMIN can create hub employees');
    }

    // Check if email already exists
    const userExist = await this.usersRepository.findOneBy({
      email: createHubEmployeeDto.email,
    });

    if (userExist) {
      throw new BadRequestException({
        fr: 'Cet email est déjà utilisé',
        ar: 'هذا البريد الإلكتروني مستخدم بالفعل',
        en: 'This email is already in use',
      });
    }

    const hashedPassword = await Hash.hash(createHubEmployeeDto.password);

    const employee = this.usersRepository.create({
      ...createHubEmployeeDto,
      password: hashedPassword,
      role: UserRole.HUB_EMPLOYEE,
      hubId: hubAdminId, // Link employee to this hub admin
      imgUrl: createHubEmployeeDto.fileName
        ? `${this.appConfig.getAppUrl()}/api/v1/images/profile-images/${
            createHubEmployeeDto.fileName
          }`
        : null,
    });

    console.log(
      employee,
      `${this.appConfig.getAppUrl()}/api/v1/images/profile-images/${
        createHubEmployeeDto.fileName
      }`,
    );

    await this.usersRepository.save(employee);
    return employee;
  }

  /**
   * Update an employee - only if they belong to this HUB_ADMIN
   */
  async updateEmployee(
    employeeId: number,
    hubAdminId: number,
    updateHubEmployeeDto: UpdateTeamMemberDto,
  ): Promise<User> {
    const employee = await this.findEmployeeById(employeeId, hubAdminId);

    // Check if email is being changed and if it's already in use
    if (
      updateHubEmployeeDto.email &&
      updateHubEmployeeDto.email !== employee.email
    ) {
      const existingUser = await this.usersRepository.findOneBy({
        email: updateHubEmployeeDto.email,
      });
      if (existingUser) {
        throw new BadRequestException({
          fr: 'Cette adresse email est déjà utilisée',
          ar: 'هذا البريد الإلكتروني مستخدم بالفعل',
          en: 'This email address is already in use',
        });
      }
    }

    let imgUrl = '';

    // Handle profile image update
    if (updateHubEmployeeDto.fileName) {
      // Delete old image if exists
      if (employee.imgUrl) {
        try {
          const oldFileName = employee.imgUrl.split('/').pop();
          rmSync(
            path.join(
              __dirname,
              '..',
              '..',
              '..',
              'uploads',
              'profile-images',
              oldFileName,
            ),
          );
        } catch (error) {
          // File might not exist, continue
        }
      }

      // Set new image URL
      imgUrl = `${this.appConfig.getAppUrl()}/api/v1/images/profile-images/${
        updateHubEmployeeDto.fileName
      }`;
    }

    // Hash password if provided
    if (updateHubEmployeeDto.password) {
      updateHubEmployeeDto.password = await Hash.hash(
        updateHubEmployeeDto.password,
      );
    }

    Object.assign(employee, updateHubEmployeeDto);

    if (imgUrl) {
      employee.imgUrl = imgUrl;
    }

    return await this.usersRepository.save(employee);
  }

  /**
   * Get all employees for a specific HUB_ADMIN
   */
  async findMyEmployees(
    hubAdminId: number,
    filterDto: HubEmployeeFilterDto,
  ): Promise<PaginatedResponse<User>> {
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
   * Get a specific employee - only if they belong to this HUB_ADMIN
   */
  async findEmployeeById(
    employeeId: number,
    hubAdminId: number,
  ): Promise<User> {
    const employee = await this.usersRepository.findOne({
      where: {
        id: employeeId,
        hubId: hubAdminId,
        role: UserRole.HUB_EMPLOYEE,
      },
      select: [
        'id',
        'email',
        'nom',
        'prenom',
        'fullName',
        'address',
        'role',
        'permissions',
        'createdAt',
        'phoneNumber',
        'isEmailVerified',
        'imgUrl',
        'blocked',
        'hubId',
      ],
      relations: ['city', 'city.wilaya'],
    });

    if (!employee) {
      throw new NotFoundException('Employee not found or access denied');
    }

    return employee;
  }

  /**
   * Update employee status (block/unblock) - only if they belong to this HUB_ADMIN
   */
  async updateEmployeeStatus(
    employeeId: number,
    hubAdminId: number,
    blocked: boolean,
  ): Promise<{ message: string }> {
    const employee = await this.findEmployeeById(employeeId, hubAdminId);

    employee.blocked = blocked;
    await this.usersRepository.save(employee);

    return {
      message: blocked
        ? 'Employé bloqué avec succès !'
        : 'Employé débloqué avec succès !',
    };
  }

  /**
   * Update employee permissions - only if they belong to this HUB_ADMIN
   */
  async updateEmployeePermissions(
    employeeId: number,
    hubAdminId: number,
    permissions: string[],
  ): Promise<User> {
    const employee = await this.findEmployeeById(employeeId, hubAdminId);

    employee.permissions = permissions;
    await this.usersRepository.save(employee);

    return employee;
  }

  /**
   * Delete an employee - only if they belong to this HUB_ADMIN
   */
  async deleteEmployee(
    employeeId: number,
    hubAdminId: number,
  ): Promise<{ message: string }> {
    const employee = await this.findEmployeeById(employeeId, hubAdminId);

    await this.usersRepository.delete(employeeId);

    return {
      message: 'Employé supprimé avec succès !',
    };
  }

  /**
   * Get employee statistics for a specific HUB_ADMIN
   */
  async getMyEmployeeStatistics(hubAdminId: number): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    blockedEmployees: number;
    verifiedEmployees: number;
  }> {
    const [
      totalEmployees,
      activeEmployees,
      blockedEmployees,
      verifiedEmployees,
    ] = await Promise.all([
      this.usersRepository.count({
        where: { hubId: hubAdminId, role: UserRole.HUB_EMPLOYEE },
      }),
      this.usersRepository.count({
        where: {
          hubId: hubAdminId,
          role: UserRole.HUB_EMPLOYEE,
          blocked: false,
        },
      }),
      this.usersRepository.count({
        where: {
          hubId: hubAdminId,
          role: UserRole.HUB_EMPLOYEE,
          blocked: true,
        },
      }),
      this.usersRepository.count({
        where: {
          hubId: hubAdminId,
          role: UserRole.HUB_EMPLOYEE,
          isEmailVerified: true,
        },
      }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      blockedEmployees,
      verifiedEmployees,
    };
  }

  /**
   * Bulk update employee status - only for employees belonging to this HUB_ADMIN
   */
  async bulkUpdateEmployeeStatus(
    employeeIds: number[],
    hubAdminId: number,
    blocked: boolean,
  ): Promise<{ message: string; updated: number }> {
    // Verify that all employees belong to this HUB_ADMIN
    const employees = await this.usersRepository.find({
      where: {
        hubId: hubAdminId,
        role: UserRole.HUB_EMPLOYEE,
      },
      select: ['id'],
    });

    const validEmployeeIds = employees.map((emp) => emp.id);
    const filteredEmployeeIds = employeeIds.filter((id) =>
      validEmployeeIds.includes(id),
    );

    if (filteredEmployeeIds.length === 0) {
      throw new ForbiddenException(
        'No valid employees found for this hub admin',
      );
    }

    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ blocked })
      .where('id IN (:...employeeIds)', { employeeIds: filteredEmployeeIds })
      .andWhere('hubId = :hubAdminId', { hubAdminId })
      .andWhere('role = :role', { role: UserRole.HUB_EMPLOYEE })
      .execute();

    return {
      message: `${result.affected} employés ${
        blocked ? 'bloqués' : 'débloqués'
      } avec succès !`,
      updated: result.affected || 0,
    };
  }

  /**
   * Bulk delete employees - only for employees belonging to this HUB_ADMIN
   */
  async bulkDeleteEmployees(
    employeeIds: number[],
    hubAdminId: number,
  ): Promise<{ message: string; deleted: number }> {
    // Verify that all employees belong to this HUB_ADMIN
    const employees = await this.usersRepository.find({
      where: {
        hubId: hubAdminId,
        role: UserRole.HUB_EMPLOYEE,
      },
      select: ['id'],
    });

    const validEmployeeIds = employees.map((emp) => emp.id);
    const filteredEmployeeIds = employeeIds.filter((id) =>
      validEmployeeIds.includes(id),
    );

    if (filteredEmployeeIds.length === 0) {
      throw new ForbiddenException(
        'No valid employees found for this hub admin',
      );
    }

    const result = await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('id IN (:...employeeIds)', { employeeIds: filteredEmployeeIds })
      .andWhere('hubId = :hubAdminId', { hubAdminId })
      .andWhere('role = :role', { role: UserRole.HUB_EMPLOYEE })
      .execute();

    return {
      message: `${result.affected} employés supprimés avec succès !`,
      deleted: result.affected || 0,
    };
  }

  /**
   * Verify if a user is a HUB_ADMIN
   */
  async verifyHubAdmin(userId: number): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, role: UserRole.HUB_ADMIN },
    });
    return !!user;
  }

  /**
   * Get hub admin profile info
   */
  async getHubAdminProfile(hubAdminId: number): Promise<User> {
    const hubAdmin = await this.usersRepository.findOne({
      where: { id: hubAdminId, role: UserRole.HUB_ADMIN },
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
      ],
      relations: ['city', 'city.wilaya'],
    });

    if (!hubAdmin) {
      throw new NotFoundException('Hub admin not found');
    }

    return hubAdmin;
  }
}
