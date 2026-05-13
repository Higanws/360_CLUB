"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ACTIVITY_DIFFICULTY_LEVELS = void 0;
exports.normalizeActivityDifficulty = normalizeActivityDifficulty;
exports.ACTIVITY_DIFFICULTY_LEVELS = ['baja', 'media', 'alta'];
function normalizeActivityDifficulty(raw) {
    const v = (raw ?? 'media').trim().toLowerCase();
    if (exports.ACTIVITY_DIFFICULTY_LEVELS.includes(v)) {
        return v;
    }
    return 'media';
}
//# sourceMappingURL=activity-difficulty.js.map