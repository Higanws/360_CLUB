import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { GetClubBrandingUseCase } from '../shared/application/club/get-club-branding.use-case';

@Controller('settings')
export class SettingsController {
  constructor(private readonly getBranding: GetClubBrandingUseCase) {}

  /** Datos públicos para pantalla de login (nombre club, colores). */
  @Public()
  @Get('branding')
  branding() {
    return this.getBranding.execute();
  }
}
