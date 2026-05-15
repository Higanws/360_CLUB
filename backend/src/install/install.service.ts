import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createConnection } from 'mysql2/promise';
import type { Connection } from 'mysql2/promise';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { isInstallComplete } from './install-state';
import { RunInstallDto, TestDbDto } from './dto/install.dto';
import { backendDataDirectory, backendPackageRoot } from './backend-root';
import {
  assertDatabaseHasNoBaseTables,
  buildPrismaDatabaseUrl,
  dropAllTablesInDatabase,
} from './prisma-install.helper';
import { applyMvpSchemaDdl, applyMvpSeed } from './sql-install.helper';

/** Evento de avance para el asistente (SSE) o logs. */
export type InstallProgressEvent = {
  step: string;
  message: string;
};

export type TestConnectionResult =
  | {
      ok: true;
      /** Base activa en la sesión (debe coincidir con la indicada en el asistente). */
      currentDatabase: string;
      /** Usuario MySQL efectivo de la sesión (CURRENT_USER). */
      mysqlUser: string;
      /** Resumen no sensible: host/puerto/BD/usuario que se escribirán en backend/.env. */
      appliedCredentialsSummary: string;
      /** Coincide `DATABASE()` con el nombre de BD del formulario. */
      matchesExpectedDatabase: boolean;
    }
  | { ok: false; error: string; hint?: string };

function connectionErrorHint(message: string): string | undefined {
  const m = message.toLowerCase();
  /** MariaDB 11–12 en Windows: auth_or + gssapi junto a mysql_native_password → mysql2 falla. */
  if (
    m.includes('auth_gssapi') ||
    m.includes('unknown plugin') ||
    m.includes('auth_switch_plugin') ||
    m.includes('authentication plugin')
  ) {
    return (
      'MariaDB en Windows a veces ofrece autenticación GSSAPI (auth_gssapi); el cliente «mysql» la admite pero Node.js (mysql2) no. ' +
      'Configura el usuario de la app con contraseña nativa (ALTER USER … IDENTIFIED BY) en tu servidor MySQL/MariaDB. ' +
      'Comprueba todos los Host del usuario (SELECT User, Host FROM mysql.user). ' +
      'En el asistente prueba Host 127.0.0.1 si localhost falla.'
    );
  }
  if (
    m.includes('econnrefused') ||
    m.includes('connect econnrefused') ||
    m.includes('timeout')
  ) {
    return 'No hay servidor MySQL/MariaDB escuchando en ese host y puerto. Arranca el servicio local (p. ej. MariaDB en Windows) o el contenedor si usas Docker.';
  }
  if (
    m.includes('access denied') ||
    m.includes('password') ||
    m.includes('1045')
  ) {
    return 'Usuario o contraseña incorrectos para MySQL.';
  }
  if (m.includes('unknown database') || m.includes('1049')) {
    return 'Esa base de datos no existe. Créala antes de instalar (CREATE DATABASE club360;).';
  }
  return undefined;
}

