import { isPortalPreviewRole } from '../../../src/lib/member-wellness-params';

describe('member-wellness / member-wellness-params', () => {
  it('solo admin y staff pueden previsualizar portal', () => {
    expect(isPortalPreviewRole('administrator')).toBe(true);
    expect(isPortalPreviewRole('staff_member')).toBe(true);
    expect(isPortalPreviewRole('member')).toBe(false);
    expect(isPortalPreviewRole(null)).toBe(false);
  });
});
