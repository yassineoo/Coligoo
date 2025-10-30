// order-tracking.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderTracking } from './entities/order-tracking.entity';
import {
  BulkDepositOrdersDto,
  BulkDepositResultDto,
  ScanResultDto,
} from './dto/scan.dto';
import UserPayload from 'src/auth/types/user-payload.interface';
import { User } from 'src/users/entities/user.entity';

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
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  // Add to orders.service.ts

  /**
   * Scan order by tracking code (orderId)
   * Validates order exists and is in correct status for deposit
   */
  async scanOrderForDeposit(
    orderId: string,
    user: UserPayload,
  ): Promise<ScanResultDto> {
    // Find order by orderId (tracking code)
    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: [
        'sender',
        'deliveryman',
        'fromCity',
        'fromCity.wilaya',
        'toCity',
        'toCity.wilaya',
        'orderItems',
      ],
    });

    if (!order) {
      return {
        success: false,
        message: `Order ${orderId} not found`,
      };
    }

    // Check if order is in correct status
    const validStatuses = [OrderStatus.IN_PREPARATION, OrderStatus.CONFIRMED];

    if (!validStatuses.includes(order.status)) {
      return {
        success: false,
        message: `Order ${orderId} has invalid status: ${order.status}. Expected IN_PREPARATION or CONFIRMED`,
        order: {
          id: order.id,
          orderId: order.orderId,
          status: order.status,
        },
      };
    }

    // Return order details for confirmation
    return {
      success: true,
      message: 'Order found and ready for deposit',
      order: {
        id: order.id,
        orderId: order.orderId,
        status: order.status,
        firstname: order.firstname,
        lastName: order.lastName,
        contactPhone: order.contactPhone,
        fromCity: order.fromCity,
        toCity: order.toCity,
        price: Number(order.price),
        weight: order.weight ? Number(order.weight) : null,
        isStopDesk: order.isStopDesk,
        hasExchange: order.hasExchange,
        orderItems: order.orderItems,
      },
    };
  }

  /**
   * Bulk deposit orders at hub
   * Changes status to DEPOSITED_AT_HUB and creates tracking records
   */
  async bulkDepositOrders(
    dto: BulkDepositOrdersDto,
    user: UserPayload,
  ): Promise<BulkDepositResultDto> {
    const { orderIds } = dto;
    const successfulOrders: number[] = [];
    const failedOrders: { orderId: number; reason: string }[] = [];

    // Get hub user's city for location
    const hubUser = await this.userRepository.findOne({
      where: { id: user.userId },
      relations: ['city', 'city.wilaya'],
    });

    const userEntity = await this.userRepository.findOne({
      where: { id: user.userId },
    });

    if (!hubUser?.city) {
      throw new BadRequestException('Hub user must have a city assigned');
    }

    const location = `${hubUser.city.name}, ${hubUser.city.wilaya.name}`;

    // Process each order
    for (const orderId of orderIds) {
      try {
        // Find order
        const order = await this.orderRepository.findOne({
          where: { id: orderId },
          relations: ['toCity', 'toCity.wilaya'],
        });

        if (!order) {
          failedOrders.push({
            orderId,
            reason: 'Order not found',
          });
          continue;
        }

        // Validate status
        const validStatuses = [
          OrderStatus.IN_PREPARATION,
          OrderStatus.CONFIRMED,
        ];
        if (!validStatuses.includes(order.status)) {
          failedOrders.push({
            orderId,
            reason: `Invalid status: ${order.status}. Expected IN_PREPARATION or CONFIRMED`,
          });
          continue;
        }

        // Update order status and assign hub
        order.status = OrderStatus.DEPOSITED_AT_HUB;
        order.hubId = user.userId;
        order.shippedAt = new Date();

        await this.orderRepository.save(order);

        // Create tracking record
        const tracking = this.trackingRepository.create({
          orderId: order.id,
          status: OrderStatus.DEPOSITED_AT_HUB,
          location,
          note: `Order deposited at hub by ${userEntity.prenom} ${userEntity.nom}`,
          updatedBy: userEntity,
        });

        await this.trackingRepository.save(tracking);

        successfulOrders.push(orderId);
      } catch (error) {
        failedOrders.push({
          orderId,
          reason: error.message || 'Unknown error',
        });
      }
    }

    const successCount = successfulOrders.length;
    const failedCount = failedOrders.length;

    return {
      successCount,
      failedCount,
      successfulOrders,
      failedOrders,
      message: `Successfully deposited ${successCount} orders${
        failedCount > 0 ? `, ${failedCount} failed` : ''
      }`,
    };
  }
}
