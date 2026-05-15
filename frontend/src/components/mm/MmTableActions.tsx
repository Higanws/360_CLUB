import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Etiqueta accesible para lectores de pantalla */
  label?: string;
};

/** Celda de acciones con botones en una sola línea (no usar flex en `<td>`). */
export function MmTableActions({ children, label = 'Acciones' }: Props) {
  return (
    <td className="mm-table-actions">
      <div className="mm-table-actions__inner" role="group" aria-label={label}>
        {children}
      </div>
    </td>
  );
}
