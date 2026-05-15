import { Navigate } from 'react-router-dom';
import { memberPortalRoutes } from '../config/member-portal';
import { gestionHomeForRole } from '../lib/role-access';
import { useAuth } from '../context/AuthContext';

/** Tras login: staff/admin → gestión de miembros (socios); socio → portal limitado. */
export function HomeEntry() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="boot-screen">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const r = user.role_name?.trim().toLowerCase() ?? '';
  if (r === 'member') {
    return <Navigate to={memberPortalRoutes.wellness} replace />;
  }

  return <Navigate to={gestionHomeForRole(user.role_name)} replace />;
}
