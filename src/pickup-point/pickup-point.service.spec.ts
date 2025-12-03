import { Test, TestingModule } from '@nestjs/testing';
import { PickupPointService } from './pickup-point.service';

describe('PickupPointService', () => {
  let service: PickupPointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PickupPointService],
    }).compile();

    service = module.get<PickupPointService>(PickupPointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
