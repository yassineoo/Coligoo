import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserStatusDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GetCurrentUser } from 'src/auth/decorators/current-user.decorator';
import UserPayload from 'src/auth/types/user-payload.interface';
import { UpdateUserInfoDto } from './dto/update-user-info.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserFilterDto } from './dto/user-filter.dto';
import { BlockedUserGuard } from 'src/auth/guards/blocked-user.guard';
import { UserRole } from 'src/common/types/roles.enum';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(@Query() userFilterDto: UserFilterDto) {
    return this.usersService.findAll(userFilterDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('img', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|png|jpeg)$/)) cb(null, true);
        else {
          cb(new BadRequestException('File type is not supported'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      dest: './uploads/profile-images',
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req: any, file, cb) => {
          const filename: string = file.originalname;
          const stringArr = filename.split('.');
          const ext = stringArr[stringArr.length - 1];
          cb(null, `${req.user.userId}.${ext}`);
        },
      }),
    }),
  )
  @Patch('/change-info')
  update(
    @GetCurrentUser() userPayload: UserPayload,
    @Body() updateUserDto: UpdateUserInfoDto,
    @UploadedFile() img: Express.Multer.File,
  ) {
    console.log('img', img);

    if (img) {
      updateUserDto.filename = img.filename;
    } else {
      updateUserDto.filename = undefined;
    }
    console.log('imgsssss', updateUserDto);

    return this.usersService.updateUserInfo(userPayload.userId, updateUserDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Roles(UserRole.CLIENT)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('img', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|png|jpeg)$/)) cb(null, true);
        else {
          cb(new BadRequestException('File type is not supported'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      dest: './uploads/profile-images',
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req: any, file, cb) => {
          const filename: string = file.originalname;
          const stringArr = filename.split('.');
          const ext = stringArr[stringArr.length - 1];
          cb(null, `${req.user.userId}.${ext}`);
        },
      }),
    }),
  )
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Patch('/change-password')
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @GetCurrentUser() userPayload: UserPayload,
  ) {
    return this.usersService.changePassword(
      userPayload.userId,
      changePasswordDto,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  updateUserStatus(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateUserStatus(+id, updateUserDto.blocked);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, BlockedUserGuard)
  @Get('/user-info')
  findOne(@GetCurrentUser() userPayload: UserPayload) {
    return this.usersService.getUserInfo(userPayload.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.CLIENT)
  @Delete('/delete-account')
  deleteAccount(@GetCurrentUser() userPayload: UserPayload) {
    return this.usersService.deleteAccount(userPayload.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(+id);
  }
}
