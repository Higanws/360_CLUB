import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import {
  PosCapabilityGuard,
  RequirePosCapability,
} from '../shared/application/security/pos-capability.guard';
import { CreatePosProductDto } from './dto/create-product.dto';
import { CreatePosSaleDto } from './dto/create-sale.dto';
import { UpdatePosProductDto } from './dto/update-product.dto';
import { UpdatePosStockDto } from './dto/update-stock.dto';
import { PosSalesListQueryDto } from './dto/pos-sales-list-query.dto';
import { PosProductsService } from './pos-products.service';
import { PosSalesService } from './pos-sales.service';

@Controller('pos')
@UseGuards(BusinessRoleGuard, PosCapabilityGuard)
@BusinessRoles()
export class PosController {
  constructor(
    private readonly products: PosProductsService,
    private readonly sales: PosSalesService,
  ) {}

  @Get('catalog')
  @RequirePosCapability('stock_read')
  catalog() {
    return this.products.listCatalog();
  }

  @Get('products')
  @RequirePosCapability('stock_read')
  productsStock() {
    return this.products.listStock();
  }

  @Post('products')
  @RequirePosCapability('stock_write')
  createProduct(@Body() dto: CreatePosProductDto) {
    return this.products.create(dto);
  }

  @Patch('products/:id')
  @RequirePosCapability('stock_write')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePosProductDto,
  ) {
    return this.products.update(id, dto);
  }

  @Patch('products/:id/stock')
  @RequirePosCapability('stock_write')
  setStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePosStockDto,
  ) {
    return this.products.setStock(id, dto.stock_qty);
  }

  @Delete('products/:id')
  @RequirePosCapability('stock_write')
  removeProduct(@Param('id', ParseIntPipe) id: number) {
    return this.products.remove(id);
  }

  @Get('sales')
  @RequirePosCapability('sales')
  listSales(@Query() q: PosSalesListQueryDto) {
    return this.sales.listSales(
      q.from,
      q.to,
      q.page ?? 1,
      q.pageSize ?? 25,
    );
  }

  @Get('sales/export')
  @RequirePosCapability('sales')
  async exportSalesCsv(
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ): Promise<void> {
    const csv = await this.sales.exportSalesCsv(from, to);
    const safeFrom = (from ?? 'inicio').replace(/[^\d-]/g, '');
    const safeTo = (to ?? 'fin').replace(/[^\d-]/g, '');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ventas_${safeFrom}_${safeTo}.csv"`,
    );
    res.send(`\ufeff${csv}`);
  }

  @Post('sales')
  @RequirePosCapability('sales')
  createSale(
    @Body() dto: CreatePosSaleDto,
    @Req() req: { user: { userId: number } },
  ) {
    return this.sales.createSale(dto, { userId: req.user.userId });
  }
}
