import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateClientUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Hash } from './utils/hash';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { AppConfig } from 'src/config/app.config';
import { UserFilterDto } from './dto/user-filter.dto';
import { dateCalculator } from 'src/common/utils/date-calculator';
import { UserRole } from 'src/common/types/roles.enum';
import { City } from 'src/wilaya/entities/city.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly appConfig: AppConfig,

    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}
  async createClient(createUserDto: CreateClientUserDto) {
    const userExist = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (userExist) {
      throw new BadRequestException({
        fr: 'Cet email est déjà utilisé',
        ar: 'هذا البريد الإلكتروني مستخدم بالفعل',
      });
    }
    const hashedPassword = createUserDto.password
      ? await Hash.hash(createUserDto.password)
      : null;
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    await this.usersRepository.save(user);
    return user;
  }

  async findUserByEmail(email: string, selectPassword: boolean = false) {
    return await this.usersRepository.findOne({
      where: { email },
      select: [
        'password',
        'id',
        'email',
        'role',
        'nom',
        'prenom',
        'isEmailVerified',

        'imgUrl',
        'blocked',
      ],
    });
  }

  async findUserByPhone(phone: string, selectPassword: boolean = false) {
    return await this.usersRepository.findOne({
      where: { phoneNumber: phone },
      select: selectPassword
        ? [
            'password',
            'id',
            'email',
            'role',
            'nom',
            'prenom',
            'isEmailVerified',
            'imgUrl',
            'blocked',
          ]
        : undefined,
    });
  }
  async findAll(userFilterDto: UserFilterDto) {
    const [users, count] = await this.usersRepository.findAndCount({
      where: [
        {
          role: UserRole.CLIENT,
          nom: userFilterDto.nom ? Like(`%${userFilterDto.nom}%`) : undefined,
          blocked: userFilterDto.blocked
            ? userFilterDto.blocked === 'true'
              ? true
              : false
            : undefined,
        },
        {
          role: UserRole.CLIENT,
          prenom: userFilterDto.nom
            ? Like(`%${userFilterDto.nom}%`)
            : undefined,
          blocked: userFilterDto.blocked
            ? userFilterDto.blocked === 'true'
              ? true
              : false
            : undefined,
        },
        {
          role: UserRole.CLIENT,
          nom: userFilterDto.nom
            ? Like(`%${userFilterDto.nom.split(' ')?.[0]}%`)
            : undefined,
          prenom: userFilterDto.nom
            ? Like(`%${userFilterDto.nom.split(' ')?.[1]}%`)
            : undefined,
          blocked: userFilterDto.blocked
            ? userFilterDto.blocked === 'true'
              ? true
              : false
            : undefined,
        },
      ],
      skip: (userFilterDto.page - 1) * userFilterDto.pageSize,
      take: userFilterDto.pageSize,
      select: [
        'id',
        'nom',
        'prenom',
        'email',
        'phoneNumber',
        'createdAt',
        'blocked',
      ],
      order: {
        [userFilterDto.orderBy]: userFilterDto.order,
      },
    });
    return { users, count };
  }

  async findOne(id: number) {
    return await this.usersRepository.findOneBy({ id });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return await this.usersRepository.update(id, updateUserDto);
  }

  /**
   * Update user information including profile image and city
   */
  async updateUserInfo(
    id: number,
    updateUserInfoDto: UpdateUserInfoDto,
  ): Promise<{ message: string; user: Partial<User> }> {
    // Find user with relations
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['city', 'city.wilaya'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Handle email update with uniqueness check
    if (updateUserInfoDto.email && updateUserInfoDto.email !== user.email) {
      const emailExists = await this.usersRepository.findOne({
        where: { email: updateUserInfoDto.email },
      });

      if (emailExists) {
        throw new ConflictException(
          'This email address is already in use by another user',
        );
      }
      user.email = updateUserInfoDto.email;
    }

    // Handle phone number update with uniqueness check
    if (
      updateUserInfoDto.phoneNumber &&
      updateUserInfoDto.phoneNumber !== user.phoneNumber
    ) {
      const phoneExists = await this.usersRepository.findOne({
        where: { phoneNumber: updateUserInfoDto.phoneNumber },
      });

      if (phoneExists) {
        throw new ConflictException(
          'This phone number is already in use by another user',
        );
      }
      user.phoneNumber = updateUserInfoDto.phoneNumber;
    }

    // Handle city update
    if (
      updateUserInfoDto.cityId &&
      updateUserInfoDto.cityId !== user.city?.id?.toString()
    ) {
      const city = await this.cityRepository.findOne({
        where: { id: updateUserInfoDto.cityId as unknown as number },
        relations: ['wilaya'],
      });

      if (!city) {
        throw new NotFoundException(
          `City with ID ${updateUserInfoDto.cityId} not found`,
        );
      }

      user.cityId = updateUserInfoDto.cityId as unknown as number;
      user.city = city;
    }

    // Update basic info
    if (updateUserInfoDto.nom) {
      user.nom = updateUserInfoDto.nom.trim();
    }

    if (updateUserInfoDto.prenom) {
      user.prenom = updateUserInfoDto.prenom.trim();
    }

    if (updateUserInfoDto.prenom) {
      user.prenom = updateUserInfoDto.prenom.trim();
    }

    if (updateUserInfoDto.nom) {
      user.nom = updateUserInfoDto.nom.trim();
    }
    console.log('updateUserInfoDto.filename', updateUserInfoDto.filename);

    // Handle profile image
    if (updateUserInfoDto.filename) {
      const imgUrl = `${this.appConfig.getAppUrl()}/api/v1/images/profile-image/${
        updateUserInfoDto.filename
      }`;
      user.imgUrl = imgUrl;
    }

    // Save updated user
    const updatedUser = await this.usersRepository.save(user);

    // Return sanitized response (without sensitive data)
    return {
      message: 'User information updated successfully',
      user: {
        id: updatedUser.id,
        prenom: updatedUser.prenom,
        nom: updatedUser.nom,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        imgUrl: updatedUser.imgUrl,
        city: updatedUser.city
          ? ({
              id: updatedUser.city.id,
              name: updatedUser.city.name,
              ar_name: updatedUser.city.ar_name,
              wilaya: updatedUser.city.wilaya
                ? {
                    code: updatedUser.city.wilaya.code,
                    name: updatedUser.city.wilaya.name,
                    city: null,
                  }
                : null,
            } as unknown as City)
          : null,
      },
    };
  }

  async updateUserStatus(id: number, blocked: boolean) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new BadRequestException("User doesn't exist");
    }
    user.blocked = blocked;
    await this.usersRepository.save(user);
    return { msg: 'Utilisateur modifie avec succes !' };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
      select: ['password', 'id', 'email'],
    });
    if (!user) {
      throw new BadRequestException("User doesn't exist");
    }
    if (user.password) {
      const passwordMatch = await Hash.compare(
        changePasswordDto.oldPassword,
        user.password,
      );
      if (!passwordMatch) {
        throw new BadRequestException('Mot de passe incorrect !');
      }
    }
    user.password = await Hash.hash(changePasswordDto.newPassword);
    await this.usersRepository.save(user);
    return { msg: 'Mot de passe modifiee avec succes !' };
  }

  async getUserInfo(userId: number) {
    const user = await this.usersRepository.findOne({
      where: {
        id: userId,
      },
      relations: ['hubAdmin', 'hubEmployees', 'city', 'city.wilaya'], // Add relations if needed
    });

    if (!user) {
      throw new Error('User not found');
    }

    console.log('usersss', user);

    return {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      fullName: user.fullName,
      address: user.address,

      city: user.city,
      role: user.role,
      permissions: user.permissions,
      hubId: user.hubId,
      hubAdmin: user.hubAdmin
        ? {
            id: user.hubAdmin.id,
            nom: user.hubAdmin.nom,
            prenom: user.hubAdmin.prenom,
            email: user.hubAdmin.email,
          }
        : null,
      createdAt: user.createdAt,
      phoneNumber: user.phoneNumber,
      isEmailVerified: user.isEmailVerified,
      imgUrl: user.imgUrl,
      blocked: user.blocked,
      deviceToken: user.deviceToken,
      // Optional: include count of hub employees if user is a hub admin
      hubEmployeesCount: user.hubEmployees?.length ?? 0,
    };
  }

  async delete(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new BadRequestException("User doesn't exist");
    }
    await this.usersRepository.delete(id);
    return { msg: 'Utilisateur supprime avec succes !' };
  }

  async deleteAccount(userId: number) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new BadRequestException("User doesn't exist");
    }
    await this.usersRepository.delete(userId);
    return {
      msg: 'Compte supprime avec succes !',
      msgAr: 'تم حذف الحساب بنجاح !',
    };
  }
}
