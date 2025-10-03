import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { UserRole } from 'src/common/types/roles.enum';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  getProfileImage(filename: string, res: Response) {
    return res.sendFile(filename, { root: 'uploads/profile-images' });
  }
  getProfileImageBlob(filename: string, res: Response) {
    return res.sendFile(filename, { root: 'uploads/profile-images' });
  }

  async getIdCardImage(filename: string, res: Response, userId: number) {
    const user = await this.userRepository.findOneBy({ id: userId });
    const id = filename.split('-')[0];
    if (id !== userId.toString() && user.role !== UserRole.ADMIN) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    return res.sendFile(filename, { root: 'uploads/id-card-images' });
  }

  getPortfolioImage(filename: string, res: Response) {
    return res.sendFile(filename, { root: 'uploads/portfolio-images' });
  }

  getCcpReceipt(filename: string, res: Response) {
    return res.download(
      'uploads/ccp-receipts/' + filename,
      `ccp-receipt-${filename}`,
    );
  }

  getReportImage(filename: string, res: Response) {
    return res.download('uploads/app-reports/' + filename);
  }
}
