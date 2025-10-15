import { Test, TestingModule } from '@nestjs/testing';
import { FincanceService } from './fincance.service';

describe('FincanceService', () => {
  let service: FincanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FincanceService],
    }).compile();

    service = module.get<FincanceService>(FincanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
