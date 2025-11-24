import { Test, TestingModule } from '@nestjs/testing';
import { HubController } from './hub.controller';
import { HubService } from './hub.service';

describe('HubController', () => {
  let controller: HubController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HubController],
      providers: [HubService],
    }).compile();

    controller = module.get<HubController>(HubController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
