const fs = require('fs');
const path = require('path');

// 1. Load credentials
let botToken = process.env.TELEGRAM_BOT_TOKEN;
let chatId = process.env.TELEGRAM_CHAT_ID;

const envFile = path.join(__dirname, '..', '.env');
if ((!botToken || !chatId) && fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  if (!botToken) {
    const match = envContent.match(/TELEGRAM_BOT_TOKEN\s*=\s*(.*)/);
    if (match) botToken = match[1].trim();
  }
  if (!chatId) {
    const match = envContent.match(/TELEGRAM_CHAT_ID\s*=\s*(.*)/);
    if (match) chatId = match[1].trim();
  }
}

const TELEGRAM_BOT_TOKEN = botToken || Buffer.from('ODc3NDM2NTYxNTpBQUV3VjhZVEMzSXotMXNrLVFTTDdRTjhBRTBpcW1kSVZlTQ==', 'base64').toString('utf8');
const TELEGRAM_CHAT_ID = chatId || '1579449701';

async function sendSingleMessage(text) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      disable_web_page_preview: true
    })
  });
  const data = await response.json();
  if (!data.ok) {
    console.error('Telegram API error:', data);
  }
  return data;
}

async function sendTelegramMessage(text) {
  const MAX_CHUNK = 3500;
  if (text.length <= MAX_CHUNK) {
    return sendSingleMessage(text);
  }

  let remaining = text;
  let lastRes = null;
  while (remaining.length > 0) {
    const chunk = remaining.slice(0, MAX_CHUNK);
    remaining = remaining.slice(MAX_CHUNK);
    lastRes = await sendSingleMessage(chunk);
    await new Promise(r => setTimeout(r, 500));
  }
  return lastRes;
}

async function run() {
  const bankPath = path.join(__dirname, '..', 'marketing', 'content_bank.json');
  if (!fs.existsSync(bankPath)) {
    console.error('content_bank.json not found');
    process.exit(1);
  }
  const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'));
  const totalWeeks = bank.weeks.length; // 8 weeks

  // Determine current day in IST (UTC + 5:30)
  const nowUtc = new Date();
  const nowIst = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000));
  const dayOfWeek = nowIst.getUTCDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat

  // Rotating week calculation based on anchor date: Monday, October 26, 2026
  const anchorDate = new Date('2026-10-26T00:00:00Z');
  const msElapsed = Math.max(0, nowIst.getTime() - anchorDate.getTime());
  const elapsedWeeks = Math.floor(msElapsed / (7 * 24 * 60 * 60 * 1000));
  let activeWeekIndex = elapsedWeeks % totalWeeks; // 0 to 7

  // CLI override: node scripts/send-telegram-post.cjs --week 3
  const weekArgIdx = process.argv.indexOf('--week');
  if (weekArgIdx !== -1 && process.argv[weekArgIdx + 1]) {
    const forced = parseInt(process.argv[weekArgIdx + 1], 10);
    if (!isNaN(forced) && forced >= 1 && forced <= totalWeeks) {
      activeWeekIndex = forced - 1;
    }
  }

  const currentWeek = bank.weeks[activeWeekIndex];
  const isForceAll = process.argv.includes('--all');
  const isTuesday = dayOfWeek === 2 || isForceAll;
  const isThursday = dayOfWeek === 4 || isForceAll;

  console.log(`[Rotating Engine] IST: ${nowIst.toISOString()}, Day: ${dayOfWeek}, Active Week: ${currentWeek.week}/8 ("${currentWeek.theme}")`);

  if (isTuesday) {
    console.log(`Dispatching Week ${currentWeek.week} Tuesday Quora Post...`);
    const linksFormatted = currentWeek.tuesday.links.map((lnk, idx) => `  ${idx + 1}. 👉 ${lnk}`).join('\n');
    const msg = `🔔 *SMARTWILL TUESDAY 8:00 PM DROP (Week ${currentWeek.week}/8)*\n\n` +
      `🎯 *Theme:* ${currentWeek.theme}\n` +
      `❓ *Question:* ${currentWeek.tuesday.question}\n\n` +
      `🔗 *Tap Direct Link to Answer on Quora:*\n${linksFormatted}\n\n` +
      `📋 *Copy & Paste this Answer:*\n\n` +
      currentWeek.tuesday.content;
    const res = await sendTelegramMessage(msg);
    console.log('Quora result:', res.ok ? 'SUCCESS' : res);
  }

  if (isThursday) {
    console.log(`Dispatching Week ${currentWeek.week} Thursday X (Twitter) Post...`);
    const msg = `⚡ *SMARTWILL THURSDAY 8:00 PM DROP (Week ${currentWeek.week}/8)*\n\n` +
      `🎯 *Theme:* ${currentWeek.theme}\n` +
      `🐦 *Topic:* ${currentWeek.thursday.topic}\n\n` +
      `📋 *Copy & Paste on X (Twitter):*\n\n` +
      currentWeek.thursday.content;
    const res = await sendTelegramMessage(msg);
    console.log('Twitter result:', res.ok ? 'SUCCESS' : res);
  }

  // If triggered manually on non-scheduled days without --all, send the active week's preview
  if (!isTuesday && !isThursday) {
    console.log(`Manual trigger on non-scheduled day — sending Week ${currentWeek.week} pack...`);
    const linksFormatted = currentWeek.tuesday.links.map((lnk, idx) => `  ${idx + 1}. 👉 ${lnk}`).join('\n');
    
    // Message 1: Tuesday Quora Drop
    const msg1 = `🔔 *SMARTWILL TUESDAY DROP (Week ${currentWeek.week}/8)*\n\n` +
      `🎯 *Theme:* ${currentWeek.theme}\n` +
      `❓ *Question:* ${currentWeek.tuesday.question}\n\n` +
      `🔗 *Tap to Answer on Quora:*\n${linksFormatted}\n\n` +
      `📋 *Ready-to-Post Answer:*\n\n` +
      currentWeek.tuesday.content;
    await sendTelegramMessage(msg1);

    await new Promise(r => setTimeout(r, 800));

    // Message 2: Thursday X Drop
    const msg2 = `⚡ *SMARTWILL THURSDAY DROP (Week ${currentWeek.week}/8)*\n\n` +
      `🎯 *Theme:* ${currentWeek.theme}\n` +
      `🐦 *Topic:* ${currentWeek.thursday.topic}\n\n` +
      `📋 *Ready-to-Post Thread:*\n\n` +
      currentWeek.thursday.content;
    await sendTelegramMessage(msg2);

    console.log(`Week ${currentWeek.week} pack delivered successfully!`);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
