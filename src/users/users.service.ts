import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateClientUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Hash } from './utils/hash';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { AppConfig } from 'src/config/app.config';
import { UserFilterDto } from './dto/user-filter.dto';
import { dateCalculator } from 'src/common/utils/date-calculator';
import { UserRole } from 'src/common/types/roles.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    private readonly appConfig: AppConfig,
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
    const dob = createUserDto.dob ? dateCalculator(createUserDto.dob) : null;
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      dob,
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
        'dob',
        'sex',
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

  async updateUserInfo(id: number, updateUserInfoDto: UpdateUserInfoDto) {
    const user = await this.usersRepository.findOneBy({ id });
    const imgUrl = updateUserInfoDto.filename
      ? `${this.appConfig.getAppUrl()}/api/v1/images/profile-image/${
          updateUserInfoDto.filename
        }`
      : undefined;
    user.nom = updateUserInfoDto.nom || user.nom;
    user.prenom = updateUserInfoDto.prenom || updateUserInfoDto.prenom;
    if (updateUserInfoDto.email && updateUserInfoDto.email !== user.email) {
      const userExist = await this.usersRepository.findOneBy({
        email: updateUserInfoDto.email,
      });
      if (userExist) {
        throw new BadRequestException('Cette addresse email est deja utilisé');
      }
    }
    user.email = updateUserInfoDto.email || user.email;
    user.phoneNumber = updateUserInfoDto.phoneNumber || user.phoneNumber;
    user.dob = updateUserInfoDto.dob
      ? dateCalculator(updateUserInfoDto.dob)
      : user.dob;
    user.sex = updateUserInfoDto.sex || user.sex;
    user.imgUrl = imgUrl || user.imgUrl;
    await this.usersRepository.save(user);
    return { msg: 'Informations modifiees avec succes !' };
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
      // relations: ['artisan'],
    });

    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      dob: user.dob?.toISOString().split('T')[0] ?? null,
      sex: user.sex ?? null,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      imgUrl: user.imgUrl,
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
