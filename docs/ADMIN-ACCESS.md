# Akses Admin Console (Berbasis Kebutuhan)

Prinsip: **akses minimum, disetujui, teraudit**. Admin Console Keycloak adalah
permukaan risiko tinggi — akses diberikan hanya bila ada kebutuhan operasional
yang tidak dapat dipenuhi melalui pipeline `identity-platform`.

## Model akses

| Peran | Kemampuan | Cara mendapatkannya | Jumlah pemegang |
| --- | --- | --- | --- |
| Operasi normal (default) | Semua perubahan realm/client melalui PR → pipeline | Tidak butuh Admin Console | Semua tim |
| Realm auditor (`auditors`) | Baca event/sesi/konfigurasi realm | Role realm `realm-auditor` via group `auditors` (di kode) | Security & Identity Platform |
| Platform admin (`platform-admins`) | Operasional realm terbatas via role `platform-admin` | Group `platform-admins` (di kode) | Anggota Identity Platform |
| Break-glass (master realm) | Akses penuh Admin Console | Prosedur di bawah; akun di-master realm | Maksimal 2 orang, tercatat |

## Prosedur akses Admin Console (master realm)

1. Ajukan permintaan (tiket) berisi: alasan, perkiraan durasi, resource target.
2. Persetujuan: Identity Platform Team + Engineering Manager.
3. Akun dibuat di master realm dengan role **sesempit mungkin** dari client
   `realm-management` (mis. `view-realm`, `manage-clients`) — bukan `admin`.
4. **MFA (TOTP) wajib** untuk semua akun admin.
5. Akses dicabut otomatis setelah window berakhir (atau maksimal 7 hari).

## Break-glass (keadaan darurat)

- Digunakan hanya bila pipeline/Keycloak bermasalah dan layanan terhenti.
- Dua orang harus hadir (four-eyes); seluruh tindakan dicatat di tiket insiden.
- Setelah insiden: audit events direview, perubahan manual direkonsiliasi ke
  kode (**drift detection** nightly akan menandai bila terlewat).

## Audit & review

- Realm mencatat semua admin events (bawaan Keycloak 26; retensi diatur di
  level realm, bukan lagi lewat Terraform) — ekspor mingguan ke sistem log
  organisasi.
- Review akses kuartalan: daftar pemegang akses admin dibandingkan dengan
  kebutuhan; akses yang tidak lagi perlu dicabut.
- Review **dijadwalkan otomatis** oleh workflow `admin-access-review.yml`
  (awal setiap kuartal) yang membuka issue berisi checklist; issue ditutup
  setelah checklist selesai. Tidak ada review yang terlewat tanpa jejak.

## Yang dilarang

- Akun admin bersama (shared credential).
- Memberi role `admin` penuh untuk pekerjaan rutin.
- Perubahan konfigurasi permanen melalui Admin Console tanpa PR (akan muncul
  sebagai drift dan memicu issue otomatis).
