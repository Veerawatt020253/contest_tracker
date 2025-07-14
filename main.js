require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const { Telegraf } = require("telegraf");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000; // จำเป็นบน Render

const bot = new Telegraf(process.env.BOT_TOKEN);
const CHAT_ID = process.env.CHAT_ID;
const PAGE_URL = process.env.FB_PAGE_URL;

let lastPostText = null;

async function getLatestFacebookPost() {
  try {
    const response = await axios.get(PAGE_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0"
      }
    });

    const $ = cheerio.load(response.data);
    const post = $('div[data-ad-preview="message"]').first().text().trim();

    return post || null;
  } catch (err) {
    console.error("❌ ดึงโพสต์ล้มเหลว:", err.message);
    return null;
  }
}

async function checkNewPost() {
  const latest = await getLatestFacebookPost();

  if (latest && latest !== lastPostText) {
    lastPostText = latest;
    await bot.telegram.sendMessage(CHAT_ID, `📢 Facebook Page โพสต์ใหม่:\n\n${latest}`);
    console.log("✅ ส่งโพสต์แล้ว");
  } else {
    console.log("⏳ ยังไม่มีโพสต์ใหม่");
  }
}

// เรียกทุก 5 นาที
setInterval(checkNewPost, 5 * 60 * 1000);
checkNewPost();

// For Render to keep alive (optional)
app.get("/", (req, res) => {
  res.send("FB Post Watcher is running.");
});

app.listen(PORT, () => {
  console.log(`🌐 Server running on port ${PORT}`);
});
