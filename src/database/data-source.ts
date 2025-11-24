import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

// Load environment variables
config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: configService.get('DATABASE_HOST') || 'localhost',
  port: configService.get('DATABASE_PORT') || 3306,
  username: configService.get('DATABASE_USERNAME') || 'root',
  password: configService.get('DATABASE_PASSWORD') || '',
  database: configService.get('DATABASE_NAME') || 'your_database',
  entities: ['src/**/*.entity{.ts,.js}'],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false, // IMPORTANT: Set to false when using migrations
  logging: true,
});
