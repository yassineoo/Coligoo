import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { AppConfig } from 'src/config/app.config';
import { SlickpayConfig } from 'src/config/slickpay.config';
import { Repository } from 'typeorm';

@Injectable()
export class PaymentService {
  constructor(
    private readonly slickpayConfig: SlickpayConfig,
    private readonly appConfig: AppConfig,
  ) {}
  /*
  async createPayment(amount: number) {
    try {
      const { data: commissionData } = await axios.post(
        'https://devapi.slick-pay.com/api/v2/users/transfers/commission',
        {
          amount,
        },
        {
          headers: {
            Authorization: `Bearer ${this.slickpayConfig.getPublicKey()}`,
          },
        },
      );
      const { data } = await axios.post(
        'https://devapi.slick-pay.com/api/v2/users/transfers',
        {
          amount: amount - commissionData.commission,
          url: `${this.appConfig.getAppUrl()}/api/v1/payment/success`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.slickpayConfig.getPublicKey()}`,
          },
        },
      );
      return data;
    } catch (error) {
      console.log(error);
    }
  }

  async success(transferId: number) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { paymentId: transferId },
      relations: ['plan', 'artisan'],
    });
    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }
    const plan = await this.planRepository.findOneBy({
      id: subscription.plan.id,
    });
    if (!plan) {
      throw new BadRequestException('Plan not found');
    }
    const artisan = await this.artisanRepository.findOne({
      where: { id: subscription.artisan.id },
      relations: ['user'],
    });
    if (!artisan) {
      throw new BadRequestException('Artisan not found');
    }
    try {
      const { data } = await axios.get(
        `https://devapi.slick-pay.com/api/v2/users/transfers/${transferId}`,
        {
          headers: {
            Authorization: `Bearer ${this.slickpayConfig.getPublicKey()}`,
          },
        },
      );
      if (data.completed === 1) {
        subscription.status = SubscriptionStatus.ACCEPTED;
        subscription.subscriptionEndDate = new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 30 * plan.duration,
        );
        await this.subscriptionRepository.save(subscription);
        artisan.status = ArtisanStatus.ACTIF;
        await this.artisanRepository.save(artisan);
        // TODO: Redirect to success page
      }
    } catch (error) {
      console.log(error);
    }
  }
    */
}
