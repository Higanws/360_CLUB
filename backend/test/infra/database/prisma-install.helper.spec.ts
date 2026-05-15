import { buildPrismaDatabaseUrl } from '../../../src/install/prisma-install.helper';

describe('prisma-install.helper (infra)', () => {
  it('buildPrismaDatabaseUrl codifica credenciales', () => {
    const url = buildPrismaDatabaseUrl({
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: 'p@ss',
      database: 'club360',
    });
    expect(url).toBe('mysql://root:p%40ss@127.0.0.1:3306/club360');
  });
});
