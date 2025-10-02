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
import { SharedOrdersService } from './shared.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly trackingService: OrderTrackingService, // private readonly notificationService: NotificationService, //private readonly eventEmitter: EventEmitter2,
    private readonly sharedOrder: SharedOrdersService,
  ) {}

  async findAllWithFilters(
    filterDto: OrderFilterDto,
    user: User,
  ): Promise<PaginatedResult<Order>> {
    const {
      page = 1,
      limit = 10,
      status,
      fromCityId,
      toCityId,
      vendorId,
      deliverymanId,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.sender', 'sender')
      .leftJoinAndSelect('order.deliveryman', 'deliveryman')
      .leftJoinAndSelect('order.fromCity', 'fromCity')
      .leftJoinAndSelect('order.toCity', 'toCity');

    // Apply role-based filtering
    if (user.role === UserRole.VENDOR) {
      query = query.where('order.senderId = :userId', { userId: user.id });
    } else if (user.role === UserRole.DELIVERYMAN) {
      query = query.where('order.deliverymanId = :userId', { userId: user.id });
    }

    // Apply filters
    if (status) {
      query = query.andWhere('order.status = :status', { status });
    }

    if (fromCityId) {
      query = query.andWhere('order.fromCityId = :fromCityId', { fromCityId });
    }

    if (toCityId) {
      query = query.andWhere('order.toCityId = :toCityId', { toCityId });
    }

    if (vendorId && user.role === UserRole.ADMIN) {
      query = query.andWhere('order.senderId = :vendorId', { vendorId });
    }

    if (deliverymanId && user.role === UserRole.ADMIN) {
      query = query.andWhere('order.deliverymanId = :deliverymanId', {
        deliverymanId,
      });
    }

    if (dateFrom && dateTo) {
      query = query.andWhere('order.createdAt BETWEEN :dateFrom AND :dateTo', {
        dateFrom,
        dateTo,
      });
    }

    // Fix: Replace ILIKE with LIKE for MySQL/MariaDB compatibility
    if (search) {
      query = query.andWhere(
        '(order.orderId LIKE :search OR order.firstname LIKE :search OR order.lastName LIKE :search OR order.contactPhone LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting with validation
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'status',
      'price',
      'orderId',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query = query.orderBy(`order.${sortField}`, sortDirection);

    // Apply pagination with validation
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100); // Cap at 100 items per page
    const offset = (validatedPage - 1) * validatedLimit;

    query = query.skip(offset).take(validatedLimit);

    try {
      const [data, total] = await query.getManyAndCount();

      return {
        data,
        meta: {
          total,
          page: validatedPage,
          lastPage: Math.ceil(total / validatedLimit),
          limit: validatedLimit,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to retrieve orders: ${error.message}`,
      );
    }
  }
  async findVendorOrders(
    vendorId: number,
    filterDto: OrderFilterDto,
  ): Promise<PaginatedResult<Order>> {
    const user = await this.userRepository.findOne({
      where: { id: vendorId, role: UserRole.VENDOR },
    });

    if (!user) {
      throw new NotFoundException('Vendor not found');
    }

    return this.findAllWithFilters(filterDto, user);
  }

  async findDeliverymanOrders(
    deliverymanId: number,
    filterDto: OrderFilterDto,
  ): Promise<PaginatedResult<Order>> {
    const user = await this.userRepository.findOne({
      where: { id: deliverymanId, role: UserRole.DELIVERYMAN },
    });

    if (!user) {
      throw new NotFoundException('Deliveryman not found');
    }

    return this.findAllWithFilters(filterDto, user);
  }

  async findOneWithPermission(id: number, user: User): Promise<Order> {
    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.sender', 'sender')
      .leftJoinAndSelect('order.deliveryman', 'deliveryman')
      .leftJoinAndSelect('order.fromCity', 'fromCity')
      .leftJoinAndSelect('order.toCity', 'toCity')
      .leftJoinAndSelect('order.orderItems', 'orderItems')

      .where('order.id = :id', { id });

    // Apply role-based access control
    if (user.role === UserRole.VENDOR) {
      query = query.andWhere('order.senderId = :userId', { userId: user.id });
    } else if (user.role === UserRole.DELIVERYMAN) {
      query = query.andWhere('order.deliverymanId = :userId', {
        userId: user.id,
      });
    }

    const order = await query.getOne();

    if (!order) {
      throw new NotFoundException(`Order #${id} not found or access denied`);
    }

    return order;
  }

  async updateWithPermission(
    id: number,
    updateOrderDto: UpdateOrderDto,
    user: User,
  ): Promise<Order> {
    const order = await this.findOneWithPermission(id, user);

    // Business rules for updates based on status and role
    if (user.role === UserRole.VENDOR) {
      // Vendors can only update orders that are PENDING or CONFIRMED
      if (
        ![OrderStatus.IN_PREPARATION, OrderStatus.CONFIRMED].includes(
          order.status,
        )
      ) {
        throw new BadRequestException('Cannot update order in current status');
      }

      // Vendors cannot change certain fields
      delete updateOrderDto.status;
      delete updateOrderDto.deliverymanId;
    } else if (user.role === UserRole.DELIVERYMAN) {
      // Deliverymen can only update status and delivery-related fields
      const allowedFields = ['status', 'deliveredAt'];
      Object.keys(updateOrderDto).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updateOrderDto[key];
        }
      });
    }

    Object.assign(order, updateOrderDto);
    const updatedOrder = await this.orderRepository.save(order);

    // Track status changes
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      await this.trackingService.addTrackingEntry(id, {
        status: updateOrderDto.status,
        location: order.toCity.name,
        note: `Status changed to ${updateOrderDto.status}`,
        updatedBy: user.id,
      });

      // Send notifications
      //this.eventEmitter.emit('order.statusChanged', updatedOrder, user);
    }

    return updatedOrder;
  }

  async updateOrderStatus(
    id: number,
    status: OrderStatus,
    user: User,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['sender', 'deliveryman', 'fromCity', 'toCity'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    // Validate status transition
    this.validateStatusTransition(order.status, status, user.role);

    const previousStatus = order.status;
    order.status = status;

    // Set timestamps for specific statuses
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    } else if (status === OrderStatus.CANCELLED) {
      order.cancelledAt = new Date();
    }

    const updatedOrder = await this.orderRepository.save(order);

    // Add tracking entry
    await this.trackingService.addTrackingEntry(id, {
      status,
      location:
        status === OrderStatus.DELIVERED
          ? order.toCity.name
          : order.fromCity.name,
      note: `Status changed from ${previousStatus} to ${status}`,
      updatedBy: user.id,
    });

    // Emit events for notifications and webhooks
    // this.eventEmitter.emit('order.statusChanged', updatedOrder, user);

    return updatedOrder;
  }

  async assignDeliveryman(id: number, deliverymanId: number): Promise<Order> {
    const [order, deliveryman] = await Promise.all([
      this.orderRepository.findOne({
        where: { id },
        relations: ['sender', 'fromCity', 'toCity'],
      }),
      this.userRepository.findOne({
        where: { id: deliverymanId, role: UserRole.DELIVERYMAN },
      }),
    ]);

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    if (!deliveryman) {
      throw new NotFoundException('Deliveryman not found');
    }

    order.deliveryman = deliveryman;

    // Update status if it's still pending
    if (order.status === OrderStatus.IN_PREPARATION) {
      order.status = OrderStatus.CONFIRMED;
    }

    const updatedOrder = await this.orderRepository.save(order);

    // Add tracking entry
    await this.trackingService.addTrackingEntry(id, {
      status: order.status,
      location: order.fromCity.name,
      note: `Assigned to deliveryman: ${deliveryman.fullName} `,
    });

    // Send notifications
    /* this.eventEmitter.emit(
      'order.deliverymanAssigned',
      updatedOrder,
      deliveryman,
    );
    */

    return updatedOrder;
  }

  async bulkUpdateOrders(bulkUpdateDto: BulkUpdateOrderDto) {
    const { orderIds, updateData } = bulkUpdateDto;
    const results = { updated: 0, failed: 0, errors: [] };

    for (const orderId of orderIds) {
      try {
        await this.orderRepository.update(orderId, updateData);
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Order ${orderId}: ${error.message}`);
      }
    }

    return results;
  }

  async cancelOrder(id: number, reason: string, user: User): Promise<Order> {
    const order = await this.findOneWithPermission(id, user);

    if (
      ![OrderStatus.IN_PREPARATION, OrderStatus.CONFIRMED].includes(
        order.status,
      )
    ) {
      throw new BadRequestException('Cannot cancel order in current status');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();

    const updatedOrder = await this.orderRepository.save(order);

    // Add tracking entry
    await this.trackingService.addTrackingEntry(id, {
      status: OrderStatus.CANCELLED,
      location: order.fromCity.name,
      note: `Order cancelled. Reason: ${reason}`,
      updatedBy: user.id,
    });

    // Send notifications
    //this.eventEmitter.emit('order.cancelled', updatedOrder, reason, user);

    return updatedOrder;
  }

  async getOrderAnalytics(period: string, user: User) {
    let dateCondition = '';
    const now = new Date();

    switch (period) {
      case 'day':
        dateCondition = `DATE(order.createdAt) = CURRENT_DATE`;
        break;
      case 'week':
        dateCondition = `order.createdAt >= DATE_TRUNC('week', CURRENT_DATE)`;
        break;
      case 'month':
        dateCondition = `order.createdAt >= DATE_TRUNC('month', CURRENT_DATE)`;
        break;
      case 'year':
        dateCondition = `order.createdAt >= DATE_TRUNC('year', CURRENT_DATE)`;
        break;
    }

    let baseQuery = this.orderRepository.createQueryBuilder('order');

    // Apply role-based filtering
    if (user.role === UserRole.VENDOR) {
      baseQuery = baseQuery.where('order.senderId = :userId', {
        userId: user.id,
      });
    }

    if (dateCondition) {
      baseQuery = baseQuery.andWhere(dateCondition);
    }

    const [totalOrders, totalRevenue] = await Promise.all([
      baseQuery.getCount(),
      baseQuery
        .select('SUM(order.price)', 'revenue')
        .getRawOne()
        .then((result) => parseFloat(result.revenue) || 0),
    ]);

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Status breakdown
    const statusBreakdown = await baseQuery
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany()
      .then((results) =>
        results.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
      );

    // Revenue by period (last 7 periods)
    const revenueByPeriod = await this.getRevenueByPeriod(period, user);

    // Top performing cities
    const topCities = await this.getTopCities(user);

    // Delivery performance metrics
    const deliveryMetrics = await this.getDeliveryMetrics(user);

    return {
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      statusBreakdown,
      revenueByPeriod,
      topCities,
      deliveryMetrics,
    };
  }

  async exportOrders(filterDto: OrderFilterDto, format: string, user: User) {
    const { data } = await this.findAllWithFilters(
      { ...filterDto, limit: 10000 },
      user,
    );

    if (format === 'excel') {
      return this.exportToExcel(data);
    }

    return this.exportToCSV(data);
  }

  async getTrackingInfo(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { orderId },
      relations: ['fromCity', 'toCity', 'deliveryman'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const trackingHistory = await this.trackingService.getTrackingHistory(
      order.id,
    );
    const estimatedDelivery = this.calculateEstimatedDelivery(order);

    return {
      orderId: order.orderId,
      status: order.status,
      trackingHistory,
      estimatedDelivery,
      currentLocation: this.getCurrentLocation(order, trackingHistory),
      customerInfo: {
        name: `${order.firstname} ${order.lastName}`,
        phone: order.contactPhone,
        phone2: order.contactPhone2,
        address: order.address,
        city: order.toCity,
      },
      deliveryInfo: order.deliveryman
        ? {
            name: `${order.deliveryman.fullName} `,
            phone: order.deliveryman.phoneNumber,
          }
        : null,
    };
  }

  async uploadDeliveryProof(
    id: number,
    proofData: { photoUrl?: string; signatureUrl?: string; note?: string },
    user: User,
  ) {
    const order = await this.orderRepository.findOne({
      //  where: { id, deliverymanId: user.id },
      where: { id },
      relations: ['toCity'],
    });

    if (!order) {
      throw new NotFoundException('Order not found or not assigned to you');
    }

    if (order.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new BadRequestException(
        'Order must be in transit to upload delivery proof',
      );
    }

    // Save delivery proof
    await this.trackingService.addTrackingEntry(id, {
      status: OrderStatus.DELIVERED,
      location: order.toCity.name,
      note: proofData.note || 'Package delivered successfully',
      proofPhoto: proofData.photoUrl,
      signature: proofData.signatureUrl,
      updatedBy: user.id,
    });

    // Update order status
    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    await this.orderRepository.save(order);

    // Send notifications
    // this.eventEmitter.emit('order.delivered', order, proofData);

    return {
      message: 'Delivery proof uploaded successfully',
      orderId: order.orderId,
      deliveredAt: order.deliveredAt,
    };
  }

  async bulkRemove(orderIds: number[]): Promise<void> {
    const orders = await this.orderRepository.find({
      where: { id: In(orderIds) },
    });

    if (!orders.length) {
      throw new NotFoundException('No orders found for the given IDs');
    }

    const undeletable = orders.filter(
      (order) =>
        order.status !== OrderStatus.CANCELLED &&
        order.status !== OrderStatus.IN_PREPARATION,
    );

    if (undeletable.length > 0) {
      throw new BadRequestException(
        `Only cancelled orders can be deleted. Problematic order IDs: ${undeletable
          .map((o) => o.id)
          .join(', ')}`,
      );
    }

    await this.orderRepository.remove(orders);
  }

  async getOrderStatistics(user: User) {
    let baseQuery = this.orderRepository.createQueryBuilder('order');

    if (user.role === UserRole.VENDOR) {
      baseQuery = baseQuery.where('order.senderId = :userId', {
        userId: user.id,
      });
    } else if (user.role === UserRole.DELIVERYMAN) {
      baseQuery = baseQuery.where('order.deliverymanId = :userId', {
        userId: user.id,
      });
    }

    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      todayOrders,
    ] = await Promise.all([
      baseQuery.getCount(),
      baseQuery
        .clone()
        .where('order.status = :status', { status: OrderStatus.IN_PREPARATION })
        .getCount(),
      baseQuery
        .clone()
        .where('order.status = :status', { status: OrderStatus.DELIVERED })
        .getCount(),
      baseQuery
        .clone()
        .where('order.status = :status', { status: OrderStatus.CANCELLED })
        .getCount(),
      baseQuery
        .clone()
        .where('DATE(order.createdAt) = CURRENT_DATE')
        .getCount(),
    ]);

    const successRate =
      totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    return {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      todayOrders,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    userRole: UserRole,
  ): void {
    const allowedTransitions = {
      [OrderStatus.IN_PREPARATION]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.CONFIRMED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.DELIVERED,
        OrderStatus.RETURNED,
      ],
      [OrderStatus.DELIVERED]: [], // Final state
      [OrderStatus.CANCELLED]: [], // Final state
      [OrderStatus.RETURNED]: [OrderStatus.IN_PREPARATION], // Can be resent
    };

    const rolePermissions = {
      [UserRole.ADMIN]: Object.values(OrderStatus),
      [UserRole.DELIVERYMAN]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED,
        OrderStatus.RETURNED,
      ],
      [UserRole.VENDOR]: [OrderStatus.CANCELLED],
    };

    if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }

    if (!rolePermissions[userRole]?.includes(newStatus)) {
      throw new ForbiddenException(
        `Role ${userRole} cannot set status to ${newStatus}`,
      );
    }
  }

  private async getRevenueByPeriod(period: string, user: User) {
    const periods = 7; // Last 7 periods
    const results = [];

    for (let i = periods - 1; i >= 0; i--) {
      let startDate: Date;
      let endDate: Date;
      let periodLabel: string;

      const now = new Date();

      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
          periodLabel = startDate.toISOString().split('T')[0];
          break;
        case 'week':
          startDate = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          periodLabel = `Week ${Math.floor(
            startDate.getTime() / (7 * 24 * 60 * 60 * 1000),
          )}`;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
          endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
          periodLabel = startDate.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - i, 0, 1);
          endDate = new Date(now.getFullYear() - i + 1, 0, 1);
          periodLabel = startDate.getFullYear().toString();
          break;
      }

      let query = this.orderRepository
        .createQueryBuilder('order')
        .where('order.createdAt >= :startDate AND order.createdAt < :endDate', {
          startDate,
          endDate,
        });

      if (user.role === UserRole.VENDOR) {
        query = query.andWhere('order.senderId = :userId', { userId: user.id });
      }

      const [orderCount, revenueResult] = await Promise.all([
        query.getCount(),
        query
          .select('SUM(order.price)', 'revenue')
          .getRawOne()
          .then((result) => parseFloat(result.revenue) || 0),
      ]);

      results.push({
        period: periodLabel,
        revenue: Math.round(revenueResult * 100) / 100,
        orderCount,
      });
    }

    return results;
  }

  private async getTopCities(user: User) {
    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoin('order.toCity', 'city')
      .select('city.name', 'cityName')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('SUM(order.price)', 'revenue')
      .groupBy('city.name')
      .orderBy('COUNT(*)', 'DESC')
      .limit(5);

    if (user.role === UserRole.VENDOR) {
      query = query.where('order.senderId = :userId', { userId: user.id });
    }

    const results = await query.getRawMany();

    return results.map((item) => ({
      cityName: item.cityName,
      orderCount: parseInt(item.orderCount),
      revenue: parseFloat(item.revenue) || 0,
    }));
  }

  private async getDeliveryMetrics(user: User) {
    let baseQuery = this.orderRepository.createQueryBuilder('order');

    if (user.role === UserRole.VENDOR) {
      baseQuery = baseQuery.where('order.senderId = :userId', {
        userId: user.id,
      });
    } else if (user.role === UserRole.DELIVERYMAN) {
      baseQuery = baseQuery.where('order.deliverymanId = :userId', {
        userId: user.id,
      });
    }

    const [averageDeliveryTime, onTimeDeliveries, totalDeliveries] =
      await Promise.all([
        baseQuery
          .clone()
          .where('order.status = :status', { status: OrderStatus.DELIVERED })
          .select(
            'AVG(EXTRACT(DAY FROM (order.deliveredAt - order.createdAt)))',
            'avgDays',
          )
          .getRawOne()
          .then((result) => parseFloat(result.avgDays) || 0),

        baseQuery
          .clone()
          .where('order.status = :status', { status: OrderStatus.DELIVERED })
          .andWhere("order.deliveredAt <= order.createdAt + INTERVAL '3 days'")
          .getCount(),

        baseQuery
          .clone()
          .where('order.status = :status', { status: OrderStatus.DELIVERED })
          .getCount(),
      ]);

    const onTimePercentage =
      totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;

    return {
      averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
      onTimePercentage: Math.round(onTimePercentage * 100) / 100,
      totalDeliveries,
      onTimeDeliveries,
    };
  }

  private calculateEstimatedDelivery(order: Order): string | null {
    // Simple estimation: 2-5 business days based on status and distance
    let daysToAdd = 3; // Default

    switch (order.status) {
      case OrderStatus.IN_PREPARATION:
        daysToAdd = 5;
        break;
      case OrderStatus.CONFIRMED:
        daysToAdd = 4;
        break;
      case OrderStatus.DISPATCHED:
        daysToAdd = 3;
        break;
      case OrderStatus.OUT_FOR_DELIVERY:
        daysToAdd = 1;
        break;
      case OrderStatus.DELIVERED:
        return order.deliveredAt?.toISOString().split('T')[0] || null;
      default:
        return null;
    }

    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + daysToAdd);

    return estimatedDate.toISOString().split('T')[0];
  }

  private getCurrentLocation(order: Order, trackingHistory: any[]) {
    if (trackingHistory.length === 0) {
      return order.fromCity;
    }

    const latestEntry = trackingHistory[trackingHistory.length - 1];
    return latestEntry.location || order.fromCity;
  }

  private exportToCSV(orders: Order[]): string {
    const headers = [
      'Order ID',
      'Customer Name',
      'Phone',
      'Address',
      'From City',
      'To City',
      'Product List',
      'Status',
      'Price (DZD)',
      'Shipping Fee (DZD)',
      'Total (DZD)',
      'Weight (kg)',
      'Payment Type',
      'Created Date',
      'Delivered Date',
      'Vendor',
      'Deliveryman',
    ];

    const rows = orders.map((order) => [
      order.orderId,
      `${order.firstname} ${order.lastName}`,
      order.contactPhone,
      order.address,
      order.fromCity.name,
      order.toCity.name,
      order.productList,
      order.status,
      order.price,
      order.shippingFee,
      order.price + order.shippingFee,
      order.weight || 0,
      order.paymentType,
      order.createdAt.toISOString().split('T')[0],
      order.deliveredAt ? order.deliveredAt.toISOString().split('T')[0] : '',
      order.sender ? `${order.sender.fullName} ` : '',
      order.deliveryman ? `${order.deliveryman.fullName} ` : '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  private async exportToExcel(orders: Order[]) {
    // This would integrate with a library like xlsx or exceljs
    // For now, return enhanced CSV format with additional metadata
    const metadata = [
      ['Export Date', new Date().toISOString()],
      ['Total Orders', orders.length.toString()],
      [
        'Total Revenue',
        orders.reduce((sum, order) => sum + order.price, 0).toString(),
      ],
      [''],
      [''],
    ];

    const headers = [
      'Order ID',
      'Customer Name',
      'Phone',
      'Phone2',
      'Address',
      'From City',
      'To City',
      'Product List',
      'Status',
      'Price (DZD)',
      'Shipping Fee (DZD)',
      'Total (DZD)',
      'Weight (kg)',
      'Dimensions (H×W×L)',
      'Payment Type',
      'Stop Desk',
      'Free Shipping',
      'Has Exchange',
      'Created Date',
      'Delivered Date',
      'Vendor',
      'Deliveryman',
    ];

    const rows = orders.map((order) => [
      order.orderId,
      `${order.firstname} ${order.lastName}`,
      order.contactPhone,
      order.contactPhone2,
      order.address,
      order.fromCity.name,
      order.toCity.name,
      order.productList,
      order.status,
      order.price,
      order.shippingFee,
      order.price + order.shippingFee,
      order.weight || 0,
      `${order.height || 0}×${order.width || 0}×${order.length || 0}`,
      order.paymentType,
      order.isStopDesk ? 'Yes' : 'No',
      order.freeShipping ? 'Yes' : 'No',
      order.hasExchange ? 'Yes' : 'No',
      order.createdAt.toISOString().split('T')[0],
      order.deliveredAt ? order.deliveredAt.toISOString().split('T')[0] : '',
      order.sender ? `${order.sender.fullName} ` : '',
      order.deliveryman ? `${order.deliveryman.fullName} ` : '',
    ]);

    const excelContent = [...metadata, headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    return excelContent;
  }

  async getDashboardStats(user: User) {
    const today = new Date();
    const startOfWeek = new Date(
      today.setDate(today.getDate() - today.getDay()),
    );
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let baseQuery = this.orderRepository.createQueryBuilder('order');

    if (user.role === UserRole.VENDOR) {
      baseQuery = baseQuery.where('order.senderId = :userId', {
        userId: user.id,
      });
    } else if (user.role === UserRole.DELIVERYMAN) {
      baseQuery = baseQuery.where('order.deliverymanId = :userId', {
        userId: user.id,
      });
    }

    const [
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      pendingOrders,
      inTransitOrders,
      deliveredOrders,
      totalRevenue,
      monthRevenue,
    ] = await Promise.all([
      baseQuery.getCount(),

      baseQuery
        .clone()
        .where('DATE(order.createdAt) = CURRENT_DATE')
        .getCount(),

      baseQuery
        .clone()
        .where('order.createdAt >= :startOfWeek', { startOfWeek })
        .getCount(),

      baseQuery
        .clone()
        .where('order.createdAt >= :startOfMonth', { startOfMonth })
        .getCount(),

      baseQuery
        .clone()
        .where('order.status = :status', { status: OrderStatus.IN_PREPARATION })
        .getCount(),

      baseQuery
        .clone()
        .where('order.status IN (:...statuses)', {
          statuses: [OrderStatus.DISPATCHED, OrderStatus.OUT_FOR_DELIVERY],
        })
        .getCount(),

      baseQuery
        .clone()
        .where('order.status = :status', { status: OrderStatus.DELIVERED })
        .getCount(),

      baseQuery
        .clone()
        .select('SUM(order.price)', 'revenue')
        .getRawOne()
        .then((result) => parseFloat(result.revenue) || 0),

      baseQuery
        .clone()
        .where('order.createdAt >= :startOfMonth', { startOfMonth })
        .select('SUM(order.price)', 'revenue')
        .getRawOne()
        .then((result) => parseFloat(result.revenue) || 0),
    ]);

    // Recent orders for dashboard
    const recentOrders = await baseQuery
      .clone()
      .leftJoinAndSelect('order.fromCity', 'fromCity')
      .leftJoinAndSelect('order.toCity', 'toCity')
      .leftJoinAndSelect('order.deliveryman', 'deliveryman')
      .orderBy('order.createdAt', 'DESC')
      .limit(5)
      .getMany();

    // Performance metrics
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const deliveryRate =
      totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    return {
      overview: {
        totalOrders,
        todayOrders,
        weekOrders,
        monthOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        monthRevenue: Math.round(monthRevenue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
      },
      ordersByStatus: {
        pending: pendingOrders,
        inTransit: inTransitOrders,
        delivered: deliveredOrders,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderId: order.orderId,
        customerName: `${order.firstname} ${order.lastName}`,
        fromCity: order.fromCity.name,
        toCity: order.toCity.name,
        status: order.status,
        price: order.price,
        createdAt: order.createdAt,
        deliveryman: order.deliveryman ? `${order.deliveryman.fullName}` : null,
      })),
    };
  }

  async getOrdersByDateRange(
    startDate: string,
    endDate: string,
    user: User,
  ): Promise<Order[]> {
    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.sender', 'sender')
      .leftJoinAndSelect('order.deliveryman', 'deliveryman')
      .leftJoinAndSelect('order.fromCity', 'fromCity')
      .leftJoinAndSelect('order.toCity', 'toCity')
      .where('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });

    if (user.role === UserRole.VENDOR) {
      query = query.andWhere('order.senderId = :userId', { userId: user.id });
    } else if (user.role === UserRole.DELIVERYMAN) {
      query = query.andWhere('order.deliverymanId = :userId', {
        userId: user.id,
      });
    }

    return await query.orderBy('order.createdAt', 'DESC').getMany();
  }

  async searchOrders(searchTerm: string, user: User): Promise<Order[]> {
    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.sender', 'sender')
      .leftJoinAndSelect('order.deliveryman', 'deliveryman')
      .leftJoinAndSelect('order.fromCity', 'fromCity')
      .leftJoinAndSelect('order.toCity', 'toCity')
      .where(
        '(order.orderId ILIKE :search OR order.firstname ILIKE :search OR order.lastName ILIKE :search OR order.contactPhone ILIKE :search OR order.productList ILIKE :search)',
        { search: `%${searchTerm}%` },
      );

    if (user.role === UserRole.VENDOR) {
      query = query.andWhere('order.senderId = :userId', { userId: user.id });
    } else if (user.role === UserRole.DELIVERYMAN) {
      query = query.andWhere('order.deliverymanId = :userId', {
        userId: user.id,
      });
    }

    return await query.orderBy('order.createdAt', 'DESC').limit(20).getMany();
  }

  async getOrdersNeedingAttention(user: User): Promise<Order[]> {
    // Orders that need attention: pending for >24h, in transit for >3 days, etc.
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    let query = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.sender', 'sender')
      .leftJoinAndSelect('order.deliveryman', 'deliveryman')
      .leftJoinAndSelect('order.fromCity', 'fromCity')
      .leftJoinAndSelect('order.toCity', 'toCity')
      .where(
        '(order.status = :pending AND order.createdAt < :oneDayAgo) OR ' +
          '(order.status = :inTransit AND order.updatedAt < :threeDaysAgo)',
        {
          pending: OrderStatus.IN_PREPARATION,
          inTransit: OrderStatus.OUT_FOR_DELIVERY,
          oneDayAgo,
          threeDaysAgo,
        },
      );

    if (user.role === UserRole.VENDOR) {
      query = query.andWhere('order.senderId = :userId', { userId: user.id });
    } else if (user.role === UserRole.DELIVERYMAN) {
      query = query.andWhere('order.deliverymanId = :userId', {
        userId: user.id,
      });
    }

    return await query.orderBy('order.createdAt', 'ASC').getMany();
  }

  async validateOrderUpdate(
    orderId: number,
    updateData: Partial<Order>,
    user: User,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const order = await this.findOneWithPermission(orderId, user);

    // Business validation rules
    if (updateData.status && updateData.status !== order.status) {
      try {
        this.validateStatusTransition(
          order.status,
          updateData.status,
          user.role,
        );
      } catch (error) {
        errors.push(error.message);
      }
    }

    // Validate price changes
    if (updateData.price && updateData.price !== order.price) {
      if (
        user.role !== UserRole.ADMIN &&
        order.status !== OrderStatus.IN_PREPARATION
      ) {
        errors.push('Price can only be changed for pending orders');
      }
      if (updateData.price < 0) {
        errors.push('Price cannot be negative');
      }
    }

    // Validate delivery assignment
    if (updateData.deliveryman && order.status === OrderStatus.DELIVERED) {
      errors.push('Cannot change deliveryman for delivered orders');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async getMonthlyReport(year: number, month: number, user: User) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    let baseQuery = this.orderRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :startDate AND order.createdAt < :endDate', {
        startDate,
        endDate,
      });

    if (user.role === UserRole.VENDOR) {
      baseQuery = baseQuery.andWhere('order.senderId = :userId', {
        userId: user.id,
      });
    }

    const [
      totalOrders,
      totalRevenue,
      deliveredOrders,
      cancelledOrders,
      averageDeliveryTime,
      topProducts,
    ] = await Promise.all([
      baseQuery.getCount(),

      baseQuery
        .clone()
        .select('SUM(order.price)', 'revenue')
        .getRawOne()
        .then((result) => parseFloat(result.revenue) || 0),

      baseQuery
        .clone()
        .where('order.status = :status', { status: OrderStatus.DELIVERED })
        .getCount(),

      baseQuery
        .clone()
        .where('order.status = :status', { status: OrderStatus.CANCELLED })
        .getCount(),

      baseQuery
        .clone()
        .where('order.status = :status', { status: OrderStatus.DELIVERED })
        .select(
          'AVG(EXTRACT(DAY FROM (order.deliveredAt - order.createdAt)))',
          'avgDays',
        )
        .getRawOne()
        .then((result) => parseFloat(result.avgDays) || 0),

      baseQuery
        .clone()
        .select('order.productList', 'product')
        .addSelect('COUNT(*)', 'count')
        .groupBy('order.productList')
        .orderBy('COUNT(*)', 'DESC')
        .limit(5)
        .getRawMany(),
    ]);

    const successRate =
      totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      summary: {
        totalOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        deliveredOrders,
        cancelledOrders,
        successRate: Math.round(successRate * 100) / 100,
        averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
      },
      topProducts: topProducts.map((item) => ({
        product: item.product,
        orderCount: parseInt(item.count),
      })),
    };
  }

  async createOrderFromTemplate(
    templateId: number,
    user: User,
  ): Promise<Order> {
    // This would fetch a saved order template and create a new order
    // For now, we'll just return a placeholder
    throw new BadRequestException('Order templates not implemented yet');
  }
}
