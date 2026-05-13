import { Navigate } from 'react-router-dom';
import { memberPortalRoutes } from '../../config/member-portal';
import { useAuth } from '../../context/AuthContext';
import { isPortalPreviewRole } from '../../lib/member-wellness-params';
import { MemberPortalHome } from './MemberPortalHome';

/**
 * Ruta índice `/socio`: los socios van directo a nutrición/ejercicio;
 * administración/staff ve una pantalla corta de ayuda (vista previa).
 */
export function MemberPortalIndex() {
  const { user } = useAuth();
  const r = user?.role_name?.trim().toLowerCase() ?? '';

  if (r === 'member') {
    return <Navigate to={memberPortalRoutes.wellness} replace />;
  }

  if (isPortalPreviewRole(user?.role_name)) {
    return <MemberPortalHome />;
  }

  return <Navigate to={memberPortalRoutes.wellness} replace />;
}
