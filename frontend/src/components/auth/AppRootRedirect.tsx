import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/** `/` → home si hay sesión; si no, login (sin URL de retorno). */
export function AppRootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="boot-screen" role="status" aria-live="polite">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return <Navigate to={user ? '/home' : '/login'} replace />;
}
