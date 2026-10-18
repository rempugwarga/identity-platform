# identity-platform

Platform identitas organisasi **rempugwarga**: Keycloak sebagai kode (Terraform),
registrasi client self-service, kebijakan token, dan pengujian konfigurasi IAM
sebelum diterapkan.

> **Pemilik (owner):** Identity Platform Team (`@rempugwarga/identity-platform`)
> **Kontak:** `#identity-platform` · **Mode interaksi:** X-as-a-Service
> (kolaborasi time-boxed untuk onboarding — lihat panduan di portal platform)

## Prinsip

1. **Config as code.** Realm, client, role, dan kebijakan token didefinisikan di
   repository ini. Tidak ada perubahan manual di Admin Console untuk hal yang
   sudah dikelola kode (perubahan manual akan terdeteksi sebagai drift).
2. **Diuji sebelum diterapkan.** Setiap PR menjalankan uji kebijakan + apply ke
   realm ephemeral (container Keycloak) lalu verifikasi kontrak OIDC.
3. **Tanpa secret di repository.** Secret client & admin disuntikkan dari secret
   manager (GitHub Environment) saat deploy; `*.tfvars` dilarang masuk repo.
4. **Self-service.** Tim aplikasi mendaftarkan client lewat PR ke `clients/`
   tanpa menunggu pekerjaan manual tim platform.

## Struktur

```
clients/                     Registry client (satu file = satu client) + schema
policies/token-policy.json   Sumber kebenaran kebijakan token (dibaca Terraform & diuji CI)
governance/teams.json        Registry tim pemilik client
terraform/modules/realm/     Modul realm & client (provider keycloak/keycloak)
terraform/envs/{dev,staging,prod}/  Root module per environment (state terpisah)
tests/                       Uji kebijakan (rstest) + verifikasi kontrak OIDC
scripts/                     Validasi terraform & integration test ephemeral
docs/                        Dokumen perubahan, kebijakan token, akses admin
```

## Alur perubahan (ringkas)

```
PR (client/realm/policy) ──► CI: policy tests + terraform validate +
                             integration test realm ephemeral
   │ merge ke main
   ▼
apply dev otomatis ──► staging (approval environment) ──► prod (approval environment)
```

Detail: [docs/CHANGE-MANAGEMENT.md](docs/CHANGE-MANAGEMENT.md).

## Menjalankan lokal

Prasyarat: Terraform ≥ 1.9, Docker, Bun, Node ≥ 20.

```sh
bun install
bun run test                     # uji kebijakan (tanpa Docker)
bash scripts/validate-terraform.sh
bash scripts/integration-test.sh # realm ephemeral + verifikasi OIDC (butuh Docker)
```

## Dokumentasi

| Dokumen | Isi |
| --- | --- |
| [docs/CLIENT-REGISTRATION.md](docs/CLIENT-REGISTRATION.md) | Mekanisme registrasi client self-service |
| [docs/TOKEN-POLICY.md](docs/TOKEN-POLICY.md) | Kebijakan token & rotasi secret |
| [docs/ADMIN-ACCESS.md](docs/ADMIN-ACCESS.md) | Akses Admin Console berbasis kebutuhan |
| [docs/CHANGE-MANAGEMENT.md](docs/CHANGE-MANAGEMENT.md) | Alur uji → apply → rollback |

Portal integrasi untuk tim aplikasi (OIDC, URL environment, contoh kode):
**platform-docs**. Kontrak integrasi juga dirujuk dari
[design-system docs](../design-system/docs/INTEGRATION.md) untuk konsumsi UI.
