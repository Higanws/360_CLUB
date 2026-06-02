import { useEffect, useId, useMemo, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { RedirectToLogin } from '../components/auth/RedirectToLogin';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  featureSocios,
  featureStaff,
  gestionAbsoluteUrl,
  gestionNewTab,
  routes,
} from '../config/member-management';
import { memberPortalAbsoluteUrl, memberPortalNewTab, memberPortalRoutes } from '../config/member-portal';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  canStaffAccessGestionPath,
  isAdministrator,
  isBusinessUser,
  isStaff,
  staffDefaultRoute,
} from '../lib/role-access';

const NAV_COLLAPSE_KEY = 'mm_nav_collapsed';

function readNavCollapsed(): boolean {
  try {
    return localStorage.getItem(NAV_COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

type Branding = {
  name: string;
  gym_logo: string | null;
  left_header: string;
};

/**
 * Layout de gestión del club (barra lateral + contenido).
 * Acceso: administrador y staff.
 */
export function MemberManagementLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const affNavPanelId = useId();
  const posNavPanelId = useId();
  const actNavPanelId = useId();
  const trainingNavPanelId = useId();
  const portalSocioNavPanelId = useId();
  const nutritionNavPanelId = useId();
  const accessNavPanelId = useId();
  const [affOpen, setAffOpen] = useState(true);
  const [posOpen, setPosOpen] = useState(true);
  const [activitiesOpen, setActivitiesOpen] = useState(true);
  const [trainingOpen, setTrainingOpen] = useState(true);
  const [portalSocioOpen, setPortalSocioOpen] = useState(true);
  const [nutritionOpen, setNutritionOpen] = useState(true);
  const [accessOpen, setAccessOpen] = useState(true);
  const [navCollapsed, setNavCollapsed] = useState(readNavCollapsed);
  const [branding, setBranding] = useState<Branding | null>(null);
  const [logoBroken, setLogoBroken] = useState(false);

  const r = user?.role_name ?? '';
  const isBusiness = isBusinessUser(r);
  const isAdmin = isAdministrator(r);
  const isStaffUser = isStaff(r);

  const uploadBase = import.meta.env.VITE_UPLOAD_BASE as string | undefined;

  const logoSrc = useMemo(() => {
    const raw = branding?.gym_logo;
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (uploadBase) return `${uploadBase.replace(/\/$/, '')}/${raw}`;
    return raw;
  }, [branding?.gym_logo, uploadBase]);

  const brandTitle =
    branding?.left_header ?? branding?.name ?? 'Club360';

  useEffect(() => {
    if (
      location.pathname.startsWith('/gestion/socios') ||
      location.pathname.startsWith('/gestion/personal') ||
      location.pathname.startsWith('/gestion/membresias') ||
      location.pathname.startsWith('/gestion/cobro/membresias')
    ) {
      setAffOpen(true);
    }
    if (location.pathname.startsWith('/gestion/punto-venta')) setPosOpen(true);
    if (location.pathname.startsWith('/gestion/ejercicios')) setActivitiesOpen(true);
    if (location.pathname.startsWith('/gestion/rutinas')) setTrainingOpen(true);
    if (location.pathname.startsWith('/gestion/nutricion')) setNutritionOpen(true);
    if (location.pathname.startsWith('/gestion/control-acceso')) setAccessOpen(true);
  }, [location.pathname]);

  useEffect(() => {
    api
      .get<Branding>('/settings/branding')
      .then(({ data }) => setBranding(data))
      .catch(() =>
        setBranding({
          name: 'Club360',
          gym_logo: null,
          left_header: 'Club360',
        }),
      );
  }, []);

  function toggleNavCollapsed() {
    setNavCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(NAV_COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  useEffect(() => {
    setLogoBroken(false);
  }, [logoSrc]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!isBusiness) {
      navigate(memberPortalRoutes.wellness, { replace: true });
      return;
    }
    if (isStaffUser && !canStaffAccessGestionPath(location.pathname)) {
      navigate(staffDefaultRoute(), { replace: true });
    }
  }, [loading, user, isBusiness, isStaffUser, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="home-shell" role="status" aria-live="polite" aria-busy="true">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return <RedirectToLogin />;
  }

  if (!isBusiness) {
    return <Navigate to={memberPortalRoutes.wellness} replace />;
  }

  return (
    <div
      className={
        navCollapsed ? 'mm-layout mm-layout--nav-collapsed' : 'mm-layout'
      }
    >
      <div className="mm-sidebar-column">
        <div className="mm-sidebar-brand">
          <div className="mm-sidebar-brand-mark">
            {logoSrc && !logoBroken ? (
              <img
                src={logoSrc}
                alt=""
                onError={() => setLogoBroken(true)}
              />
            ) : (
              <span className="mm-sidebar-brand-fallback" aria-hidden>
                {brandTitle.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <button
            type="button"
            className="mm-sidebar-collapse-btn mm-ui-icon-btn"
            onClick={toggleNavCollapsed}
            title="Ocultar menú"
            aria-label="Ocultar menú lateral"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <aside className="mm-sidebar" aria-label="Navegación de gestión">
          <div className="mm-sidebar-block">
            {isAdmin ? (
              <NavLink
                to={routes.dashboard}
                className={({ isActive }) =>
                  isActive
                    ? 'mm-sidebar-flat-link mm-sidebar-flat-link--active'
                    : 'mm-sidebar-flat-link'
                }
                end
              >
                <span className="mm-sidebar-toggle-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 19V5M4 19h16M4 19h4M8 5v14M8 5h12v14H8V5z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="mm-sidebar-flat-link-label">Dashboard</span>
              </NavLink>
            ) : (
              <NavLink
                to={routes.rutinasAsignaciones}
                className={({ isActive }) =>
                  isActive
                    ? 'mm-sidebar-flat-link mm-sidebar-flat-link--active'
                    : 'mm-sidebar-flat-link'
                }
                end
              >
                <span className="mm-sidebar-flat-link-label">Mis asignaciones</span>
              </NavLink>
            )}

            {isAdmin ? (
            <>
            <div className="mm-sidebar-section mm-sidebar-section--affiliation">
              <button
                type="button"
                className="mm-sidebar-toggle mm-ui-menu-control"
                aria-expanded={affOpen}
                aria-controls={affNavPanelId}
                id={`${affNavPanelId}-label`}
                onClick={() => setAffOpen((v) => !v)}
              >
                <span className="mm-sidebar-toggle-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6h16v4H4V6zm0 8h10v4H4v-4zm12 0h4v4h-4v-4z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span className="mm-sidebar-toggle-label">Afiliación</span>
                <span
                  className={
                    affOpen
                      ? 'mm-sidebar-chevron mm-sidebar-chevron--open'
                      : 'mm-sidebar-chevron'
                  }
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
              {affOpen ? (
                <nav
                  className="mm-nav mm-nav--nested"
                  id={affNavPanelId}
                  role="navigation"
                  aria-labelledby={`${affNavPanelId}-label`}
                >
                  {featureSocios ? (
                    <NavLink
                      to={routes.socios}
                      className={({ isActive }) =>
                        isActive ||
                        location.pathname.startsWith(`${routes.socios}/`)
                          ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                          : 'mm-nav-link mm-nav-link--sublink'
                      }
                    >
                      <span className="mm-nav-bullet" aria-hidden />
                      Miembros
                    </NavLink>
                  ) : null}
                  {featureStaff ? (
                    <NavLink
                      to={routes.personal}
                      className={({ isActive }) =>
                        isActive ||
                        location.pathname.startsWith(`${routes.personal}/`)
                          ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                          : 'mm-nav-link mm-nav-link--sublink'
                      }
                    >
                      <span className="mm-nav-bullet" aria-hidden />
                      Miembro del equipo
                    </NavLink>
                  ) : null}
                  <NavLink
                    to={routes.membresias}
                    className={({ isActive }) =>
                      isActive ||
                      location.pathname.startsWith(`${routes.membresias}/`)
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Lista de membresías
                  </NavLink>
                  <NavLink
                    to={routes.cobroMembresias}
                    className={({ isActive }) =>
                      isActive ||
                      location.pathname.startsWith(`${routes.cobroMembresias}/`)
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Cobro de membresías
                  </NavLink>
                </nav>
              ) : null}
            </div>

            <div className="mm-sidebar-section mm-sidebar-section--pos">
              <button
                type="button"
                className="mm-sidebar-toggle mm-ui-menu-control"
                aria-expanded={posOpen}
                aria-controls={posNavPanelId}
                id={`${posNavPanelId}-label`}
                onClick={() => setPosOpen((v) => !v)}
              >
                <span className="mm-sidebar-toggle-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      fill="currentColor"
                      d="M4 5h16a1 1 0 011 1v10H3V6a1 1 0 011-1zm2 3v6h12V8H6zm3 11h6v2H9v-2z"
                    />
                    <path fill="currentColor" d="M7 10h10v3H7v-3z" opacity="0.35" />
                  </svg>
                </span>
                <span className="mm-sidebar-toggle-label">Venta y Stock</span>
                <span
                  className={
                    posOpen
                      ? 'mm-sidebar-chevron mm-sidebar-chevron--open'
                      : 'mm-sidebar-chevron'
                  }
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
              {posOpen ? (
                <nav
                  className="mm-nav mm-nav--nested"
                  id={posNavPanelId}
                  role="navigation"
                  aria-labelledby={`${posNavPanelId}-label`}
                >
                  <NavLink
                    to={routes.puntoVentaVender}
                    className={({ isActive }) =>
                      isActive
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Vender un producto
                  </NavLink>
                  <NavLink
                    to={routes.puntoVentaVentas}
                    className={({ isActive }) =>
                      isActive
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Registro de ventas
                  </NavLink>
                  <NavLink
                    to={routes.puntoVentaStock}
                    className={({ isActive }) =>
                      isActive
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Control stock
                  </NavLink>
                </nav>
              ) : null}
            </div>
            </>
            ) : null}
          </div>

          <div className="mm-sidebar-block">
            <div className="mm-sidebar-section mm-sidebar-section--activities">
              <button
                type="button"
                className="mm-sidebar-toggle mm-ui-menu-control"
                aria-expanded={activitiesOpen}
                aria-controls={actNavPanelId}
                id={`${actNavPanelId}-label`}
                onClick={() => setActivitiesOpen((v) => !v)}
              >
                <span className="mm-sidebar-toggle-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 4h12v4H6V4zm0 6h8v4H6v-4zm0 6h12v4H6v-4z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span className="mm-sidebar-toggle-label">Ejercicios</span>
                <span
                  className={
                    activitiesOpen
                      ? 'mm-sidebar-chevron mm-sidebar-chevron--open'
                      : 'mm-sidebar-chevron'
                  }
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
              {activitiesOpen ? (
                <nav
                  className="mm-nav mm-nav--nested"
                  id={actNavPanelId}
                  role="navigation"
                  aria-labelledby={`${actNavPanelId}-label`}
                >
                  <NavLink
                    to={routes.ejercicios}
                    end
                    className={({ isActive }) =>
                      isActive
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Lista de ejercicios
                  </NavLink>
                  <NavLink
                    to={routes.ejerciciosNuevo}
                    className={({ isActive }) =>
                      isActive
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Añadir ejercicio
                  </NavLink>
                </nav>
              ) : null}
            </div>

            <div className="mm-sidebar-section mm-sidebar-section--training">
              <button
                type="button"
                className="mm-sidebar-toggle mm-ui-menu-control"
                aria-expanded={trainingOpen}
                aria-controls={trainingNavPanelId}
                id={`${trainingNavPanelId}-label`}
                onClick={() => setTrainingOpen((v) => !v)}
              >
                <span className="mm-sidebar-toggle-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 3h12v6H6V3zm0 8h8v10H6V11zm10 0h4v6h-4v-6z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span className="mm-sidebar-toggle-label">
                  Rutinas de entrenamiento
                </span>
                <span
                  className={
                    trainingOpen
                      ? 'mm-sidebar-chevron mm-sidebar-chevron--open'
                      : 'mm-sidebar-chevron'
                  }
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
              {trainingOpen ? (
                <nav
                  className="mm-nav mm-nav--nested"
                  id={trainingNavPanelId}
                  role="navigation"
                  aria-labelledby={`${trainingNavPanelId}-label`}
                >
                  <NavLink
                    to={routes.rutinas}
                    end
                    className={({ isActive }) =>
                      isActive ||
                      location.pathname.startsWith(`${routes.rutinas}/nuevo`) ||
                      /\/gestion\/rutinas\/\d+\/edit$/.test(location.pathname)
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Crear entrenamiento (rutina)
                  </NavLink>
                  <NavLink
                    to={routes.rutinasAsignaciones}
                    className={({ isActive }) =>
                      isActive ||
                      location.pathname.startsWith(
                        `${routes.rutinasAsignaciones}/`,
                      )
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Asignar entrenamiento
                  </NavLink>
                </nav>
              ) : null}
            </div>

            <div className="mm-sidebar-section mm-sidebar-section--nutrition">
              <button
                type="button"
                className="mm-sidebar-toggle mm-ui-menu-control"
                aria-expanded={nutritionOpen}
                aria-controls={nutritionNavPanelId}
                id={`${nutritionNavPanelId}-label`}
                onClick={() => setNutritionOpen((v) => !v)}
              >
                <span className="mm-sidebar-toggle-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3c-4 3-7 6-7 10a7 7 0 1014 0c0-4-3-7-7-10zm0 14a2 2 0 110-4 2 2 0 010 4z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span className="mm-sidebar-toggle-label">Nutrición</span>
                <span
                  className={
                    nutritionOpen
                      ? 'mm-sidebar-chevron mm-sidebar-chevron--open'
                      : 'mm-sidebar-chevron'
                  }
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
              {nutritionOpen ? (
                <nav
                  className="mm-nav mm-nav--nested"
                  id={nutritionNavPanelId}
                  role="navigation"
                  aria-labelledby={`${nutritionNavPanelId}-label`}
                >
                  <NavLink
                    to={routes.nutricion}
                    end
                    className={({ isActive }) =>
                      isActive
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Planes por socio
                  </NavLink>
                </nav>
              ) : null}
            </div>
          </div>

          {isAdmin ? (
          <div className="mm-sidebar-block">
            <div className="mm-sidebar-section mm-sidebar-section--access-control">
              <button
                type="button"
                className="mm-sidebar-toggle mm-ui-menu-control"
                aria-expanded={accessOpen}
                aria-controls={accessNavPanelId}
                id={`${accessNavPanelId}-label`}
                onClick={() => setAccessOpen((v) => !v)}
              >
                <span className="mm-sidebar-toggle-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 5h16v14H4V5zm2 2v10h12V7H6zm2 2h8v2H8V9zm0 3.5h8V15H8v-2.5z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span className="mm-sidebar-toggle-label">Control de acceso</span>
                <span
                  className={
                    accessOpen
                      ? 'mm-sidebar-chevron mm-sidebar-chevron--open'
                      : 'mm-sidebar-chevron'
                  }
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
              {accessOpen ? (
                <nav
                  className="mm-nav mm-nav--nested"
                  id={accessNavPanelId}
                  role="navigation"
                  aria-labelledby={`${accessNavPanelId}-label`}
                >
                  <a
                    href={gestionAbsoluteUrl(routes.controlAccesoRecepcion)}
                    {...gestionNewTab}
                    className="mm-nav-link mm-nav-link--sublink mm-nav-link--external"
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Validar entrada
                  </a>
                  <NavLink
                    to={routes.controlAccesoRegistro}
                    className={({ isActive }) =>
                      isActive
                        ? 'mm-nav-link mm-nav-link--sublink mm-nav-link--active'
                        : 'mm-nav-link mm-nav-link--sublink'
                    }
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Registro de accesos
                  </NavLink>
                </nav>
              ) : null}
            </div>
          </div>
          ) : null}

          {isAdmin ? (
          <div className="mm-sidebar-block">
            <div className="mm-sidebar-section mm-sidebar-section--portal-socio">
              <button
                type="button"
                className="mm-sidebar-toggle mm-ui-menu-control"
                aria-expanded={portalSocioOpen}
                aria-controls={portalSocioNavPanelId}
                id={`${portalSocioNavPanelId}-label`}
                onClick={() => setPortalSocioOpen((v) => !v)}
              >
                <span className="mm-sidebar-toggle-icon" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 11a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 0114 0H5z"
                      fill="currentColor"
                    />
                    <path
                      d="M19 8h-2V6h-2v2h-2v2h2v2h2v-2h2V8z"
                      fill="currentColor"
                      opacity="0.85"
                    />
                  </svg>
                </span>
                <span className="mm-sidebar-toggle-label">Portal socio</span>
                <span
                  className={
                    portalSocioOpen
                      ? 'mm-sidebar-chevron mm-sidebar-chevron--open'
                      : 'mm-sidebar-chevron'
                  }
                  aria-hidden
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M6 9l6 6 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
              {portalSocioOpen ? (
                <nav
                  className="mm-nav mm-nav--nested"
                  id={portalSocioNavPanelId}
                  role="navigation"
                  aria-labelledby={`${portalSocioNavPanelId}-label`}
                >
                  <a
                    {...memberPortalNewTab}
                    href={memberPortalAbsoluteUrl(memberPortalRoutes.wellness)}
                    className="mm-nav-link mm-nav-link--sublink"
                  >
                    <span className="mm-nav-bullet" aria-hidden />
                    Portal socio (dieta y rutina)
                  </a>
                </nav>
              ) : null}
            </div>
          </div>
          ) : null}
        </aside>
      </div>

      <button
        type="button"
        className="mm-sidebar-expand-tab mm-ui-icon-btn"
        onClick={toggleNavCollapsed}
        title="Mostrar menú"
        aria-label="Mostrar menú lateral"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 18l6-6-6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="mm-main">
        <div className="mm-main-bar">
          <ThemeToggle />
          <button type="button" className="btn-outline" onClick={() => logout()}>
            Cerrar sesión
          </button>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
