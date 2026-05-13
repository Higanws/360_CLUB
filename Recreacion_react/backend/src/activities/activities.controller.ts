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
import { BusinessRoleGuard } from '../members/business-role.guard';
import { BusinessRoles } from '../members/roles.decorator';
import { ActivitiesService } from './activities.service';
import { CreateActivityCategoryDto } from './dto/create-activity-category.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

type JwtReq = { user: { userId: number; role_name: string } };

@Controller('activities')
@UseGuards(AuthGuard('jwt'), BusinessRoleGuard)
@BusinessRoles()
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Get('categories')
  listCategories() {
    return this.activities.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateActivityCategoryDto) {
    return this.activities.createCategory(dto);
  }

  @Get()
  list() {
    return this.activities.listActivities();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.activities.getOne(id);
  }

  @Post()
  create(@Body() dto: CreateActivityDto, @Req() req: JwtReq) {
    return this.activities.createActivity(dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateActivityDto,
    @Req() req: JwtReq,
  ) {
    return this.activities.updateActivity(id, dto, {
      userId: req.user.userId,
      role_name: req.user.role_name,
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.activities.remove(id);
  }
}
