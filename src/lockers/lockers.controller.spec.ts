import { Test, TestingModule } from '@nestjs/testing';
import { LockersController } from './lockers.controller';
import { LockersService } from './lockers.service';

describe('LockersController', () => {
  let controller: LockersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LockersController],
      providers: [LockersService],
    }).compile();

    controller = module.get<LockersController>(LockersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
