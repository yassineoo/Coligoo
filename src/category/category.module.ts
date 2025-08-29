import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { EnvConfigModule } from 'src/config/config.module';
//import { SubCategoryModule } from 'src/sub-category/sub-category.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    UsersModule,
    EnvConfigModule,
    MulterModule.register({
      dest: './uploads/category-icons',
      storage: diskStorage({
        destination: './uploads/category-icons',
        filename: (req, file, cb) => {
          const filename: string = file.originalname;
          const stringArr = filename.split('.');
          const ext = stringArr[stringArr.length - 1];
          cb(null, `${Date.now()}.${ext}`);
        },
      }),
    }),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
