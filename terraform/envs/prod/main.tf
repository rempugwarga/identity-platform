terraform {
  required_version = ">= 1.9.0"

  required_providers {
    keycloak = {
      source  = "keycloak/keycloak"
      version = "~> 5.10"
    }
  }
}

variable "environment" {
  description = "Nama environment"
  type        = string
  default     = "prod"
}

variable "keycloak_url" {
  description = "URL Keycloak; diisi dari secret environment (TF_VAR_keycloak_url)"
  type        = string
}

variable "keycloak_admin_username" {
  description = "Username admin Keycloak (master realm); dari secret environment"
  type        = string
}

variable "keycloak_admin_password" {
  description = "Password admin Keycloak (master realm); dari secret environment"
  type        = string
  sensitive   = true
}

variable "client_secrets" {
  description = "Map clientId -> secret untuk client rahasia; dari secret manager (TF_VAR_client_secrets)"
  type        = map(string)
  default     = {}
  sensitive   = true
}

provider "keycloak" {
  url       = var.keycloak_url
  client_id = "admin-cli"
  username  = var.keycloak_admin_username
  password  = var.keycloak_admin_password
}

locals {
  policy = jsondecode(file("${path.module}/../../../policies/token-policy.json"))

  all_clients = {
    for f in fileset("${path.module}/../../../clients", "*.json") :
    trimsuffix(f, ".json") => jsondecode(file("${path.module}/../../../clients/${f}"))
  }

  clients = [
    for name, c in local.all_clients : c
    if contains(c.environments, var.environment)
  ]
}

module "realm" {
  source = "../../modules/realm"

  realm_name         = "rempugwarga"
  realm_display_name = "rempugwarga (${var.environment})"
  environment        = var.environment
  keycloak_base_url  = var.keycloak_url

  token_policy   = local.policy
  clients        = local.clients
  client_secrets = var.client_secrets
}
