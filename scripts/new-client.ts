// Generator registrasi client OIDC (self-service, tanpa menunggu tim platform).
// Menghasilkan file clients/<clientId>.json yang otomatis lolos schema +
// kebijakan platform. Jalankan dari root repo identity-platform:
//
//   bun scripts/new-client.ts --id my-app --name "My App" --owner team-billing \
//     --type public-spa --base-url https://my-app.rempugwarga.example \
//     --environments dev,staging,prod
//
// Untuk client service (machine-to-machine):
//
//   bun scripts/new-client.ts --id my-api --name "My API" --owner team-billing \
//     --type service --audience billing-api --environments dev,staging,prod

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadTeams, loadTokenPolicy } from '../src/policies/index';
import {
  buildClientConfig,
  ScaffoldError,
  type ScaffoldInput,
} from '../src/scaffold';

const USAGE = `Pemakaian: bun scripts/new-client.ts --id <clientId> --name "<Nama>" --owner <tim> --type <tipe> [opsi]

Opsi:
  --id             clientId (kebab-case, = nama file)
  --name           Nama tampilan client
  --description    Deskripsi (opsional; ada default)
  --owner          Slug tim dari governance/teams.json
  --type           public-spa | mobile | service | confidential-web
  --environments   Daftar dipisah koma (default: dev,staging,prod)
  --base-url       Origin aplikasi (wajib untuk public-spa/mobile/confidential-web)
  --redirect-path  Path callback (default: /callback)
  --audience       Audience API (wajib untuk service; opsional lainnya)
  --scopes         Daftar scope dipisah koma (default: scope inti OIDC)`;

function parseArgs(argv: string[]): Map<string, string> {
  const parsed = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new ScaffoldError(`Opsi --${key} membutuhkan nilai`);
    }
    parsed.set(key, value);
    index += 1;
  }
  return parsed;
}

function requireArg(args: Map<string, string>, key: string): string {
  const value = args.get(key);
  if (!value) {
    throw new ScaffoldError(`Opsi --${key} wajib diisi`);
  }
  return value;
}

function main(): void {
  if (!existsSync('clients')) {
    throw new ScaffoldError(
      'Jalankan dari root repo identity-platform (folder clients/ tidak ditemukan).',
    );
  }

  const args = parseArgs(process.argv.slice(2));
  if (args.get('help') !== undefined) {
    console.log(USAGE);
    return;
  }

  const policy = loadTokenPolicy();
  const teams = loadTeams();
  const input: ScaffoldInput = {
    clientId: requireArg(args, 'id'),
    name: requireArg(args, 'name'),
    description: args.get('description'),
    owner: requireArg(args, 'owner'),
    type: requireArg(args, 'type') as ScaffoldInput['type'],
    environments: (args.get('environments') ?? 'dev,staging,prod')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    baseUrl: args.get('base-url'),
    redirectPath: args.get('redirect-path'),
    audience: args.get('audience'),
    scopes: args.get('scopes')
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean),
  };

  const config = buildClientConfig(input, {
    owners: teams.map((team) => team.slug),
    environments: policy.allowedEnvironments,
    scopes: policy.allowedScopes,
    audiences: policy.allowedAudiences,
  });

  const target = join('clients', `${config.clientId}.json`);
  if (existsSync(target)) {
    throw new ScaffoldError(
      `${target} sudah ada — ubah client lewat PR edit file tersebut (riwayat review lebih baik).`,
    );
  }

  writeFileSync(target, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  console.log(`✔ Dibuat: ${target}`);
  console.log('');
  console.log('Langkah berikutnya:');
  console.log(`  1. Tinjau ${target} (sesuaikan deskripsi/scope bila perlu).`);
  console.log('  2. Jalankan: bun run test  (validasi schema + kebijakan + konsistensi).');
  console.log('  3. Buka PR — reviewer: Identity Platform Team (SLA ≤ 2 hari kerja).');
  console.log('  4. Merge → apply otomatis ke dev; staging/prod via approval environment.');
}

try {
  main();
} catch (error) {
  if (error instanceof ScaffoldError) {
    console.error(`✖ ${error.message}`);
    console.error('');
    console.error(USAGE);
    process.exit(1);
  }
  throw error;
}
