#!/usr/bin/env python3
import os, sys, pathlib
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import dynamic_credential_entry
prompt = pathlib.Path("/home/hatch/workspace/makefun-gta6/PROMPT-V1.txt").read_text()
os.environ["PATH"] = "/home/hatch/.opencode/bin:" + os.environ.get("PATH", "")
entry = dynamic_credential_entry("custom.coarena", "access_token")
os.environ["COARENA_API_KEY"] = entry["surrogate"]
os.chdir("/home/hatch/workspace/makefun-gta6")
os.execvp("opencode", ["opencode", "run", "--pure", "--format", "json", "-m", "coarena/gpt-6-luna", prompt])
