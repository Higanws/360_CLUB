import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeneralSetting } from '../entities/general-setting.entity';
import { SettingsController } from './settings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GeneralSetting])],
  controllers: [SettingsController],
})
export class SettingsModule {}
