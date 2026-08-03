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
import { BusinessRoleGuard } from './business-role.guard';
import { CreateMemberDto } from './dto/create-member.dto';
import { MembersListQueryDto } from './dto/members-list-query.dto';
import { MembersSearchQueryDto } from './dto/members-search-query.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';
import { BusinessRoles } from './roles.decorator';
import {
  RequireStaffSpecs,
  StaffSpecializationGuard,
} from '../shared/application/security/staff-specialization.guard';
import { STAFF_SPEC } from '../shared/application/security/staff-specialization';

@Controller('members')
@UseGuards(BusinessRoleGuard)
@BusinessRoles()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  /** Listas desplegables (staff, planes). */
  @Get('form-options')
  @UseGuards(StaffSpecializationGuard)
  @RequireStaffSpecs(STAFF_SPEC.CAJERO)
  formOptions() {
    return this.members.formOptions();
  }

  /** Búsqueda por nombre, username o DNI (MCP / integraciones). */
  @Get('search')
  search(
    @Query() query: MembersSearchQueryDto,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    return this.members.searchForUser({
      userId: req.user.userId,
      role_name: req.user.role_name,
      q: query.q,
      limit: query.limit ?? 20,
    });
  }

  @Get()
  list(
    @Query() query: MembersListQueryDto,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    return this.members.listForUser({
      userId: req.user.userId,
      role_name: req.user.role_name,
      page,
      pageSize,
      q: query.q,
    });
  }

  @Post()
  @UseGuards(StaffSpecializationGuard)
  @RequireStaffSpecs(STAFF_SPEC.CAJERO)
  create(
    @Body() dto: CreateMemberDto,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    return this.members.create(dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    return this.members.findOne(id, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Patch(':id')
  @UseGuards(StaffSpecializationGuard)
  @RequireStaffSpecs(STAFF_SPEC.CAJERO)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberDto,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    return this.members.update(id, dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Delete(':id')
  @UseGuards(StaffSpecializationGuard)
  @RequireStaffSpecs(STAFF_SPEC.CAJERO)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: { user: { userId: number; role_name: string } },
  ) {
    return this.members.remove(id, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }
}
