# Pull Request — Perubahan IAM / Identity Platform

## Ringkasan

<!-- Perubahan konfigurasi apa dan mengapa? Sertakan tautan tiket/jawaban konsultasi bila ada. -->

## Jenis perubahan

- [ ] Registrasi/ubah client (`clients/*.json`)
- [ ] Kebijakan token (`policies/token-policy.json`)
- [ ] Perubahan realm/modul Terraform (`terraform/`)
- [ ] Pipeline/keamanan (`.github/`, `scripts/`)

## Checklist wajib (perubahan IAM)

- [ ] `bun run test` lulus (schema + kebijakan client + batas kebijakan token)
- [ ] `bash scripts/validate-terraform.sh` lulus lokal
- [ ] Integration test (realm ephemeral) lulus di CI
- [ ] Tidak ada secret/kredensial baru di repository (secret via secret manager/GitHub Environment)
- [ ] `owner` client valid dan tim terkait sudah diberi tahu
- [ ] Dampak ke staging/prod dijelaskan (window, approval, rollback = revert PR)
- [ ] Dokumentasi terkait diperbarui (`docs/`, dan `platform-docs` bila kontrak berubah)
