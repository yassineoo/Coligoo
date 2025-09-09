import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ImagesService } from './images.service';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetCurrentUser } from 'src/auth/decorators/current-user.decorator';
import UserPayload from 'src/auth/types/user-payload.interface';
import { BlockedUserGuard } from 'src/auth/guards/blocked-user.guard';
import { UserRole } from 'src/common/types/roles.enum';

@ApiTags('Images')
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  // Profile image, carte artisan, carte identite, portfolio images, ccp receipt
  @Get('/profile-images/:filename')
  getProfileImage(@Param('filename') filename: string, @Res() res: Response) {
    return this.imagesService.getProfileImage(filename, res);
  }

  @Get('/id-card-image/:filename')
  @UseGuards(JwtAuthGuard, RolesGuard, BlockedUserGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  getIdCardImage(
    @Param('filename') filename: string,
    @Res() res: Response,
    @GetCurrentUser() userPayload: UserPayload,
  ) {
    return this.imagesService.getIdCardImage(filename, res, userPayload.userId);
  }

  @Get('/portfolio-images/:filename')
  getPortfolioImage(@Param('filename') filename: string, @Res() res: Response) {
    return this.imagesService.getPortfolioImage(filename, res);
  }

  @Get('/ccp-receipts/:filename')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  getCcpReceipt(@Param('filename') filename: string, @Res() res: Response) {
    return this.imagesService.getCcpReceipt(filename, res);
  }

  @Get('/report-images/:filename')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  getReportImage(@Param('filename') filename: string, @Res() res: Response) {
    return this.imagesService.getReportImage(filename, res);
  }
}
