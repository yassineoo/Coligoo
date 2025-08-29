import { Controller } from '@nestjs/common';
import { CategoryService } from './category.service';

import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';

@ApiTags('Category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  /*
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('icon', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|png|jpeg|svg)$/)) cb(null, true);
        else {
          cb(new BadRequestException('File type is not supported'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() icon: Express.Multer.File,
  ) {
    if (!icon) {
      throw new BadRequestException('Icon not found');
    }
    createCategoryDto.fileName = icon.filename;
    return await this.categoryService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }
  /*
  @Get('/paginated/')
  findAllAdmin(@Query() categoryFilterDto: CategoryFilterDto) {
    return this.categoryService.findAllPaginated(categoryFilterDto);
  }


  @Get('/icons/:fileName')
  findOne(@Param('fileName') fileName: string, @Res() res: Response) {
    return this.categoryService.findOne(fileName, res);
  }

  @Get(':id')
  findOneById(@Param('id') id: string) {
    return this.categoryService.findOneById(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('icon', {
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/^.*\.(jpg|png|jpeg)$/)) cb(null, true);
        else {
          cb(new BadRequestException('File type is not supported'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UploadedFile() icon: Express.Multer.File,
  ) {
    if (icon) {
      updateCategoryDto.fileName = icon.filename;
    }
    return this.categoryService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
      */
}
