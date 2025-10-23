// src/lockers/lockers.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Locker, ClosetStatus, Closet } from './entities/locker.entity';
import { City } from 'src/wilaya/entities/city.entity';
import { CreateLockerDto } from './dto/create-locker.dto';
import { LockerFilterDto } from './dto/filter.dto';
import {
  UpdateClosetStatusDto,
  UpdateLockerDto,
} from './dto/update-locker.dto';

@Injectable()
export class LockersService {
  constructor(
    @InjectRepository(Locker)
    private lockerRepo: Repository<Locker>,
    @InjectRepository(City)
    private cityRepo: Repository<City>,
  ) {}

  /**
   * Generate default operating hours (08:00 - 22:00 for all days)
   */
  private getDefaultOperatingHours() {
    const defaultHours = { open: '08:00', close: '22:00' };
    return {
      monday: defaultHours,
      tuesday: defaultHours,
      wednesday: defaultHours,
      thursday: defaultHours,
      friday: defaultHours,
      saturday: defaultHours,
      sunday: defaultHours,
    };
  }

  /**
   * Initialize closets array based on capacity
   */
  private initializeClosets(capacity: number): Closet[] {
    const closets: Closet[] = [];
    for (let i = 1; i <= capacity; i++) {
      closets.push({
        id: i,
        status: ClosetStatus.AVAILABLE,
        currentOrderId: null,
      });
    }
    return closets;
  }

  /**
   * Generate reference ID: LOCK-{wilayaCode}-{lockerId}
   */
  private async generateReferenceId(
    cityId: number,
    lockerId: number,
  ): Promise<string> {
    const city = await this.cityRepo.findOne({
      where: { id: cityId },
      relations: ['wilaya'],
    });

    if (!city) {
      throw new NotFoundException(`City ${cityId} not found`);
    }

    return `LOCK-${city.wilaya.code}-${lockerId}`;
  }

  /**
   * Create a new locker
   */
  async create(dto: CreateLockerDto): Promise<Locker> {
    // Verify city exists
    const city = await this.cityRepo.findOne({
      where: { id: dto.cityId },
      relations: ['wilaya'],
    });

    if (!city) {
      throw new NotFoundException(`City ${dto.cityId} not found`);
    }

    // Create locker with temporary referenceId
    const locker = this.lockerRepo.create({
      referenceId: 'TEMP', // Temporary, will be updated after save
      name: dto.name,
      address: dto.address,
      cityId: dto.cityId,
      capacity: dto.capacity,
      closets: this.initializeClosets(dto.capacity),
      operatingHours: dto.operatingHours || this.getDefaultOperatingHours(),
      isActive: dto.isActive ?? true,
      contactPhone: dto.contactPhone,
    });

    // Save to get the ID
    const savedLocker = await this.lockerRepo.save(locker);

    // Update with correct referenceId
    savedLocker.referenceId = await this.generateReferenceId(
      dto.cityId,
      savedLocker.id,
    );

    return this.lockerRepo.save(savedLocker);
  }

