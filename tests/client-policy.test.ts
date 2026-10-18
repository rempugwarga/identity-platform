import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from '@rstest/core';
import {
  isLocalhostUri,
  loadClientSchema,
  loadClients,
  loadTeams,
  loadTokenPolicy,
} from '../src/policies/index';

const clients = loadClients();
const teams = loadTeams();
const policy = loadTokenPolicy();

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(loadClientSchema());

const PUBLIC_TYPES = ['public-spa', 'mobile'];

describe('registrasi client — schema', () => {
  it('memuat setidaknya satu client', () => {
    expect(clients.length).toBeGreaterThan(0);
  });

  for (const client of clients) {
    it(`${client.sourceFile}: valid terhadap schema`, () => {
      const { sourceFile: _sourceFile, ...config } = client;
      const valid = validateSchema(config);
      expect(validateSchema.errors ?? []).toEqual([]);
      expect(valid).toBe(true);
    });
  }
});

describe('registrasi client — kebijakan platform', () => {
  it('nama file sama dengan clientId', () => {
    for (const client of clients) {
      expect(client.sourceFile).toBe(`${client.clientId}.json`);
    }
  });

  it('owner terdaftar di governance/teams.json', () => {
    const slugs = teams.map((team) => team.slug);
    for (const client of clients) {
      expect(slugs).toContain(client.owner);
    }
  });

  it('environment terbatas pada daftar yang diizinkan', () => {
    for (const client of clients) {
      for (const env of client.environments) {
        expect(policy.allowedEnvironments).toContain(env);
      }
    }
  });

  it('client uji (prefix test-) hanya untuk dev', () => {
    for (const client of clients) {
      if (client.clientId.startsWith('test-')) {
        expect(client.environments).toEqual(['dev']);
      }
    }
  });

  it('scope terbatas pada allowedScopes', () => {
    for (const client of clients) {
      for (const scope of client.scopes ?? []) {
        expect(policy.allowedScopes).toContain(scope);
      }
    }
  });

  it('audience terbatas pada allowedAudiences; client service wajib punya audience', () => {
    for (const client of clients) {
      if (client.audience !== undefined) {
        expect(policy.allowedAudiences).toContain(client.audience);
      }
      if (client.type === 'service') {
        expect(client.audience).toBeDefined();
      }
    }
  });

  it('public client wajib PKCE S256 dan memiliki redirect URI', () => {
    for (const client of clients) {
      if (PUBLIC_TYPES.includes(client.type)) {
        expect(policy.publicClientRequiresPkce).toBe(true);
        expect(client.pkce).toBe('S256');
        expect((client.redirectUris ?? []).length).toBeGreaterThan(0);
      }
    }
  });

  it('redirect URI wajib HTTPS kecuali localhost (hanya bila dev diikutsertakan)', () => {
    for (const client of clients) {
      for (const uri of [
        ...(client.redirectUris ?? []),
        ...(client.postLogoutRedirectUris ?? []),
      ]) {
        const url = new URL(uri);
        if (isLocalhostUri(uri)) {
          expect(client.environments).toContain('dev');
        } else {
          expect(url.protocol).toBe('https:');
        }
      }
    }
  });

  it('tidak ada wildcard pada redirect URI, post-logout URI, dan web origin', () => {
    for (const client of clients) {
      const values = [
        ...(client.redirectUris ?? []),
        ...(client.postLogoutRedirectUris ?? []),
        ...(client.webOrigins ?? []),
      ];
      for (const value of values) {
        expect(value).not.toContain('*');
      }
    }
  });

  it('web origin berupa origin penuh (bukan path/query/fragment)', () => {
    for (const client of clients) {
      for (const origin of client.webOrigins ?? []) {
        const url = new URL(origin);
        expect(url.pathname).toBe('/');
        expect(url.search).toBe('');
        expect(url.hash).toBe('');
        expect(url.origin).toBe(origin);
      }
    }
  });

  it('client service tidak memiliki redirect URI/web origin dan tidak memakai PKCE', () => {
    for (const client of clients) {
      if (client.type === 'service') {
        expect(client.redirectUris ?? []).toEqual([]);
        expect(client.postLogoutRedirectUris ?? []).toEqual([]);
        expect(client.webOrigins ?? []).toEqual([]);
        expect(client.pkce ?? 'none').toBe('none');
      }
    }
  });
});
