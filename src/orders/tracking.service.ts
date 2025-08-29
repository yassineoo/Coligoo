// order-tracking.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatus } from './entities/order.entity';
import { OrderTracking } from './entities/order-tracking.entity';

interface TrackingEntryData {
  status: OrderStatus;
  location: string;
  note: string;
  proofPhoto?: string;
  signature?: string;
  updatedBy?: number;
}

@Injectable()
export class OrderTrackingService {
  constructor(
    @InjectRepository(OrderTracking)
    private readonly trackingRepository: Repository<OrderTracking>,
  ) {}

  async addTrackingEntry(
    orderId: number,
    data: TrackingEntryData,
  ): Promise<OrderTracking> {
    const tracking = this.trackingRepository.create({
      orderId,
      status: data.status,
      location: data.location,
      note: data.note,
      proofPhoto: data.proofPhoto,
      signature: data.signature,
      updatedBy: data.updatedBy ? { id: data.updatedBy } : undefined,
    });

    return await this.trackingRepository.save(tracking);
  }

  async getTrackingHistory(orderId: number): Promise<OrderTracking[]> {
    return await this.trackingRepository.find({
      where: { orderId },
      relations: ['updatedBy'],
      order: { timestamp: 'ASC' },
    });
  }

  async getLatestTracking(orderId: number): Promise<OrderTracking | null> {
    return await this.trackingRepository.findOne({
      where: { orderId },
      relations: ['updatedBy'],
      order: { timestamp: 'DESC' },
    });
  }
}
