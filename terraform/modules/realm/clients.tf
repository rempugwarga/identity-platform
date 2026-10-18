locals {
  clients      = { for c in var.clients : c.clientId => c }
  public_types = ["public-spa", "mobile"]
  api_clients  = { for k, c in local.clients : k => c if c.audience != null }
}

resource "keycloak_openid_client" "client" {
  for_each = local.clients

  realm_id    = keycloak_realm.realm.id
  client_id   = each.value.clientId
  name        = each.value.name
  description = each.value.description
  enabled     = true

  access_type = contains(local.public_types, each.value.type) ? "PUBLIC" : "CONFIDENTIAL"

  standard_flow_enabled        = each.value.type != "service"
  direct_access_grants_enabled = false
  service_accounts_enabled     = each.value.type == "service"

  # Public client wajib PKCE S256 (kebijakan platform, ditegakkan juga oleh CI).
  pkce_code_challenge_method = contains(local.public_types, each.value.type) ? "S256" : null

  valid_redirect_uris             = each.value.redirectUris
  valid_post_logout_redirect_uris = each.value.postLogoutRedirectUris
  web_origins                     = each.value.webOrigins

  use_refresh_tokens = true

  client_secret = contains(local.public_types, each.value.type) ? null : try(var.client_secrets[each.key], null)

  lifecycle {
    precondition {
      condition     = !contains(local.public_types, each.value.type) || each.value.pkce == "S256"
      error_message = "Public client ${each.key} wajib memakai PKCE S256."
    }
    precondition {
      condition     = each.value.type != "service" || try(var.client_secrets[each.key], null) != null
      error_message = "Client service ${each.key} memerlukan secret melalui TF_VAR_client_secrets (secret manager)."
    }
  }
}

resource "keycloak_openid_client_scope" "api_scope" {
  for_each = local.api_clients

  realm_id               = keycloak_realm.realm.id
  name                   = each.value.audience
  description            = "Scope API untuk ${each.key} (audience: ${each.value.audience})"
  include_in_token_scope = true
}

resource "keycloak_openid_audience_protocol_mapper" "audience" {
  for_each = local.api_clients

  realm_id                 = keycloak_realm.realm.id
  client_scope_id          = keycloak_openid_client_scope.api_scope[each.key].id
  name                     = "audience-mapper"
  included_custom_audience = each.value.audience
}

resource "keycloak_openid_client_default_scopes" "client" {
  for_each = local.clients

  realm_id  = keycloak_realm.realm.id
  client_id = keycloak_openid_client.client[each.key].id

  default_scopes = distinct(concat(
    ["profile", "email", "roles", "web-origins", "acr"],
    each.value.audience != null ? [each.value.audience] : []
  ))
}
