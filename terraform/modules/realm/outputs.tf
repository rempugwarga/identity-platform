output "realm_name" {
  value = keycloak_realm.realm.realm
}

output "realm_id" {
  value = keycloak_realm.realm.id
}

output "issuer" {
  value = "${var.keycloak_base_url}/realms/${keycloak_realm.realm.realm}"
}

output "oidc_endpoints" {
  description = "Endpoint OIDC efektif untuk environment ini (sumber kebenaran dokumentasi platform-docs)"
  value = {
    discovery     = "${var.keycloak_base_url}/realms/${keycloak_realm.realm.realm}/.well-known/openid-configuration"
    authorization = "${var.keycloak_base_url}/realms/${keycloak_realm.realm.realm}/protocol/openid-connect/auth"
    token         = "${var.keycloak_base_url}/realms/${keycloak_realm.realm.realm}/protocol/openid-connect/token"
    userinfo      = "${var.keycloak_base_url}/realms/${keycloak_realm.realm.realm}/protocol/openid-connect/userinfo"
    jwks          = "${var.keycloak_base_url}/realms/${keycloak_realm.realm.realm}/protocol/openid-connect/certs"
    logout        = "${var.keycloak_base_url}/realms/${keycloak_realm.realm.realm}/protocol/openid-connect/logout"
  }
}

output "client_ids" {
  value = sort(keys(local.clients))
}

output "effective_token_policy" {
  value = var.token_policy
}
