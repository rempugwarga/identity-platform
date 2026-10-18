/**
 * Verifikasi kontrak OIDC terhadap realm hasil terapkan (ephemeral/nyata).
 * Dijalankan oleh scripts/integration-test.sh dan pipeline CI.
 */
const baseUrl = process.env.KC_BASE_URL ?? 'http://localhost:8080';
const realm = process.env.REALM ?? 'rempugwarga';
const clientId = process.env.TEST_CLIENT_ID ?? 'test-harness';
const clientSecret = process.env.TEST_CLIENT_SECRET;
const expectedLifespan = Number(
  process.env.EXPECTED_ACCESS_TOKEN_LIFESPAN ?? '300',
);
const publicClientId = process.env.PUBLIC_CLIENT_ID ?? 'web-dashboard';
const publicRedirectUri =
  process.env.PUBLIC_REDIRECT_URI ??
  'https://dashboard-staging.rempugwarga.example/callback';

const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures.push(name);
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log(
  `\nVerifikasi kontrak OIDC\n  issuer : ${baseUrl}/realms/${realm}\n`,
);

// 1. Discovery
const discoveryRes = await fetch(
  `${baseUrl}/realms/${realm}/.well-known/openid-configuration`,
);
check(
  'discovery endpoint dapat diakses',
  discoveryRes.ok,
  `HTTP ${discoveryRes.status}`,
);
const discovery = await discoveryRes.json();
check(
  'issuer sesuai harapan',
  discovery.issuer === `${baseUrl}/realms/${realm}`,
  discovery.issuer,
);
check(
  'authorization endpoint tersedia',
  Boolean(discovery.authorization_endpoint),
);
check('token endpoint tersedia', Boolean(discovery.token_endpoint));
check(
  'PKCE S256 diiklankan',
  (discovery.code_challenge_methods_supported ?? []).includes('S256'),
);

// 2. Token machine-to-machine (client credentials)
const tokenRes = await fetch(discovery.token_endpoint, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret ?? '',
    scope: 'billing-api',
  }),
});
check(
  'grant client_credentials diterbitkan',
  tokenRes.ok,
  `HTTP ${tokenRes.status}`,
);
const tokenSet = await tokenRes.json();
check(
  `umur access token sesuai kebijakan (${expectedLifespan}s)`,
  tokenSet.expires_in === expectedLifespan,
  `expires_in=${tokenSet.expires_in}`,
);
check(
  'token type Bearer',
  (tokenSet.token_type ?? '').toLowerCase() === 'bearer',
);

if (tokenSet.access_token) {
  const payload = JSON.parse(
    Buffer.from(tokenSet.access_token.split('.')[1], 'base64url').toString(
      'utf8',
    ),
  );
  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  check(
    'audience token berisi billing-api',
    audiences.includes('billing-api'),
    JSON.stringify(audiences),
  );
  check(
    'token diterbitkan oleh issuer realm',
    payload.iss === `${baseUrl}/realms/${realm}`,
    payload.iss,
  );
}

// 3. PKCE wajib untuk public client
const authBase = discovery.authorization_endpoint;
const missingPkceUrl = new URL(authBase);
missingPkceUrl.search = new URLSearchParams({
  client_id: publicClientId,
  response_type: 'code',
  scope: 'openid',
  redirect_uri: publicRedirectUri,
  state: 'test-state',
}).toString();
const missingPkceRes = await fetch(missingPkceUrl, { redirect: 'manual' });
check(
  'authorization tanpa code_challenge ditolak (PKCE wajib)',
  missingPkceRes.status === 400,
  `HTTP ${missingPkceRes.status}`,
);

// 4. redirect_uri yang tidak terdaftar ditolak
const badRedirectUrl = new URL(authBase);
badRedirectUrl.search = new URLSearchParams({
  client_id: publicClientId,
  response_type: 'code',
  scope: 'openid',
  redirect_uri: 'https://evil.example/callback',
  state: 'test-state',
  code_challenge: 'x'.repeat(43),
  code_challenge_method: 'S256',
}).toString();
const badRedirectRes = await fetch(badRedirectUrl, { redirect: 'manual' });
const location = badRedirectRes.headers.get('location') ?? '';
check(
  'redirect_uri tak terdaftar ditolak',
  badRedirectRes.status === 400 || location.includes('error=invalid_request'),
  `HTTP ${badRedirectRes.status} ${location}`,
);

if (failures.length > 0) {
  console.error(`\n${failures.length} pemeriksaan gagal:`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log('\nSemua pemeriksaan kontrak OIDC lulus.\n');
