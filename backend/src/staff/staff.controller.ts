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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import { AdministratorRoleGuard } from './administrator-role.guard';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffService } from './staff.service';

@Controller('staff')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard)
@BusinessRoles()
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('form-options')
  @UseGuards(AdministratorRoleGuard)
  formOptions() {
    return this.staff.formOptions();
  }

  @Get()
  list(
    @Req() req: { user: { userId: number; role_name: string } },
    @Query() q: PaginationQueryDto,
  ) {
    return this.staff.listForUser(
      { userId: req.user.userId, role_name: req.user.role_name },
      q.page ?? 1,
      q.pageSize ?? 25,
      q.q,
    );
  }

  @Post()
  @UseGuards(AdministratorRoleGuard)
  create(@Body() dto: CreateStaffDto) {
    return this.staff.create(dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    return this.staff.findOne(id, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Patch(':id')
  @UseGuards(AdministratorRoleGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaffDto,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    return this.staff.update(id, dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Delete(':id')
  @UseGuards(AdministratorRoleGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.staff.remove(id);
  }
}
