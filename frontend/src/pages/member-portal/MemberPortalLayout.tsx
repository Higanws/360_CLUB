import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLoadingScreen } from '../../components/auth/AuthLoadingScreen';
import { RedirectToLogin } from '../../components/auth/RedirectToLogin';
import { ThemeToggle } from '../../components/ThemeToggle';
import { memberPortalRoutes } from '../../config/member-portal';
import { routes } from '../../config/member-management';
import { isPortalPreviewRole } from '../../lib/member-wellness-params';
import { useAuth } from '../../context/AuthContext';
import { MemberSocioPreviewBar } from './MemberSocioPreviewBar';

export function MemberPortalLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    if (
      user.role_name?.trim().toLowerCase() !== 'member' &&
      !isPortalPreviewRole(user.role_name)
    ) {
      navigate(routes.socios, { replace: true });
    }
  }, [user, navigate]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <RedirectToLogin />;
  }

  const wellnessPath = memberPortalRoutes.wellness;
  const wellnessActive =
    location.pathname === wellnessPath ||
    location.pathname.startsWith(`${wellnessPath}/`);

  const qs = searchParams.toString();
  const qSuffix = qs ? `?${qs}` : '';

  const isMember = user.role_name?.trim().toLowerCase() === 'member';
  const showInicioNav = !isMember;

  return (
    <div className="home-shell">
      <div className="home-top-bar home-top-bar--split">
        <ThemeToggle />
        <button type="button" className="btn-outline" onClick={() => logout()}>
          Cerrar sesión
        </button>
      </div>
      <nav className="mp-portal-nav" aria-label="Portal de socio">
        {showInicioNav ? (
          <NavLink
            to={`${memberPortalRoutes.home}${qSuffix}`}
            end
            className={({ isActive }) =>
              isActive ? 'mp-portal-nav-link mp-portal-nav-link--active' : 'mp-portal-nav-link'
            }
          >
            Inicio
          </NavLink>
        ) : null}
        <NavLink
          to={`${memberPortalRoutes.wellnessDiet}${qSuffix}`}
          className={() =>
            wellnessActive
              ? 'mp-portal-nav-link mp-portal-nav-link--active'
              : 'mp-portal-nav-link'
          }
        >
          Nutrición y ejercicio
        </NavLink>
      </nav>
      <MemberSocioPreviewBar />
      <Outlet />
    </div>
  );
}
