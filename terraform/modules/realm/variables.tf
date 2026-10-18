variable "realm_name" {
  description = "Nama realm Keycloak"
  type        = string
}

variable "realm_display_name" {
  description = "Nama tampilan realm"
  type        = string
}

variable "environment" {
  description = "Nama environment (dev/staging/prod)"
  type        = string
}

variable "keycloak_base_url" {
  description = "Base URL Keycloak untuk menghitung issuer dan endpoint OIDC"
  type        = string
}

variable "token_policy" {
  description = "Kebijakan token dari policies/token-policy.json (sumber kebenaran)"
  type = object({
    accessTokenLifespanSeconds       = number
    ssoSessionIdleTimeoutSeconds     = number
    ssoSessionMaxLifespanSeconds     = number
    offlineSessionIdleTimeoutSeconds = number
    refreshTokenMaxReuse             = number
    revokeRefreshToken               = bool
    allowedScopes                    = list(string)
    allowedAudiences                 = list(string)
    allowedEnvironments              = list(string)
    publicClientRequiresPkce         = bool
  })
}

variable "clients" {
  description = "Daftar client dari registry clients/*.json (sudah difilter per environment)"
  type = list(object({
    clientId                = string
    name                    = string
    description             = string
    owner                   = string
    type                    = string
    environments            = list(string)
    redirectUris            = optional(list(string), [])
    postLogoutRedirectUris  = optional(list(string), [])
    webOrigins              = optional(list(string), [])
    scopes                  = optional(list(string), [])
    audience                = optional(string)
    pkce                    = optional(string)
    allowedClockSkewSeconds = optional(number)
  }))
  default = []
}

variable "client_secrets" {
  description = "Secret client rahasia; disuntikkan dari secret manager saat deploy (TIDAK pernah disimpan di repo)"
  type        = map(string)
  default     = {}
  sensitive   = true
}
