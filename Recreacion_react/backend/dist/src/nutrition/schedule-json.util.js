"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealsScheduleLongtextTransformer = void 0;
exports.parseMealsScheduleJson = parseMealsScheduleJson;
exports.dedupeNutritionSlots = dedupeNutritionSlots;
exports.stringifyMealsScheduleJson = stringifyMealsScheduleJson;
function parseMealsScheduleJson(raw) {
    if (raw == null)
        return [];
    if (Array.isArray(raw))
        return normalizeSlotsArray(raw);
    if (Buffer.isBuffer(raw))
        return parseString(String(raw.toString('utf8')));
    if (typeof raw === 'string')
        return parseString(raw);
    if (typeof raw === 'object') {
        try {
            return parseString(JSON.stringify(raw));
        }
        catch {
            return [];
        }
    }
    return parseString(String(raw));
}
function parseString(text) {
    const t = text.trim();
    if (!t || t === 'null')
        return [];
    try {
        const p = JSON.parse(t);
        return Array.isArray(p) ? normalizeSlotsArray(p) : [];
    }
    catch {
        return [];
    }
}
function normalizeSlotsArray(arr) {
    const out = [];
    for (const x of arr) {
        if (!x || typeof x !== 'object')
            continue;
        const o = x;
        const wd = Number(o.weekday);
        const hour = Number(o.hour);
        const event = String(o.event ?? '').trim();
        if (!Number.isInteger(wd) || wd < 0 || wd > 6)
            continue;
        if (!Number.isInteger(hour) || hour < 5 || hour > 23)
            continue;
        if (!event)
            continue;
        out.push({ weekday: wd, hour, event: event.slice(0, 8000) });
    }
    return dedupeNutritionSlots(out);
}
function dedupeNutritionSlots(slots) {
    const m = new Map();
    for (const s of slots) {
        m.set(`${s.weekday}-${s.hour}`, s);
    }
    return [...m.values()].sort((a, b) => a.weekday !== b.weekday ? a.weekday - b.weekday : a.hour - b.hour);
}
function stringifyMealsScheduleJson(slots) {
    if (slots == null || !Array.isArray(slots) || slots.length === 0)
        return null;
    return JSON.stringify(dedupeNutritionSlots(slots));
}
exports.mealsScheduleLongtextTransformer = {
    to: (v) => stringifyMealsScheduleJson(v),
    from: (v) => {
        const slots = parseMealsScheduleJson(v);
        return slots.length ? slots : null;
    },
};
//# sourceMappingURL=schedule-json.util.js.map