function escapeEnvValue(value: string): string {
  if (value === '') return '""';
  if (/[\s#"']/.test(value)) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return value;
}

function isMissingTableError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const err = e as { errno?: number; code?: string };
  return err.errno === 1146 || err.code === 'ER_NO_SUCH_TABLE';
}

/** Tablas MVP con columna AUTO_INCREMENT a realinear tras el seed con IDs fijos. */
const AUTO_INCREMENT_TABLES: [string, string][] = [
  ['nutrition_plan', 'id'],
  ['member_weekly_routine', 'id'],
  ['training_assignment_trainer', 'id'],
  ['training_assignment_member', 'id'],
  ['training_assignment', 'id'],
  ['training_routine_activity', 'id'],
  ['activity_trainer', 'id'],
  ['activity_video', 'id'],
  ['activity', 'id'],
  ['activity_category', 'id'],
  ['pos_sale_line', 'id'],
  ['pos_sale', 'id'],
  ['pos_product', 'id'],
  ['membership_payment', 'mp_id'],
  ['gym_member_class', 'id'],
  ['club_access_log', 'id'],
  ['gym_member', 'id'],
  ['training_routine', 'id'],
  ['membership', 'id'],
  ['class_schedule', 'id'],
  ['general_setting', 'id'],
  ['gym_roles', 'id'],
  ['specialization', 'id'],
];

@Injectable()
export class InstallService {
  private readonly logger = new Logger(InstallService.name);

  assertNotInstalled() {
    if (isInstallComplete()) {
      throw new ConflictException(
        'La instalación ya se completó. Elimina data/installed.txt y data/.installed solo si sabes lo que haces.',
      );
    }
  }

  /**
   * Tras `seed_mvp.sql`, deben existir ajustes y usuarios demo antes de que el asistente
   * sobrescriba la contraseña del administrador (id=1).
   */
  private async assertBaselinePopulationAfterSeed(conn: Connection): Promise<void> {
    const [gs] = await conn.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM general_setting',
    );
    if (Number((gs as RowDataPacket[])[0]?.c ?? 0) < 1) {
      throw new BadRequestException(
        'La población inicial no se aplicó: falta general_setting. Revisa database/seed/seed_mvp.sql.',
      );
    }
    const [gm] = await conn.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM gym_member',
    );
    const mc = Number((gm as RowDataPacket[])[0]?.c ?? 0);
    if (mc < 4) {
      throw new BadRequestException(
        `La población inicial no se aplicó: gym_member tiene ${mc} fila(s); se esperaban al menos 4 (admin, staff y socios demo en seed_mvp.sql).`,
      );
    }
  }

  /**
   * Comprueba tablas MVP, población inicial del seed SQL, usuario admin y bcrypt.
   */
  private async verifyMvpInstallation(
    conn: Connection,
    adminUsername: string,
    adminPlainPassword: string,
  ): Promise<void> {
    const required = [
      'gym_member',
      'general_setting',
      'gym_roles',
      'membership',
      'club_access_log',
      'training_routine',
      'activity',
      /** Portal socio: snapshot semanal de rutina (member-wellness). */
      'member_weekly_routine',
    ];
    const ph = required.map(() => '?').join(',');
    const [tableRows] = await conn.query<RowDataPacket[]>(
      `SELECT TABLE_NAME AS n FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN (${ph})`,
      required,
    );
    const found = new Set((tableRows ?? []).map((r) => String(r.n)));
    for (const t of required) {
      if (!found.has(t)) {
        throw new BadRequestException(
          `Falta la tabla esencial «${t}» en la base. No se completará la instalación.`,
        );
      }
    }
    const [countRows] = await conn.query<RowDataPacket[]>(
      'SELECT COUNT(*) AS c FROM gym_member',
    );
    const memberCount = Number((countRows as RowDataPacket[])[0]?.c ?? 0);
    if (memberCount < 4) {
      throw new BadRequestException(
        'Se esperaban al menos 4 usuarios demo en gym_member (admin, staff y socios). Revisa database/seed/seed_mvp.sql.',
      );
    }
    this.logger.log(
      `Verificación post-seed: gym_member tiene ${memberCount} fila(s).`,
    );

    const [gm] = await conn.query<RowDataPacket[]>(
      'SELECT id, username, password FROM gym_member WHERE id = 1 LIMIT 1',
    );
    if (!Array.isArray(gm) || gm.length === 0) {
      throw new BadRequestException(
        'No hay fila id=1 en gym_member. Los datos iniciales no quedaron bien aplicados.',
      );
    }
    const row = gm[0] as RowDataPacket;
    const u = row.username != null ? String(row.username).trim() : '';
    if (u !== adminUsername.trim()) {
      throw new BadRequestException(
        `El usuario administrador en BD («${u}») no coincide con el indicado en el asistente.`,
      );
    }
    const storedHash = row.password != null ? String(row.password) : '';
    if (!storedHash.startsWith('$2') || storedHash.length < 50) {
      throw new BadRequestException(
        'La contraseña del administrador en BD no es un hash bcrypt válido (revisa columna password / truncado).',
      );
    }
    const bcryptOk = await bcrypt.compare(adminPlainPassword, storedHash);
    if (!bcryptOk) {
      throw new BadRequestException(
        'La contraseña guardada para el administrador no coincide con la del asistente (fallo de verificación bcrypt).',
      );
    }
  }

  /** Tras INSERT con ids explícitos en el volcado demo, alinea AUTO_INCREMENT. */
  private async syncAutoIncrement(conn: Connection): Promise<void> {
    for (const [table, col] of AUTO_INCREMENT_TABLES) {
      try {
        const [rows] = await conn.query(
          `SELECT COALESCE(MAX(\`${col}\`), 0) + 1 AS n FROM \`${table}\``,
        );
        const row = (rows as RowDataPacket[])[0];
        const n = Number(row?.n ?? 1);
        await conn.query(`ALTER TABLE \`${table}\` AUTO_INCREMENT = ?`, [n]);
      } catch (e: unknown) {
        if (isMissingTableError(e)) continue;
        throw e;
      }
    }
  }

  async testConnection(dto: TestDbDto): Promise<TestConnectionResult> {
    try {
      const conn = await createConnection({
        host: dto.host,
        port: dto.port,
        user: dto.username,
        password: dto.password,
        database: dto.database,
        connectTimeout: 8000,
      });
      await conn.query('SELECT 1');
      const [rows] = await conn.query<RowDataPacket[]>(
        'SELECT DATABASE() AS db, CURRENT_USER() AS cu',
      );
      const row = (rows as RowDataPacket[])[0];
      const currentDatabase =
        row?.db != null ? String(row.db) : '';
      const mysqlUser = row?.cu != null ? String(row.cu) : '';
      const expected = dto.database.trim();
      const matchesExpectedDatabase =
        currentDatabase.toLowerCase() === expected.toLowerCase();
      const appliedCredentialsSummary = `${dto.username}@${dto.host}:${dto.port} / ${expected}`;
      await conn.end();
      return {
        ok: true,
        currentDatabase,
        mysqlUser,
        appliedCredentialsSummary,
        matchesExpectedDatabase,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`testConnection failed: ${msg}`);
      const hint = connectionErrorHint(msg);
      return { ok: false, error: msg, ...(hint ? { hint } : {}) };
    }
  }

  /**
   * Comprueba si hay MySQL accesible con los valores por defecto del asistente
   * (localhost:3306, root/root, BD sistema mysql).
   */
  async pingProjectDefaults(): Promise<{ ok: boolean; message: string }> {
    const r = await this.testConnection({
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'mysql',
    });
    if (r.ok) {
      return {
        ok: true,
        message:
          'MySQL responde en localhost:3306 con usuario root (credenciales por defecto del proyecto / Docker). ' +
          `Sesion: ${r.mysqlUser}, base activa: «${r.currentDatabase}».`,
      };
    }
    const hint = r.hint ?? connectionErrorHint(r.error);
    return {
      ok: false,
      message: hint
        ? `${hint} Detalle técnico: ${r.error}`
        : `Sin conexión con MySQL por defecto: ${r.error}`,
    };
  }

  async run(
    dto: RunInstallDto,
    onProgress?: (e: InstallProgressEvent) => void,
  ): Promise<{
    success: true;
    message: string;
    adminUsername: string;
  }> {
    const tick = (step: string, message: string) => {
      try {
        onProgress?.({ step, message });
      } catch {
        /* no bloquear instalación si el cliente SSE falla al notificar */
      }
    };

    this.assertNotInstalled();

    tick(
      'validate',
      'Validando acceso a la base de datos y que DATABASE() coincida con la base indicada…',
    );
    const test = await this.testConnection(dto);
    if (!test.ok) {
      throw new BadRequestException(`No se pudo conectar a MySQL: ${test.error}`);
    }
    if (!test.matchesExpectedDatabase) {
      throw new BadRequestException(
        `La base activa en MySQL («${test.currentDatabase}») no coincide con «${dto.database.trim()}». ` +
          'Comprueba el nombre de la base o los permisos del usuario.',
      );
    }

    tick('connect', 'Conectando a MySQL: se vaciará por completo cualquier dato o esquema antiguo…');
    let conn = await createConnection({
      host: dto.host,
      port: dto.port,
      user: dto.username,
      password: dto.password,
      database: dto.database,
      multipleStatements: true,
    });

    try {
      tick(
        'drop_tables',
        'Eliminando todas las vistas y tablas: la base debe quedar totalmente vacía…',
      );
      this.logger.log(
        'Instalación: DROP de todas las vistas y tablas — sin restos de datos ni esquema previo.',
      );
      await dropAllTablesInDatabase(conn);
      tick(
        'verify_empty',
        'Comprobando limpieza total: 0 tablas y 0 vistas antes de crear esquema y población inicial…',
      );
      await assertDatabaseHasNoBaseTables(conn);
      tick(
        'schema',
        'Creando esquema MVP desde database/schema/schema_mysql.sql…',
      );
      await applyMvpSchemaDdl(conn);
      tick(
        'seed',
        'Insertando datos demo desde database/seed/seed_mvp.sql…',
      );
      await applyMvpSeed(conn);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await conn.end().catch(() => undefined);
      throw new BadRequestException(
        `No se pudo preparar la base (vaciado, esquema o seed): ${msg}`,
      );
    }

    const databaseUrl = buildPrismaDatabaseUrl({
      host: dto.host,
      port: dto.port,
      username: dto.username.trim(),
      password: dto.password,
      database: dto.database.trim(),
    });

    const hash = await bcrypt.hash(dto.adminPassword, 10);
    const adminUser = dto.adminUsername.trim();

    try {
      tick(
        'poblacion',
        'Comprobando que exista la población inicial del seed demo…',
      );
      await this.assertBaselinePopulationAfterSeed(conn);
    } catch (e) {
      await conn.end();
      throw e instanceof BadRequestException
        ? e
        : new BadRequestException(
            `Fallo comprobando población inicial: ${e instanceof Error ? e.message : String(e)}`,
          );
    }

    try {
      tick(
        'admin',
        'Actualizando el usuario administrador (id=1) con la contraseña del asistente…',
      );
      const [result] = await conn.query<ResultSetHeader>(
        'UPDATE gym_member SET username = ?, password = ? WHERE id = 1',
        [adminUser, hash],
      );
      if ((result?.affectedRows ?? 0) === 0) {
        throw new Error(
          'No existe la fila id=1 en gym_member tras seed_mvp.sql.',
        );
      }
      await this.syncAutoIncrement(conn);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await conn.end();
      throw new BadRequestException(`Error aplicando el usuario administrador: ${msg}`);
    }

    try {
      tick(
        'verify',
        'Verificando tablas esenciales, datos demo y hash bcrypt del administrador…',
      );
      await this.verifyMvpInstallation(conn, adminUser, dto.adminPassword);
    } catch (e) {
      await conn.end();
      throw e instanceof BadRequestException
        ? e
        : new BadRequestException(
            `Verificación tras instalación fallida: ${e instanceof Error ? e.message : String(e)}`,
          );
    }

    await conn.end();

    const jwtSecret = randomBytes(32).toString('hex');

    const envLines = [
      '# Generado por el asistente de instalación — no commitees secretos reales',
      `NODE_ENV=development`,
      `PORT=3000`,
      `FRONTEND_URL=http://localhost:5173`,
      ``,
      `DATABASE_HOST=${escapeEnvValue(dto.host)}`,
      `DATABASE_PORT=${dto.port}`,
      `DATABASE_USER=${escapeEnvValue(dto.username)}`,
      `DATABASE_PASSWORD=${escapeEnvValue(dto.password)}`,
      `DATABASE_NAME=${escapeEnvValue(dto.database)}`,
      `DATABASE_URL=${escapeEnvValue(databaseUrl)}`,
      ``,
      `JWT_SECRET=${jwtSecret}`,
      `JWT_ACCESS_SECONDS=1800`,
      `JWT_REFRESH_SECONDS=604800`,
      ``,
    ];

    try {
      tick(
        'env',
        'Escribiendo backend/.env y marcadores de instalación (data/installed.txt)…',
      );
      const dataDir = backendDataDirectory();
      mkdirSync(dataDir, { recursive: true });
      writeFileSync(join(backendPackageRoot(), '.env'), envLines.join('\n'), 'utf8');
      const installedAt = new Date().toISOString();
      const marker = `Club360 — instalación completada (${installedAt})\n`;
      writeFileSync(join(dataDir, '.installed'), installedAt, 'utf8');
      writeFileSync(join(dataDir, 'installed.txt'), marker, 'utf8');
    } catch (e) {
      throw new BadRequestException(
        `Tablas creadas pero no se pudo escribir .env o el marcador de instalación: ${e}`,
      );
    }

    this.logger.log('Instalación completada. Reinicia el servidor API para cargar la nueva configuración.');

    return {
      success: true,
      message:
        'Base vaciada, esquema y seed demo aplicados, administrador actualizado. Reinicia el proceso del backend (npm run start:dev) para aplicar el archivo .env.',
      adminUsername: adminUser,
    };
  }
}
