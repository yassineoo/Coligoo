import { Test, TestingModule } from '@nestjs/testing';
import { PickupPointController } from './pickup-point.controller';
import { PickupPointService } from './pickup-point.service';

describe('PickupPointController', () => {
  let controller: PickupPointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PickupPointController],
      providers: [PickupPointService],
    }).compile();

    controller = module.get<PickupPointController>(PickupPointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
