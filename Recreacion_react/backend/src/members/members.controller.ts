import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessRoleGuard } from './business-role.guard';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MembersService } from './members.service';
import { BusinessRoles } from './roles.decorator';

@Controller('members')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard)
@BusinessRoles()
export class MembersController {
  constructor(private readonly members: MembersService) {}

  /** Listas desplegables (staff, clases, planes). */
  @Get('form-options')
  formOptions() {
    return this.members.formOptions();
  }

  @Get()
  list(@Req() req: { user: { userId: number; role_name: string } }) {
    return this.members.listForUser({
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Post()
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
