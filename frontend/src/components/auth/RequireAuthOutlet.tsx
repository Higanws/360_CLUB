import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Rutas hijas solo si hay sesión; si no, login (guardando URL de retorno). */
export function RequireAuthOutlet() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="boot-screen" role="status" aria-live="polite">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    const from = location.pathname + location.search;
    return (
      <Navigate
        to="/login"
        replace
        state={from && from !== '/login' ? { from } : undefined}
      />
    );
  }

  return <Outlet />;
}
