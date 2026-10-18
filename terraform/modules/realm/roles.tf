# Peran realm untuk model akses berbasis kebutuhan (lihat docs/ADMIN-ACCESS.md).
resource "keycloak_role" "platform_admin" {
  realm_id    = keycloak_realm.realm.id
  name        = "platform-admin"
  description = "Operasional realm: mengelola client, role, dan konfigurasi via pipeline. BUKAN akses default ke Admin Console."
}

resource "keycloak_role" "realm_auditor" {
  realm_id    = keycloak_realm.realm.id
  name        = "realm-auditor"
  description = "Baca-saja untuk audit: melihat event, sesi, dan konfigurasi realm."
}

resource "keycloak_group" "platform_admins" {
  realm_id = keycloak_realm.realm.id
  name     = "platform-admins"
}

resource "keycloak_group" "auditors" {
  realm_id = keycloak_realm.realm.id
  name     = "auditors"
}

resource "keycloak_group_roles" "platform_admins" {
  realm_id = keycloak_realm.realm.id
  group_id = keycloak_group.platform_admins.id

  role_ids = [
    keycloak_role.platform_admin.id,
  ]
}

resource "keycloak_group_roles" "auditors" {
  realm_id = keycloak_realm.realm.id
  group_id = keycloak_group.auditors.id

  role_ids = [
    keycloak_role.realm_auditor.id,
  ]
}
