// src/lockers/dto/update-locker.dto.ts
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateLockerDto } from './create-locker.dto';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ClosetStatus } from '../entities/locker.entity';

export class UpdateLockerDto extends PartialType(CreateLockerDto) {}

export class UpdateClosetStatusDto {
  @ApiPropertyOptional({ example: 1, description: 'Closet ID (number)' })
  @IsNumber()
  @Type(() => Number)
  closetId: number;

  @ApiPropertyOptional({ enum: ClosetStatus, example: ClosetStatus.OCCUPIED })
  @IsEnum(ClosetStatus)
  status: ClosetStatus;

  @ApiPropertyOptional({ example: 123, description: 'Order ID to assign' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  currentOrderId?: number;
}
