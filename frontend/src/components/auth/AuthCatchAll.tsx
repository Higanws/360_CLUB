import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { RedirectToLogin } from './RedirectToLogin';

/** Rutas desconocidas: con sesión → home; sin sesión → login con URL de retorno. */
export function AuthCatchAll() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return <RedirectToLogin />;
}
