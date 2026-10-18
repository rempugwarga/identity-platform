output "issuer" {
  value = module.realm.issuer
}

output "oidc_endpoints" {
  value = module.realm.oidc_endpoints
}

output "client_ids" {
  value = module.realm.client_ids
}

output "effective_token_policy" {
  value = module.realm.effective_token_policy
}
