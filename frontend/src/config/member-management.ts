/**
 * Módulo de gestión del club (Afiliación, venta y stock, ejercicios, etc.).
 * Rutas bajo `/gestion`.
 * Desactivar socios/staff en UI: VITE_FEATURE_SOCIOS=false, VITE_FEATURE_STAFF=false
 */
export const featureSocios =
  import.meta.env.VITE_FEATURE_SOCIOS !== 'false';
export const featureStaff =
  import.meta.env.VITE_FEATURE_STAFF !== 'false';

export const routes = {
  gestion: '/gestion',
  dashboard: '/gestion/dashboard',
  socios: '/gestion/socios',
  sociosNew: '/gestion/socios/nuevo',
  sociosDetail: (id: number) => `/gestion/socios/${id}`,
  sociosEdit: (id: number) => `/gestion/socios/${id}/edit`,
  personal: '/gestion/personal',
  personalNew: '/gestion/personal/nuevo',
  personalDetail: (id: number) => `/gestion/personal/${id}`,
  personalEdit: (id: number) => `/gestion/personal/${id}/edit`,
  /** Cobros de membresía (antes «pago») */
  cobroMembresias: '/gestion/cobro/membresias',
  cobroMembresiasRegistrar: '/gestion/cobro/membresias/registrar',
  membresias: '/gestion/membresias',
  membresiasNew: '/gestion/membresias/nuevo',
  membresiasEdit: (id: number) => `/gestion/membresias/${id}/edit`,
  puntoVentaVender: '/gestion/punto-venta/vender',
  puntoVentaVentas: '/gestion/punto-venta/ventas',
  puntoVentaStock: '/gestion/punto-venta/stock',
  ejercicios: '/gestion/ejercicios',
  ejerciciosNuevo: '/gestion/ejercicios/nuevo',
  ejerciciosDetail: (id: number) => `/gestion/ejercicios/${id}`,
  ejerciciosEdit: (id: number) => `/gestion/ejercicios/${id}/edit`,
  rutinas: '/gestion/rutinas',
  rutinasNuevo: '/gestion/rutinas/nuevo',
  rutinasEdit: (id: number) => `/gestion/rutinas/${id}/edit`,
  rutinasAsignaciones: '/gestion/rutinas/asignaciones',
  rutinasAsignacionesNuevo: '/gestion/rutinas/asignaciones/nuevo',
  nutricion: '/gestion/nutricion',
  nutricionGeneral: '/gestion/nutricion/general',
  nutricionNuevo: '/gestion/nutricion/nuevo',
  nutricionMember: (id: number) => `/gestion/nutricion/${id}`,
  /** Recepción: validar entrada sin menú lateral (abrir en nueva pestaña). */
  controlAccesoRecepcion: '/recepcion/control-acceso',
  /** Registro de accesos con filtros (dentro de gestión, con menú). */
  controlAccesoRegistro: '/gestion/control-acceso/registro',
  sociosPhysical: (id: number) => `/gestion/socios/${id}/tabla-fisica`,
} as const;

/** Enlaces de gestión que deben abrirse en otra pestaña (recepción, etc.). */
export const gestionNewTab = {
  target: '_blank' as const,
  rel: 'noopener noreferrer' as const,
};

export function gestionAbsoluteUrl(path: string): string {
  return new URL(path, window.location.origin).href;
}
