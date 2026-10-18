# Registrasi Client (self-service)

Folder ini adalah **mekanisme registrasi client**: satu file JSON = satu client OIDC.

## Alur (tanpa menunggu bantuan manual)

1. Buat file client dengan generator (disarankan — langsung lolos kebijakan):

   ```sh
   bun run new-client --id my-app --name "My App" --owner team-billing \
     --type public-spa --base-url https://my-app.rempugwarga.example
   ```

   Atau salin file contoh (`billing-api.json` / `web-dashboard.json`) dan ganti
   nama file sesuai `clientId`.
2. Isi sesuai [schema/client.schema.json](schema/client.schema.json). Aturan yang
   akan ditegakkan CI:
   - `owner` harus salah satu tim di [`../governance/teams.json`](../governance/teams.json)
   - public client wajib PKCE `S256`; redirect URI wajib HTTPS (kecuali `localhost`)
   - tanpa wildcard pada redirect URI / web origin
   - scope & audience terbatas pada daftar di [`../policies/token-policy.json`](../policies/token-policy.json)
3. Buka Pull Request. CI otomatis menjalankan tes kebijakan + `terraform plan`
   terhadap realm ephemeral; reviewer adalah **Identity Platform Team**.
4. Setelah merge: perubahan diterapkan otomatis ke `dev`; `staging`/`prod`
   melalui approval environment (lihat `docs/CHANGE-MANAGEMENT.md`).

## Client secret

Secret **tidak pernah** ditulis di file ini. Untuk client rahasia, secret
disuntikkan saat deploy dari secret manager (GitHub Environment) dengan nama
`TF_VAR_client_secrets` (JSON `{"<clientId>": "<secret>"}`). Rotasi maksimal
90 hari, dicatat di `docs/TOKEN-POLICY.md`.
