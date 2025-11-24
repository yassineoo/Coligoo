// src/lockers/locker-hardware.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Locker, ClosetStatus, Closet } from './entities/locker.entity';
import * as crypto from 'crypto';
import { Hash } from 'src/users/utils/hash';

// DTOs for the hardware endpoints
export class OpenDepositDto {
  lockerId: number;
  trackingCode: string;
}

export class CloseDepositDto {
  lockerId: number;
  closetId: number;
  trackingCode: string;
}

export class OpenWithdrawDto {
  lockerId: number;
  password: string;
}

export class CloseWithdrawDto {
  lockerId: number;
  closetId: number;
}

// Response interfaces
interface OpenDepositResponse {
  closetId: number;
  lockerId: number;
  message: string;
}

interface CloseDepositResponse {
  closetId: number;
  lockerId: number;
  password: string;
  orderId: number;
  message: string;
}

interface OpenWithdrawResponse {
  closetId: number;
  lockerId: number;
  orderId: number;
  message: string;
}

interface CloseWithdrawResponse {
  closetId: number;
  lockerId: number;
  message: string;
}

@Injectable()
export class LockerHardwareService {
  constructor(
    @InjectRepository(Locker)
    private lockerRepo: Repository<Locker>,
  ) {}

  /**
   * Generate a 6-digit password for closet access
   */
  private generatePassword(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return Hash.hash(password);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return Hash.compare(password, hash);
  }

  /**
   * STEP 1: Open deposit door - Find available closet and open it
   * Customer puts the package inside
   */
  async openDeposit(dto: OpenDepositDto): Promise<OpenDepositResponse> {
    const { lockerId, trackingCode } = dto;

    // Find locker with relations
    const locker = await this.lockerRepo.findOne({
      where: { id: lockerId },
      relations: ['city', 'city.wilaya'],
    });

    if (!locker) {
      throw new NotFoundException(`Locker ${lockerId} not found`);
    }

    if (!locker.isActive) {
      throw new BadRequestException(`Locker ${lockerId} is not active`);
    }

    // TODO: Verify order exists and get orderId from your Order service
    // const order = await this.orderService.findByTrackingCode(trackingCode);
    // if (!order) {
    //   throw new NotFoundException(`Order with tracking code ${trackingCode} not found`);
    // }
    // if (order.status !== 'READY_FOR_DEPOSIT') {
    //   throw new BadRequestException(`Order ${trackingCode} is not ready for deposit`);
    // }

    // Find available closet
    const availableCloset = locker.closets.find(
      (c) => c.status === ClosetStatus.AVAILABLE,
    );

    if (!availableCloset) {
      throw new BadRequestException(
        `No available closets in locker ${lockerId}`,
      );
    }

    // Mark closet as RESERVED (door is open, waiting for package)
    const closetIndex = locker.closets.findIndex(
      (c) => c.id === availableCloset.id,
    );
    locker.closets[closetIndex].status = ClosetStatus.RESERVED;

    await this.lockerRepo.save(locker);

    // TODO: Send signal to hardware to open the door
    // await this.sendHardwareCommand(lockerId, availableCloset.id, 'OPEN');

    return {
      closetId: availableCloset.id,
      lockerId: locker.id,
      message: `Closet ${availableCloset.id} opened. Please place the package inside and close the door.`,
    };
  }

