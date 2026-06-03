import { GetClubBrandingUseCase } from '../../../src/shared/application/club/get-club-branding.use-case';
import type { GeneralSettingsRepository } from '../../../src/shared/application/ports/general-settings.port';

function mockCache() {
  const store = new Map<string, unknown>();
  return {
    get: async <T>(key: string) => (store.get(key) as T | undefined) ?? undefined,
    set: async (key: string, value: unknown) => {
      store.set(key, value);
    },
    del: async (key: string) => {
      store.delete(key);
    },
  };
}

describe('shared / GetClubBrandingUseCase', () => {
  it('devuelve valores por defecto si no hay fila', async () => {
    const settings: GeneralSettingsRepository = {
      getPrimary: async () => null,
    };
    const uc = new GetClubBrandingUseCase(settings, mockCache() as never);
    await expect(uc.execute()).resolves.toEqual({
      name: 'Club360',
      gym_logo: null,
      left_header: 'Club360',
      footer: '',
      header_color: '#1db198',
      currency: 'ARS',
    });
  });

  it('mapea fila de general_setting', async () => {
    const settings: GeneralSettingsRepository = {
      getPrimary: async () => ({
        id: 1,
        name: 'Gym Test',
        gym_logo: 'logo.png',
        left_header: 'Header',
        footer: 'Pie',
        header_color: '#000',
        currency: 'ARS',
        member_can_view_other: 1,
        staff_can_view_own_member: 1,
        date_format: 'd/m/Y',
      }),
    };
    const uc = new GetClubBrandingUseCase(settings, mockCache() as never);
    const dto = await uc.execute();
    expect(dto.name).toBe('Gym Test');
    expect(dto.currency).toBe('ARS');
  });
});
