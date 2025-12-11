import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, Between } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto, OrderItemsDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from 'src/users/entities/user.entity';
import { OrderTrackingService } from './tracking.service';
import { BulkUpdateOrderDto, OrderFilterDto, PaginatedResult } from './dto/dto';
import { UserRole } from 'src/common/types/roles.enum';
import { OrderItem } from './entities/order-items';
import { City } from 'src/wilaya/entities/city.entity';

@Injectable()
export class SharedOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    private readonly trackingService: OrderTrackingService, // private readonly notificationService: NotificationService, //private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Process order items and calculate totals
   */
  private async processOrderItems(orderItems: OrderItemsDto[]) {
    if (!orderItems || orderItems.length === 0) {
      throw new Error('Order must contain at least one item');
    }

    let calculatedPrice = 0;
    const orderItemsData = [];

    for (const item of orderItems) {
      // Calculate total price for each item if not provided
      const itemTotal = item.totalPrice || item.unitPrice * item.quantity;

      // Validate that calculated total matches provided total
      if (
        item.totalPrice &&
        Math.abs(item.totalPrice - item.unitPrice * item.quantity) > 0.01
      ) {
        throw new Error(
          `Total price for item ${item.productName} does not match unit price * quantity`,
        );
      }

      calculatedPrice += itemTotal;

      orderItemsData.push({
        ...item,
        totalPrice: itemTotal,
      });

      // Optional: Validate that the product exists
      // await this.validateProductExists(item.productId);
    }

    return { calculatedPrice, orderItemsData };
  }

  /**
   * Create order items for the saved order
   */
  private async createOrderItems(
    orderItemsData: any[],
    order: Order,
  ): Promise<OrderItem[]> {
    const orderItems = [];

    for (const itemData of orderItemsData) {
      const orderItem = this.orderItemRepository.create({
        ...itemData,
        order: order,
      });

      const savedOrderItem = await this.orderItemRepository.save(orderItem);
      orderItems.push(savedOrderItem);
    }

    return orderItems;
  }

  /**
   * Generate product list string from order items for backward compatibility
   */
  private generateProductListFromItems(
    orderItems: OrderItemsDto[],
  ): { name: string; quantity: number }[] {
    return orderItems.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
    }));
  }

  // Private helper methods

  async generateOrderId(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';

    // Generate 8-character ID (e.g., ZRKHG321A)
    for (let i = 0; i < 8; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }

    // Check for uniqueness
    const existingOrder = await this.orderRepository.findOne({
      where: { orderId: result },
    });

    // Regenerate if collision occurs (very rare with 8 chars)
    if (existingOrder) {
      return this.generateOrderId();
    }

    return result;
  }

  async calculateShippingFee(
    fromCityId: number,
    toCityId: number,
    weight: number = 1,
  ): Promise<number> {
    // This would typically integrate with a shipping calculator service
    // For now, we'll use a simple calculation based on distance and weight

    const baseRate = 300; // Base shipping fee in DZD
    const weightMultiplier = weight * 50; // 50 DZD per kg
    const distanceMultiplier = fromCityId !== toCityId ? 200 : 0; // Inter-city fee

    // Special rates for specific routes (could be stored in database)
    const specialRoutes = {
      [`${fromCityId}-${toCityId}`]: 150, // Express routes
    };

    const specialRate = specialRoutes[`${fromCityId}-${toCityId}`] || 0;

    return Math.max(
      baseRate + weightMultiplier + distanceMultiplier - specialRate,
      200,
    );
  }
}
