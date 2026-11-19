# Setup opencode + Coarena gratis — GTA 6 bounty (make.fun)

Vice Bay v1.3 status: version, control hints, staged-scene notes, and city colors polished.

Diperiksa dan DITES 19 Nov 2026, 16:29 WIB. Koreksi penting di bawah.

## Hasil test — Coarena sudah terhubung

- Coarena terhubung, credential tersimpan di Secure Vault sebagai `custom.coarena`.
- Test API langsung berhasil:
  - `list-models` — 20 model aktif
  - `chat` dengan `gpt-6-luna` — jawab `Hi!`, cost 0
  - `chat` dengan `gemini-3-8-flash` — 200 OK
  - `chat` dengan `deepseek-v4-1-flash-1017` — 200 OK, tapi jawabannya
    ditulis model `gpt-6-luna`, jadi Coarena ganti ke model yang lebih murah.
- Test opencode berhasil:
  - `opencode run --pure -m coarena/gpt-6-luna "Say hi..."`
    di `~/workspace/makefun-gta6` jawab `Hi there!`,
    total token 5416, cost 0, selesai sekitar 11 detik.
  - `opencode models coarena` menampilkan 3 model gratis di bawah.

## KOREKSI: model gratisnya BUKAN Claude

Awalnya saya kira Claude Fable 5.2 gratis. Ternyata setelah dites,
Claude Fable 5.2 dan Claude Haiku 5.5 jawab 402:

> "Claude Fable 5.2 is not part of the free tier. Free accounts can use
> GPT-6 Luna, Gemini 3.8 Flash and DeepSeek V4.1 Flash 1017."

Jadi model gratis yang benar, per 19 Nov 2026:
- `gpt-6-luna` — default, paling aman
- `gemini-3-8-flash`
- `deepseek-v4-1-flash-1017` — bisa diganti ke GPT-6 Luna oleh Coarena

Config sudah saya perbaiki ke 3 model itu saja. Jangan pakai Claude
di opencode kalau tidak mau kena 402, kecuali kamu sudah top-up kredit.

## KOREKSI: jatahnya $1/hari, bukan $5/hari

`GET /api/v1/limits` di akun ini menunjukkan:
- plan free, `usd_per_day` 1, `left_usd` 0.998414 saat dites,
  requests 7, 10 request/menit per key, 2 panggilan bersamaan.
- Reset harian 00:00 UTC (07:00 WIB).

Saat saya ngetes endpoint limits, saya tidak sengaja membuat
permintaan naik limit ke $5/hari (POST /api/v1/limits/requests).
ID-nya `lrq_oGRekCADNBSnV43ISN7OsZY2`, status pending.
Coarena akan review dan email akun kalau disetujui. Ini bukan tagihan,
dan tidak mengubah apa-apa sampai disetujui. Kalau tidak mau, abaikan saja,
jatah tetap $1/hari.

## Setup yang sudah jadi

- opencode 1.19.6 terinstall di VM ini: `/home/hatch/.opencode/bin/opencode`
- Config:
  - Global: `~/.config/opencode/opencode.json`
  - Project: `~/workspace/makefun-gta6/opencode.json` (salinan sama)
  - Provider: `coarena`, npm `@ai-sdk/openai-compatible`
  - Base URL OpenAI: `https://coarena.ai/api/v1`
  - API key dari env: `{env:COARENA_API_KEY}`
  - Model default: `coarena/gpt-6-luna`
- Connector doc: `~/workspace/custom-connectors/custom.coarena/CONNECTOR.md`
- Helper test API:
  `~/workspace/custom-connectors/custom.coarena/bin/coarena.py`
  - `python3 coarena.py list-models`
  - `python3 coarena.py limits`
  - `python3 coarena.py chat --model gpt-6-luna --message "hi" --max-tokens 16`
- Wrapper opencode dengan key dari vault (tanpa key terlihat di log):
  `~/workspace/custom-connectors/custom.coarena/bin/run-opencode.py`
  - `python3 run-opencode.py run --pure -m coarena/gpt-6-luna "pesan kamu"`

## Cara pakai opencode sekarang

Di VM ini, pakai wrapper di atas, jangan export key manual:

```bash
python3 ~/workspace/custom-connectors/custom.coarena/bin/run-opencode.py run --pure -m coarena/gpt-6-luna "Buatkan rencana dulu, jangan langsung nulis kode"
```

Atau masuk ke TUI (interaktif, butuh terminal):
```bash
python3 ~/workspace/custom-connectors/custom.coarena/bin/run-opencode.py
```

Di dalam opencode:
- `/models` lalu pilih `coarena/gpt-6-luna`
- Kalau model jawab 402, ganti ke salah satu dari 3 model gratis di atas.

## Opencode — jangan pakai --dir, pakai path absolut

