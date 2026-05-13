"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPrismaDatabaseUrl = buildPrismaDatabaseUrl;
exports.dropAllTablesInDatabase = dropAllTablesInDatabase;
exports.runPrismaMigrateDeploy = runPrismaMigrateDeploy;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
const backend_root_1 = require("./backend-root");
function stringProcessEnv(overrides) {
    const out = {};
    for (const [k, v] of Object.entries(process.env)) {
        if (typeof v === 'string')
            out[k] = v;
    }
    Object.assign(out, overrides);
    return out;
}
function buildPrismaDatabaseUrl(params) {
    const u = encodeURIComponent(params.username);
    const p = encodeURIComponent(params.password);
    const db = params.database.trim();
    return `mysql://${u}:${p}@${params.host}:${params.port}/${db}`;
}
async function dropAllTablesInDatabase(conn) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
        const [rows] = await conn.query(`SELECT TABLE_NAME AS n FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`);
        const names = (rows ?? [])
            .map((r) => String(r.n ?? '').trim())
            .filter((n) => n.length > 0);
        for (const name of names) {
            await conn.query(`DROP TABLE IF EXISTS \`${name.replace(/`/g, '``')}\``);
        }
    }
    finally {
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    }
}
function runPrismaMigrateDeploy(databaseUrl) {
    const cwd = (0, backend_root_1.backendPackageRoot)();
    const env = stringProcessEnv({ DATABASE_URL: databaseUrl });
    const prismaCli = (0, path_1.join)(cwd, 'node_modules', 'prisma', 'build', 'index.js');
    const useNodeCli = (0, fs_1.existsSync)(prismaCli);
    const command = useNodeCli ? process.execPath : 'npx';
    const args = useNodeCli
        ? [prismaCli, 'migrate', 'deploy']
        : ['prisma', 'migrate', 'deploy'];
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(command, args, {
            cwd,
            env,
            windowsHide: true,
            ...(!useNodeCli && process.platform === 'win32' ? { shell: true } : {}),
        });
        let stderr = '';
        let stdout = '';
        child.stdout?.on('data', (c) => {
            stdout += c.toString();
        });
        child.stderr?.on('data', (c) => {
            stderr += c.toString();
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0)
                resolve();
            else {
                const tail = (stderr || stdout).trim().slice(-4000);
                reject(new Error(`prisma migrate deploy terminó con código ${code}. ` +
                    (tail ? `Salida: ${tail}` : '')));
            }
        });
    });
}
//# sourceMappingURL=prisma-install.helper.js.map