#!/usr/bin/env python3
"""Launch a recorded opencode build for gta6-01.

Fetches the Coarena surrogate from authd, sets PATH and
COARENA_API_KEY for the child process only, then execs the make.fun
record command which wraps one opencode run. The real key never
appears in a file, log, or chat.
Usage: python3 record-build.py "<prompt>"
The prompt is passed as a single argument to opencode run.
"""
import os
import sys

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import dynamic_credential_entry

if len(sys.argv) < 2:
    print("usage: record-build.py \"<opencode prompt>\"", file=sys.stderr)
    sys.exit(2)

prompt = sys.argv[1]
os.environ["PATH"] = "/home/hatch/.opencode/bin:" + os.environ.get("PATH", "")
entry = dynamic_credential_entry("custom.coarena", "access_token")
os.environ["COARENA_API_KEY"] = entry["surrogate"]
os.chdir("/home/hatch/workspace/makefun-gta6/kit/gta6-01-kit")
cmd = [
    "node", "cli/makefun.mjs", "record",
    "--competition", "gta6-01",
    "--source", "/home/hatch/workspace/makefun-gta6",
    "--", "opencode", "run", "--pure",
    "-m", "coarena/gpt-6-luna",
    prompt,
]
os.execvp("node", cmd)
