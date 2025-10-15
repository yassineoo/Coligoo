// src/finance/dto/withdrawal-filter.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  WithdrawalCondition,
  WithdrawalStatus,
} from '../entities/fincance.entity';
// src/finance/dto/finance-statistics.dto.ts
import { ApiProperty } from '@nestjs/swagger';
export class WithdrawalFilterDto {
  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: WithdrawalStatus })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

  @ApiPropertyOptional({ enum: WithdrawalCondition })
  @IsOptional()
  @IsEnum(WithdrawalCondition)
  condition?: WithdrawalCondition;

  @ApiPropertyOptional({ example: 1, description: 'Filter by vendor ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vendorId?: number;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({
    example: 'ZRKGH321A',
    description: 'Search by tracking code or vendor name',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    enum: ['createdAt', 'totalAmount', 'paymentDate', 'status'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

export class FinanceStatisticsDto {
  @ApiProperty({
    example: 200000,
    description: 'Total available balance for all vendors',
  })
  totalAvailableBalance: number;

  @ApiProperty({
    example: 190000,
    description: 'Total pending payments to be made',
  })
  totalPaymentToBeMade: number;

  @ApiProperty({
    example: 10000,
    description: 'Remaining balance after pending payments',
  })
  totalRemainingBalance: number;

  @ApiProperty({
    example: 5,
    description: 'Number of pending withdrawal requests',
  })
  storeRequestForPayment: number;

  @ApiProperty({
    example: 8,
    description: 'Number of approved requests ready for payment',
  })
  storeReadyForPayment: number;

  @ApiProperty({
    example: 150000,
    description: 'Total paid out to vendors',
  })
  totalPaidOut: number;

  @ApiProperty({
    example: 13,
    description: 'Total number of completed payments',
  })
  totalCompletedPayments: number;
}
