import {
  isMondayYmdInMadrid,
  madridMondayWeekStart,
} from '../../../src/member-wellness/madrid-week.util';

describe('member-wellness / madrid-week.util', () => {
  it('isMondayYmdInMadrid detecta lunes en Madrid', () => {
    expect(isMondayYmdInMadrid('2026-05-11')).toBe(true);
    expect(isMondayYmdInMadrid('2026-05-12')).toBe(false);
  });

  it('madridMondayWeekStart devuelve lunes de la semana', () => {
    const monday = madridMondayWeekStart(new Date('2026-05-15T10:00:00Z'));
    expect(monday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isMondayYmdInMadrid(monday)).toBe(true);
  });
});
