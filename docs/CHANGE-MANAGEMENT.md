# Manajemen Perubahan IAM

Setiap perubahan konfigurasi IAM (realm, client, kebijakan token) melewati
gerbang pengujian berlapis sebelum mencapai environment nyata.

## Alur lengkap

```
1. PR ke identity-platform
   ├─ Policy tests        : schema client, batas kebijakan token, owner tim
   ├─ Terraform checks    : fmt, validate, tflint, trivy (IaC)
   └─ Integration test    : Keycloak ephemeral + apply + verifikasi kontrak OIDC
2. Merge ke main
   ├─ Apply otomatis ke dev (environment iam-dev)
   └─ Staging/Prod: workflow_dispatch → environment approval (required reviewers)
3. Verifikasi pasca-apply
   └─ Output oidc_endpoints ditampilkan; tim aplikasi smoke-test integrasi
4. Drift detection (mingguan)
   └─ plan -detailed-exitcode pada staging & prod → issue otomatis bila drift
```

## Gerbang per environment

| Environment | Gerbang | Approver |
| --- | --- | --- |
| dev | Otomatis setelah CI hijau | — |
| staging | GitHub Environment `iam-staging` (required reviewers) | Identity Platform |
| prod | GitHub Environment `iam-prod` (required reviewers) | Identity Platform + EM |

## Rollback

1. `git revert` PR penyebab → pipeline menjalankan ulang semua gerbang.
2. Apply ulang ke environment terdampak (staging/prod via approval).
3. Untuk kasus darurat: prosedur break-glass (`docs/ADMIN-ACCESS.md`), lalu
   rekonsiliasi kode segera agar drift tidak berlanjut.

## Versi kontrak kebijakan token

`policies/token-policy.json` memuat `version` (semver) dan `effectiveDate`.
Aturan: setiap perubahan nilai kebijakan → **naikkan versi** (patch untuk
klarifikasi/komentar, minor untuk nilai baru, major untuk perubahan yang
memaksa perubahan perilaku konsumen) dan perbarui `effectiveDate`. Versi
ditampilkan di `platform-docs/docs/identity/token-policies.md`; konsumen dapat
mengaitkan perilaku token dengan versi kontrak.

## Yang menjamin "diuji sebelum diterapkan"

1. Integration test menerapkan konfigurasi ke **realm ephemeral nyata** dan
   memverifikasi: issuer, umur access token, audience token, PKCE wajib,
   penolakan redirect URI tak terdaftar.
2. Apply workflow menjalankan **policy tests sebagai gerbang terakhir** sebelum
   `terraform apply`.
3. `terraform plan` untuk staging/prod dijalankan pada environment ber-approval;
   approver melihat rencana sebelum menyetujui.
