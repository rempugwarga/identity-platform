import type { ClientConfig, ClientType } from './policies/index';

export interface ScaffoldContext {
  owners: string[];
  environments: string[];
  scopes: string[];
  audiences: string[];
}

export interface ScaffoldInput {
  clientId: string;
  name: string;
  description?: string;
  owner: string;
  type: ClientType;
  environments: string[];
  baseUrl?: string;
  redirectPath?: string;
  audience?: string;
  scopes?: string[];
}

const DEFAULT_SCOPES = ['openid', 'profile', 'email', 'roles'];
const PUBLIC_TYPES: ClientType[] = ['public-spa', 'mobile'];
const LOCALHOST_NAMES = ['localhost', '127.0.0.1', '[::1]'];

export class ScaffoldError extends Error {}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new ScaffoldError(message);
  }
}

export function buildClientConfig(
  input: ScaffoldInput,
  context: ScaffoldContext,
): ClientConfig {
  assert(
    /^[a-z][a-z0-9-]{2,63}$/.test(input.clientId),
    `clientId "${input.clientId}" tidak valid: huruf kecil/angka/tanda hubung, 3-64 karakter`,
  );
  assert(
    context.owners.includes(input.owner),
    `owner "${input.owner}" tidak terdaftar di governance/teams.json (pilihan: ${context.owners.join(', ')})`,
  );
  assert(
    input.environments.length > 0,
    'minimal satu environment wajib diisi (pilihan: dev, staging, prod)',
  );
  for (const environment of input.environments) {
    assert(
      context.environments.includes(environment),
      `environment "${environment}" tidak diizinkan (pilihan: ${context.environments.join(', ')})`,
    );
  }
  if (input.clientId.startsWith('test-')) {
    assert(
      input.environments.length === 1 && input.environments[0] === 'dev',
      'client dengan prefix "test-" hanya boleh untuk environment dev',
    );
  }

  const scopes =
    input.type === 'service'
      ? (input.scopes ?? (input.audience ? [input.audience] : []))
      : (input.scopes ?? DEFAULT_SCOPES);
  for (const scope of scopes) {
    assert(
      context.scopes.includes(scope),
      `scope "${scope}" tidak diizinkan (lihat policies/token-policy.json)`,
    );
  }

  const config: ClientConfig = {
    clientId: input.clientId,
    name: input.name,
    description:
      input.description ??
      `${input.name} — didaftarkan melalui scripts/new-client.ts`,
    owner: input.owner,
    type: input.type,
    environments: [...input.environments],
  };

  if (input.type === 'service') {
    assert(
      input.audience !== undefined,
      'client service wajib memiliki --audience (API target)',
    );
    assert(
      context.audiences.includes(input.audience),
      `audience "${input.audience}" tidak diizinkan (pilihan: ${context.audiences.join(', ')})`,
    );
    config.scopes = scopes;
    config.audience = input.audience;
    config.allowedClockSkewSeconds = 30;
    return config;
  }

  assert(
    input.baseUrl !== undefined,
    `client ${input.type} wajib memiliki --base-url (origin aplikasi)`,
  );
  assert(!input.baseUrl.includes('*'), 'base-url tidak boleh memuat wildcard');

  const url = new URL(input.baseUrl);
  const isLocalhost = LOCALHOST_NAMES.includes(url.hostname);
  assert(
    url.protocol === 'https:' || isLocalhost,
    'base-url wajib https (kecuali localhost untuk dev)',
  );
  if (isLocalhost) {
    assert(
      input.environments.includes('dev'),
      'base-url localhost hanya boleh bila environment dev disertakan',
    );
  }
  assert(
    url.pathname === '/' && url.search === '' && url.hash === '',
    'base-url harus origin murni tanpa path/query/fragment (contoh: https://app.example)',
  );

  const redirectPath = input.redirectPath ?? '/callback';
  const normalizedRedirect = redirectPath.startsWith('/')
    ? redirectPath
    : `/${redirectPath}`;

  config.redirectUris = [`${url.origin}${normalizedRedirect}`];
  config.postLogoutRedirectUris = [url.origin];
  config.webOrigins = [url.origin];
  config.scopes = scopes;
  if (input.audience !== undefined) {
    assert(
      context.audiences.includes(input.audience),
      `audience "${input.audience}" tidak diizinkan (pilihan: ${context.audiences.join(', ')})`,
    );
    config.audience = input.audience;
  }
  config.pkce = PUBLIC_TYPES.includes(input.type) ? 'S256' : 'none';
  config.allowedClockSkewSeconds = 30;
  return config;
}
