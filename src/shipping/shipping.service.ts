// ===========================
// 3. SERVICE
// ===========================

// src/shipping/shipping.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wilaya } from 'src/wilaya/entities/wilaya.entity';
import { ShippingFee } from './entities/shipping.entity';
import { CreateShippingFeeDto } from './dto/create-shipping.dto';
import {
  QueryShippingFeeDto,
  SetAllPricesDto,
  UpdateShippingFeeDto,
} from './dto/update-shipping.dto';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(ShippingFee)
    private shippingFeeRepo: Repository<ShippingFee>,
    @InjectRepository(Wilaya)
    private wilayaRepo: Repository<Wilaya>,
  ) {}

  async create(dto: CreateShippingFeeDto): Promise<ShippingFee> {
    const fromWilaya = await this.wilayaRepo.findOne({
      where: { code: dto.fromWilayaCode },
    });
    const toWilaya = await this.wilayaRepo.findOne({
      where: { code: dto.toWilayaCode },
    });

    if (!fromWilaya) {
      throw new NotFoundException(
        `From wilaya ${dto.fromWilayaCode} not found`,
      );
    }
    if (!toWilaya) {
      throw new NotFoundException(`To wilaya ${dto.toWilayaCode} not found`);
    }

    const existing = await this.shippingFeeRepo.findOne({
      where: {
        fromWilayaCode: dto.fromWilayaCode,
        toWilayaCode: dto.toWilayaCode,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Shipping fee from ${dto.fromWilayaCode} to ${dto.toWilayaCode} already exists`,
      );
    }

    const fee = this.shippingFeeRepo.create({
      ...dto,
      fromWilaya,
      toWilaya,
    });
    return this.shippingFeeRepo.save(fee);
  }

  async findAll(query: QueryShippingFeeDto): Promise<ShippingFee[]> {
    const where: any = {};

    if (query.fromWilayaCode) where.fromWilayaCode = query.fromWilayaCode;
    if (query.toWilayaCode) where.toWilayaCode = query.toWilayaCode;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.shippingFeeRepo.find({
      where,
      order: { fromWilayaCode: 'ASC', toWilayaCode: 'ASC' },
    });
  }

  async findOne(id: number): Promise<ShippingFee> {
    const fee = await this.shippingFeeRepo.findOne({ where: { id } });
    if (!fee) {
      throw new NotFoundException(`Shipping fee ${id} not found`);
    }
    return fee;
  }

  async findByRoute(fromCode: string, toCode: string): Promise<ShippingFee> {
    const fee = await this.shippingFeeRepo.findOne({
      where: { fromWilayaCode: fromCode, toWilayaCode: toCode },
    });
    if (!fee) {
      throw new NotFoundException(
        `Shipping fee from ${fromCode} to ${toCode} not found`,
      );
    }
    return fee;
  }

  async update(id: number, dto: UpdateShippingFeeDto): Promise<ShippingFee> {
    const fee = await this.findOne(id);
    Object.assign(fee, dto);
    return this.shippingFeeRepo.save(fee);
  }

  async remove(id: number): Promise<void> {
    const fee = await this.findOne(id);
    await this.shippingFeeRepo.remove(fee);
  }

  async toggleActive(id: number): Promise<ShippingFee> {
    const fee = await this.findOne(id);
    fee.isActive = !fee.isActive;
    return this.shippingFeeRepo.save(fee);
  }

  async setAllPrices(
    dto: SetAllPricesDto,
  ): Promise<{ updated: number; created: number }> {
    const wilayas = await this.wilayaRepo.find();
    let updated = 0;
    let created = 0;

    // Create all combinations: 58 × 58 = 3,364 rows
    for (const fromWilaya of wilayas) {
      for (const toWilaya of wilayas) {
        let fee = await this.shippingFeeRepo.findOne({
          where: {
            fromWilayaCode: fromWilaya.code,
            toWilayaCode: toWilaya.code,
          },
        });

        if (fee) {
          fee.desktopPrice = dto.desktopPrice;
          fee.homePrice = dto.homePrice;
          fee.returnPrice = dto.returnPrice;
          await this.shippingFeeRepo.save(fee);
          updated++;
        } else {
          fee = this.shippingFeeRepo.create({
            fromWilayaCode: fromWilaya.code,
            toWilayaCode: toWilaya.code,
            fromWilaya,
            toWilaya,
            desktopPrice: dto.desktopPrice,
            homePrice: dto.homePrice,
            returnPrice: dto.returnPrice,
            isActive: true,
          });
          await this.shippingFeeRepo.save(fee);
          created++;
        }
      }
    }

    return { updated, created };
  }

  // ===========================
  // SERVICE - New Function
  // ===========================

  async setWilayaPrices(
    wilayaCode: string,
    dto: SetAllPricesDto,
  ): Promise<{ updated: number; created: number }> {
    const wilaya = await this.wilayaRepo.findOne({
      where: { code: wilayaCode },
    });

    if (!wilaya) {
      throw new NotFoundException(`Wilaya ${wilayaCode} not found`);
    }

    const allWilayas = await this.wilayaRepo.find();
    let updated = 0;
    let created = 0;

    // Update/create routes FROM this wilaya to all others
    for (const toWilaya of allWilayas) {
      let fee = await this.shippingFeeRepo.findOne({
        where: {
          fromWilayaCode: wilayaCode,
          toWilayaCode: toWilaya.code,
        },
      });

      if (fee) {
        fee.desktopPrice = dto.desktopPrice;
        fee.homePrice = dto.homePrice;
        fee.returnPrice = dto.returnPrice;
        await this.shippingFeeRepo.save(fee);
        updated++;
      } else {
        fee = this.shippingFeeRepo.create({
          fromWilayaCode: wilayaCode,
          toWilayaCode: toWilaya.code,
          fromWilaya: wilaya,
          toWilaya,
          desktopPrice: dto.desktopPrice,
          homePrice: dto.homePrice,
          returnPrice: dto.returnPrice,
          isActive: true,
        });
        await this.shippingFeeRepo.save(fee);
        created++;
      }
    }

    // Update/create routes TO this wilaya from all others
    for (const fromWilaya of allWilayas) {
      if (fromWilaya.code === wilayaCode) continue; // Skip duplicate

      let fee = await this.shippingFeeRepo.findOne({
        where: {
          fromWilayaCode: fromWilaya.code,
          toWilayaCode: wilayaCode,
        },
      });

      if (fee) {
        fee.desktopPrice = dto.desktopPrice;
        fee.homePrice = dto.homePrice;
        fee.returnPrice = dto.returnPrice;
        await this.shippingFeeRepo.save(fee);
        updated++;
      } else {
        fee = this.shippingFeeRepo.create({
          fromWilayaCode: fromWilaya.code,
          toWilayaCode: wilayaCode,
          fromWilaya,
          toWilaya: wilaya,
          desktopPrice: dto.desktopPrice,
          homePrice: dto.homePrice,
          returnPrice: dto.returnPrice,
          isActive: true,
        });
        await this.shippingFeeRepo.save(fee);
        created++;
      }
    }

    return { updated, created };
  }

  async initializeAll(): Promise<{ created: number; skipped: number }> {
    const wilayas = await this.wilayaRepo.find();
    let created = 0;
    let skipped = 0;

    // Create all 58 × 58 = 3,364 combinations
    for (const fromWilaya of wilayas) {
      for (const toWilaya of wilayas) {
        const existing = await this.shippingFeeRepo.findOne({
          where: {
            fromWilayaCode: fromWilaya.code,
            toWilayaCode: toWilaya.code,
          },
        });

        if (!existing) {
          await this.shippingFeeRepo.save({
            fromWilayaCode: fromWilaya.code,
            toWilayaCode: toWilaya.code,
            fromWilaya,
            toWilaya,
            desktopPrice: 500,
            homePrice: 600,
            returnPrice: 300,
            isActive: true,
          });
          created++;
        } else {
          skipped++;
        }
      }
    }

    return { created, skipped };
  }

  async getPrice(
    fromCode: string,
    toCode: string,
    type: 'desktop' | 'home' | 'return',
  ): Promise<number> {
    const fee = await this.shippingFeeRepo.findOne({
      where: {
        fromWilayaCode: fromCode,
        toWilayaCode: toCode,
        isActive: true,
      },
    });

    if (!fee) {
      throw new NotFoundException(
        `No active fee from ${fromCode} to ${toCode}`,
      );
    }

    const prices = {
      desktop: fee.desktopPrice,
      home: fee.homePrice,
      return: fee.returnPrice,
    };

    return Number(prices[type]);
  }
}
