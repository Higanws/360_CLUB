import { Module } from '@nestjs/common';
import { InstallController } from './install.controller';
import { InstallSchemaService } from './install-schema.service';
import { InstallService } from './install.service';

@Module({
  controllers: [InstallController],
  providers: [InstallSchemaService, InstallService],
})
export class InstallModule {}
