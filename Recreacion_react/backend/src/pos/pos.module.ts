import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosProduct } from '../entities/pos-product.entity';
import { PosSale } from '../entities/pos-sale.entity';
import { PosSaleLine } from '../entities/pos-sale-line.entity';
import { PosController } from './pos.controller';
import { PosProductsService } from './pos-products.service';
import { PosSalesService } from './pos-sales.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PosProduct, PosSale, PosSaleLine]),
  ],
  controllers: [PosController],
  providers: [PosProductsService, PosSalesService],
})
export class PosModule {}
