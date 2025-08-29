import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Wilaya } from './entities/wilaya.entity';
import { City } from './entities/city.entity';

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
}
