import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { CreateProductDto, ProductFilterDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { UserRole } from 'src/common/types/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import UserPayload from 'src/auth/types/user-payload.interface';
import { GetCurrentUser } from 'src/auth/decorators/current-user.decorator';
import { PaginatedResponse } from 'src/common/utils/paginated-response';



@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR , UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ 
    status: 201, 
    description: 'Product created successfully',
    type: Product 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Vendor role required' 
  })
  async create(
    @Body() createProductDto: CreateProductDto,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<Product> {
    return await this.productService.create(createProductDto, currentUser.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with optional filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Products retrieved successfully',
    type: [Product] 
  })
  @ApiQuery({ name: 'category', required: false, enum: ['Electronics', 'Clothing', 'Home & Garden'] })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query() productFilterDto: ProductFilterDto):  Promise<PaginatedResponse<Product>> {
    return await this.productService.findAll(productFilterDto);
  }

  @Get('my-products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Get current vendor\'s products' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vendor products retrieved successfully',
    type: [Product] 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Vendor role required' 
  })
  async findMyProducts(
    @GetCurrentUser() currentUser: UserPayload,
    @Query() productFilterDto: ProductFilterDto
  ):  Promise<PaginatedResponse<Product>> {
    return await this.productService.findByVendor(currentUser.userId, productFilterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({ name: 'id', description: 'Product ID', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product found',
    type: Product 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Product not found' 
  })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return await this.productService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', description: 'Product ID', type: 'number' })
  @ApiResponse({ 
    status: 200, 
    description: 'Product updated successfully',
    type: Product 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Can only update own products' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Product not found' 
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<Product> {
    return await this.productService.update(id, updateProductDto, currentUser.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a product' })
  @ApiParam({ name: 'id', description: 'Product ID', type: 'number' })
  @ApiResponse({ 
    status: 204, 
    description: 'Product deleted successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Can only delete own products' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Product not found' 
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetCurrentUser() currentUser: UserPayload
  ): Promise<void> {
    return await this.productService.remove(id, currentUser.userId);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: Get all products from all vendors' })
  @ApiResponse({ 
    status: 200, 
    description: 'All products retrieved successfully',
    type: [Product] 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin role required' 
  })
  async adminFindAll(@Query() productFilterDto: ProductFilterDto):  Promise<PaginatedResponse<Product>> {
    return await this.productService.adminFindAll(productFilterDto);
  }
}