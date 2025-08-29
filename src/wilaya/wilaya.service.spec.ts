import { Test, TestingModule } from '@nestjs/testing';
import { WilayaService } from './wilaya.service';

describe('WilayaService', () => {
  let service: WilayaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WilayaService],
    }).compile();

    service = module.get<WilayaService>(WilayaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
