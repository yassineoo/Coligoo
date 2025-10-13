// src/shipping/shipping.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Wilaya } from 'src/wilaya/entities/wilaya.entity';
import { ShippingFee } from './entities/shipping.entity';
import { ShippingZone } from './entities/shipping-zone.entity';
import { CreateShippingFeeDto } from './dto/create-shipping.dto';
import {
  QueryShippingFeeDto,
  SetAllPricesDto,
  UpdateShippingFeeDto,
} from './dto/update-shipping.dto';
import { City } from 'src/wilaya/entities/city.entity';
import {
  BulkCreateZonesDto,
  CreateShippingZoneDto,
  QueryShippingZoneDto,
  UpdateShippingZoneDto,
} from './dto/zonz-shipping.dto';

@Injectable()
export class ShippingService {
  constructor(
    @InjectRepository(ShippingFee)
    private shippingFeeRepo: Repository<ShippingFee>,
    @InjectRepository(Wilaya)
    private wilayaRepo: Repository<Wilaya>,
    @InjectRepository(City)
    private cityRepo: Repository<City>,
    @InjectRepository(ShippingZone)
    private zoneRepo: Repository<ShippingZone>,
  ) {}

  // ===========================
  // EXISTING SHIPPING FEE METHODS
  // ===========================

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

  // ===========================
  // SERVICE - Update findAll in shipping.service.ts
  // ===========================

