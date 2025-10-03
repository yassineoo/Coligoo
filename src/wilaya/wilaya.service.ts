import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Wilaya } from './entities/wilaya.entity';
import { City } from './entities/city.entity';
import { ShippingFee } from 'src/shipping/entities/shipping.entity';

@Injectable()
export class WilayaService {
  constructor(private readonly dataSource: DataSource) {}

  async getAll() {
    const wilayaRepository = this.dataSource.getRepository(Wilaya);
    return await wilayaRepository.find();
  }

  async getWilayaCities(code: string) {
    const cityRepository = this.dataSource.getRepository(City);
    return await cityRepository.find({
      where: {
        wilaya: {
          code,
        },
      },
    });
  }

  async getWilayaWithShippingFees(code: string) {
    const wilayaRepository = this.dataSource.getRepository(Wilaya);
    const shippingFeeRepository = this.dataSource.getRepository(ShippingFee);

    const wilaya = await wilayaRepository.findOne({
      where: { code },
    });

    if (!wilaya) {
      throw new Error(`Wilaya ${code} not found`);
    }

    // Get all shipping fees FROM this wilaya
    const feesFrom = await shippingFeeRepository.find({
      where: { fromWilayaCode: code },
      order: { toWilayaCode: 'ASC' },
    });

    // Get all shipping fees TO this wilaya
    const feesTo = await shippingFeeRepository.find({
      where: { toWilayaCode: code },
      order: { fromWilayaCode: 'ASC' },
    });

    return {
      wilaya,
      shippingFeesFrom: feesFrom,
      shippingFeesTo: feesTo,
      totalRoutes: feesFrom.length + feesTo.length,
    };
  }

  async getAllWilayasWithShippingFees() {
    const wilayaRepository = this.dataSource.getRepository(Wilaya);

    const wilayas = await wilayaRepository
      .createQueryBuilder('wilaya')
      .leftJoinAndSelect('wilaya.shippingFeesFrom', 'feesFrom')
      .orderBy('wilaya.code', 'ASC')
      .getMany();

    return wilayas;
  }
}
