import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { EnvConfigModule } from 'src/config/config.module';
import { HubAdminService } from './hub-admin.service';
import { AdminService } from './admin-service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AdminController } from './admin.controller';
import { HubAdminController } from './admin-hub.controller';
import { City } from 'src/wilaya/entities/city.entity';
import { BadRequestException } from '@nestjs/common';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, City]),
    EnvConfigModule,
    MulterModule.register({
      dest: './uploads/profile-images',
      storage: diskStorage({
        destination: './uploads/profile-images',
        filename: (req, file, cb) => {
          const filename: string = file.originalname;
          const stringArr = filename.split('.');
          const ext = stringArr[stringArr.length - 1];
          cb(null, `${Date.now()}.${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
      },
      fileFilter: (req, file, cb) => {
        // Accept only image files
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException({
              message: {
                en: 'Only image files are allowed (jpg, jpeg, png, gif, webp)',
                fr: 'Seuls les fichiers image sont autorisés (jpg, jpeg, png, gif, webp)',
                ar: 'يُسمح فقط بملفات الصور (jpg, jpeg, png, gif, webp)',
              },
            }),
            false,
          );
        }
        cb(null, true);
      },
    }),
  ],
  controllers: [UsersController, HubAdminController, AdminController],
  providers: [UsersService, HubAdminService, AdminService],
  exports: [UsersService, HubAdminService, AdminService],
})
export class UsersModule {}
