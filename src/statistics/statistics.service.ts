import { Injectable } from '@nestjs/common';
import { UserRole } from 'src/common/types/roles.enum';
import { User } from 'src/users/entities/user.entity';
import { DataSource, IsNull, Not } from 'typeorm';

@Injectable()
export class StatisticsService {
  constructor(private readonly dataSource: DataSource) {}

  async getGeneralStatistics() {
    const userRepository = this.dataSource.getRepository(User);
    const clientCount = await userRepository.count({
      where: { role: UserRole.CLIENT },
    });
    //const artisanCount = await userRepository.count({where: {role: Role.ARTISAN}});
    const usersCount = await userRepository.count({
      where: { role: Not(UserRole.ADMIN), sex: Not(IsNull()) },
    });

    return {};
  }

  async getRevenuByMonth() {
    const currentMonth = new Date().getMonth();
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(currentMonth + 1);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setDate(1);
    console.log(oneYearAgo);

    return {};
  }

  async getRevenuLastMonth() {
    return {};
  }

  async getRevenuLastWeek() {
    return {};
  }
}
