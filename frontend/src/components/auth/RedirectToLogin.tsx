import { Navigate, useLocation } from 'react-router-dom';
import { loginRedirectState } from '../../lib/auth-routes';

/** Redirige al login conservando la URL actual (cualquier ruta profunda). */
export function RedirectToLogin() {
  const location = useLocation();
  return (
    <Navigate
      to="/login"
      replace
      state={loginRedirectState(location.pathname, location.search)}
    />
  );
}
