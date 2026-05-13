export type AccessLogRow = {
  id: number;
  access_at: string;
  access_date: string;
  outcome: string;
  status_display: string | null;
  lookup_raw: string | null;
  member_id: number | null;
  first_name: string | null;
  last_name: string | null;
  staff_first_name: string | null;
  staff_last_name: string | null;
};

export function outcomeLabel(code: string): string {
  const map: Record<string, string> = {
    allowed: 'Entrada registrada',
    denied_not_found: 'No encontrado',
    denied_forbidden_staff: 'Sin permiso',
    denied_not_member: 'No es socio',
    denied_inactive: 'Cuenta inactiva',
    denied_no_due: 'Sin vigencia',
    denied_not_started: 'Aún no inicia',
    denied_expired: 'Vencido / denegado',
    duplicate_daily: 'Duplicado hoy',
  };
  return map[code] ?? code;
}

export function localYmd(d: Date): string {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function firstDayOfMonthYmd(): string {
  const d = new Date();
  d.setDate(1);
  return localYmd(d);
}
