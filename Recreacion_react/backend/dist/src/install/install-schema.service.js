"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var InstallSchemaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstallSchemaService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const database_path_1 = require("./database-path");
let InstallSchemaService = InstallSchemaService_1 = class InstallSchemaService {
    constructor() {
        this.logger = new common_1.Logger(InstallSchemaService_1.name);
    }
    schemaFilePath() {
        return (0, database_path_1.resolveRepoDatabaseFile)('schema', 'schema_mysql.sql');
    }
    splitSqlStatements(sql) {
        const noComments = sql.replace(/^--[^\n]*$/gm, '').trim();
        const chunks = [];
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
                if (t.length > 0)
                    chunks.push(t);
                buf = '';
                continue;
            }
            buf += c;
        }
        const tail = buf.trim();
        if (tail.length > 0)
            chunks.push(tail);
        return chunks;
    }
    async executeSqlScript(conn, sql) {
        try {
            await conn.query(sql);
            return;
        }
        catch (first) {
            this.logger.warn(`Script SQL monolítico falló (${first instanceof Error ? first.message : first}); reintentando por sentencias.`);
        }
        const chunks = this.splitSqlStatements(sql);
        for (const chunk of chunks) {
            const stmt = chunk.trim().replace(/;\s*$/, '').trim();
            if (!stmt.length)
                continue;
            await conn.query(stmt);
        }
    }
    async applyFullSchema(conn) {
        let sql;
        try {
            sql = (0, fs_1.readFileSync)(this.schemaFilePath(), 'utf8');
        }
        catch {
            throw new Error(`No se encontró el esquema en ${this.schemaFilePath()}`);
        }
        await this.executeSqlScript(conn, sql);
    }
};
exports.InstallSchemaService = InstallSchemaService;
exports.InstallSchemaService = InstallSchemaService = InstallSchemaService_1 = __decorate([
    (0, common_1.Injectable)()
], InstallSchemaService);
//# sourceMappingURL=install-schema.service.js.map