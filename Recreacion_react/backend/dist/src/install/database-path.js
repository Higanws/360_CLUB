"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRepoDatabaseFile = resolveRepoDatabaseFile;
const fs_1 = require("fs");
const path_1 = require("path");
function resolveRepoDatabaseFile(...relativePathFromDatabaseDir) {
    const sub = (0, path_1.join)(...relativePathFromDatabaseDir);
    const candidates = [
        (0, path_1.join)(process.cwd(), '..', 'database', sub),
        (0, path_1.join)(process.cwd(), 'database', sub),
        (0, path_1.join)(__dirname, '..', '..', '..', 'database', sub),
        (0, path_1.join)(__dirname, '..', '..', '..', '..', 'database', sub),
    ];
    for (const p of candidates) {
        if ((0, fs_1.existsSync)(p))
            return p;
    }
    return candidates[0];
}
//# sourceMappingURL=database-path.js.map