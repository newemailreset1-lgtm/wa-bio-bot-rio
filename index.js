require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const TelegramBot = require('node-telegram-bot-api');
const qrcode = require('qrcode');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

if (!TELEGRAM_TOKEN || !ADMIN_ID) {
  console.error('Please set TELEGRAM_TOKEN and ADMIN_ID in environment (or .env).');
  process.exit(1);
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
let waReady = false;
let lastQR = null;

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'wa-bio-railway' }),
  puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] }
});

client.on('qr', async (qr) => {
  try {
    lastQR = qr;
    console.log('QR received, sending to Telegram...');
    const img = await qrcode.toBuffer(qr, { type: 'png' });
    await bot.sendPhoto(ADMIN_ID, img, { caption: '📷 Scan QR ini untuk login WhatsApp (jangan bagikan).' });
  } catch (e) {
    console.error('Failed to send QR to telegram:', e);
  }
});

client.on('ready', async () => {
  waReady = true;
  console.log('WhatsApp client is ready.');
  await bot.sendMessage(ADMIN_ID, '✅ WhatsApp berhasil terhubung!');
});

client.on('auth_failure', (msg) => {
  console.error('Auth failure:', msg);
  bot.sendMessage(ADMIN_ID, '❌ WhatsApp auth failure: ' + msg);
});

client.on('disconnected', (reason) => {
  waReady = false;
  console.log('WhatsApp disconnected:', reason);
  bot.sendMessage(ADMIN_ID, '⚠️ WhatsApp terputus: ' + reason);
});

client.initialize();

// Telegram commands
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Halo! Kirim /check <nomor> (contoh: /check 6281234567890) untuk cek bio. Jika belum login WhatsApp, kirim /getqr untuk menerima QR.');
});

bot.onText(/\/getqr/, async (msg) => {
  const chatId = msg.chat.id;
  if (waReady) return bot.sendMessage(chatId, 'WhatsApp sudah terhubung ✅');
  if (!lastQR) return bot.sendMessage(chatId, 'QR belum tersedia, tunggu beberapa detik setelah service start.');
  try {
    const img = await qrcode.toBuffer(lastQR, { type: 'png' });
    await bot.sendPhoto(chatId, img, { caption: '📷 Scan QR ini untuk login WhatsApp' });
  } catch (e) {
    bot.sendMessage(chatId, 'Gagal mengirim QR: ' + e.message);
  }
});

bot.onText(/\/check\s+(\d+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const number = match[1].replace(/\D/g,'');
  if (!waReady) return bot.sendMessage(chatId, 'WhatsApp client belum ready. Scan QR dulu.');
  try {
    const numberId = await client.getNumberId(number);
    if (!numberId) return bot.sendMessage(chatId, `❌ Nomor ${number} tidak terdaftar di WhatsApp`);
    const contact = await client.getContactById(numberId._serialized || (number + '@c.us'));
    let about = null;
    try { about = await contact.getAbout(); } catch(e) { about = null; }
    const reply = [
      `✅ Nomor: ${number}`,
      `• Terdaftar: Ya`,
      `• Bio: ${about ? about : '(tidak tersedia/privasi)'}`
    ].join('\n');
    bot.sendMessage(chatId, reply);
  } catch (e) {
    console.error('Check error:', e);
    bot.sendMessage(chatId, 'Error saat mengecek: ' + e.message);
  }
});
