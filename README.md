# WA Bio Checker (Railway-ready)

Cara pakai:
1. Buat repo GitHub dan upload seluruh folder `bot-railway`.
2. Atau upload zip ke Railway (Deploy from GitHub / Upload).
3. Di Railway set Environment Variables:
   - TELEGRAM_TOKEN
   - ADMIN_ID
4. Deploy. Buka logs untuk melihat proses.
5. Di Telegram chat dengan bot: kirim `/start` atau `/check 628123...`
6. Scan QR yang dikirim bot ke Telegram, lalu bot akan mengirim 'WhatsApp connected'.

Catatan:
- Railway container harus menjalankan Chromium untuk puppeteer. Jika build gagal, pilih template yang menyediakan Chromium atau gunakan buildpack yang menginstal chromium.