  /**
   * Get all lockers with filters and pagination
   */
  async findAll(filterDto: LockerFilterDto): Promise<{
    data: Locker[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      cityId,
      wilayaCode,
      isActive,
      hasAvailableClosets,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filterDto;

    let query = this.lockerRepo
      .createQueryBuilder('locker')
      .leftJoinAndSelect('locker.city', 'city')
      .leftJoinAndSelect('city.wilaya', 'wilaya');

    // Apply filters
    if (cityId) {
      query = query.andWhere('locker.cityId = :cityId', { cityId });
    }

    if (wilayaCode) {
      query = query.andWhere('wilaya.code = :wilayaCode', { wilayaCode });
    }

    if (isActive !== undefined) {
      query = query.andWhere('locker.isActive = :isActive', { isActive });
    }

    if (search) {
      query = query.andWhere(
        '(locker.name LIKE :search OR locker.address LIKE :search OR locker.referenceId LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const allowedSortFields = ['name', 'createdAt', 'capacity'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    query = query.orderBy(`locker.${sortField}`, sortOrder);

    // Pagination
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100);
    const skip = (validatedPage - 1) * validatedLimit;

    query = query.skip(skip).take(validatedLimit);

    const [data, total] = await query.getManyAndCount();

    // Filter by available closets if requested (post-query filtering)
    let filteredData = data;
    if (hasAvailableClosets !== undefined) {
      filteredData = data.filter(
        (locker) => locker.availableClosets > 0 === hasAvailableClosets,
      );
    }

    const totalPages = Math.ceil(total / validatedLimit);

    return {
      data: filteredData,
      meta: {
        total,
        page: validatedPage,
        limit: validatedLimit,
        totalPages,
        hasNextPage: validatedPage < totalPages,
        hasPreviousPage: validatedPage > 1,
      },
    };
  }

  /**
   * Get locker by ID
   */
  async findOne(id: number): Promise<Locker> {
    const locker = await this.lockerRepo.findOne({
      where: { id },
      relations: ['city', 'city.wilaya'],
    });

    if (!locker) {
      throw new NotFoundException(`Locker ${id} not found`);
    }

    return locker;
  }

  /**
   * Get locker by reference ID
   */
  async findByReferenceId(referenceId: string): Promise<Locker> {
    const locker = await this.lockerRepo.findOne({
      where: { referenceId },
      relations: ['city', 'city.wilaya'],
    });

    if (!locker) {
      throw new NotFoundException(`Locker ${referenceId} not found`);
    }

    return locker;
  }

  /**
   * Update locker
   */
  async update(id: number, dto: UpdateLockerDto): Promise<Locker> {
    const locker = await this.findOne(id);

    // If capacity changed, reinitialize closets
    if (dto.capacity && dto.capacity !== locker.capacity) {
      locker.closets = this.initializeClosets(dto.capacity);
    }

    // If city changed, regenerate referenceId
    if (dto.cityId && dto.cityId !== locker.cityId) {
      const city = await this.cityRepo.findOne({
        where: { id: dto.cityId },
        relations: ['wilaya'],
      });

      if (!city) {
        throw new NotFoundException(`City ${dto.cityId} not found`);
      }

      locker.referenceId = await this.generateReferenceId(dto.cityId, id);
    }

    Object.assign(locker, dto);
    return this.lockerRepo.save(locker);
  }

  /**
   * Update closet status
   */
  async updateClosetStatus(
    lockerId: number,
    dto: UpdateClosetStatusDto,
  ): Promise<Locker> {
    const locker = await this.findOne(lockerId);

    const closetIndex = locker.closets.findIndex((c) => c.id === dto.closetId);

    if (closetIndex === -1) {
      throw new NotFoundException(
        `Closet ${dto.closetId} not found in locker ${lockerId}`,
      );
    }

    locker.closets[closetIndex].status = dto.status;

    if (dto.currentOrderId !== undefined) {
      locker.closets[closetIndex].currentOrderId = dto.currentOrderId;
    }

    // If status is AVAILABLE, clear the order
    if (dto.status === ClosetStatus.AVAILABLE) {
      locker.closets[closetIndex].currentOrderId = null;
    }

    return this.lockerRepo.save(locker);
  }

  /**
   * Assign order to available closet
   */
  async assignOrderToCloset(
    lockerId: number,
    orderId: number,
  ): Promise<{ locker: Locker; closetId: number }> {
    const locker = await this.findOne(lockerId);

    const availableCloset = locker.closets.find(
      (c) => c.status === ClosetStatus.AVAILABLE,
    );

    if (!availableCloset) {
      throw new BadRequestException(
        `No available closets in locker ${lockerId}`,
      );
    }

    availableCloset.status = ClosetStatus.OCCUPIED;
    availableCloset.currentOrderId = orderId;

    const updatedLocker = await this.lockerRepo.save(locker);

    return {
      locker: updatedLocker,
      closetId: availableCloset.id,
    };
  }

  /**
   * Release closet (customer picked up order)
   */
  async releaseCloset(lockerId: number, closetId: number): Promise<Locker> {
    const locker = await this.findOne(lockerId);

    const closet = locker.closets.find((c) => c.id === closetId);

    if (!closet) {
      throw new NotFoundException(
        `Closet ${closetId} not found in locker ${lockerId}`,
      );
    }

    closet.status = ClosetStatus.AVAILABLE;
    closet.currentOrderId = null;

    return this.lockerRepo.save(locker);
  }

  /**
   * Delete locker
   */
  async remove(id: number): Promise<void> {
    const locker = await this.findOne(id);
    await this.lockerRepo.remove(locker);
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: number): Promise<Locker> {
    const locker = await this.findOne(id);
    locker.isActive = !locker.isActive;
    return this.lockerRepo.save(locker);
  }

  /**
   * Get lockers statistics
   */
  async getStatistics(): Promise<{
    totalLockers: number;
    activeLockers: number;
    inactiveLockers: number;
    totalCapacity: number;
    totalAvailable: number;
    totalOccupied: number;
    occupancyRate: number;
  }> {
    const lockers = await this.lockerRepo.find();

    const totalLockers = lockers.length;
    const activeLockers = lockers.filter((l) => l.isActive).length;
    const totalCapacity = lockers.reduce((sum, l) => sum + l.capacity, 0);
    const totalAvailable = lockers.reduce(
      (sum, l) => sum + l.availableClosets,
      0,
    );
    const totalOccupied = lockers.reduce(
      (sum, l) => sum + l.occupiedClosets,
      0,
    );
    const occupancyRate =
      totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;

    return {
      totalLockers,
      activeLockers,
      inactiveLockers: totalLockers - activeLockers,
      totalCapacity,
      totalAvailable,
      totalOccupied,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  }
}
