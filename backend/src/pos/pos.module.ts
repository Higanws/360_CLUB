import { Module } from '@nestjs/common';
import { PosCapabilityGuard } from '../shared/application/security/pos-capability.guard';
import { PosController } from './pos.controller';
import { PosProductsService } from './pos-products.service';
import { PosSalesService } from './pos-sales.service';

@Module({
  controllers: [PosController],
  providers: [PosProductsService, PosSalesService, PosCapabilityGuard],
})
export class PosModule {}
