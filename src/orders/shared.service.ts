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

@Injectable()
export class SharedOrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly trackingService: OrderTrackingService, // private readonly notificationService: NotificationService, //private readonly eventEmitter: EventEmitter2,
  ) {}

   async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    // Generate unique order ID
    const orderId = await this.generateOrderId();

    // Validate and calculate order totals from order items
    const { calculatedPrice, orderItemsData } = await this.processOrderItems(
      createOrderDto.orderItems,
    );

    // Use calculated price if no price provided or validate against provided price
    const finalPrice = createOrderDto.price || calculatedPrice;
    
    // Optional: Validate that provided price matches calculated price
    if (createOrderDto.price && Math.abs(createOrderDto.price - calculatedPrice) > 0.01) {
      throw new Error('Provided price does not match calculated price from order items');
    }

    // Create the main order
    const order = this.orderRepository.create({
      ...createOrderDto,
      orderId,
      sender: user,
      price: finalPrice,
      // Generate productList from orderItems if not provided (backward compatibility)
      productList: createOrderDto.productList || this.generateProductListFromItems(createOrderDto.orderItems),
    });

    // Calculate shipping fee based on cities and weight
    order.shippingFee = await this.calculateShippingFee(
      createOrderDto.fromCityId,
      createOrderDto.toCityId,
      createOrderDto.weight ,
    );

    // Save the order first
    const savedOrder = await this.orderRepository.save(order);

    // Create and save order items
    const orderItems = await this.createOrderItems(orderItemsData, savedOrder);
    
    // Update the saved order with the order items relationship
    savedOrder.orderItems = orderItems;

    // Create initial tracking entry
    await this.trackingService.addTrackingEntry(savedOrder.id, {
      status: OrderStatus.PENDING,
      location: savedOrder.fromCity?.name || 'Unknown Location',
      note: 'Order created and awaiting confirmation',
    });

    // Emit event for notifications
    // this.eventEmitter.emit('order.created', savedOrder);

    return savedOrder;
  }

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
      const itemTotal = item.totalPrice || (item.unitPrice * item.quantity);
      
      // Validate that calculated total matches provided total
      if (item.totalPrice && Math.abs(item.totalPrice - (item.unitPrice * item.quantity)) > 0.01) {
        throw new Error(`Total price for item ${item.productName} does not match unit price * quantity`);
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
  private async createOrderItems(orderItemsData: any[], order: Order): Promise<OrderItem[]> {
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
  private generateProductListFromItems(orderItems: OrderItemsDto[]): string {
    return orderItems
      .map(item => `${item.productName} (x${item.quantity})`)
      .join(', ');
  }

    // Private helper methods

  async generateOrderId(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.orderRepository.count({
      where: {
        createdAt: Between(
          new Date(`${year}-01-01`),
          new Date(`${year}-12-31`),
        ),
      },
    });

    return `ORD-${year}-${String(count + 1).padStart(6, '0')}`;
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
