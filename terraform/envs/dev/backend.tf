# State dev memakai local state (ephemeral, hanya untuk pengembangan/CI).
# State TIDAK boleh di-commit (lihat .gitignore: *.tfstate*).
terraform {
  backend "local" {}
}

# Untuk staging/prod, aktifkan remote backend dengan enkripsi + locking, contoh:
#
# terraform {
#   backend "s3" {
#     bucket         = "rempugwarga-tfstate"
#     key            = "identity-platform/staging/terraform.tfstate"
#     region         = "ap-southeast-1"
#     dynamodb_table = "rempugwarga-tfstate-lock"
#     encrypt        = true
#   }
# }
