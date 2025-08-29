import { Injectable } from '@nestjs/common';
import { City } from 'src/wilaya/entities/city.entity';
import { Wilaya } from 'src/wilaya/entities/wilaya.entity';
import { DataSource } from 'typeorm';
import * as wilayas from './wilaya.json';
import * as cities from './city.json';
import * as plans from './plan.json';
import { User } from 'src/users/entities/user.entity';
import { Hash } from 'src/users/utils/hash';
import { UserRole } from 'src/common/types/roles.enum';

@Injectable()
export class SeederService {
  constructor(private readonly dataSource: DataSource) {}
  async seed() {
    const wilayaRepository = this.dataSource.getRepository(Wilaya);
    await Promise.all(
      wilayas.map(async (wilaya) => {
        const newWilaya = wilayaRepository.create({ ...wilaya });
        await wilayaRepository.save(newWilaya);
      }),
    );
    const cityRepository = this.dataSource.getRepository(City);
    await Promise.all(
      cities.map(async (city) => {
        const wilaya = await wilayaRepository.findOneBy({
          code: city.wilaya_code,
        });
        const newCity = cityRepository.create({
          name: city.commune_name_ascii,
          ar_name: city.commune_name,
          wilaya,
        });
        await cityRepository.save(newCity);
      }),
    );
    const userRepository = this.dataSource.getRepository(User);
    const hashedPassword = await Hash.hash('adminadmin');
    const user = userRepository.create({
      email: 'admin@admin.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
      nom: 'Admin',
      prenom: 'Admin',
    });
    await userRepository.save(user);
  }
}
