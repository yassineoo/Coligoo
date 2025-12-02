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
import { Hub } from 'src/hub/entities/hub.entity';

@Injectable()
export class HubAdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly appConfig: AppConfig,
    @InjectRepository(Hub)
    private readonly hubRepository: Repository<Hub>,
  ) {}

  /**
   * Create a new hub employee - Only HUB_ADMIN can create HUB_EMPLOYEE
   */

  // Update the constructor to inject AppConfig

  /**
   * Create a new hub employee - Only HUB_ADMIN can create HUB_EMPLOYEE
   * Automatically links employee to the admin's hub
   */
  async createHubEmployee(
    createHubEmployeeDto: CreateTeamMemberDto,
    hubAdminId: number,
  ): Promise<User> {
    // 1. Find the hub where this user is the admin
    const hub = await this.hubRepository.findOne({
      where: { adminUserId: hubAdminId },
      relations: ['admin'],
    });

    if (!hub) {
      throw new ForbiddenException(
        'You must be a hub admin to create employees',
      );
    }

    // 2. Verify the user has HUB_ADMIN role
    if (hub.admin.role !== UserRole.HUB_ADMIN) {
      throw new ForbiddenException('Only HUB_ADMIN can create hub employees');
    }

    // 3. Check if email already exists
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

    // 4. Create employee and automatically link to the SAME hub as the admin
    const employee = this.usersRepository.create({
      email: createHubEmployeeDto.email,
      password: hashedPassword,
      nom: createHubEmployeeDto.nom,
      prenom: createHubEmployeeDto.prenom,
      fullName: `${createHubEmployeeDto.prenom || ''} ${
        createHubEmployeeDto.nom || ''
      }`.trim(),
      phoneNumber: createHubEmployeeDto.phoneNumber,
      role: UserRole.HUB_EMPLOYEE,
      hubAdminId: hub.id, // ✅ Link to the SAME hub ID as the admin
      permissions: createHubEmployeeDto.permissions || [],
      imgUrl: createHubEmployeeDto.fileName
        ? `${this.appConfig.getAppUrl()}/api/v1/images/profile-images/${
            createHubEmployeeDto.fileName
          }`
        : null,
      cityId: null, // ✅ Hub employees don't need their own city
    });

    console.log('Creating employee for hub:', hub.id, hub.name);
    console.log('Employee data:', employee);

    const savedEmployee = await this.usersRepository.save(employee);

    // 5. Return employee with hub info
    return await this.usersRepository.findOne({
      where: { id: savedEmployee.id },
      relations: ['hub', 'hub.city', 'hub.city.wilaya'],
    });
  }

  /**
   * Update an employee - only if they belong to the SAME hub as the admin
   */
  async updateEmployee(
    employeeId: number,
    hubAdminId: number,
    updateHubEmployeeDto: UpdateTeamMemberDto,
  ): Promise<User> {
    // 1. Verify employee belongs to admin's hub
    const employee = await this.findEmployeeById(employeeId, hubAdminId);

    // 2. Get the admin's hub to ensure consistency
    const hub = await this.hubRepository.findOne({
      where: { adminUserId: hubAdminId },
    });

    // 3. Check if email is being changed and if it's already in use
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

    // 4. Handle profile image update
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

    // 5. Hash password if provided
    if (updateHubEmployeeDto.password) {
      updateHubEmployeeDto.password = await Hash.hash(
        updateHubEmployeeDto.password,
      );
    }

    // 6. Update employee fields
    if (updateHubEmployeeDto.email) employee.email = updateHubEmployeeDto.email;
    if (updateHubEmployeeDto.password)
      employee.password = updateHubEmployeeDto.password;
    if (updateHubEmployeeDto.nom) employee.nom = updateHubEmployeeDto.nom;
    if (updateHubEmployeeDto.prenom)
      employee.prenom = updateHubEmployeeDto.prenom;
    if (updateHubEmployeeDto.nom || updateHubEmployeeDto.prenom) {
      employee.fullName = `${employee.prenom || ''} ${
        employee.nom || ''
      }`.trim();
    }
    if (updateHubEmployeeDto.phoneNumber)
      employee.phoneNumber = updateHubEmployeeDto.phoneNumber;
    if (updateHubEmployeeDto.permissions)
      employee.permissions = updateHubEmployeeDto.permissions;

    if (imgUrl) {
      employee.imgUrl = imgUrl;
    }

    // 7. IMPORTANT: Ensure employee stays linked to the SAME hub
    employee.hubAdminId = hub.id; // ✅ Maintain hub link
    employee.cityId = null; // ✅ Employees use hub's city, not their own

    const updatedEmployee = await this.usersRepository.save(employee);

    // 8. Return with hub relations
    return await this.usersRepository.findOne({
      where: { id: updatedEmployee.id },
      relations: ['hub', 'hub.city', 'hub.city.wilaya'],
    });
  }

  /**
   * Get all employees for the admin's hub
   */
  async findAllEmployees(hubAdminId: number): Promise<User[]> {
    // 1. Get the admin's hub
    const hub = await this.hubRepository.findOne({
      where: { adminUserId: hubAdminId },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found for this admin');
    }

    // 2. Find all employees in the SAME hub
    return await this.usersRepository.find({
      where: {
        role: UserRole.HUB_EMPLOYEE,
        hubAdminId: hub.id, // ✅ Only employees in THIS hub
      },
      relations: ['hub', 'hub.city', 'hub.city.wilaya'],
      order: { createdAt: 'DESC' },
    });
  }
  /**
   * Get all employees for a specific HUB_ADMIN
   */
  /**
   * Get all employees for a specific HUB_ADMIN
   * Automatically extracts hub from admin and returns employees with hub info
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

    // 1. First, get the admin's hub
    const hub = await this.hubRepository.findOne({
      where: { adminUserId: hubAdminId },
    });

    if (!hub) {
      throw new NotFoundException('Hub not found for this admin');
    }

    // 2. Query employees belonging to this hub
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.hubAdminId = :hubId', { hubId: hub.id }) // ✅ Use hub.id
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

    // 3. Apply pagination and ordering with hub relations
    const employees = await queryBuilder
      .leftJoin('user.hub', 'hub')
      .leftJoin('hub.city', 'city')
      .leftJoin('city.wilaya', 'wilaya')
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
        'user.hubAdminId',
        // Hub info (inherited location)
        'hub.id',
        'hub.name',
        'hub.address',
        'hub.latitude',
        'hub.longitude',
        // City info (from hub)
        'city.id',
        'city.name',
        // Wilaya info (from hub)
        'wilaya.code',
        'wilaya.name',
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
        hubAdminId: hubAdminId,
        role: UserRole.HUB_EMPLOYEE,
      },
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
        'hubAdminId',
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
        where: { hubAdminId: hubAdminId, role: UserRole.HUB_EMPLOYEE },
      }),
      this.usersRepository.count({
        where: {
          hubAdminId: hubAdminId,
          role: UserRole.HUB_EMPLOYEE,
          blocked: false,
        },
      }),
      this.usersRepository.count({
        where: {
          hubAdminId: hubAdminId,
          role: UserRole.HUB_EMPLOYEE,
          blocked: true,
        },
      }),
      this.usersRepository.count({
        where: {
          hubAdminId: hubAdminId,
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
        hubAdminId: hubAdminId,
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
      .andWhere('hubAdminId = :hubAdminId', { hubAdminId })
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
        hubAdminId: hubAdminId,
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
      .andWhere('hubAdminId = :hubAdminId', { hubAdminId })
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
