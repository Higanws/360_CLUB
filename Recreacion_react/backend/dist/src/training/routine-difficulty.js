"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROUTINE_DIFFICULTY_LEVELS = void 0;
exports.computeRoutineDifficulty = computeRoutineDifficulty;
exports.normalizeRoutineDifficulty = normalizeRoutineDifficulty;
exports.ROUTINE_DIFFICULTY_LEVELS = [
    'baja',
    'media',
    'alta',
    'mixta',
];
function computeRoutineDifficulty(activityLevels) {
    if (activityLevels.length === 0)
        return 'media';
    const uniq = [...new Set(activityLevels)];
    if (uniq.length === 1)
        return uniq[0];
    return 'mixta';
}
function normalizeRoutineDifficulty(raw) {
    const v = (raw ?? 'media').trim().toLowerCase();
    if (exports.ROUTINE_DIFFICULTY_LEVELS.includes(v)) {
        return v;
    }
    return 'media';
}
//# sourceMappingURL=routine-difficulty.js.map