"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backendPackageRoot = backendPackageRoot;
exports.backendDataDirectory = backendDataDirectory;
const path_1 = require("path");
function backendPackageRoot() {
    const normalized = __dirname.replace(/\\/g, '/');
    if (/\/dist\/src\//.test(normalized)) {
        return (0, path_1.join)(__dirname, '..', '..', '..');
    }
    return (0, path_1.join)(__dirname, '..', '..');
}
function backendDataDirectory() {
    return (0, path_1.join)(backendPackageRoot(), 'data');
}
//# sourceMappingURL=backend-root.js.map