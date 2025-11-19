import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { In, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { NotificationType } from './types/notification-type.enum';
import { CreateNotifcationDto } from './dto/create-notification.dto';
import { FilterDto } from 'src/common/filters/filter.dto';
import { Cron } from '@nestjs/schedule';
import * as firebase from 'firebase-admin';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    // setup firebase admin
    const app = firebase.initializeApp({
      credential: firebase.credential.cert('firebase-service-account.json'),
    });
  }

  /*

  async createPaymentApprouvedNotification(user: User) {
    const notification = this.notificationRepository.create({
      type: NotificationType.PAYMENT,
      content: 'Félicitations ! Votre paiement a été approuvé !',
      ar_content: 'تهانينا! تمت الموافقة على دفعك!',
      user,
    });
    await this.notificationRepository.save(notification);
    try {
      await firebase.messaging().send({
        notification: {
          title: 'Payment approuvé',
          body: 'Félicitations ! Votre paiement a été approuvé !',
        },
        token: user.deviceToken,
      });
    } catch (error) {}
  }

  async createPaymentRefusedNotification(user: User) {
    const notification = this.notificationRepository.create({
      type: NotificationType.PAYMENT,
      content:
        "Votre paiement n'a pas été approuvé. Veuillez vérifier et resoumettre vos informations de paiement.",
      ar_content:
        'لم يتم الموافقة على دفعك. يرجى التحقق وإعادة تقديم معلومات الدفع الخاصة بك.',
      user,
    });
    await this.notificationRepository.save(notification);
    try {
      await firebase.messaging().send({
        notification: {
          title: 'Payment refusé',
          body: "Votre paiement n'a pas été approuvé. Veuillez vérifier et resoumettre vos informations de paiement.",
        },
        token: user.deviceToken,
      });
    } catch (error) {}
  }

  async createApprouvedArtisanCardNotification(user: User) {
    const notification = this.notificationRepository.create({
      type: NotificationType.ARTISAN_CARD,
      content: "Super ! Votre carte d'artisan a été approuvée !",
      ar_content: 'تمت الموافقة على بطاقتك الحرفية!',
      user,
    });
    await this.notificationRepository.save(notification);
    try {
      await firebase.messaging().send({
        notification: {
          title: 'Carte Artisan approuvée',
          body: "Super ! Votre carte d'artisan a été approuvée avec succès.",
        },
        token: user.deviceToken,
      });
    } catch (error) {}
  }

  async createRefusedArtisanCardNotification(user: User) {
    const notification = this.notificationRepository.create({
      type: NotificationType.ARTISAN_CARD_REFUSED,
      content:
        "Votre carte d'artisan n'a pas été approuvé. Veuillez soumettre à nouveau vos documents et veillez à ce qu'ils soient visibles.",
      ar_content: 'تم رفض بطاقة الحرفي الخاصة بك. يرجى التحقق من معلوماتك.',
      user,
    });
    await this.notificationRepository.save(notification);
    try {
      await firebase.messaging().send({
        notification: {
          title: 'Carte Artisan refusée',
          body: "Votre carte d'artisan n'a pas été approuvé. Veuillez soumettre à nouveau vos documents et veillez à ce qu'ils soient visibles.",
        },
        token: user.deviceToken,
      });
    } catch (error) {}
  }

  async createApprouvedIdentityCardNotification(user: User) {
    const notification = this.notificationRepository.create({
      type: NotificationType.VERIFICATION,
      content:
        "Félicitations ! Votre carte d'identité ou permis de conduite a été approuvé avec succès",
      ar_content:
        'تمت الموافقة بنجاح على بطاقة الهوية أو رخصة السياقة الخاصة بك',
      user,
    });
    await this.notificationRepository.save(notification);
    try {
      await firebase.messaging().send({
        notification: {
          title: "Carte d'identité approuvée",
          body: "Félicitations ! Votre carte d'identité ou permis de conduite a été approuvé avec succès",
        },
        token: user.deviceToken,
      });
    } catch (error) {}
  }

  async createRefusedIdentityCardNotification(user: User) {
    const notification = this.notificationRepository.create({
      type: NotificationType.VERIFICATION_REFUSED,
      content:
        "Votre carte d'identité ou votre permis de conduite n'a pas été approuvé. Veuillez soumettre à nouveau vos documents et veillez à ce qu'ils soient visibles.",
      ar_content:
        'لم يتم الموافقة على بطاقة الحرفي. يرجى إعادة تقديم مستنداتك والتأكد من وضوحها.',
      user,
    });
    await this.notificationRepository.save(notification);
    try {
      await firebase.messaging().send({
        notification: {
          title: "Carte d'identité refusée",
          body: "Votre carte d'identité ou votre permis de conduite n'a pas été approuvé. Veuillez soumettre à nouveau vos documents et veillez à ce qu'ils soient visibles.",
        },
        token: user.deviceToken,
      });
    } catch (error) {}
  }

  async createReportWarningNotification(user: User) {
    const notification = this.notificationRepository.create({
      type: NotificationType.WARNING,
      content:
        'Votre comportement a été signalé par un client. Veuillez veiller à maintenir une attitude respectueuse et professionnelle dans vos interactions.',
      ar_content:
        'تم الإبلاغ عنك من قبل عميل. يرجى التأكد من الحفاظ على تصرف احترافي ومحترم في تفاعلاتك.',
      user,
    });
    await this.notificationRepository.save(notification);
    try {
      await firebase.messaging().send({
        notification: {
          title: 'Avertissement',
          body: 'Votre comportement a été signalé par un client. Veuillez veiller à maintenir une attitude respectueuse et professionnelle dans vos interactions.',
        },
        token: user.deviceToken,
      });
    } catch (error) {}
  }

  async createBugReportNotification(user: User) {
    const notification = this.notificationRepository.create({
      type: NotificationType.PERSONAL,
      content:
        'Merci de nous avoir signalé un Bug. Notre équipe technique travaille pour résoudre le problème.',
      ar_content: 'شكرا لإبلاغنا عن خلل. يعمل فريقنا التقني على حل المشكلة.',
      user,
    });
    await this.notificationRepository.save(notification);
    try {
    } catch (error) {
      await firebase.messaging().send({
        notification: {
          title: 'Bug report',
          body: 'Merci de nous avoir signalé un Bug. Notre équipe technique travaille pour résoudre le problème.',
        },
        token: user.deviceToken,
      });
    }
  }

  async createInactivityNotification(user: User) {
    const notification = this.notificationRepository.create({
      type: NotificationType.PERSONAL,
      content:
        "Nous avons remarqué que vous n'avez pas utilisé l'application depuis quelques jours. Revenez bientôt !",
      ar_content: 'لقد لاحظنا أنك لم تستخدم التطبيق منذ بضعة أيام. عود قريبا!',
      user,
    });
    await this.notificationRepository.save(notification);
  }

  async createArtisanHiringNotification(user: User, hiring: Hiring) {
    const notification = this.notificationRepository.create({
      type: NotificationType.HIRING,
      content: `Le client ${hiring.user.nom} ${hiring.user.prenom} veut vous réserver. Accepter la demande pour qu'il puisse vous noter et vous laisser un commentaire.`,
      ar_content: `يرغب العميل ${hiring.user.nom} ${hiring.user.prenom} في حجز خدماتك. يرجى قبول الطلب حتى يتمكن من تقييمك وترك تعليق.`,
      user,
      hiring,
    });
    await this.notificationRepository.save(notification);
    try {
      await firebase.messaging().send({
        notification: {
          title: 'Recrutement',
          body: `Le client ${hiring.user.nom} ${hiring.user.prenom} veut vous réserver. Accepter la demande pour qu'il puisse vous noter et vous laisser un commentaire.`,
        },
        token: user.deviceToken,
      });
    } catch (error) {}
  }

  async createAcceptedHiringNotification(user: User, hiring: Hiring) {
    const notification = this.notificationRepository.create({
      type: NotificationType.HIRING,
      content: `Votre demande a été acceptée ! N'oubliez pas de noter le handyman ${hiring.artisan.user.nom} ${hiring.artisan.user.prenom}`,
      ar_content: `تم قبول حجزك! لا تنسى تقييم الحرفي ${hiring.artisan.user.nom} ${hiring.artisan.user.prenom}`,
      user,
      hiring,
    });
    await this.notificationRepository.save(notification);
    try {
      await firebase.messaging().send({
        notification: {
          title: 'Recrutement accepté',
          body: `Votre demande a été acceptée ! N'oubliez pas de noter le handyman ${hiring.artisan.user.nom} ${hiring.artisan.user.prenom}`,
        },
        token: user.deviceToken,
      });
    } catch (error) {}
  }

  async createNotification(createNotifcationDto: CreateNotifcationDto) {
    const users = await this.userRepository.find({
      where: {
        role: In(createNotifcationDto.receivers),
      },
    });
    await Promise.all(
      users.map(async (user) => {
        const notification = this.notificationRepository.create({
          type: NotificationType.GLOBAL,
          content: createNotifcationDto.content,
          ar_content: createNotifcationDto.content,
          user,
        });
        await this.notificationRepository.save(notification);
        try {
          await firebase.messaging().send({
            notification: {
              title: 'Notification',
              body: createNotifcationDto.content,
            },
            token: user.deviceToken,
          });
        } catch (error) {}
      }),
    );
    return { message: 'Notifcations envoyes avec succes !' };
  }

  async getUserNotifications(filter: FilterDto, userId: number) {
    const [notifications, count] =
      await this.notificationRepository.findAndCount({
        where: {
          user: { id: userId },
        },
        skip: (filter.page - 1) * filter.pageSize,
        take: filter.pageSize,
        order: {
          createdAt: 'DESC',
        },
        relations: ['hiring.artisan.user', 'hiring.user'],
      });
    const returnedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        let rating;
        if (notification.type === NotificationType.HIRING) {
          rating = await this.ratingRepository.findOneBy({
            user: { id: userId },
            artisan: { id: notification.hiring.artisan.id },
          });
        }
        return {
          ...notification,
          hiring: notification.hiring
            ? {
                id: notification.hiring.id,
                artisanId: notification.hiring.artisan.user.id,
                isClient: notification.hiring.user.id === userId,
                hasCommented: rating ? true : false,
                accepted: notification.hiring.status === HiringStatus.HIRED,
              }
            : undefined,
          fileUploaded:
            notification.type === NotificationType.VERIFICATION_REFUSED ||
            notification.type === NotificationType.ARTISAN_CARD_REFUSED
              ? notification.fileUploaded
              : undefined,
        };
      }),
    );
    return { returnedNotifications, count };
  }

  async markNotificationsAsRead(userId: number) {
    await this.notificationRepository.update(
      { user: { id: userId } },
      { read: true },
    );
    return { message: 'Notifications marked as read' };
  }

  async checkUnreadNotifications(userId: number) {
    const count = await this.notificationRepository.count({
      where: {
        user: { id: userId },
        read: false,
      },
    });
    if (count === 0) return { hasUnreadNotifications: false };
    return { hasUnreadNotifications: true };
  }

  // each friday at 20:00
  @Cron('0 20 * * 5')
  //@Cron('0 * * * * *')
  async sendClientInterestsNotifications() {
    console.log('Sending client interests notifications');

    const artisans = await this.artisanRepository.find({
      where: {
        status: ArtisanStatus.ACTIF,
      },
      relations: ['user'],
    });
    await Promise.all(
      artisans.map(async (artisan) => {
        if (artisan.interestedClients === 0) return;
        const notification = this.notificationRepository.create({
          type: NotificationType.PERSONAL,
          // Cette semaine, vous avez suscité l'intérêt de 20 clients ! Continuez comme ça !
          content: `Cette semaine, vous avez suscité l'intérêt de ${artisan.interestedClients} clients. Continuez votre excellent travail !`,
          ar_content: `هذا الأسبوع ، لفتت انتباه ${artisan.interestedClients} عميلا! تابع هكذا!`,
          user: artisan.user,
        });
        await this.notificationRepository.save(notification);
        try {
          await firebase.messaging().send({
            notification: {
              title: 'Clients intéressés',
              body: `Cette semaine, vous avez suscité l'intérêt de ${artisan.interestedClients} clients. Continuez votre excellent travail !`,
            },
            token: artisan.user.deviceToken,
          });
        } catch (error) {}
        await this.artisanRepository.update(
          { id: artisan.id },
          { interestedClients: 0 },
        );
      }),
    );
  }
    */
}
