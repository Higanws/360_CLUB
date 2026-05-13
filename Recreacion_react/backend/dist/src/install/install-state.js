"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isInstallComplete = isInstallComplete;
const fs_1 = require("fs");
const path_1 = require("path");
const backend_root_1 = require("./backend-root");
function candidateInstallDataDirs() {
    const dirs = new Set();
    dirs.add((0, backend_root_1.backendDataDirectory)());
    dirs.add((0, path_1.join)(process.cwd(), 'data'));
    dirs.add((0, path_1.join)(process.cwd(), 'backend', 'data'));
    return [...dirs];
}
function isInstallComplete() {
    try {
        for (const dir of candidateInstallDataDirs()) {
            if ((0, fs_1.existsSync)((0, path_1.join)(dir, 'installed.txt')) ||
                (0, fs_1.existsSync)((0, path_1.join)(dir, '.installed'))) {
                return true;
            }
        }
        return false;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=install-state.js.map