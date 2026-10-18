# Staging/prod WAJIB memakai remote backend (enkripsi + locking). Contoh:
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
#
# Selama backend belum diaktifkan, terraform init akan memakai local state —
# jangan pernah menerapkan ini untuk produksi (state berisi client secret).
