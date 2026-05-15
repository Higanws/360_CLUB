import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpException,
  Post,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { RunInstallDto, TestDbDto } from './dto/install.dto';
import { isInstallComplete } from './install-state';
import { InstallService } from './install.service';

@Controller('install')
@SkipThrottle()
export class InstallController {
  constructor(private readonly install: InstallService) {}

  @Get('status')
  status() {
    return { installed: isInstallComplete() };
  }

  /** Comprueba MySQL con credenciales por defecto del proyecto / Docker (wizard). */
  @Get('db-check')
  dbCheck() {
    return this.install.pingProjectDefaults();
  }

  @Post('test-db')
  async testDb(@Body() dto: TestDbDto) {
    if (isInstallComplete()) {
      throw new ConflictException('La instalación ya está completada.');
    }
    return this.install.testConnection(dto);
  }

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
