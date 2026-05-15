import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { AdministratorRoleGuard } from '../staff/administrator-role.guard';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipsService } from './memberships.service';

@Controller('memberships')
@UseGuards(BusinessRoleGuard, AdministratorRoleGuard)
@BusinessRoles()
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get()
  list() {
    return this.memberships.list();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.memberships.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMembershipDto) {
    return this.memberships.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.memberships.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.memberships.remove(id);
  }
}
