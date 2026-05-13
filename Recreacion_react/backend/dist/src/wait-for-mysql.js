"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForMysql = waitForMysql;
const common_1 = require("@nestjs/common");
const promise_1 = require("mysql2/promise");
const logger = new common_1.Logger('MysqlWait');
async function pingClose(connection) {
    await connection.query('SELECT 1');
    await connection.end();
}
async function waitForMysql(config) {
    const host = config.get('DATABASE_HOST', 'localhost');
    const port = parseInt(config.get('DATABASE_PORT', '3306'), 10);
    const user = config.get('DATABASE_USER', 'root');
    const password = config.get('DATABASE_PASSWORD', 'root');
    const database = config.get('DATABASE_NAME', 'club360');
    const maxAttempts = 45;
    const delayMs = 2000;
    let serverUp = false;
    for (let attempt = 1; attempt <= maxAttempts && !serverUp; attempt++) {
        try {
            const c = await (0, promise_1.createConnection)({
                host,
                port,
                user,
                password,
                database: 'mysql',
                connectTimeout: 2000,
            });
            await pingClose(c);
            serverUp = true;
            logger.log(`MySQL disponible en ${host}:${port}`);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            const tail = attempt === maxAttempts ? ` Último error: ${msg}` : '';
            logger.warn(`[${attempt}/${maxAttempts}] Esperando MySQL en ${host}:${port} (usuario por defecto del proyecto: ${user}). Arranca la BD (p. ej. docker compose up mysql).${tail}`);
            if (attempt === maxAttempts) {
                throw new Error(`No se pudo conectar a MySQL tras ${maxAttempts} intentos (${Math.round((maxAttempts * delayMs) / 1000)} s). Credenciales esperadas: ${user} @ ${host}:${port}. Último error: ${msg}`);
            }
            await new Promise((r) => setTimeout(r, delayMs));
        }
    }
    try {
        const appConn = await (0, promise_1.createConnection)({
            host,
            port,
            user,
            password,
            database,
            connectTimeout: 2000,
        });
        await pingClose(appConn);
    }
    catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.error(`La base «${database}» no responde: ${msg}. Créala antes del primer arranque o usa el asistente de instalación.`);
        throw new Error(`MySQL está en marcha pero la base «${database}» no está disponible: ${msg}. Crea la base de datos e inténtalo de nuevo.`);
    }
}
//# sourceMappingURL=wait-for-mysql.js.map