  async findAll(query: QueryShippingFeeDto): Promise<{
    data: ShippingFee[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const where: any = {};

    if (query.fromWilayaCode) where.fromWilayaCode = query.fromWilayaCode;
    if (query.toWilayaCode) where.toWilayaCode = query.toWilayaCode;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await this.shippingFeeRepo.findAndCount({
      where,
      relations: ['zones', 'zones.cities'],
      order: { fromWilayaCode: 'ASC', toWilayaCode: 'ASC' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }
  async findOne(id: number): Promise<ShippingFee> {
    const fee = await this.shippingFeeRepo.findOne({
      where: { id },
      relations: ['zones', 'zones.cities'],
    });
    if (!fee) {
      throw new NotFoundException(`Shipping fee ${id} not found`);
    }
    return fee;
  }

  async findByRoute(fromCode: string, toCode: string): Promise<ShippingFee> {
    const fee = await this.shippingFeeRepo.findOne({
      where: { fromWilayaCode: fromCode, toWilayaCode: toCode },
      relations: ['zones', 'zones.cities'],
    });
    if (!fee) {
      throw new NotFoundException(
        `Shipping fee from ${fromCode} to ${toCode} not found`,
      );
    }
    return fee;
  }

  // Add these methods to your ShippingService class

  /**
   * Update shipping fee with optional zones update
   */
  async update(id: number, dto: UpdateShippingFeeDto): Promise<ShippingFee> {
    const fee = await this.findOne(id);

    // Update basic shipping fee fields
    if (dto.desktopPrice !== undefined) fee.desktopPrice = dto.desktopPrice;
    if (dto.homePrice !== undefined) fee.homePrice = dto.homePrice;
    if (dto.returnPrice !== undefined) fee.returnPrice = dto.returnPrice;
    if (dto.isActive !== undefined) fee.isActive = dto.isActive;

    // Save the shipping fee first
    const updatedFee = await this.shippingFeeRepo.save(fee);

    // Handle zones if provided
    if (dto.zones && dto.zones.length > 0) {
      // Collect all city IDs to check for duplicates
      const allCityIds = dto.zones.flatMap((z) => z.cityIds);
      const uniqueCityIds = [...new Set(allCityIds)];

      if (allCityIds.length !== uniqueCityIds.length) {
        throw new BadRequestException('Duplicate city IDs found across zones');
      }

      // Verify all cities exist
      const cities = await this.cityRepo.findBy({ id: In(uniqueCityIds) });
      if (cities.length !== uniqueCityIds.length) {
        throw new BadRequestException('Some city IDs are invalid');
      }

      // Get existing zones for this shipping fee
      const existingZones = await this.zoneRepo.find({
        where: { shippingFeeId: id },
        relations: ['cities'],
      });

      const existingZoneIds = new Set(existingZones.map((z) => z.id));
      const updatedZoneIds = new Set(
        dto.zones.filter((z) => z.id).map((z) => z.id),
      );

      // Delete zones that are not in the update list
      const zonesToDelete = existingZones.filter(
        (zone) => !updatedZoneIds.has(zone.id),
      );
      if (zonesToDelete.length > 0) {
        await this.zoneRepo.remove(zonesToDelete);
      }

      // Process each zone in the DTO
      for (const zoneDto of dto.zones) {
        const zoneCities = cities.filter((city) =>
          zoneDto.cityIds.includes(city.id),
        );

        if (zoneDto.id && existingZoneIds.has(zoneDto.id)) {
          // Update existing zone
          const zone = existingZones.find((z) => z.id === zoneDto.id);
          if (zone) {
            zone.name = zoneDto.name;
            zone.price = zoneDto.price;
            zone.cities = zoneCities;
            zone.isActive = zoneDto.isActive ?? zone.isActive;
            await this.zoneRepo.save(zone);
          }
        } else {
          // Create new zone
          const newZone = this.zoneRepo.create({
            name: zoneDto.name,
            price: zoneDto.price,
            shippingFeeId: id,
            cities: zoneCities,
            isActive: zoneDto.isActive ?? true,
          });
          await this.zoneRepo.save(newZone);
        }
      }
    }

    // Return the updated fee with zones
    return this.findOne(id);
  }

  /**
   * Update a single zone by ID
   */
  async updateZoneById(
    zoneId: number,
    dto: UpdateShippingZoneDto,
  ): Promise<ShippingZone> {
    const zone = await this.findOneZone(zoneId);

    // Update basic fields
    if (dto.name) zone.name = dto.name;
    if (dto.price !== undefined) zone.price = dto.price;
    if (dto.isActive !== undefined) zone.isActive = dto.isActive;

    // Update cities if provided
    if (dto.cityIds) {
      const cities = await this.cityRepo.findBy({ id: In(dto.cityIds) });
      if (cities.length !== dto.cityIds.length) {
        throw new BadRequestException('Some city IDs are invalid');
      }

      // Check for conflicts with other zones in the same shipping fee
      const otherZones = await this.zoneRepo.find({
        where: { shippingFeeId: zone.shippingFeeId },
        relations: ['cities'],
      });

      const usedCityIds = new Set(
        otherZones
          .filter((z) => z.id !== zoneId)
          .flatMap((z) => z.cities.map((city) => city.id)),
      );

      const duplicates = dto.cityIds.filter((id) => usedCityIds.has(id));
      if (duplicates.length > 0) {
        throw new ConflictException(
          `Cities ${duplicates.join(', ')} are already in another zone`,
        );
      }

      zone.cities = cities;
    }

    return this.zoneRepo.save(zone);
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

    for (const fromWilaya of allWilayas) {
      if (fromWilaya.code === wilayaCode) continue;

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

  // ===========================
  // ZONE MANAGEMENT METHODS
  // ===========================

  async createZone(dto: CreateShippingZoneDto): Promise<ShippingZone> {
    // Verify shipping fee exists
    const shippingFee = await this.shippingFeeRepo.findOne({
      where: { id: dto.shippingFeeId },
    });
    if (!shippingFee) {
      throw new NotFoundException(
        `Shipping fee ${dto.shippingFeeId} not found`,
      );
    }

    // Verify cities exist
    const cities = await this.cityRepo.findBy({ id: In(dto.cityIds) });
    if (cities.length !== dto.cityIds.length) {
      throw new BadRequestException('Some city IDs are invalid');
    }

    // Check if cities are already in another zone for this route
    const existingZones = await this.zoneRepo.find({
      where: { shippingFeeId: dto.shippingFeeId },
      relations: ['cities'],
    });

    const usedCityIds = new Set(
      existingZones.flatMap((zone) => zone.cities.map((city) => city.id)),
    );

    const duplicates = dto.cityIds.filter((id) => usedCityIds.has(id));
    if (duplicates.length > 0) {
      throw new ConflictException(
        `Cities ${duplicates.join(', ')} are already assigned to another zone`,
      );
    }

    const zone = this.zoneRepo.create({
      name: dto.name,
      price: dto.price,
      shippingFeeId: dto.shippingFeeId,
      cities,
      isActive: dto.isActive ?? true,
    });

    return this.zoneRepo.save(zone);
  }

  async bulkCreateZones(dto: BulkCreateZonesDto): Promise<ShippingZone[]> {
    const shippingFee = await this.shippingFeeRepo.findOne({
      where: { id: dto.shippingFeeId },
    });
    if (!shippingFee) {
      throw new NotFoundException(
        `Shipping fee ${dto.shippingFeeId} not found`,
      );
    }

    const allCityIds = dto.zones.flatMap((z) => z.cityIds);
    const uniqueCityIds = [...new Set(allCityIds)];

    if (allCityIds.length !== uniqueCityIds.length) {
      throw new BadRequestException('Duplicate city IDs found across zones');
    }

    const cities = await this.cityRepo.findBy({ id: In(uniqueCityIds) });
    if (cities.length !== uniqueCityIds.length) {
      throw new BadRequestException('Some city IDs are invalid');
    }

    const zones: ShippingZone[] = [];

    for (const zoneData of dto.zones) {
      const zoneCities = cities.filter((city) =>
        zoneData.cityIds.includes(city.id),
      );

      const zone = this.zoneRepo.create({
        name: zoneData.name,
        price: zoneData.price,
        shippingFeeId: dto.shippingFeeId,
        cities: zoneCities,
        isActive: true,
      });

      zones.push(await this.zoneRepo.save(zone));
    }

    return zones;
  }

  async findAllZones(query: QueryShippingZoneDto): Promise<ShippingZone[]> {
    const where: any = {};

    if (query.shippingFeeId) where.shippingFeeId = query.shippingFeeId;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    return this.zoneRepo.find({
      where,
      relations: ['cities', 'shippingFee'],
      order: { price: 'ASC' },
    });
  }

  async findZonesByRoute(
    fromCode: string,
    toCode: string,
  ): Promise<ShippingZone[]> {
    const shippingFee = await this.findByRoute(fromCode, toCode);
    return this.zoneRepo.find({
      where: { shippingFeeId: shippingFee.id },
      relations: ['cities'],
      order: { price: 'ASC' },
    });
  }

  async findOneZone(id: number): Promise<ShippingZone> {
    const zone = await this.zoneRepo.findOne({
      where: { id },
      relations: ['cities', 'shippingFee'],
    });
    if (!zone) {
      throw new NotFoundException(`Shipping zone ${id} not found`);
    }
    return zone;
  }

  async updateZone(
    id: number,
    dto: UpdateShippingZoneDto,
  ): Promise<ShippingZone> {
    const zone = await this.findOneZone(id);

    if (dto.name) zone.name = dto.name;
    if (dto.price !== undefined) zone.price = dto.price;
    if (dto.isActive !== undefined) zone.isActive = dto.isActive;

    if (dto.cityIds) {
      const cities = await this.cityRepo.findBy({ id: In(dto.cityIds) });
      if (cities.length !== dto.cityIds.length) {
        throw new BadRequestException('Some city IDs are invalid');
      }

      // Check for conflicts with other zones
      const otherZones = await this.zoneRepo.find({
        where: { shippingFeeId: zone.shippingFeeId },
        relations: ['cities'],
      });

      const usedCityIds = new Set(
        otherZones
          .filter((z) => z.id !== id)
          .flatMap((z) => z.cities.map((city) => city.id)),
      );

      const duplicates = dto.cityIds.filter((id) => usedCityIds.has(id));
      if (duplicates.length > 0) {
        throw new ConflictException(
          `Cities ${duplicates.join(', ')} are already in another zone`,
        );
      }

      zone.cities = cities;
    }

    return this.zoneRepo.save(zone);
  }

  async removeZone(id: number): Promise<void> {
    const zone = await this.findOneZone(id);
    await this.zoneRepo.remove(zone);
  }

  async toggleZoneActive(id: number): Promise<ShippingZone> {
    const zone = await this.findOneZone(id);
    zone.isActive = !zone.isActive;
    return this.zoneRepo.save(zone);
  }

  // ===========================
  // PRICE CALCULATION WITH ZONES
  // ===========================

  async getPrice(
    fromCode: string,
    toCode: string,
    type: 'desktop' | 'home' | 'return',
    cityId?: number,
  ): Promise<number> {
    const fee = await this.shippingFeeRepo.findOne({
      where: {
        fromWilayaCode: fromCode,
        toWilayaCode: toCode,
        isActive: true,
      },
      relations: ['zones', 'zones.cities'],
    });

    if (!fee) {
      throw new NotFoundException(
        `No active fee from ${fromCode} to ${toCode}`,
      );
    }

    // For desktop and return, use base prices
    if (type === 'desktop') return Number(fee.desktopPrice);
    if (type === 'return') return Number(fee.returnPrice);

    // For home delivery, check zones if cityId provided
    if (type === 'home' && cityId) {
      const activeZones = fee.zones?.filter((z) => z.isActive) || [];

      for (const zone of activeZones) {
        const cityInZone = zone.cities.some((city) => city.id === cityId);
        if (cityInZone) {
          return Number(zone.price);
        }
      }
    }

    // Default home price if no zone found
    return Number(fee.homePrice);
  }

  async getPriceDetails(
    fromCode: string,
    toCode: string,
    cityId?: number,
  ): Promise<{
    desktopPrice: number;
    homePrice: number;
    returnPrice: number;
    zoneName?: string;
    zoneId?: number;
  }> {
    const fee = await this.shippingFeeRepo.findOne({
      where: {
        fromWilayaCode: fromCode,
        toWilayaCode: toCode,
        isActive: true,
      },
      relations: ['zones', 'zones.cities'],
    });

    if (!fee) {
      throw new NotFoundException(
        `No active fee from ${fromCode} to ${toCode}`,
      );
    }

    let homePrice = Number(fee.homePrice);
    let zoneName: string | undefined;
    let zoneId: number | undefined;

    if (cityId) {
      const activeZones = fee.zones?.filter((z) => z.isActive) || [];

      for (const zone of activeZones) {
        const cityInZone = zone.cities.some((city) => city.id === cityId);
        if (cityInZone) {
          homePrice = Number(zone.price);
          zoneName = zone.name;
          zoneId = zone.id;
          break;
        }
      }
    }

    return {
      desktopPrice: Number(fee.desktopPrice),
      homePrice,
      returnPrice: Number(fee.returnPrice),
      zoneName,
      zoneId,
    };
  }

  // ----------------------------------------------
  /// random function to test
  // ----------------------------------------------

  async generateRandomZones(
    fromCode: string,
    toCode: string,
  ): Promise<ShippingZone[]> {
    // Find the shipping fee route
    const shippingFee = await this.shippingFeeRepo.findOne({
      where: {
        fromWilayaCode: fromCode,
        toWilayaCode: toCode,
      },
      relations: ['toWilaya', 'toWilaya.cities'],
    });

    if (!shippingFee) {
      throw new NotFoundException(
        `Shipping fee from ${fromCode} to ${toCode} not found`,
      );
    }

    // Get all communes/cities in the destination wilaya
    const cities = await this.cityRepo.find({
      where: { wilaya: { code: toCode } },
    });

    if (cities.length === 0) {
      throw new BadRequestException(`No communes found in wilaya ${toCode}`);
    }

    // Check if zones already exist for this route
    const existingZones = await this.zoneRepo.find({
      where: { shippingFeeId: shippingFee.id },
    });

    if (existingZones.length > 0) {
      throw new ConflictException(
        `Zones already exist for this route. Delete them first or use update endpoints.`,
      );
    }

    // Shuffle cities randomly
    const shuffledCities = cities.sort(() => Math.random() - 0.5);

    // Split into 3 groups
    const totalCities = shuffledCities.length;
    const zone1Count = Math.ceil(totalCities / 3);
    const zone2Count = Math.ceil((totalCities - zone1Count) / 2);

    const zone1Cities = shuffledCities.slice(0, zone1Count);
    const zone2Cities = shuffledCities.slice(
      zone1Count,
      zone1Count + zone2Count,
    );
    const zone3Cities = shuffledCities.slice(zone1Count + zone2Count);

    // Calculate prices based on base homePrice
    const basePrice = Number(shippingFee.homePrice);
    const zone1Price = basePrice; // Base price
    const zone2Price = Math.round(basePrice * 1.17); // +17%
    const zone3Price = Math.round(basePrice * 1.33); // +33%

    // Create the 3 zones
    const zones: ShippingZone[] = [];

    // Zone 1
    const zone1 = this.zoneRepo.create({
      name: `Zone 1 - Centre (${zone1Price} DA)`,
      price: zone1Price,
      shippingFeeId: shippingFee.id,
      cities: zone1Cities,
      isActive: true,
    });
    zones.push(await this.zoneRepo.save(zone1));

    // Zone 2
    const zone2 = this.zoneRepo.create({
      name: `Zone 2 - Périphérie (${zone2Price} DA)`,
      price: zone2Price,
      shippingFeeId: shippingFee.id,
      cities: zone2Cities,
      isActive: true,
    });
    zones.push(await this.zoneRepo.save(zone2));

    // Zone 3
    const zone3 = this.zoneRepo.create({
      name: `Zone 3 - Éloignée (${zone3Price} DA)`,
      price: zone3Price,
      shippingFeeId: shippingFee.id,
      cities: zone3Cities,
      isActive: true,
    });
    zones.push(await this.zoneRepo.save(zone3));

    return zones;
  }
}