  /**
   * STEP 2: Close deposit door - Package is inside, generate password
   * Called when door sensor detects closure
   */
  async closeDeposit(dto: CloseDepositDto): Promise<CloseDepositResponse> {
    const { lockerId, closetId, trackingCode } = dto;

    // Find locker
    const locker = await this.lockerRepo.findOne({
      where: { id: lockerId },
      relations: ['city', 'city.wilaya'],
    });

    if (!locker) {
      throw new NotFoundException(`Locker ${lockerId} not found`);
    }

    // Find closet
    const closetIndex = locker.closets.findIndex((c) => c.id === closetId);

    if (closetIndex === -1) {
      throw new NotFoundException(
        `Closet ${closetId} not found in locker ${lockerId}`,
      );
    }

    const closet = locker.closets[closetIndex];

    // Verify closet is in RESERVED state
    if (closet.status !== ClosetStatus.RESERVED) {
      throw new BadRequestException(
        `Closet ${closetId} is not in reserved state`,
      );
    }

    // TODO: Verify order and get orderId
    // const order = await this.orderService.findByTrackingCode(trackingCode);
    // if (!order) {
    //   throw new NotFoundException(`Order with tracking code ${trackingCode} not found`);
    // }
    // const orderId = order.id;
    const orderId = Math.floor(Math.random() * 10000); // Placeholder

    // Generate password and hash it
    const password = this.generatePassword();
    const hashedPassword = await this.hashPassword(password);

    // Calculate expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Update closet with hashed password, orderId, and expiration
    locker.closets[closetIndex] = {
      ...locker.closets[closetIndex],
      status: ClosetStatus.OCCUPIED,
      currentOrderId: orderId,
      passwordHash: hashedPassword,
      passwordExpiresAt: expiresAt.toISOString(),
      depositedAt: new Date().toISOString(),
    };

    await this.lockerRepo.save(locker);

    // TODO: Update order status to 'IN_LOCKER'
    // await this.orderService.updateStatus(orderId, 'IN_LOCKER', {
    //   lockerId,
    //   closetId,
    //   depositedAt: new Date(),
    // });

    // TODO: Send notification to customer with password
    // await this.notificationService.sendPasswordNotification(orderId, password);

    return {
      closetId,
      lockerId,
      password, // Only return the plain password here, it won't be stored
      orderId,
      message: `Package deposited successfully. Password: ${password}. This password will expire in 24 hours.`,
    };
  }

  /**
   * STEP 3: Open withdraw door - Customer enters password to retrieve package
   * Verify password and open the door
   */
  async openWithdraw(dto: OpenWithdrawDto): Promise<OpenWithdrawResponse> {
    const { lockerId, password } = dto;

    // Find locker
    const locker = await this.lockerRepo.findOne({
      where: { id: lockerId },
      relations: ['city', 'city.wilaya'],
    });

    if (!locker) {
      throw new NotFoundException(`Locker ${lockerId} not found`);
    }

    if (!locker.isActive) {
      throw new BadRequestException(`Locker ${lockerId} is not active`);
    }

    // Find occupied closets and verify password
    let matchedCloset: Closet & {
      passwordHash?: string;
      passwordExpiresAt?: string;
      depositedAt?: string;
    } = null;
    let matchedClosetIndex: number = -1;

    for (let i = 0; i < locker.closets.length; i++) {
      const closet = locker.closets[i] as any;

      if (
        closet.status === ClosetStatus.OCCUPIED &&
        closet.passwordHash &&
        closet.currentOrderId
      ) {
        // Check if password is expired
        if (closet.passwordExpiresAt) {
          const expiresAt = new Date(closet.passwordExpiresAt);
          if (new Date() > expiresAt) {
            continue; // Skip expired passwords
          }
        }

        // Verify password
        const isValid = await this.verifyPassword(
          password,
          closet.passwordHash,
        );
        if (isValid) {
          matchedCloset = closet;
          matchedClosetIndex = i;
          break;
        }
      }
    }

    if (!matchedCloset) {
      throw new BadRequestException(
        'Invalid password, password expired, or closet not found',
      );
    }

    // TODO: Send signal to hardware to open the door
    // await this.sendHardwareCommand(lockerId, matchedCloset.id, 'OPEN');

    // TODO: Log the withdrawal attempt
    // await this.orderService.logEvent(matchedCloset.currentOrderId, 'WITHDRAWAL_STARTED', {
    //   lockerId,
    //   closetId: matchedCloset.id,
    //   attemptedAt: new Date(),
    // });

    return {
      closetId: matchedCloset.id,
      lockerId,
      orderId: matchedCloset.currentOrderId,
      message: `Closet ${matchedCloset.id} opened. Please retrieve your package and close the door.`,
    };
  }

