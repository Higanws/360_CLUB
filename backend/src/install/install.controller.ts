import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../auth/public.decorator';
import { RunInstallDto, TestDbDto } from './dto/install.dto';
import { isInstallComplete } from './install-state';
import { InstallService } from './install.service';

@Controller('install')
export class InstallController {
  constructor(private readonly install: InstallService) {}

  @Public()
  @Get('status')
  status() {
    return {
      installed: isInstallComplete(),
      dockerAutoRestart: process.env.CLUB360_DOCKER === '1',
    };
  }

  /** Solo durante instalación: comprueba MySQL con credenciales por defecto. */
  @Public()
  @Get('db-check')
  dbCheck() {
    if (isInstallComplete()) {
      throw new NotFoundException();
    }
    return this.install.pingProjectDefaults();
  }

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post('test-db')
  async testDb(@Body() dto: TestDbDto) {
    if (isInstallComplete()) {
      throw new ConflictException('La instalación ya está completada.');
    }
    return this.install.testConnection(dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('run')
  async run(@Body() dto: RunInstallDto) {
    if (isInstallComplete()) {
      throw new ConflictException('La instalación ya está completada.');
    }
    return this.install.run(dto);
  }

  /**
   * Misma lógica que `POST /install/run` pero emite **Server-Sent Events** (líneas `data: {...}`)
   * para mostrar el avance en el asistente (validación, DROP, Prisma, seed, etc.).
   */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('run-stream')
  async runStream(
    @Body() dto: RunInstallDto,
    @Res({ passthrough: false }) res: Response,
  ): Promise<void> {
    if (isInstallComplete()) {
      res.status(409).json({
        message: 'La instalación ya está completada.',
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    (res as Response & { flushHeaders?: () => void }).flushHeaders?.();

    const send = (payload: object) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const result = await this.install.run(dto, (ev) => send(ev));
      send({
        step: 'done',
        success: true,
        message: result.message,
        adminUsername: result.adminUsername,
      });
    } catch (e: unknown) {
      const status = e instanceof HttpException ? e.getStatus() : 500;
      const body = e instanceof HttpException ? e.getResponse() : null;
      const message =
        typeof body === 'string'
          ? body
          : body && typeof body === 'object' && 'message' in body
            ? String((body as { message: unknown }).message)
            : e instanceof Error
              ? e.message
              : String(e);
      send({ step: 'error', status, message });
    } finally {
      res.end();
    }
  }
}
