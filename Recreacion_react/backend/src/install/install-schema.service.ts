import { Injectable, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import type { Connection } from 'mysql2/promise';
import { resolveRepoDatabaseFile } from './database-path';

/**
 * Adaptador de instalación: DDL inicial contra MySQL (puerto de infraestructura).
 * Fuente de DDL: `database/schema/schema_mysql.sql` — esquema MVP Club360 (solo tablas que usa Nest + TypeORM).
 */
@Injectable()
export class InstallSchemaService {
  private readonly logger = new Logger(InstallSchemaService.name);

  schemaFilePath(): string {
    return resolveRepoDatabaseFile('schema', 'schema_mysql.sql');
  }

  /** Divide SQL en sentencias sin cortar dentro de literales '…' (respeta '' como escape). */
  splitSqlStatements(sql: string): string[] {
    const noComments = sql.replace(/^--[^\n]*$/gm, '').trim();
    const chunks: string[] = [];
    let buf = '';
    let inQuote = false;
    for (let i = 0; i < noComments.length; i++) {
      const c = noComments[i];
      if (c === "'") {
        if (inQuote && noComments[i + 1] === "'") {
          buf += "''";
          i++;
          continue;
        }
        inQuote = !inQuote;
        buf += c;
        continue;
      }
      if (!inQuote && c === ';') {
        const t = buf.trim();
        if (t.length > 0) chunks.push(t);
        buf = '';
        continue;
      }
      buf += c;
    }
    const tail = buf.trim();
    if (tail.length > 0) chunks.push(tail);
    return chunks;
  }

  /**
   * Ejecuta un script SQL completo (DDL o DML). Si el bloque monolítico falla,
   * se reintenta por sentencias.
   */
  async executeSqlScript(conn: Connection, sql: string): Promise<void> {
    try {
      await conn.query(sql);
      return;
    } catch (first) {
      this.logger.warn(
        `Script SQL monolítico falló (${first instanceof Error ? first.message : first}); reintentando por sentencias.`,
      );
    }

    const chunks = this.splitSqlStatements(sql);
    for (const chunk of chunks) {
      const stmt = chunk.trim().replace(/;\s*$/, '').trim();
      if (!stmt.length) continue;
      await conn.query(stmt);
    }
  }

  async applyFullSchema(conn: Connection): Promise<void> {
    let sql: string;
    try {
      sql = readFileSync(this.schemaFilePath(), 'utf8');
    } catch {
      throw new Error(
        `No se encontró el esquema en ${this.schemaFilePath()}`,
      );
    }
    await this.executeSqlScript(conn, sql);
  }
}
