// src/settings/settings.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { UpdateSettingsDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private settingsRepository: Repository<Setting>,
  ) {}

  /**
   * Get system settings (creates default if not exists)
   */
  async getSettings(): Promise<Setting> {
    let settings = await this.settingsRepository.findOne({
      where: { id: 1 },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = this.settingsRepository.create({
        id: 1,
        // Weight defaults
        freeWeightLimit: 10,
        weightPricePerKg: 50,
        maxWeightLimit: 100,
        // Volume defaults
        freeVolumeLimit: 50000,
        volumePricePerCm3: 0.001,
        maxVolumeLimit: 500000,
      });
      await this.settingsRepository.save(settings);
    }

    return settings;
  }

  /**
   * Update system settings
   */
  async updateSettings(updateSettingsDto: UpdateSettingsDto): Promise<Setting> {
    const settings = await this.getSettings();

    // Update only provided fields
    if (updateSettingsDto.freeWeightLimit !== undefined) {
      settings.freeWeightLimit = updateSettingsDto.freeWeightLimit;
    }
    if (updateSettingsDto.weightPricePerKg !== undefined) {
      settings.weightPricePerKg = updateSettingsDto.weightPricePerKg;
    }
    if (updateSettingsDto.maxWeightLimit !== undefined) {
      settings.maxWeightLimit = updateSettingsDto.maxWeightLimit;
    }
    if (updateSettingsDto.freeVolumeLimit !== undefined) {
      settings.freeVolumeLimit = updateSettingsDto.freeVolumeLimit;
    }
    if (updateSettingsDto.volumePricePerCm3 !== undefined) {
      settings.volumePricePerCm3 = updateSettingsDto.volumePricePerCm3;
    }
    if (updateSettingsDto.maxVolumeLimit !== undefined) {
      settings.maxVolumeLimit = updateSettingsDto.maxVolumeLimit;
    }

    return this.settingsRepository.save(settings);
  }

  /**
   * Calculate extra weight charge
   */
  async calculateWeightCharge(weight: number): Promise<number> {
    const settings = await this.getSettings();

    if (weight <= settings.freeWeightLimit) {
      return 0;
    }

    const extraWeight = weight - settings.freeWeightLimit;
    return extraWeight * Number(settings.weightPricePerKg);
  }

  /**
   * Calculate extra volume charge
   * Volume = length × width × height (in cm³)
   */
  async calculateVolumeCharge(volume: number): Promise<number> {
    const settings = await this.getSettings();

    if (volume <= settings.freeVolumeLimit) {
      return 0;
    }

    const extraVolume = volume - settings.freeVolumeLimit;
    return extraVolume * Number(settings.volumePricePerCm3);
  }

  /**
   * Calculate total extra charges (weight + volume)
   */
  async calculateExtraCharges(
    weight: number,
    length: number,
    width: number,
    height: number,
  ): Promise<{
    weightCharge: number;
    volumeCharge: number;
    totalExtraCharge: number;
  }> {
    const volume = length * width * height;

    const weightCharge = await this.calculateWeightCharge(weight);
    const volumeCharge = await this.calculateVolumeCharge(volume);

    return {
      weightCharge: Math.round(weightCharge * 100) / 100,
      volumeCharge: Math.round(volumeCharge * 100) / 100,
      totalExtraCharge: Math.round((weightCharge + volumeCharge) * 100) / 100,
    };
  }
}
