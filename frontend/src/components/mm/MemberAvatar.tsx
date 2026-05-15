import { useMemo, useState } from 'react';

const uploadBase = import.meta.env.VITE_UPLOAD_BASE as string | undefined;

type Props = {
  filename: string | null | undefined;
  /** Nombre para iniciales y texto alternativo */
  label: string;
  className?: string;
};

function resolveUploadUrl(filename: string): string | null {
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  if (uploadBase) {
    return `${uploadBase.replace(/\/$/, '')}/${filename}`;
  }
  return filename;
}

function initialsFrom(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Avatar con foto o iniciales (socios, staff, planes). */
export function MemberAvatar({ filename, label, className = 'members-photo' }: Props) {
  const [broken, setBroken] = useState(false);
  const src = useMemo(
    () => (filename?.trim() ? resolveUploadUrl(filename.trim()) : null),
    [filename],
  );
  const initials = initialsFrom(label);
  const alt = label.trim() || 'Usuario';

  if (src && !broken) {
    return (
      <img
        className={className}
        src={src}
        alt={alt}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div
      className={`${className} members-photo--fallback`}
      aria-hidden={!alt}
      title={alt}
    >
      {initials || '?'}
    </div>
  );
}
