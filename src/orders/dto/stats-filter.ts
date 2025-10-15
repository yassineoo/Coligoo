// src/orders/dto/hub-stats.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class HubStatsFilterDto {
  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date for statistics',
  })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'End date for statistics',
  })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class HubStatsResponseDto {
  @ApiProperty({ example: 250, description: 'Total number of orders' })
  totalOrders: number;

  @ApiProperty({
    example: 45,
    description: 'Orders pending (in preparation, confirmed, deposited at hub)',
  })
  pending: number;

  @ApiProperty({
    example: 30,
    description: 'Orders deferred (dispatched, collected, out for delivery)',
  })
  deferred: number;

  @ApiProperty({ example: 150, description: 'Successfully delivered orders' })
  delivered: number;

  @ApiProperty({
    example: 25,
    description: 'Returned orders (returned, returned to hub)',
  })
  returned: number;

  @ApiProperty({
    example: {
      pending: 18.0,
      deferred: 12.0,
      delivered: 60.0,
      returned: 10.0,
    },
    description: 'Percentage breakdown of order statuses',
  })
  percentages: {
    pending: number;
    deferred: number;
    delivered: number;
    returned: number;
  };

  @ApiPropertyOptional({
    example: '2025-01-01',
    description: 'Start date of the statistics period',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    example: '2025-12-31',
    description: 'End date of the statistics period',
  })
  dateTo?: string;
}
