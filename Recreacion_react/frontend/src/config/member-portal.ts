/** Rutas del portal de socio (rol `member`). */
export const memberPortalRoutes = {
  home: '/socio',
  /** Entrada habitual del socio: redirige a `dieta` vía índice de rutas. */
  wellness: '/socio/nutricion-ejercicio',
  wellnessDiet: '/socio/nutricion-ejercicio/dieta',
  wellnessRoutine: '/socio/nutricion-ejercicio/rutina',
} as const;

/** Enlaces del portal se abren en otra pestaña (gestión puede seguir abierta). */
export const memberPortalNewTab = {
  target: '_blank' as const,
  rel: 'noopener noreferrer' as const,
};

/** URL absoluta en el mismo origen (evita rutas ambiguas al abrir el portal en pestaña nueva). */
export function memberPortalAbsoluteUrl(path: string): string {
  return new URL(path, window.location.origin).href;
}
