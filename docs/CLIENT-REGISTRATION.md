# Registrasi Client (Mekanisme Resmi)

Registrasi client OIDC adalah proses **self-service berbasis Pull Request**.
Tim aplikasi tidak perlu menunggu pekerjaan manual tim platform.

## Langkah untuk tim aplikasi

1. **Buat file** `clients/<clientId>.json` (satu file = satu client). Contoh
   lengkap: [`clients/billing-api.json`](../clients/billing-api.json) (service)
   dan [`clients/web-dashboard.json`](../clients/web-dashboard.json) (SPA).
2. **Isi field wajib**: `clientId` (sama dengan nama file), `name`,
   `description`, `owner` (slug tim di `governance/teams.json`), `type`,
   `environments`.
3. **Ikuti aturan platform** (ditegakkan otomatis oleh CI):

   | Aturan | Detail |
   | --- | --- |
   | PKCE | `public-spa` & `mobile` wajib `"pkce": "S256"` |
   | Redirect URI | HTTPS; HTTP hanya untuk `localhost`/`127.0.0.1` saat `dev` |
   | Wildcard | Tidak boleh di redirect URI, post-logout, web origin |
   | Scope & audience | Terbatas pada daftar di `policies/token-policy.json` |
   | Service | Wajib `audience`; tidak boleh punya redirect URI/web origin |
   | Client uji | Prefix `test-` hanya boleh `environments: ["dev"]` |

4. **Buka Pull Request.** CI menjalankan: uji schema + kebijakan, `terraform
   fmt/validate`, dan **integration test** (realm ephemeral) yang membuktikan
   konfigurasi berhasil diterapkan dan kontrak OIDC terpenuhi.
5. **Review & merge.** Reviewer: Identity Platform Team. SLA review: 2 hari
   kerja. Setelah merge: apply otomatis ke `dev`; `staging`/`prod` melalui
   approval environment.

## Secret client

- Public client (SPA/mobile): **tidak ada secret** (PKCE).
- Confidential client (service/confidential-web): secret **tidak pernah**
  ditulis di repo. Platform menerbitkan secret saat deploy dengan
  `TF_VAR_client_secrets` (JSON `{"<clientId>": "<secret>"}`) dari secret
  manager. Tim aplikasi menerima secret melalui kanal aman (tidak melalui PR,
  chat publik, atau email biasa).
- Rotasi maksimal 90 hari (lihat `docs/TOKEN-POLICY.md`).

## Perubahan & penghapusan client

- Perubahan konfigurasi: PR baru terhadap file yang sama — riwayat lengkap
  tersedia di git.
- Penghapusan (offboarding): hapus file, merge; client dihapus dari realm saat
  apply. Sertakan bukti tidak ada konsumen aktif.

## Escalation

Jika alur self-service gagal karena keterbatasan platform, buka PR komentar +
ping `#identity-platform`. Tim platform akan memperbaiki alur (bukan mengambil
alih pekerjaan) — indikator kesehatan platform.
