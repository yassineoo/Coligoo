import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AppConfig } from 'src/config/app.config';
import { Response } from 'express';
import { rmSync } from 'fs';
import * as path from 'path';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly appConfig: AppConfig,
  ) {}
  /*
  async create(createCategoryDto: CreateCategoryDto) {
    const categoryExist = await this.categoryRepository.findOneBy({
      name: createCategoryDto.name,
    });
    if (categoryExist) {
      throw new BadRequestException('Category exist deja');
    }
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      iconUrl: `${this.appConfig.getAppUrl()}/api/v1/category/icons/${
        createCategoryDto.fileName
      }`,
    });
    await this.categoryRepository.save(category);
    return { msg: 'Category cree avec succes' };
  }

  async findAll() {
    return await this.categoryRepository.find();
  }

  async findAllPaginated(categoryFilterDto: CategoryFilterDto) {
    const [categories, count] = await this.categoryRepository.findAndCount({
      skip: categoryFilterDto.pageSize * (categoryFilterDto.page - 1),
      take: categoryFilterDto.pageSize,
      order: {
        [categoryFilterDto.orderBy]: categoryFilterDto.order,
      },
      relations: ['artisans', 'subCategories'],
    });
    const returnedCategories = categories.map((category) => {
      category.artisans = category.artisans.filter(
        (artisan) => artisan.isProfileVerified,
      );
      return {
        id: category.id,
        name: category.name,
        ar_name: category.ar_name,
        color: category.color,
        iconUrl: category.iconUrl,
        nbrSubCategories: category.subCategories.length,
        profiles: category.artisans.length,
      };
    });
    return { categories: returnedCategories, count };
  }

  async findOne(fileName: string, res: Response) {
    const category = await this.categoryRepository.findOneBy({ fileName });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
    return res.sendFile(category.fileName, { root: 'uploads/category-icons' });
  }

  async findOneById(id: number) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new BadRequestException('Category not found');
    }
    if (updateCategoryDto.fileName) {
      try {
        rmSync(
          path.join(
            __dirname,
            '..',
            '..',
            '..',
            'uploads',
            'category-icons',
            category.fileName,
          ),
        );
      } catch (error) {}
      category.fileName = updateCategoryDto.fileName;
      category.iconUrl = `${this.appConfig.getAppUrl()}/api/v1/category/icons/${
        updateCategoryDto.fileName
      }`;
    }
    category.name = updateCategoryDto.name;
    category.ar_name = updateCategoryDto.ar_name;
    category.color = updateCategoryDto.color;
    await this.categoryRepository.save(category);
    return { msg: 'Category modifie avec succes' };
  }

  async remove(id: number) {
    const category = await this.categoryRepository.findOneBy({ id });
    if (!category) {
      throw new BadRequestException("Category n'existe pas");
    }
    await this.subCategoryService.removeByCategory(category.id);
    // Delete category icon
    rmSync(
      path.join(
        __dirname,
        '..',
        '..',
        '..',
        'uploads',
        'category-icons',
        category.fileName,
      ),
    );
    await this.categoryRepository.delete(category.id);
    return { msg: 'Category supprime avec succes' };
  }
    */
}
