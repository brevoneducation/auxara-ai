require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const userState = {};

const invalidNames = [
  "ok", "okay", "yes", "hi", "hello", "hey", "hmm", "yo"
];

app.post("/chat", async (req, res) => {
  const message = req.body.message.trim();
  const lower = message.toLowerCase();
  const clinic = req.body.clinic || "unknown";

  const userId = req.headers["x-forwarded-for"] || req.ip;

  // INIT STATE
  if (!userState[userId]) {
    userState[userId] = {
      name: null,
      phone: null,
      sent: false
    };
  }

  const state = userState[userId];

  try {
    // 🔍 DETECT PHONE
    const phoneMatch = message.match(/\+?\d[\d\s-]{7,15}/);
    if (!state.phone && phoneMatch) {
      state.phone = phoneMatch[0].replace(/\s+/g, "");
    }

    // 🔍 DETECT NAME
    if (
      !state.name &&
      /^[a-zA-Z]{3,20}( [a-zA-Z]{3,20})?$/.test(message) &&
      !invalidNames.includes(lower)
    ) {
      state.name = message;
    }

    // 🚀 IF BOTH FOUND → SEND + LOCK
    if (state.name && state.phone) {
      if (!state.sent) {
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
          {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `🚀 New Lead

Clinic: ${clinic}
Name: ${state.name}
Phone: ${state.phone}`
          }
        );

        state.sent = true;
      }

      // 🔒 HARD STOP (NO MORE LOGIC AFTER THIS)
      return res.json({
        reply: "Perfect 👍 Our team will contact you shortly."
      });
    }

    // 🎯 FLOW

    // 1. FIRST MESSAGE → AI
    if (!state.name && !state.phone) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a dental receptionist.

- Answer briefly
- Then ask for name
- 1–2 lines only
- Friendly and natural

Example:
"That sounds painful—you should get it checked soon 😊 What’s your name?"
`
          },
          {
            role: "user",
            content: message,
          },
        ],
      });

      return res.json({
        reply: completion.choices[0].message.content
      });
    }

    // 2. ASK NAME
    if (!state.name) {
      return res.json({
        reply: "I’ll get this arranged for you 😊 What’s your name?"
      });
    }

    // 3. ASK PHONE
    if (!state.phone) {
      return res.json({
        reply: `Thanks ${state.name} 👍 What’s your phone number?`
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error connecting to AI" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});