import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { isInstallComplete } from './install/install-state';

function assertProductionSecrets(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  if (!process.env.JWT_SECRET?.trim()) {
    throw new Error('JWT_SECRET es obligatorio cuando NODE_ENV=production.');
  }
}

async function bootstrap() {
  assertProductionSecrets();
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Idempotency-Key',
      'idempotency-key',
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);

  if (!isInstallComplete()) {
    console.log(
      `[Club360] Modo asistente activo → http://localhost:${port}/api/install/status (sin TypeORM ni MySQL hasta completar el wizard).`,
    );
  }
}

bootstrap();
