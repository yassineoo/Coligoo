import { Controller, Get, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  /*
  @Get("/success")
  async success(@Query("transfer_id") transferId: string) {
    return await this.paymentService.success(+transferId);
  }
  */
}
