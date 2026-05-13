import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare function createMysqlTypeOrmOptions(config: ConfigService): Promise<TypeOrmModuleOptions>;
