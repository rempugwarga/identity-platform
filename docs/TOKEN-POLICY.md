# Kebijakan Token & Kredensial

Sumber kebenaran: [`policies/token-policy.json`](../policies/token-policy.json).
Nilai dikonsumsi Terraform (`terraform/envs/*`) dan diuji batas keamanannya oleh
`tests/token-policy.test.ts` pada setiap PR — tidak ada perubahan kebijakan yang
bisa masuk tanpa melewati pengujian.

## Parameter token

| Parameter | Nilai saat ini | Batas uji (tidak boleh dilanggar) | Alasan |
| --- | --- | --- | --- |
| Access token lifespan | 300 dtk (5 mnt) | 60–900 dtk | Membatasi jendela penyalahgunaan token bocor; refresh menangani sesi panjang |
| SSO session idle timeout | 1800 dtk (30 mnt) | 300–3600 dtk | Pengguna pasif dipaksa re-autentikasi |
| SSO session max lifespan | 36000 dtk (10 jam) | ≤ 86400 dtk | Rotasi sesi harian |
| Offline session idle timeout | 1800 dtk | ≤ SSO idle | Konsistensi dengan sesi interaktif |
| Refresh token reuse | 0 (rotasi, reuse dilarang) | wajib 0 | Deteksi token bocor |
| Revoke refresh token | true | wajib true | Refresh token lama langsung mati setelah dipakai |
| PKCE public client | wajib S256 | wajib | Mencegah interception code pada SPA/mobile |

## Aturan turunan

- **Scope terbatas**: hanya scope di `allowedScopes`. Penambahan scope baru
  memerlukan PR ke `policies/token-policy.json` (review Identity Platform Team).
- **Audience eksplisit**: setiap API punya audience sendiri via audience mapper;
  token tanpa audience yang benar ditolak oleh resource server.
- **MFA (TOTP)**: kebijakan OTP realm aktif (6 digit, window 1, periode 30 dtk).
  Aplikasi dapat meminta langkah autentikasi lebih tinggi melalui parameter
  `acr`/`claims` bila diperlukan.
- **Jangan menyimpan token di localStorage** untuk aplikasi baru; gunakan
  `oidc-client-ts` (in-memory / session storage) atau BFF. Template aplikasi
  menunjukkan pola yang direkomendasikan.

## Rotasi & masa hidup kredensial

| Kredensial | Maksimum | Mekanisme rotasi |
| --- | --- | --- |
| Client secret | 90 hari | Regenerasi via secret manager → `TF_VAR_client_secrets` → apply |
| Admin console (master) | 90 hari / break-glass | Lihat `docs/ADMIN-ACCESS.md` |
| Service account token | otomatis (5 menit) | Client credentials + refresh otomatis |

## Konsekuensi pada aplikasi

- Access token kedaluwarsa dalam 5 menit → implementasikan refresh otomatis
  (template aplikasi sudah menyediakan).
- Refresh token berotasi → simpan token terbaru; reuse = sesi dicabut.
- Clock skew yang diizinkan 30 detik; selaraskan waktu server aplikasi (NTP).
