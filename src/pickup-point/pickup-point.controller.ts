// pickup-point/pickup-point.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PickupPointService } from './pickup-point.service';
import { CreatePickupPointDto } from './dto/create-pickup-point.dto';
import { UpdatePickupPointDto } from './dto/update-pickup-point.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { QueryPickupPointDto } from './dto/filter.dto';
import { UserRole } from 'src/common/types/roles.enum';
import { User } from 'src/users/entities/user.entity';
import { GetCurrentUser } from 'src/auth/decorators/current-user.decorator';
import UserPayload from 'src/auth/types/user-payload.interface';

@ApiTags('Pickup Points')
@Controller('pickup-points')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PickupPointController {
  constructor(private readonly pickupPointService: PickupPointService) {}

  @Post()
  @Roles(UserRole.HUB_ADMIN)
  @ApiOperation({ summary: 'Create new pickup point (Hub Admin only)' })
  create(
    @Body() createPickupPointDto: CreatePickupPointDto,
    @GetCurrentUser() userPayload: UserPayload,
  ) {
    return this.pickupPointService.create(
      createPickupPointDto,
      userPayload.userId,
    );
  }

  @Get()
  @Roles(
    UserRole.HUB_ADMIN,
    UserRole.ADMIN,
    UserRole.PICKUP_POINT_ADMIN,
    UserRole.HUB_EMPLOYEE,
    UserRole.MODERATOR,
  )
  @ApiOperation({ summary: 'Get all pickup points (filtered by role)' })
  findAll(
    @Query() queryDto: QueryPickupPointDto,
    @GetCurrentUser() userPayload: UserPayload,
  ) {
    return this.pickupPointService.findAll(queryDto, userPayload.userId);
  }

  @Get('profile')
  @Roles(UserRole.PICKUP_POINT_ADMIN)
  @ApiOperation({
    summary: 'Get pickup point profile for logged-in pickup point admin',
  })
  getProfile(@Request() req) {
    return this.pickupPointService.findByAdminUserId(req.user.id);
  }

  @Patch('profile')
  @Roles(UserRole.PICKUP_POINT_ADMIN)
  @ApiOperation({
    summary: 'Update pickup point profile for logged-in pickup point admin',
  })
  updateProfile(
    @Body() updatePickupPointDto: UpdatePickupPointDto,
    @GetCurrentUser() userPayload: UserPayload,
  ) {
    return this.pickupPointService.updateProfile(
      userPayload.userId,
      updatePickupPointDto,
    );
  }

  @Get('hub/:hubId')
  @Roles(UserRole.ADMIN, UserRole.HUB_ADMIN)
  @ApiOperation({ summary: 'Get all pickup points for a specific hub' })
  findByHub(@Param('hubId') hubId: string) {
    return this.pickupPointService.findByHub(+hubId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.HUB_ADMIN, UserRole.PICKUP_POINT_ADMIN)
  @ApiOperation({ summary: 'Get pickup point by ID' })
  findOne(@Param('id') id: string, @GetCurrentUser() userPayload: UserPayload) {
    return this.pickupPointService.findOne(+id, userPayload.userId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.HUB_ADMIN, UserRole.PICKUP_POINT_ADMIN)
  @ApiOperation({ summary: 'Update pickup point' })
  update(
    @Param('id') id: string,
    @Body() updatePickupPointDto: UpdatePickupPointDto,
    @GetCurrentUser() userPayload: UserPayload,
  ) {
    return this.pickupPointService.update(
      +id,
      updatePickupPointDto,
      userPayload.userId,
    );
  }

  @Delete(':id')
  @Roles(UserRole.HUB_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete pickup point (Hub Admin only)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.pickupPointService.remove(+id, req.user);
  }
}
