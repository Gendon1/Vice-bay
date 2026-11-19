#!/bin/bash
# Jalankan opencode dengan Coarena di folder GTA 6
set -e
export PATH=/home/hatch/.opencode/bin:$PATH
if [ -z "$COARENA_API_KEY" ]; then
  echo "COARENA_API_KEY belum diisi."
  echo "Isi dulu: export COARENA_API_KEY='key-kamu'"
  echo "Key dibuat di https://coarena.ai/account/api (gratis, tanpa kartu)"
  exit 1
fi
cd ~/workspace/makefun-gta6
exec opencode "$@"
