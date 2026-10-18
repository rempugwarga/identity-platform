import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export type ClientType =
  | 'public-spa'
  | 'mobile'
  | 'service'
  | 'confidential-web';

export interface ClientConfig {
  clientId: string;
  name: string;
  description: string;
  owner: string;
  type: ClientType;
  environments: string[];
  redirectUris?: string[];
  postLogoutRedirectUris?: string[];
  webOrigins?: string[];
  scopes?: string[];
  audience?: string;
  pkce?: 'S256' | 'none';
  allowedClockSkewSeconds?: number;
}

export interface TokenPolicy {
  /** Versi kontrak kebijakan token (semver). Naikkan saat nilai berubah. */
  version: string;
  /** Tanggal berlaku kontrak (ISO 8601, YYYY-MM-DD) — pengumuman ke konsumen. */
  effectiveDate: string;
  accessTokenLifespanSeconds: number;
  ssoSessionIdleTimeoutSeconds: number;
  ssoSessionMaxLifespanSeconds: number;
  offlineSessionIdleTimeoutSeconds: number;
  refreshTokenMaxReuse: number;
  revokeRefreshToken: boolean;
  allowedScopes: string[];
  allowedAudiences: string[];
  allowedEnvironments: string[];
  publicClientRequiresPkce: boolean;
}

interface TeamEntry {
  slug: string;
  name: string;
  contact: string;
}

const repoRoot = process.cwd();

export function loadClients(): Array<ClientConfig & { sourceFile: string }> {
  const clientsDir = join(repoRoot, 'clients');
  return readdirSync(clientsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => {
      const raw = JSON.parse(
        readFileSync(join(clientsDir, entry.name), 'utf8'),
      ) as ClientConfig;
      return { ...raw, sourceFile: entry.name };
    });
}

export function loadTokenPolicy(): TokenPolicy {
  return JSON.parse(
    readFileSync(join(repoRoot, 'policies', 'token-policy.json'), 'utf8'),
  ) as TokenPolicy;
}

export function loadTeams(): TeamEntry[] {
  const parsed = JSON.parse(
    readFileSync(join(repoRoot, 'governance', 'teams.json'), 'utf8'),
  ) as { teams: TeamEntry[] };
  return parsed.teams;
}

export function loadClientSchema(): Record<string, unknown> {
  return JSON.parse(
    readFileSync(
      join(repoRoot, 'clients', 'schema', 'client.schema.json'),
      'utf8',
    ),
  ) as Record<string, unknown>;
}

export function isLocalhostUri(uri: string): boolean {
  try {
    const url = new URL(uri);
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}
