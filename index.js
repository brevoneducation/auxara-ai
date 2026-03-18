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

// 🧠 TEMP MEMORY (per IP)
const userState = {};

app.get("/", (req, res) => {
  res.send("Auxara AI Server is running 🚀");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const clinic = req.body.clinic || "unknown";
  const userId = req.ip; // simple tracking

  if (!userState[userId]) {
    userState[userId] = {};
  }

  const state = userState[userId];

  try {
    // 🔍 DETECT NAME (basic)
    if (!state.name && /^[a-zA-Z ]{2,30}$/.test(userMessage)) {
      state.name = userMessage.trim();
    }

    // 🔍 DETECT PHONE
    const phoneMatch = userMessage.match(/\+?\d[\d\s-]{7,15}/);
    if (phoneMatch) {
      state.phone = phoneMatch[0];
    }

    // 🚀 SEND TO TELEGRAM ONLY WHEN BOTH EXIST
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

    // 🧠 CONTROLLED FLOW (VERY IMPORTANT)
    let reply = "";

    if (!state.name) {
      reply = "I’ll get this checked for you 😊 What’s your name?";
    } else if (!state.phone) {
      reply = `Got it, ${state.name} 👍 What’s your phone number?`;
    } else if (!state.time) {
      state.time = userMessage;
      reply = "Perfect. What time works best for you?";
    } else {
      reply = "Done! I’ll have the clinic confirm your appointment shortly 😊";
    }

    // 🤖 ONLY USE AI FOR FIRST MESSAGE / QUESTIONS
    if (!state.name && !state.phone) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a smart dental receptionist.

- Answer briefly
- Then ask for name
- 1–2 lines only
- Friendly + natural
`
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      reply = completion.choices[0].message.content;
    }

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