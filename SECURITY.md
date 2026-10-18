# Kebijakan Keamanan — Identity Platform

## Pelaporan

Jangan buka issue publik untuk kerentanan. Hubungi Identity Platform Team
(`#identity-platform`) atau buat Security Advisory di repository ini.
Respons awal maksimal 1 hari kerja (realm production: segera).

## Praktik wajib

1. **Secret tidak pernah ada di repository.**
   - Pemindaian: `gitleaks` pada setiap PR/push + GitHub push protection.
   - Injeksi saat deploy: GitHub Environment (`iam-dev`, `iam-staging`,
     `iam-prod`) → variabel `TF_VAR_*`. Nama yang dipakai:
     `KC_URL`, `KC_ADMIN_USERNAME`, `KC_ADMIN_PASSWORD`, `CLIENT_SECRETS_JSON`.
2. **State Terraform berisi client secret.**
   - `*.tfstate*` dilarang di-commit (lihat `.gitignore`).
   - Production wajib remote backend terenkripsi + locking (lihat `backend.tf`).
3. **Scanning konfigurasi.** `trivy config` (IaC) + `tflint` + CodeQL-like policy
   tests berjalan di CI; temuan HIGH/CRITICAL memblokir merge.
4. **Audit.** Realm mencatat seluruh admin & user event
   (`admin_events_enabled`) — dasar review akses kuartalan.
5. **Rotasi.** Secret client maksimal 90 hari; kredensial admin mengikuti
   kebijakan break-glass di [docs/ADMIN-ACCESS.md](docs/ADMIN-ACCESS.md).
