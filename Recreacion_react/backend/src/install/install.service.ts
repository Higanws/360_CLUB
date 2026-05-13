import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createConnection } from 'mysql2/promise';
import type { Connection } from 'mysql2/promise';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { isInstallComplete } from './install-state';
import { RunInstallDto, TestDbDto } from './dto/install.dto';
import { InstallSchemaService } from './install-schema.service';
import { resolveRepoDatabaseFile } from './database-path';
import { backendDataDirectory, backendPackageRoot } from './backend-root';
import {
  buildPrismaDatabaseUrl,
  dropAllTablesInDatabase,
  runPrismaMigrateDeploy,
} from './prisma-install.helper';

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
      'MariaDB en Windows a veces añade autenticación GSSAPI (auth_gssapi / auth_gssapi_client) como alternativa a la contraseña; ' +
      'el cliente «mysql» la soporta pero Node.js (mysql2) no. ' +
      'Ejecuta el script database/ops/mariadb-node-auth.sql con mysql.exe o HeidiSQL: hace ALTER USER … IDENTIFIED BY en cada cuenta root ' +
      'y deja de ofrecer GSSAPI a los clientes Node. Ajusta contraseñas si no usas root/root. ' +
      'Comprueba también todos los Host de root (consulta mysql.user) y repite ALTER si falta alguno. ' +
      'En el asistente usa Host 127.0.0.1 si localhost sigue dando problemas.'
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

/**
 * Tablas MVP definidas en `database/schema/schema_mysql.sql` (orden: hijas antes que
 * padres por claridad; con `FOREIGN_KEY_CHECKS=0` el orden no es obligatorio).
 */
const MVP_TABLES_FOR_TRUNCATE: string[] = [
  'nutrition_plan',
  'member_weekly_routine',
  'training_assignment_trainer',
  'training_assignment_member',
  'training_assignment',
  'training_routine_activity',
  'activity_trainer',
  'activity_video',
  'activity',
  'activity_category',
  'pos_sale_line',
  'pos_sale',
  'pos_product',
  'membership_payment',
  'gym_member_class',
  'club_access_log',
  'gym_member',
  'training_routine',
  'membership',
  'class_schedule',
  'general_setting',
  'gym_roles',
  'specialization',
];

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

  constructor(private readonly installSchema: InstallSchemaService) {}

  assertNotInstalled() {
    if (isInstallComplete()) {
      throw new ConflictException(
        'La instalación ya se completó. Elimina data/installed.txt y data/.installed solo si sabes lo que haces.',
      );
    }
  }

  /**
   * Comprueba tablas MVP, datos del seed, usuario admin y que la contraseña en BD
   * sea un hash bcrypt válido que coincida con la que indicó el asistente.
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
    if (memberCount < 1) {
      throw new BadRequestException(
        'La tabla gym_member quedó vacía tras el seed. Revisa logs de SQL y permisos.',
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

  private seedMvpPath(): string {
    return resolveRepoDatabaseFile('seed', 'seed_mvp_mysql.sql');
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

  /**
   * Vacía todas las tablas MVP antes de volcar el seed: permite reinstalar sobre una
   * base ya poblada (sin errores «Duplicate entry») y deja el esquema alineado con el DDL.
   */
  private async truncateAllMvpTables(conn: Connection): Promise<void> {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      for (const table of MVP_TABLES_FOR_TRUNCATE) {
        try {
          await conn.query(`TRUNCATE TABLE \`${table}\``);
        } catch (e: unknown) {
          if (isMissingTableError(e)) {
            continue;
          }
          const msg = e instanceof Error ? e.message : String(e);
          this.logger.warn(`TRUNCATE \`${table}\` omitido o fallido: ${msg}`);
        }
      }
    } finally {
      await conn.query('SET FOREIGN_KEY_CHECKS = 1');
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

    tick('connect', 'Conectando a MySQL para vaciar el esquema…');
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
        'Eliminando todas las tablas de la base (DROP IF EXISTS), incluido el historial de Prisma…',
      );
      this.logger.log(
        'Instalacion: vaciado completo de la base (DROP de todas las tablas), equivalente a truncar todo el esquema.',
      );
      await dropAllTablesInDatabase(conn);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await conn.end().catch(() => undefined);
      throw new BadRequestException(`No se pudo vaciar la base de datos: ${msg}`);
    }
    await conn.end();

    const databaseUrl = buildPrismaDatabaseUrl({
      host: dto.host,
      port: dto.port,
      username: dto.username.trim(),
      password: dto.password,
      database: dto.database.trim(),
    });

    try {
      tick(
        'prisma_migrate',
        'Creando tablas desde cero con Prisma (migrate deploy: una migración baseline + seed SQL)…',
      );
      this.logger.log(
        'Aplicando baseline Prisma: prisma migrate deploy (esquema completo; datos demo en seed SQL).',
      );
      await runPrismaMigrateDeploy(databaseUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(
        `Error aplicando el esquema Prisma (migrate deploy). Comprueba prisma/migrations y el CLI de Prisma en backend/: ${msg}`,
      );
    }

    tick('reconnect', 'Conectando de nuevo a MySQL para importar datos de ejemplo…');
    conn = await createConnection({
      host: dto.host,
      port: dto.port,
      user: dto.username,
      password: dto.password,
      database: dto.database,
      multipleStatements: true,
    });

    let seedSql: string;
    try {
      seedSql = readFileSync(this.seedMvpPath(), 'utf8');
    } catch {
      await conn.end();
      throw new BadRequestException(
        `No se encontró el seed MVP en ${this.seedMvpPath()} (database/seed/seed_mvp_mysql.sql).`,
      );
    }

    try {
      tick(
        'truncate_seed',
        'Truncando tablas MVP conocidas y ejecutando el script seed (datos demo)…',
      );
      this.logger.log(
        'Truncando tablas MVP y volcando seed demo (tras migraciones Prisma).',
      );
      await this.truncateAllMvpTables(conn);
      await this.installSchema.executeSqlScript(conn, seedSql);
      this.logger.log('Seed SQL ejecutado contra la base conectada al wizard.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await conn.end();
      throw new BadRequestException(
        `Error cargando datos iniciales del MVP: ${msg}. ` +
          'Si venías de un intento fallido, vuelve a ejecutar el asistente.',
      );
    }

    const hash = await bcrypt.hash(dto.adminPassword, 10);
    const adminUser = dto.adminUsername.trim();

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
        throw new Error('No existe la fila id=1 en gym_member tras el seed MVP.');
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
        'Verificando tablas esenciales, seed y hash bcrypt del administrador…',
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
        'Base vaciada, migraciones Prisma aplicadas, datos MVP importados y administrador actualizado. Reinicia el proceso del backend (npm run start:dev) para aplicar el archivo .env.',
      adminUsername: adminUser,
    };
  }
}
