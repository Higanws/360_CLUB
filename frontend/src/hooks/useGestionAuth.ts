import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../context/AuthContext';

/**
 * Sesión en rutas bajo `MemberManagementLayout` (ya validada en el layout).
 * No redirige: usar solo dentro de `/gestion/*`.
 */
export function useGestionAuth(): { user: UserProfile } {
  const { user } = useAuth();
  if (!user) {
    throw new Error('useGestionAuth: sin usuario (¿fuera de MemberManagementLayout?)');
  }
  return { user };
}
