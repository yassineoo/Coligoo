import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In, Between, IsNull } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto, OrderItemsDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { User } from 'src/users/entities/user.entity';
import { Product } from 'src/products/entities/product.entity'; // Add missing import
import { OrderTrackingService } from './tracking.service';
import { BulkUpdateOrderDto, OrderFilterDto, PaginatedResult } from './dto/dto';
import { UserRole } from 'src/common/types/roles.enum';
import { OrderItem } from './entities/order-items';
import { SharedOrdersService } from './shared.service';
import { City } from 'src/wilaya/entities/city.entity';

@Injectable()
export class OrdersOperationsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product) // Add missing Product repository
    private readonly productRepository: Repository<Product>,
    private readonly sharedOrder: SharedOrdersService,

    private readonly trackingService: OrderTrackingService, // Make optional // private readonly notificationService: NotificationService, // private readonly eventEmitter: EventEmitter2,
  ) {}

  // Updated create method - no longer requires cities
  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    try {
      // Generate unique order ID
      const orderId = await this.sharedOrder.generateOrderId();

      // Validate and calculate order totals from order items
      const { calculatedPrice, orderItemsData } = await this.processOrderItems(
        createOrderDto.orderItems,
      );

      // Use calculated price if no price provided or validate against provided price
      const finalPrice = createOrderDto.price || calculatedPrice;

      // Optional: Validate that provided price matches calculated price
      if (
        createOrderDto.price &&
        Math.abs(createOrderDto.price - calculatedPrice) > 0.01
      ) {
        throw new BadRequestException(
          'Provided price does not match calculated price from order items',
        );
      }

      // Handle optional cities - only fetch if IDs are provided
      let fromCity = null;
      let toCity = null;

      if (createOrderDto.fromCityId) {
        fromCity = await this.cityRepository.findOne({
          where: { id: createOrderDto.fromCityId },
        });

        if (!fromCity) {
          throw new BadRequestException(
            `From city with ID ${createOrderDto.fromCityId} not found`,
          );
        }
      }

      if (createOrderDto.toCityId) {
        toCity = await this.cityRepository.findOne({
          where: { id: createOrderDto.toCityId },
        });

        if (!toCity) {
          throw new BadRequestException(
            `To city with ID ${createOrderDto.toCityId} not found`,
          );
        }
      }

      // Create the main order
      const order = this.orderRepository.create({
        orderId,
        sender: user,
        firstname: createOrderDto.firstname,
        lastName: createOrderDto.lastName,
        contactPhone: createOrderDto.contactPhone,
        contactPhone2: createOrderDto.contactPhone2,
        address: createOrderDto.address,
        note: createOrderDto.note,
        fromCity, // Can be null initially
        toCity, // Can be null initially
        price: finalPrice,
        weight: createOrderDto.weight,
        height: createOrderDto.height,
        width: createOrderDto.width,
        length: createOrderDto.length,
        isStopDesk: createOrderDto.isStopDesk,
        freeShipping: createOrderDto.freeShipping,
        hasExchange: createOrderDto.hasExchange,
        paymentType: createOrderDto.paymentType,
        shippingFee: null, // Will be calculated when cities are assigned
      });

      // Only calculate shipping if both cities are provided
      if (fromCity && toCity) {
        order.shippingFee = await this.sharedOrder.calculateShippingFee(
          createOrderDto.fromCityId,
          createOrderDto.toCityId,
          createOrderDto.weight ||
            this.calculateTotalWeight(createOrderDto.orderItems),
        );
      }

      // Save the order first
      const savedOrder = await this.orderRepository.save(order);

      // Create and save order items
      const orderItems = await this.createOrderItems(
        orderItemsData,
        savedOrder,
      );

      // Update the saved order with the order items relationship
      savedOrder.orderItems = orderItems;

      // Create initial tracking entry
      try {
        await this.trackingService.addTrackingEntry(savedOrder.id, {
          status: OrderStatus.PENDING,
          location: savedOrder.fromCity?.name || 'Warehouse',
          note:
            savedOrder.fromCity && savedOrder.toCity
              ? 'Order created and awaiting confirmation'
              : 'Order created - awaiting city assignment by hub staff',
        });
      } catch (trackingError) {
        console.warn('Failed to create tracking entry:', trackingError.message);
      }

      return savedOrder;
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new BadRequestException(
          'One or more products in the order do not exist. Please check your product IDs.',
        );
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new BadRequestException(`Failed to create order: ${error.message}`);
    }
  }

  async duplicateOrder(orderId: number, user: User): Promise<Order> {
    // Find original order with order items included
    const originalOrder = await this.findOneWithPermissionAndItems(
      orderId,
      user,
    );

    // Map original order items to OrderItemsDto format
    const orderItems: OrderItemsDto[] =
      originalOrder.orderItems?.map((item) => ({
        productId: item.productId,
        productName: item.product.productName, // Use productName directly from OrderItem
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })) || [];

    const duplicateData: CreateOrderDto = {
      orderId: '', // Will be generated in the create() method
      firstname: originalOrder.firstname,
      lastName: originalOrder.lastName,
      contactPhone: originalOrder.contactPhone,
      contactPhone2: originalOrder.contactPhone2,
      address: originalOrder.address,
      note: originalOrder.note,
      fromCityId: originalOrder.fromCity.id,
      toCityId: originalOrder.toCity.id,
      productList: originalOrder.productList, // Keep for backward compatibility
      orderItems: orderItems, // New structured order items
      price: originalOrder.price,
      weight: originalOrder.weight,
      height: originalOrder.height,
      width: originalOrder.width,
      length: originalOrder.length,
      isStopDesk: originalOrder.isStopDesk,
      freeShipping: originalOrder.freeShipping,
      hasExchange: originalOrder.hasExchange,
      paymentType: originalOrder.paymentType,
    };

    return this.create(duplicateData, user);
  }

  /**
   * Find order with permission check and include order items
   */
  private async findOneWithPermissionAndItems(
    orderId: number,
    user: User,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, sender: { id: user.id } },
      relations: [
        'sender',
        'fromCity',
        'toCity',
        'orderItems', // Include order items relation
      ],
    });

    if (!order) {
      throw new NotFoundException(
        'Order not found or you do not have permission to access it',
      );
    }

    return order;
  }

  /**
   * Process order items and calculate totals
   */
  private async processOrderItems(orderItems: OrderItemsDto[]) {
    if (!orderItems || orderItems.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    let calculatedPrice = 0;
    const orderItemsData = [];

    for (const item of orderItems) {
      // Validate that the product exists
      await this.validateProductExists(item.productId);

      // Calculate total price for each item if not provided
      const itemTotal = item.totalPrice || item.unitPrice * item.quantity;

      // Validate that calculated total matches provided total
      if (
        item.totalPrice &&
        Math.abs(item.totalPrice - item.unitPrice * item.quantity) > 0.01
      ) {
        throw new BadRequestException(
          `Total price for item ${item.productName} does not match unit price * quantity`,
        );
      }

      calculatedPrice += itemTotal;

      orderItemsData.push({
        ...item,
        totalPrice: itemTotal,
      });
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
  private generateProductListFromItems(orderItems: OrderItemsDto[]): string {
    return orderItems
      .map((item) => `${item.productName} (x${item.quantity})`)
      .join(', ');
  }

  /**
   * Calculate total weight from order items if not provided
   */
  private calculateTotalWeight(orderItems: OrderItemsDto[]): number {
    // This would typically fetch product weights from database
    // For now, return a default weight per item
    const defaultWeightPerItem = 0.5; // kg
    return orderItems.reduce(
      (total, item) => total + item.quantity * defaultWeightPerItem,
      0,
    );
  }

  /**
   * Validate that a product exists
   */
  private async validateProductExists(productId: number): Promise<boolean> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return true;
  }

  /**
   * Get first available product or create a default one for legacy orders
   */
  private async getOrCreateDefaultProduct(): Promise<number> {
    // Try to get the first available product
    const existingProduct = await this.productRepository.findOne({
      order: { id: 'ASC' },
    });

    if (existingProduct) {
      return existingProduct.id;
    }

    // If no products exist, create a default one
    const defaultProduct = this.productRepository.create({
      productName: 'Produit par défaut',
      description: 'Produit créé automatiquement pour les commandes legacy',
      price: 0,
      // Add other required fields based on your Product entity
    });

    const savedProduct = await this.productRepository.save(defaultProduct);
    return savedProduct.id;
  }
}
