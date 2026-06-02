import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { RedirectToLogin } from './RedirectToLogin';

/** Rutas hijas solo si hay sesión; si no, login (guardando URL de retorno). */
export function RequireAuthOutlet() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <RedirectToLogin />;
  }

  return <Outlet />;
}
