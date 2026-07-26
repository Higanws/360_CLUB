import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosProductsService } from './pos-products.service';
import { PosSalesService } from './pos-sales.service';

@Module({
  controllers: [PosController],
  providers: [PosProductsService, PosSalesService],
})
export class PosModule {}
