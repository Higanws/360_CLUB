/** Valores almacenados en BD (consistentes con validación del API). */
export type GenderValue = 'male' | 'female' | 'other';

export function normalizeStoredGender(
  raw: string | null | undefined,
): GenderValue | '' {
  const s = (raw ?? '').trim().toLowerCase();
  if (['male', 'm', 'masculino', 'hombre'].includes(s)) return 'male';
  if (['female', 'f', 'femenino', 'mujer'].includes(s)) return 'female';
  if (['other', 'otro', 'otra', 'x'].includes(s)) return 'other';
  return '';
}

export function genderLabelEs(value: string | null | undefined): string {
  const v = normalizeStoredGender(value);
  switch (v) {
    case 'male':
      return 'Masculino';
    case 'female':
      return 'Femenino';
    case 'other':
      return 'Otro';
    default:
      return '—';
  }
}
