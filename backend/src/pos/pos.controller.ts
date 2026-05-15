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
import { AdministratorRoleGuard } from '../staff/administrator-role.guard';
import { CreatePosProductDto } from './dto/create-product.dto';
import { CreatePosSaleDto } from './dto/create-sale.dto';
import { UpdatePosProductDto } from './dto/update-product.dto';
import { UpdatePosStockDto } from './dto/update-stock.dto';
import { PosProductsService } from './pos-products.service';
import { PosSalesService } from './pos-sales.service';

@Controller('pos')
@UseGuards(BusinessRoleGuard, AdministratorRoleGuard)
@BusinessRoles()
export class PosController {
  constructor(
    private readonly products: PosProductsService,
    private readonly sales: PosSalesService,
  ) {}

  @Get('catalog')
  catalog() {
    return this.products.listCatalog();
  }

  @Get('products')
  productsStock() {
    return this.products.listStock();
  }

  @Post('products')
  createProduct(@Body() dto: CreatePosProductDto) {
    return this.products.create(dto);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePosProductDto,
  ) {
    return this.products.update(id, dto);
  }

  @Patch('products/:id/stock')
  setStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePosStockDto,
  ) {
    return this.products.setStock(id, dto.stock_qty);
  }

  @Delete('products/:id')
  removeProduct(@Param('id', ParseIntPipe) id: number) {
    return this.products.remove(id);
  }

  @Get('sales')
  listSales(@Query('from') from: string, @Query('to') to: string) {
    return this.sales.listSales(from, to);
  }

  @Get('sales/export')
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
  createSale(
    @Body() dto: CreatePosSaleDto,
    @Req() req: { user: { userId: number } },
  ) {
    return this.sales.createSale(dto, { userId: req.user.userId });
  }
}
