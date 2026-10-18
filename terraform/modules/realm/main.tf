resource "keycloak_realm" "realm" {
  realm        = var.realm_name
  enabled      = true
  display_name = var.realm_display_name

  # Kebijakan token — nilai bersumber dari policies/token-policy.json dan diuji CI.
  access_token_lifespan        = "${var.token_policy.accessTokenLifespanSeconds}s"
  sso_session_idle_timeout     = "${var.token_policy.ssoSessionIdleTimeoutSeconds}s"
  sso_session_max_lifespan     = "${var.token_policy.ssoSessionMaxLifespanSeconds}s"
  offline_session_idle_timeout = "${var.token_policy.offlineSessionIdleTimeoutSeconds}s"
  refresh_token_max_reuse      = var.token_policy.refreshTokenMaxReuse
  revoke_refresh_token         = var.token_policy.revokeRefreshToken

  # Pengerasan dasar realm
  ssl_required             = "external"
  registration_allowed     = false
  remember_me              = false
  login_with_email_allowed = true
  reset_password_allowed   = true

  password_policy = "length(12) and upperCase(1) and lowerCase(1) and digits(1) and notUsername and notEmail and passwordHistory(5)"

  security_defenses {
    brute_force_detection {
      permanent_lockout                = false
      max_login_failures               = 5
      wait_increment_seconds           = 60
      quick_login_check_milli_seconds  = 1000
      max_failure_wait_seconds         = 900
      minimum_quick_login_wait_seconds = 60
    }
  }

  otp_policy {
    algorithm         = "HmacSHA1"
    digits            = 6
    look_ahead_window = 1
    period            = 30
    type              = "totp"
  }

  # Metadata environment (mempermudah audit lintas environment di Admin Console).
  attributes = {
    environment = var.environment
  }

  # Audit trail (dasar review akses kuartalan): sejak Keycloak 26, event user
  # dan admin selalu dicatat. Provider keycloak v5 menghapus switch
  # events_enabled/events_expiration/admin_events_* — retensi & listener diatur
  # di level realm Keycloak, bukan lagi lewat Terraform.
}
