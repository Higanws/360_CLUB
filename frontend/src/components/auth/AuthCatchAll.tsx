import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** Rutas desconocidas: con sesión → home; sin sesión → login. */
export function AuthCatchAll() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="boot-screen" role="status" aria-live="polite">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  const from = location.pathname + location.search;
  return (
    <Navigate
      to="/login"
      replace
      state={from && from !== '/login' ? { from } : undefined}
    />
  );
}