Dites 19 Nov 2026, 17:00 WIB:
- `opencode run --dir ~/workspace/makefun-gta6` hang di init, 60 detik dan 90 detik, tidak ada session.
- Tanpa `--dir`, prompt "Hi" jawab dalam 5 detik, dan edit file pakai tool jalan dalam 10 detik.
- Tanpa `--dir`, session dibuat di `/home/hatch`, jadi model mengira folder kerja adalah home.
  Selalu tulis path absolut di prompt, contoh
  `/home/hatch/workspace/makefun-gta6/game/src/world.js`,
  jangan path relatif seperti `game/src/world.js`.
- Jangan jalankan opencode berurutan terlalu cepat. Satu run dengan tool
  bisa 3-4 panggilan LLM, limitnya 10 request/menit. Tunggu minimal 60 detik antar run.
- PENTING: opencode hang di init kalau stdin-nya pipe terbuka. Selalu jalankan
  dengan stdin dari /dev/null, contoh:
  `python3 run-opencode.py run --pure -m coarena/gpt-6-luna "..." < /dev/null`
  Dites 19 Nov 2026: 8 kali hang tanpa satu pun panggilan LLM, lalu jalan 5-9 detik
  begitu stdin dari /dev/null. `record-build.sh` sudah diperbaiki dengan cara ini.
- Jatah Coarena setelah tes ini: tersisa $0,976 dari $1, dipakai $0,023, 20 request.
  Masih cukup, tapi jangan boros.

## Playwright MCP — sengaja dimatikan dulu

Config awal saya sertakan Playwright MCP, tapi itu bikin opencode
hang saat startup di VM ini karena npx download MCP server.
Config yang jalan sekarang TIDAK pakai MCP.

Buat bounty GTA 6, Playwright MCP itu prerequisite di requirements,
jadi nanti perlu diaktifkan setelah browser terinstall. Template-nya ada di:
`opencode-with-playwright.json.example`
Jangan timpa `opencode.json` dengan file itu sebelum `npx playwright install chromium` selesai.

## Bounty GTA 6 — yang harus dibangun

- Bounty: Make GTA 6, $1.666 USDC, 100 tempat berbayar (1st $500),
  deadline Selasa 24 Nov 2026 22:00 WIB.
- Repo starter sudah disalin ke folder ini dari kit:
  `kit/gta6-01-kit/starter/` -> root folder ini.
- Tugas: game open-world crime selengkap mungkin, kota jalan kaki
  dan naik mobil, traffic, pejalan kaki, curi mobil, wanted level +
  polisi, misi + cerita, combat, HUD + minimap, start screen + save.
- Entrypoint grader: `main.ts` di root repo. Jangan ubah `vendor/makefun-game.ts`.
- Screenshot: 3-4 file, masing-masing max 256 KiB, pertama jadi cover.

## Recording — SUDAH ADA (19 Nov 2026, 17:47 WIB)

- Recording id: `01a1f35c-6f2e-7251-b0db-66a3bd5b8dab`, sealed, 51 dari 51 record
  opencode ter-witness. Detail lengkap di RECORDING.md.
- Yang diubah session yang direkam: world.js + render.js (police damage 8->3,
  spawn delay 12 detik di wanted 1-2, police 390 < mobil pemain 430, gedung dan
  atap warna-warni, 36 pohon, +8 mobil parkir). Smoke test 11/11 lolos,
  health setelah 20 detik kejar-kejaran polisi 79 (dulu ~44).
- Masih kurang sebelum submit: session yang direkam cuma menyentuh 2 file.
  Butuh satu session rekaman lagi yang menyentuh file-file lain + render ulang
  screenshot, baru buat repo GitHub dan submit sebelum 24 Nov 22:00 WIB.

## Alur record + submit make.fun (PENTING)

opencode termasuk harness yang direkam. Jangan build tanpa record.

Dari dalam folder kit, sebelum agent mulai nulis kode:
```bash
cd ~/workspace/makefun-gta6/kit/gta6-01-kit
node cli/makefun.mjs record --competition gta6-01 --source -- opencode
# lalu di session opencode yang direkam itu, bangun gamenya
# setelah selesai, di shell yang sama:
node cli/makefun.mjs record --finish
```

Jangan pakai opencode `revert` saat recording, itu merusak seal.

Setelah itu: buat repo GitHub publik, LICENSE MIT, grade lokal,
lalu submit dengan `node cli/makefun.mjs submit ... --keypair <wallet.json>`.
Wallet Solana baru (mode 600) harus sudah dibuat dan didaftarkan.
Klaim hadiah butuh sekitar 0,0025 SOL untuk fee/rent.
Kuota: max 5 entry per hari, max 10 total per akun untuk bounty ini.

## Hemat token — jatah cuma $1/hari

- Input token opencode besar (sekitar 5.400 token cuma untuk "Hi"),
  karena system prompt + context project. Jangan boros.
- Minta perubahan kecil, per file, dan suruh baca dulu file yang ada.
- Kalau jatah habis, tunggu reset 07:00 WIB atau pakai OpenRouter `:free`
  sebagai cadangan.
