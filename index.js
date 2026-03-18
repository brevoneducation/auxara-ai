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

// 🧠 MEMORY (per user IP)
const userState = {};

app.get("/", (req, res) => {
  res.send("Auxara AI Server is running 🚀");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message.trim();
  const clinic = req.body.clinic || "unknown";
  const userId = req.ip;

  if (!userState[userId]) {
    userState[userId] = {
      name: null,
      phone: null,
      time: null,
      sent: false
    };
  }

  const state = userState[userId];

  try {
    // ✅ NAME DETECTION (ONLY ONCE)
    if (!state.name && /^[a-zA-Z]{2,20}( [a-zA-Z]{2,20})?$/.test(userMessage)) {
      state.name = userMessage;
    }

    // ✅ STRICT PHONE VALIDATION
    const cleanPhone = userMessage.replace(/\s+/g, "");
    if (!state.phone && /^\+?\d{10,14}$/.test(cleanPhone)) {
      state.phone = cleanPhone;
    }

    // 🚀 SEND TO TELEGRAM ONLY ONCE (FULL LEAD)
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

    // 🎯 CONTROLLED FLOW
    let reply = "";

    // 1️⃣ FIRST MESSAGE → USE AI
    if (!state.name && !state.phone) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a friendly dental receptionist.

- Answer briefly
- Then ask for name
- 1–2 lines only
- Natural human tone
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

    // 2️⃣ ASK NAME
    else if (!state.name) {
      reply = "I’ll get this booked for you 😊 What’s your name?";
    }

    // 3️⃣ ASK PHONE
    else if (!state.phone) {
      reply = `Got it, ${state.name} 👍 What’s your phone number?`;
    }

    // 4️⃣ ASK TIME
    else if (!state.time) {
      state.time = userMessage;
      reply = "Perfect. What time works best for you?";
    }

    // 5️⃣ FINAL CONFIRM
    else {
      reply = "Done! I’ll have the clinic confirm your appointment shortly 😊";
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