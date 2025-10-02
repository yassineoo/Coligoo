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
import { Product } from 'src/products/entities/product.entity';
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
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly sharedOrder: SharedOrdersService,
    private readonly trackingService: OrderTrackingService,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User): Promise<Order> {
    try {
      // Validate that either orderItems or productList is provided (but not both or neither)
      const hasOrderItems =
        createOrderDto.orderItems && createOrderDto.orderItems.length > 0;
      const hasProductList =
        createOrderDto.productList && createOrderDto.productList.length > 0;

      if (!hasOrderItems && !hasProductList) {
        throw new BadRequestException(
          'Either orderItems or productList must be provided',
        );
      }

      if (hasOrderItems && hasProductList) {
        throw new BadRequestException(
          'Cannot provide both orderItems and productList. Choose one method.',
        );
      }

      // Generate unique order ID
      const orderId = await this.sharedOrder.generateOrderId();

      let calculatedPrice = 0;
      let orderItemsData = [];

      // Process based on which data is provided
      if (hasOrderItems) {
        // Process registered products with orderItems
        const result = await this.processOrderItems(createOrderDto.orderItems);
        calculatedPrice = result.calculatedPrice;
        orderItemsData = result.orderItemsData;
      } else if (hasProductList) {
        // Process unregistered products with productList
        calculatedPrice = this.calculatePriceFromProductList(
          createOrderDto.productList,
          createOrderDto.price,
        );
      }

      // Use calculated price if no price provided or validate against provided price
      const finalPrice = createOrderDto.price || calculatedPrice;

      // Optional: Validate that provided price matches calculated price (only for orderItems)
      if (
        hasOrderItems &&
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
        fromCity,
        toCity,
        price: finalPrice, // Total price of all products
        productList: createOrderDto.productList || null, // Only set if using productList
        /*  weight: createOrderDto.weight,
        height: createOrderDto.height,
        width: createOrderDto.width,
        length: createOrderDto.length,
        */
        discount: createOrderDto.discount || 0,
        isStopDesk: createOrderDto.isStopDesk,
        freeShipping: createOrderDto.freeShipping,
        hasExchange: createOrderDto.hasExchange,
        paymentType: createOrderDto.paymentType,
        shippingFee: 600, // Will be calculated when cities are assigned
      });

      // Only calculate shipping if both cities are provided
      if (fromCity && toCity) {
        /*    const totalWeight =
          createOrderDto.weight ||
          (hasOrderItems
            ? this.calculateTotalWeight(createOrderDto.orderItems)
            : this.calculateWeightFromProductList(createOrderDto.productList));
            */

        order.shippingFee = await this.sharedOrder.calculateShippingFee(
          1,
          createOrderDto.toCityId,
          //  totalWeight,
        );
      }

      // Save the order first
      const savedOrder = await this.orderRepository.save(order);

      // Create and save order items only if using orderItems
      if (hasOrderItems) {
        const orderItems = await this.createOrderItems(
          orderItemsData,
          savedOrder,
        );
        savedOrder.orderItems = orderItems;
      }

      // Create initial tracking entry
      try {
        await this.trackingService.addTrackingEntry(savedOrder.id, {
          status: OrderStatus.IN_PREPARATION,
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

    // Check if original order has orderItems or productList
    const hasOrderItems =
      originalOrder.orderItems && originalOrder.orderItems.length > 0;
    const hasProductList =
      originalOrder.productList && originalOrder.productList.length > 0;

    let duplicateData: CreateOrderDto;

    if (hasOrderItems) {
      // Duplicate with orderItems
      const orderItems: OrderItemsDto[] = originalOrder.orderItems.map(
        (item) => ({
          productId: item.productId,
          productName: item.product.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        }),
      );

      duplicateData = {
        firstname: originalOrder.firstname,
        lastName: originalOrder.lastName,
        contactPhone: originalOrder.contactPhone,
        contactPhone2: originalOrder.contactPhone2,
        address: originalOrder.address,
        note: originalOrder.note,
        //   fromCityId: originalOrder.fromCity?.id,
        toCityId: originalOrder.toCity?.id,
        orderItems: orderItems,
        price: originalOrder.price,
        /*/  weight: originalOrder.weight,
        height: originalOrder.height,
        width: originalOrder.width,
        length: originalOrder.length,
        */
        isStopDesk: originalOrder.isStopDesk,
        freeShipping: originalOrder.freeShipping,
        hasExchange: originalOrder.hasExchange,
        paymentType: originalOrder.paymentType,
      };
    } else {
      // Duplicate with productList
      duplicateData = {
        firstname: originalOrder.firstname,
        lastName: originalOrder.lastName,
        contactPhone: originalOrder.contactPhone,
        contactPhone2: originalOrder.contactPhone2,
        address: originalOrder.address,
        note: originalOrder.note,
        toCityId: originalOrder.toCity?.id,
        productList: originalOrder.productList,
        orderItems: [], // Empty array to satisfy DTO requirements
        price: originalOrder.price,
        /*  weight: originalOrder.weight,
        height: originalOrder.height,
        width: originalOrder.width,
        length: originalOrder.length,
        */
        discount: originalOrder.discount,
        isStopDesk: originalOrder.isStopDesk,
        freeShipping: originalOrder.freeShipping,
        hasExchange: originalOrder.hasExchange,
        paymentType: originalOrder.paymentType,
      };
    }

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
      relations: ['sender', 'fromCity', 'toCity', 'orderItems'],
    });

    if (!order) {
      throw new NotFoundException(
        'Order not found or you do not have permission to access it',
      );
    }

    return order;
  }

  /**
   * Process order items and calculate totals (for registered products)
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
   * Calculate price from productList (for unregistered products)
   */
  private calculatePriceFromProductList(
    productList: { name: string; quantity: number }[],
    providedPrice?: number,
  ): number {
    if (providedPrice) {
      return providedPrice;
    }

    // Since productList items don't have individual prices,
    // we need the user to provide the total price
    throw new BadRequestException(
      'When using productList, you must provide the total price',
    );
  }

  /**
   * Calculate total weight from productList
   */
  private calculateWeightFromProductList(
    productList: { name: string; quantity: number }[],
  ): number {
    const defaultWeightPerItem = 0.5; // kg
    return productList.reduce(
      (total, item) => total + item.quantity * defaultWeightPerItem,
      0,
    );
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
