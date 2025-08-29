import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto, ProductFilterDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginatedResponse } from 'src/common/utils/paginated-response';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto, vendorId: number): Promise<Product> {
    const product = this.productRepository.create({
      ...createProductDto,
      vendorId
    });
    return await this.productRepository.save(product);
  }

  async findAll(filterDto: ProductFilterDto): Promise<PaginatedResponse<Product>> {
    const { category, search, page = 1, limit = 10, minPrice, maxPrice } = filterDto;
    
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(product.productName) LIKE LOWER(:search) OR LOWER(product.productAlias) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Get total count before applying pagination
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getMany();

    return new PaginatedResponse(products, total, page, limit);
  }

  async findByVendor(vendorId: number, filterDto: ProductFilterDto): Promise<PaginatedResponse<Product>> {
    const { category, search, page = 1, limit = 10, minPrice, maxPrice } = filterDto;
    
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('product.vendorId = :vendorId', { vendorId });

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(product.productName) LIKE LOWER(:search) OR LOWER(product.productAlias) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Get total count before applying pagination
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getMany();

    return new PaginatedResponse(products, total, page, limit);
  }

  async adminFindAll(filterDto: ProductFilterDto): Promise<PaginatedResponse<Product>> {
    const { category, search, page = 1, limit = 10, minPrice, maxPrice } = filterDto;
    
    const queryBuilder = this.productRepository.createQueryBuilder('product');
    // Uncomment if you have User entity relationship
    // queryBuilder.leftJoinAndSelect('product.vendor', 'vendor');

    if (category) {
      queryBuilder.andWhere('product.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(product.productName) LIKE LOWER(:search) OR LOWER(product.productAlias) LIKE LOWER(:search))',
        { search: `%${search}%` }
      );
    }

    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    // Get total count before applying pagination
    const total = await queryBuilder.getCount();

    // Apply pagination and ordering
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getMany();

    return new PaginatedResponse(products, total, page, limit);
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({ 
      where: { id }
      // Uncomment if you have User entity relationship
      // relations: ['vendor']
    });
    
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, vendorId?: number): Promise<Product> {
    const product = await this.findOne(id);
    
    // Check if vendor owns this product (skip for admin)
    if (vendorId && product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only update your own products');
    }
    
    Object.assign(product, updateProductDto);
    
    return await this.productRepository.save(product);
  }

  async remove(id: number, vendorId?: number): Promise<void> {
    const product = await this.findOne(id);
    
    // Check if vendor owns this product (skip for admin)
    if (vendorId && product.vendorId !== vendorId) {
      throw new ForbiddenException('You can only delete your own products');
    }
    
    await this.productRepository.remove(product);
  }

  // Legacy methods for backward compatibility - now paginated
  async findByCategory(category: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Product>> {
    const [products, total] = await this.productRepository.findAndCount({
      where: { category: category as any },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return new PaginatedResponse(products, total, page, limit);
  }

  async searchByName(name: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Product>> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .where('LOWER(product.productName) LIKE LOWER(:name)', { name: `%${name}%` })
      .orWhere('LOWER(product.productAlias) LIKE LOWER(:name)', { name: `%${name}%` });

    const total = await queryBuilder.getCount();
    
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('product.createdAt', 'DESC')
      .getMany();

    return new PaginatedResponse(products, total, page, limit);
  }
}