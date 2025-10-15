import { Test, TestingModule } from '@nestjs/testing';
import { FincanceController } from './fincance.controller';
import { FincanceService } from './fincance.service';

describe('FincanceController', () => {
  let controller: FincanceController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FincanceController],
      providers: [FincanceService],
    }).compile();

    controller = module.get<FincanceController>(FincanceController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
