import { describe, expect, it } from '@rstest/core';
import { loadTokenPolicy } from '../src/policies/index';

const policy = loadTokenPolicy();

describe('kebijakan token — versi kontrak', () => {
  it('versi mengikuti semver', () => {
    expect(policy.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('effectiveDate berupa tanggal ISO yang valid', () => {
    expect(policy.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Number.isNaN(Date.parse(policy.effectiveDate))).toBe(false);
  });
});

describe('kebijakan token — batas keamanan', () => {
  it('access token hidup antara 1 dan 15 menit', () => {
    expect(policy.accessTokenLifespanSeconds).toBeGreaterThanOrEqual(60);
    expect(policy.accessTokenLifespanSeconds).toBeLessThanOrEqual(900);
  });

  it('sesi SSO idle antara 5 dan 60 menit', () => {
    expect(policy.ssoSessionIdleTimeoutSeconds).toBeGreaterThanOrEqual(300);
    expect(policy.ssoSessionIdleTimeoutSeconds).toBeLessThanOrEqual(3600);
  });

  it('sesi SSO maksimum tidak melebihi 24 jam', () => {
    expect(policy.ssoSessionMaxLifespanSeconds).toBeLessThanOrEqual(86400);
    expect(policy.ssoSessionMaxLifespanSeconds).toBeGreaterThanOrEqual(
      policy.ssoSessionIdleTimeoutSeconds,
    );
  });

  it('sesi offline idle tidak melebihi sesi SSO idle', () => {
    expect(policy.offlineSessionIdleTimeoutSeconds).toBeLessThanOrEqual(
      policy.ssoSessionIdleTimeoutSeconds,
    );
  });

  it('rotasi refresh token aktif tanpa reuse', () => {
    expect(policy.revokeRefreshToken).toBe(true);
    expect(policy.refreshTokenMaxReuse).toBe(0);
  });

  it('scope inti OIDC selalu tersedia', () => {
    for (const core of ['openid', 'profile', 'email', 'roles']) {
      expect(policy.allowedScopes).toContain(core);
    }
  });

  it('daftar scope dan audience unik serta mengikuti pola nama', () => {
    const namePattern = /^[a-z][a-z0-9_-]*$/;
    for (const scope of policy.allowedScopes) {
      expect(scope).toMatch(namePattern);
    }
    for (const audience of policy.allowedAudiences) {
      expect(audience).toMatch(namePattern);
    }
    expect(new Set(policy.allowedScopes).size).toBe(policy.allowedScopes.length);
    expect(new Set(policy.allowedAudiences).size).toBe(
      policy.allowedAudiences.length,
    );
  });

  it('PKCE wajib untuk public client', () => {
    expect(policy.publicClientRequiresPkce).toBe(true);
  });
});
