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
import { AuthGuard } from '@nestjs/passport';
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { MembershipAdminGuard } from './membership-admin.guard';
import { MembershipsService } from './memberships.service';

@Controller('memberships')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard)
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
  @UseGuards(MembershipAdminGuard)
  create(@Body() dto: CreateMembershipDto) {
    return this.memberships.create(dto);
  }

  @Patch(':id')
  @UseGuards(MembershipAdminGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.memberships.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(MembershipAdminGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.memberships.remove(id);
  }
}
