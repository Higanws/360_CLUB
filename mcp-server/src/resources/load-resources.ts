import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type GuideResource = {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  text: string;
};

const RESOURCE_FILES: { uri: string; file: string; name: string; description: string }[] = [
  {
    uri: 'club360://guide/domain',
    file: 'domain.md',
    name: 'Dominio Club360',
    description: 'Glosario: socio/cliente, roles, identificadores',
  },
  {
    uri: 'club360://guide/workflows',
    file: 'workflows.md',
    name: 'Flujos comunes',
    description: 'Recetas: crear socio, cambiar comida, cobros, rutinas',
  },
  {
    uri: 'club360://guide/nutrition-model',
    file: 'nutrition-model.md',
    name: 'Modelo nutricional',
    description: 'weekday, hour, event, dish, ingredients',
  },
  {
    uri: 'club360://guide/permissions',
    file: 'permissions.md',
    name: 'Permisos por rol',
    description: 'Qué tools puede usar administrator vs staff',
  },
  {
    uri: 'club360://guide/errors',
    file: 'errors.md',
    name: 'Errores API',
    description: 'Interpretar statusCode y message',
  },
  {
    uri: 'club360://guide/migration',
    file: 'migration.md',
    name: 'Modo migración',
    description: 'Importación en lotes: requisitos por tabla, fases e id_map',
  },
];

function resourcesDir(): string {
  const candidates = [
    join(__dirname, '../../resources'),
    join(__dirname, '../resources'),
  ];
  for (const p of candidates) {
    try {
      readFileSync(join(p, 'domain.md'));
      return p;
    } catch {
      /* next */
    }
  }
  return join(__dirname, '../../resources');
}

export function loadGuideResources(): GuideResource[] {
  const dir = resourcesDir();
  return RESOURCE_FILES.map((r) => ({
    uri: r.uri,
    name: r.name,
    description: r.description,
    mimeType: 'text/markdown',
    text: readFileSync(join(dir, r.file), 'utf8'),
  }));
}
