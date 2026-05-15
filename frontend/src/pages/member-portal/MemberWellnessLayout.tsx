import { NavLink, Outlet, useSearchParams } from 'react-router-dom';
import { memberPortalRoutes } from '../../config/member-portal';
import { isPortalPreviewRole } from '../../lib/member-wellness-params';
import { useAuth } from '../../context/AuthContext';

export function MemberWellnessLayout() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const qSuffix = qs ? `?${qs}` : '';
  const preview = isPortalPreviewRole(user?.role_name);

  return (
    <div className="mp-wellness">
      <header className="mp-wellness-head">
        <h1>Nutrición y ejercicio</h1>
        <p className="muted">
          {preview
            ? 'Estás viendo los mismos datos que el socio en su portal (dieta y rutina semanal). Elige un socio con la barra superior si aún no hay filtro.'
            : 'Consulta tu dieta semanal y organiza los ejercicios de tu rutina por día. La semana comienza en lunes (zona horaria Europe/Madrid), igual que en el servidor.'}
        </p>
      </header>
      <nav className="mp-wellness-tabs" aria-label="Nutrición y ejercicio">
        <NavLink
          to={`${memberPortalRoutes.wellnessDiet}${qSuffix}`}
          className={({ isActive }) =>
            isActive ? 'btn-outline mp-wellness-tab mp-wellness-tab--active' : 'btn-outline mp-wellness-tab'
          }
        >
          Dieta de la semana
        </NavLink>
        <NavLink
          to={`${memberPortalRoutes.wellnessRoutine}${qSuffix}`}
          className={({ isActive }) =>
            isActive ? 'btn-outline mp-wellness-tab mp-wellness-tab--active' : 'btn-outline mp-wellness-tab'
          }
        >
          Rutina de la semana
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
