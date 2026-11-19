#!/bin/bash
# Launcher for a recorded opencode build.
# Usage: ./record-build.sh "<prompt for opencode>"
# Fetches Coarena surrogate, sets PATH + COARENA_API_KEY, then runs makefun record
# wrapping opencode run. Do NOT use --dir (hangs in this project).
# Use absolute paths in the prompt.
# CRITICAL: opencode run hangs at init when stdin is an open pipe (verified 19 Nov 2026:
# 8 hangs, zero LLM calls). It proceeds in seconds when stdin is /dev/null (EOF).
# The < /dev/null below applies to record, and the wrapped opencode inherits it.
set -e
PROMPT="$1"
cd ~/workspace/makefun-gta6/kit/gta6-01-kit
python3 - << 'PY' > /tmp/record-env.sh
import os, sys
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import dynamic_credential_entry
entry = dynamic_credential_entry("custom.coarena", "access_token")
print(f"export COARENA_API_KEY='{entry['surrogate']}'")
print("export PATH=/home/hatch/.opencode/bin:$PATH")
PY
source /tmp/record-env.sh
rm -f /tmp/record-env.sh
exec node cli/makefun.mjs record --competition gta6-01 --source /home/hatch/workspace/makefun-gta6 -- opencode run --pure -m coarena/gpt-6-luna "$PROMPT" < /dev/null
