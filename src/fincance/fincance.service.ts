// src/finance/finance.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { CreateWithdrawalRequestDto } from './dto/create-fincance.dto';
import {
  WithdrawalCondition,
  WithdrawalRequest,
  WithdrawalStatus,
} from './entities/fincance.entity';
import { UserRole } from 'src/common/types/roles.enum';
import { FinanceStatisticsDto, WithdrawalFilterDto } from './dto/filter.dto';
import { UpdateWithdrawalRequestDto } from './dto/update-fincance.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(WithdrawalRequest)
    private withdrawalRepo: Repository<WithdrawalRequest>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  /**
   * Generate unique tracking code
   */
  private generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 9; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create withdrawal request
   */
  /**
   * Create withdrawal request
   */
  /**
   * Create withdrawal request
   */
  async createWithdrawalRequest(
    dto: CreateWithdrawalRequestDto,
    user: User,
  ): Promise<WithdrawalRequest> {
    // Determine vendor ID
    const vendorId = dto.vendorId ? dto.vendorId : user.id;

    // Get all PAID orders for this vendor that are not linked to any withdrawal
    const paidOrders = await this.orderRepo.find({
      where: {
        sender: { id: vendorId }, // Use nested object for relation filtering
        status: OrderStatus.PAID,
        withdrawalRequestId: null,
      },
    });

    // Get all RETURNED orders for this vendor that are not linked to any withdrawal
    const returnedOrders = await this.orderRepo.find({
      where: {
        sender: { id: vendorId }, // Use nested object for relation filtering
        status: OrderStatus.RETURNED,
        withdrawalRequestId: null,
      },
    });

    if (paidOrders.length === 0 && returnedOrders.length === 0) {
      throw new BadRequestException(
        'No eligible orders found for withdrawal request',
      );
    }

    // Calculate amounts
    const paidOrdersAmount = paidOrders.reduce(
      (sum, order) => sum + Number(order.price),
      0,
    );
    const returnedOrdersAmount = returnedOrders.reduce(
      (sum, order) => sum + Number(order.price),
      0,
    );
    const totalAmount = paidOrdersAmount - returnedOrdersAmount;

    if (totalAmount <= 0) {
      throw new BadRequestException('Total withdrawal amount must be positive');
    }

    // Create withdrawal request
    const request = this.withdrawalRepo.create({
      trackingCode: this.generateTrackingCode(),
      vendorId,
      totalAmount,
      paidOrdersAmount,
      returnedOrdersAmount,
      orderCount: paidOrders.length + returnedOrders.length,
      paidOrderCount: paidOrders.length,
      returnedOrderCount: returnedOrders.length,
      status: WithdrawalStatus.PENDING,
      condition: WithdrawalCondition.WAITING,
      notes: dto.notes,
    });

    const savedRequest = await this.withdrawalRepo.save(request);

    // Link orders to this withdrawal request
    const allOrders = [...paidOrders, ...returnedOrders];
    await this.orderRepo
      .createQueryBuilder()
      .update(Order)
      .set({ withdrawalRequestId: savedRequest.id })
      .where('id IN (:...ids)', { ids: allOrders.map((o) => o.id) })
      .execute();

    return this.findOne(savedRequest.id);
  }

  /**
   * Get all withdrawal requests with filters
   */
  async findAll(
    filterDto: WithdrawalFilterDto,
    user: User,
  ): Promise<{
    data: WithdrawalRequest[];
    meta: {
      total: number;
      page: number;
      lastPage: number;
      limit: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      status,
      condition,
      vendorId,
      dateFrom,
      dateTo,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    let query = this.withdrawalRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.vendor', 'vendor')
      .leftJoinAndSelect('request.orders', 'orders');

    // Role-based filtering
    if (user.role === UserRole.VENDOR) {
      query = query.where('request.vendorId = :userId', { userId: user.id });
    }

    // Apply filters
    if (status) {
      query = query.andWhere('request.status = :status', { status });
    }

    if (condition) {
      query = query.andWhere('request.condition = :condition', { condition });
    }

    if (vendorId && user.role === UserRole.ADMIN) {
      query = query.andWhere('request.vendorId = :vendorId', { vendorId });
    }

    if (dateFrom && dateTo) {
      query = query.andWhere(
        'request.createdAt BETWEEN :dateFrom AND :dateTo',
        { dateFrom, dateTo },
      );
    }

    if (search) {
      query = query.andWhere(
        '(request.trackingCode LIKE :search OR vendor.nom LIKE :search OR vendor.prenom LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const allowedSortFields = [
      'createdAt',
      'totalAmount',
      'paymentDate',
      'status',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    query = query.orderBy(`request.${sortField}`, sortOrder);

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const offset = (validatedPage - 1) * validatedLimit;

    query = query.skip(offset).take(validatedLimit);

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
  }

  /**
   * Get single withdrawal request
   */
  async findOne(id: number): Promise<WithdrawalRequest> {
    const request = await this.withdrawalRepo.findOne({
      where: { id },
      relations: ['vendor', 'orders'],
    });

    if (!request) {
      throw new NotFoundException(`Withdrawal request ${id} not found`);
    }

    return request;
  }

  /**
   * Update withdrawal request (Admin only)
   */
  async update(
    id: number,
    dto: UpdateWithdrawalRequestDto,
    user: User,
  ): Promise<WithdrawalRequest> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can update withdrawal requests',
      );
    }

    const request = await this.findOne(id);

    if (dto.status !== undefined) request.status = dto.status;
    if (dto.condition !== undefined) request.condition = dto.condition;
    if (dto.paymentDate !== undefined)
      request.paymentDate = new Date(dto.paymentDate);
    if (dto.notes !== undefined) request.notes = dto.notes;

    // Auto-update condition when payment is completed
    if (dto.status === WithdrawalStatus.APPROVED && !request.paymentDate) {
      request.paymentDate = new Date();
      request.condition = WithdrawalCondition.COMPLETE;
    }

    return this.withdrawalRepo.save(request);
  }

  /**
   * Delete withdrawal request
   */
  async remove(id: number, user: User): Promise<void> {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Only admins can delete withdrawal requests',
      );
    }

    const request = await this.findOne(id);

    // Unlink orders before deleting
    await this.orderRepo
      .createQueryBuilder()
      .update(Order)
      .set({ withdrawalRequestId: null })
      .where('withdrawalRequestId = :id', { id })
      .execute();

    await this.withdrawalRepo.remove(request);
  }

  /**
   * Get finance statistics
   */
  async getStatistics(user: User): Promise<FinanceStatisticsDto> {
    let query = this.withdrawalRepo.createQueryBuilder('request');

    // Role-based filtering
    if (user.role === UserRole.VENDOR) {
      query = query.where('request.vendorId = :userId', { userId: user.id });
    }

    const allRequests = await query.getMany();

    // Calculate statistics
    const pendingRequests = allRequests.filter(
      (r) => r.status === WithdrawalStatus.PENDING,
    );
    const approvedRequests = allRequests.filter(
      (r) => r.status === WithdrawalStatus.APPROVED,
    );
    const completedRequests = allRequests.filter(
      (r) => r.condition === WithdrawalCondition.COMPLETE,
    );

    const totalPaymentToBeMade = pendingRequests.reduce(
      (sum, r) => sum + Number(r.totalAmount),
      0,
    );

    const totalPaidOut = completedRequests.reduce(
      (sum, r) => sum + Number(r.totalAmount),
      0,
    );

    // Calculate available balance (paid orders not yet requested)
    let availableBalanceQuery = this.orderRepo
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .andWhere('order.withdrawalRequestId IS NULL');

    if (user.role === UserRole.VENDOR) {
      availableBalanceQuery = availableBalanceQuery.andWhere(
        'order.senderId = :userId',
        { userId: user.id },
      );
    }

    const availableOrders = await availableBalanceQuery.getMany();
    const totalAvailableBalance = availableOrders.reduce(
      (sum, order) => sum + Number(order.price),
      0,
    );

    return {
      totalAvailableBalance: Math.round(totalAvailableBalance * 100) / 100,
      totalPaymentToBeMade: Math.round(totalPaymentToBeMade * 100) / 100,
      totalRemainingBalance:
        Math.round((totalAvailableBalance - totalPaymentToBeMade) * 100) / 100,
      storeRequestForPayment: pendingRequests.length,
      storeReadyForPayment: approvedRequests.length,
      totalPaidOut: Math.round(totalPaidOut * 100) / 100,
      totalCompletedPayments: completedRequests.length,
    };
  }
}
