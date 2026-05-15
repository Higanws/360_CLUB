import type { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
};

/** Cabecera estándar de módulos de gestión. */
export function MmPageHeader({ title, subtitle, breadcrumb, actions }: Props) {
  return (
    <header className="mm-page-head">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="muted">{subtitle}</p> : null}
        {breadcrumb ? (
          <p className="muted">
            <span className="members-breadcrumb">{breadcrumb}</span>
          </p>
        ) : null}
      </div>
      {actions ? <div className="members-toolbar">{actions}</div> : null}
    </header>
  );
}
