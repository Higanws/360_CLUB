"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantForMadridYmd = instantForMadridYmd;
exports.isMondayYmdInMadrid = isMondayYmdInMadrid;
exports.todayYmdMadrid = todayYmdMadrid;
exports.madridMondayWeekStart = madridMondayWeekStart;
function formatYmdMadrid(d) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(d);
}
function weekdayLongMadrid(d) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Madrid',
        weekday: 'long',
    }).format(d);
}
function instantForMadridYmd(ymd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd))
        return null;
    const [y, m, d] = ymd.split('-').map((x) => parseInt(x, 10));
    if (!y || !m || !d)
        return null;
    let guess = new Date(Date.UTC(y, m - 1, d, 8, 0, 0));
    for (let i = 0; i < 48; i++) {
        if (formatYmdMadrid(guess) === ymd)
            return guess;
        guess = new Date(guess.getTime() + 3600000);
    }
    return null;
}
function isMondayYmdInMadrid(ymd) {
    const inst = instantForMadridYmd(ymd);
    if (!inst)
        return false;
    return weekdayLongMadrid(inst) === 'Monday';
}
function todayYmdMadrid(ref = new Date()) {
    return formatYmdMadrid(ref);
}
function madridMondayWeekStart(ref = new Date()) {
    let t = ref.getTime();
    for (let i = 0; i < 24 * 8; i++) {
        const d = new Date(t);
        if (weekdayLongMadrid(d) === 'Monday') {
            return formatYmdMadrid(d);
        }
        t -= 3600000;
    }
    return formatYmdMadrid(ref);
}
//# sourceMappingURL=madrid-week.util.js.map