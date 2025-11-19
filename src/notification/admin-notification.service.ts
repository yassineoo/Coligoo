import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AdminNotification } from './entities/admin-notification.entity';
import { Repository } from 'typeorm';
import { FilterDto } from 'src/common/filters/filter.dto';

@Injectable()
export class AdminNotificationService {
  constructor(
    @InjectRepository(AdminNotification)
    private readonly adminNotificationRepository: Repository<AdminNotification>,
  ) {}

  async createPaymentValidationNotification() {
    const notification = this.adminNotificationRepository.create({
      title: 'Validation de paiement requise',
      content:
        'Un handyman a soumis une demande de paiement. Veuillez vérifier et approuver le paiement si tout est en ordre.',
    });
    await this.adminNotificationRepository.save(notification);
  }

  async createReportNotification() {
    const notification = this.adminNotificationRepository.create({
      title: "Signalement d'un client concernant un handyman",
      content:
        'Un client a signalé un problème avec un handyman. Examinez la situation et prenez les mesures nécessaires.',
    });
    await this.adminNotificationRepository.save(notification);
  }

  async createBugReportNotification() {
    const notification = this.adminNotificationRepository.create({
      title: 'Rapport de bug soumis',
      content:
        'Un rapport de bug a été soumis par un utilisateur. Assurez-vous de prendre les mesures appropriées pour résoudre le problème.',
    });
    await this.adminNotificationRepository.save(notification);
  }

  async createNewUserNotification() {
    const notification = this.adminNotificationRepository.create({
      title: 'Nouvelle inscription utilisateur',
      content:
        "Un nouvel utilisateur s'est inscrit sur la plateforme. Veuillez vérifier et approuver son compte si nécessaire.",
    });
    await this.adminNotificationRepository.save(notification);
  }

  async getNotifications(filterDto: FilterDto) {
    const [notifications, count] =
      await this.adminNotificationRepository.findAndCount({
        take: filterDto.pageSize,
        skip: filterDto.pageSize * (filterDto.page - 1),
        order: {
          createdAt: 'DESC',
        },
      });
    return {
      notifications,
      count,
    };
  }

  async markNotificationsAsRead() {
    await this.adminNotificationRepository.update({}, { read: true });
    return {
      message: 'Notifications marked as read',
    };
  }
}
