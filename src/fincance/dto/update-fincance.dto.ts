// src/finance/dto/update-withdrawal-request.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import {
  WithdrawalCondition,
  WithdrawalStatus,
} from '../entities/fincance.entity';

export class UpdateWithdrawalRequestDto {
  @ApiPropertyOptional({ enum: WithdrawalStatus })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

  @ApiPropertyOptional({ enum: WithdrawalCondition })
  @IsOptional()
  @IsEnum(WithdrawalCondition)
  condition?: WithdrawalCondition;

  @ApiPropertyOptional({ example: '2025-08-29T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ example: 'Payment completed via bank transfer' })
  @IsOptional()
  @IsString()
  notes?: string;
}
