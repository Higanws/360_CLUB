import { NavLink, useSearchParams } from 'react-router-dom';
import { memberPortalRoutes } from '../../config/member-portal';
import { useAuth } from '../../context/AuthContext';

/**
 * Solo para administración/staff en `/socio` (vista previa del portal).
 * Los socios se redirigen a `nutricion-ejercicio` y no ven esta pantalla.
 */
export function MemberPortalHome() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const qSuffix = qs ? `?${qs}` : '';

  const name =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    'Usuario';

  return (
    <>
      <header className="home-top">
        <div>
          <h1>Hola, {name}</h1>
          <p className="muted">
            Estás en la vista previa del <strong>portal del socio</strong>: aquí ves la misma
            experiencia que el cliente (dieta semanal y rutina), sin mezclarla con la gestión del
            club.
          </p>
        </div>
      </header>
      <section className="home-card">
        <p>
          Elige un socio con la <strong>barra de búsqueda</strong> arriba (nombre, apellidos o ID).
          Después abre <strong>Nutrición y ejercicio</strong> para consultar su plan y su rutina
          como él las vería en la app.
        </p>
        <p className="muted mp-portal-home-note">
          Los datos personales del socio (alta, bajas, cambios de ficha) siguen gestionándose desde
          recepción o administración; esta zona es solo consulta y seguimiento de nutrición y
          entrenamiento.
        </p>
        <p className="mp-portal-home-cta">
          <NavLink
            to={`${memberPortalRoutes.wellness}${qSuffix}`}
            className="btn-primary"
          >
            Ir a nutrición y ejercicio
          </NavLink>
        </p>
      </section>
    </>
  );
}
