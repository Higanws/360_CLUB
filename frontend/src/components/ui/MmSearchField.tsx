import type { InputHTMLAttributes, ReactNode } from 'react';
import { MmInput } from './MmInput';

type MmSearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'className'
> & {
  label?: ReactNode;
  grow?: boolean;
  className?: string;
  inputClassName?: string;
};

/** Campo de búsqueda unificado para listados (filtra tabla en cliente). */
export function MmSearchField({
  label,
  grow,
  className,
  inputClassName,
  ...inputProps
}: MmSearchFieldProps) {
  const wrapClass = [
    'mm-search-field',
    grow ? 'mm-search-field--grow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={wrapClass}>
      {label ? <span className="muted small">{label}</span> : null}
      <MmInput type="search" className={inputClassName} {...inputProps} />
    </label>
  );
}
