import { existsSync } from 'fs';
import {
  DATABASE_ARTIFACT_PATHS,
  databaseArtifactsRoot,
  resolveDatabaseArtifact,
} from '../../../src/infrastructure/database/database-artifacts';

describe('database-artifacts (infra)', () => {
  it('resuelve artefactos SQL bajo backend/database', () => {
    const root = databaseArtifactsRoot();
    expect(root).toMatch(/database$/);
    expect(existsSync(root)).toBe(true);

    const schema = resolveDatabaseArtifact(
      ...DATABASE_ARTIFACT_PATHS.schemaMysql.split('/'),
    );
    expect(existsSync(schema)).toBe(true);
  });
});
