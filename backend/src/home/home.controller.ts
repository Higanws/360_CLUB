import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Home inicial por rol (equivalente a DashboardController::index redirecciones).
 */
@Controller('home')
@UseGuards(AuthGuard('jwt'))
export class HomeController {
  @Get()
  summary(@Req() req: { user: { role_name: string; username: string } }) {
    const role = (req.user.role_name ?? '').trim().toLowerCase();

    if (role === 'administrator') {
      return {
        role: 'administrator',
        title: 'Panel de administración',
        subtitle:
          'Resumen del club (miembros, staff y finanzas) — próximas fases.',
      };
    }

    if (role === 'member') {
      return {
        role: 'member',
        title: 'Tu zona de socio',
        subtitle:
          'Aquí verás rutinas de entreno y dieta asignadas por tu club.',
      };
    }

    return {
      role: 'staff',
      title: 'Panel de staff',
      subtitle:
        'Herramientas para entrenadores y personal interno — próximas fases.',
      raw_role: req.user.role_name,
    };
  }
}
