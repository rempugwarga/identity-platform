import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { describe, expect, it } from '@rstest/core';
import {
  loadClientSchema,
  loadTeams,
  loadTokenPolicy,
} from '../src/policies/index';
import {
  buildClientConfig,
  ScaffoldError,
  type ScaffoldContext,
  type ScaffoldInput,
} from '../src/scaffold';

const policy = loadTokenPolicy();
const teams = loadTeams();

const context: ScaffoldContext = {
  owners: teams.map((team) => team.slug),
  environments: policy.allowedEnvironments,
  scopes: policy.allowedScopes,
  audiences: policy.allowedAudiences,
};

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(loadClientSchema());

const baseSpa: ScaffoldInput = {
  clientId: 'my-app',
  name: 'My App',
  owner: 'team-billing',
  type: 'public-spa',
  environments: ['dev', 'staging', 'prod'],
  baseUrl: 'https://my-app.rempugwarga.example',
};

describe('scaffold client — happy path', () => {
  it('menghasilkan SPA valid terhadap schema registrasi', () => {
    const config = buildClientConfig(baseSpa, context);
    const valid = validateSchema(config);
    expect(validateSchema.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
    expect(config.pkce).toBe('S256');
    expect(config.redirectUris).toEqual([
      'https://my-app.rempugwarga.example/callback',
    ]);
  });

  it('menghasilkan client service valid tanpa redirect & PKCE', () => {
    const config = buildClientConfig(
      {
        clientId: 'my-api',
        name: 'My API',
        owner: 'team-billing',
        type: 'service',
        environments: ['dev', 'staging', 'prod'],
        audience: 'billing-api',
      },
      context,
    );
    const valid = validateSchema(config);
    expect(validateSchema.errors ?? []).toEqual([]);
    expect(valid).toBe(true);
    expect(config.audience).toBe('billing-api');
    expect(config.scopes).toEqual(['billing-api']);
    expect(config.redirectUris).toBeUndefined();
  });

  it('mengizinkan localhost untuk dev', () => {
    const config = buildClientConfig(
      {
        ...baseSpa,
        clientId: 'local-app',
        environments: ['dev'],
        baseUrl: 'http://localhost:5173',
      },
      context,
    );
    expect(config.redirectUris).toEqual(['http://localhost:5173/callback']);
    expect(config.webOrigins).toEqual(['http://localhost:5173']);
  });
});

describe('scaffold client — penolakan pelanggaran kebijakan', () => {
  const expectScaffoldError = (input: ScaffoldInput) => {
    expect(() => buildClientConfig(input, context)).toThrow(ScaffoldError);
  };

  it('menolak owner yang tidak terdaftar', () => {
    expectScaffoldError({ ...baseSpa, owner: 'tim-hantu' });
  });

  it('menolak clientId tidak valid', () => {
    expectScaffoldError({ ...baseSpa, clientId: 'My_App' });
  });

  it('menolak client test- di luar dev', () => {
    expectScaffoldError({
      ...baseSpa,
      clientId: 'test-harness-2',
      environments: ['dev', 'staging'],
    });
  });

  it('menolak base-url http non-localhost', () => {
    expectScaffoldError({ ...baseSpa, baseUrl: 'http://my-app.example' });
  });

  it('menolak localhost tanpa environment dev', () => {
    expectScaffoldError({
      ...baseSpa,
      baseUrl: 'http://localhost:5173',
      environments: ['staging'],
    });
  });

  it('menolak scope di luar kebijakan token', () => {
    expectScaffoldError({ ...baseSpa, scopes: ['admin-everything'] });
  });

  it('menolak client service tanpa audience', () => {
    expectScaffoldError({
      clientId: 'my-api',
      name: 'My API',
      owner: 'team-billing',
      type: 'service',
      environments: ['dev'],
    });
  });

  it('menolak audience di luar kebijakan token', () => {
    expectScaffoldError({
      clientId: 'my-api',
      name: 'My API',
      owner: 'team-billing',
      type: 'service',
      environments: ['dev'],
      audience: 'api-rahasia',
    });
  });
});
