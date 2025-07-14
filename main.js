require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHAT_ID = process.env.CHAT_ID;
const PAGE_URL = process.env.FB_PAGE_URL;

let lastPostText = null;

async function getLatestFacebookPost() {
  try {
    const response = await axios.get(PAGE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0' // จำเป็น! ป้องกันโดน block
      }
    });

    const $ = cheerio.load(response.data);

    // NOTE: โครงสร้าง DOM ของ facebook เปลี่ยนบ่อย — อาจต้องปรับ selector
    const post = $('div[data-ad-preview="message"]').first().text().trim();

    return post || null;
  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงโพสต์:", err.message);
    return null;
  }
}

async function checkNewPost() {
  const latest = await getLatestFacebookPost();

  if (latest && latest !== lastPostText) {
    lastPostText = latest;

    await bot.telegram.sendMessage(CHAT_ID, `📢 Facebook Page โพสต์ใหม่:\n\n${latest}`);
    console.log("✅ แจ้งเตือนโพสต์ใหม่เรียบร้อย");
  } else {
    console.log("⏳ ยังไม่มีโพสต์ใหม่");
  }
}

// เริ่มเช็คทุก 5 นาที
setInterval(checkNewPost, 5 * 60 * 1000);
checkNewPost();
