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

// 🧠 TEMP MEMORY (simple)
const userData = {};

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const clinic = req.body.clinic || "unknown";

  const userId = req.headers["x-forwarded-for"] || req.ip;

  if (!userData[userId]) {
    userData[userId] = {
      name: null,
      phone: null,
      sent: false
    };
  }

  const state = userData[userId];

  try {
    // 🔍 DETECT PHONE (GLOBAL)
    const phoneMatch = userMessage.match(/\+?\d[\d\s-]{7,15}/);
    if (phoneMatch) {
      state.phone = phoneMatch[0].replace(/\s+/g, "");
    }

    // 🔍 DETECT NAME (VERY SIMPLE)
    if (!state.name && /^[a-zA-Z ]{2,30}$/.test(userMessage)) {
      state.name = userMessage.trim();
    }

    // 🚀 SEND LEAD (ONLY WHEN BOTH EXIST)
    if (state.name && state.phone && !state.sent) {
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

    // 🤖 GPT HANDLES EVERYTHING ELSE
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a high-converting dental clinic receptionist.

GOAL:
Capture user's name and phone number and guide them toward booking.

STYLE:
- Friendly, human, confident
- 1–2 lines max
- No long explanations

BEHAVIOR:
- Answer user question first
- Then move toward booking
- Ask for name + phone naturally
- Never repeat questions unnecessarily

IMPORTANT:
- If user gives name → ask phone
- If user gives phone → move toward booking
- Do not act robotic
- Do not restart conversation

You are a smart closer, not a chatbot.
`
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error connecting to AI" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});