  /**
   * STEP 4: Close withdraw door - Customer retrieved package and closed door
   * Free the closet and remove password
   */
  async closeWithdraw(dto: CloseWithdrawDto): Promise<CloseWithdrawResponse> {
    const { lockerId, closetId } = dto;

    // Find locker
    const locker = await this.lockerRepo.findOne({
      where: { id: lockerId },
      relations: ['city', 'city.wilaya'],
    });

    if (!locker) {
      throw new NotFoundException(`Locker ${lockerId} not found`);
    }

    // Find closet
    const closetIndex = locker.closets.findIndex((c) => c.id === closetId);

    if (closetIndex === -1) {
      throw new NotFoundException(
        `Closet ${closetId} not found in locker ${lockerId}`,
      );
    }

    const closet = locker.closets[closetIndex] as any;
    const orderId = closet.currentOrderId;

    // Free the closet and clear all password-related data
    locker.closets[closetIndex] = {
      id: closet.id,
      status: ClosetStatus.AVAILABLE,
      currentOrderId: null,
      // Remove password-related fields by not including them
    };

    await this.lockerRepo.save(locker);

    // TODO: Update order status to 'PICKED_UP' or 'DELIVERED'
    // if (orderId) {
    //   await this.orderService.updateStatus(orderId, 'PICKED_UP', {
    //     lockerId,
    //     closetId,
    //     pickedUpAt: new Date(),
    //   });
    // }

    return {
      closetId,
      lockerId,
      message: `Package retrieved successfully. Closet ${closetId} is now available. Thank you!`,
    };
  }

  /**
   * Helper: Get active closets info for a locker (for debugging/admin)
   */
  async getActiveClosets(lockerId: number): Promise<any[]> {
    const locker = await this.lockerRepo.findOne({
      where: { id: lockerId },
    });

    if (!locker) {
      throw new NotFoundException(`Locker ${lockerId} not found`);
    }

    return locker.closets
      .filter(
        (c: any) => c.status === ClosetStatus.OCCUPIED && c.currentOrderId,
      )
      .map((c: any) => ({
        closetId: c.id,
        orderId: c.currentOrderId,
        depositedAt: c.depositedAt,
        expiresAt: c.passwordExpiresAt,
        isExpired: c.passwordExpiresAt
          ? new Date() > new Date(c.passwordExpiresAt)
          : false,
      }));
  }

  /**
   * Helper: Clean up expired passwords (should be run periodically via cron)
   */
  async cleanupExpiredPasswords(): Promise<{
    cleaned: number;
    lockers: number[];
  }> {
    const lockers = await this.lockerRepo.find();
    const now = new Date();
    let cleanedCount = 0;
    const affectedLockerIds = [];

    for (const locker of lockers) {
      let hasChanges = false;

      for (let i = 0; i < locker.closets.length; i++) {
        const closet = locker.closets[i] as any;

        if (
          closet.status === ClosetStatus.OCCUPIED &&
          closet.passwordExpiresAt
        ) {
          const expiresAt = new Date(closet.passwordExpiresAt);

          if (now > expiresAt) {
            // Clear the expired closet
            locker.closets[i] = {
              id: closet.id,
              status: ClosetStatus.AVAILABLE,
              currentOrderId: null,
            };

            hasChanges = true;
            cleanedCount++;

            // TODO: Update order status to 'EXPIRED' or notify customer
            // if (closet.currentOrderId) {
            //   await this.orderService.updateStatus(closet.currentOrderId, 'LOCKER_EXPIRED');
            // }
          }
        }
      }

      if (hasChanges) {
        await this.lockerRepo.save(locker);
        affectedLockerIds.push(locker.id);
      }
    }

    return {
      cleaned: cleanedCount,
      lockers: affectedLockerIds,
    };
  }
}
