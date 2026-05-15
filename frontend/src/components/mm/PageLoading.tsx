type Props = {
  message?: string;
  className?: string;
};

/** Estado de carga estándar en páginas de gestión. */
export function PageLoading({
  message = 'Cargando…',
  className = 'mm-page',
}: Props) {
  return (
    <div className={className} role="status" aria-live="polite" aria-busy="true">
      <p className="muted">{message}</p>
    </div>
  );
}
