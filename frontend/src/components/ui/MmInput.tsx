import type { InputHTMLAttributes } from 'react';

type MmInputProps = InputHTMLAttributes<HTMLInputElement>;

export function MmInput({ className, ...props }: MmInputProps) {
  return (
    <input
      {...props}
      className={['mm-ui-input', className].filter(Boolean).join(' ')}
    />
  );
}
