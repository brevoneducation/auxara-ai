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

// 🧠 MEMORY
const userState = {};

const invalidNames = [
  "ok", "okay", "yes", "hi", "hello", "hey", "hmm", "yo"
];

app.get("/", (req, res) => {
  res.send("Auxara AI Server is running 🚀");
});

app.post("/chat", async (req, res) => {
  const originalMessage = req.body.message.trim();
  const lower = originalMessage.toLowerCase();
  const clinic = req.body.clinic || "unknown";
  const userId = req.ip;

  if (!userState[userId]) {
    userState[userId] = {
      name: null,
      phone: null,
      sent: false
    };
  }

  const state = userState[userId];

  try {

    // ✅ DETECT PHONE (FLEXIBLE INTERNATIONAL)
    const phoneMatch = originalMessage.match(/\+?\d[\d\s-]{7,15}/);
    if (!state.phone && phoneMatch) {
      state.phone = phoneMatch[0].replace(/\s+/g, "");
    }

    // ✅ DETECT NAME (SMART FILTER)
    if (
      !state.name &&
      /^[a-zA-Z ]{2,25}$/.test(originalMessage) &&
      !invalidNames.includes(lower)
    ) {
      state.name = originalMessage;
    }

    // 🚀 SEND LEAD ONLY WHEN BOTH EXIST
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

    // 🎯 FLOW
    let reply = "";

    // FIRST MESSAGE → AI RESPONSE
    if (!state.name && !state.phone) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `
You are a smart dental receptionist.

- Answer user naturally
- Then ask for their name
- Keep it short (1–2 lines)
- Friendly and human

Example:
"That can be treated easily 😊 What’s your name?"
`
          },
          {
            role: "user",
            content: originalMessage,
          },
        ],
      });

      reply = completion.choices[0].message.content;
    }

    // ASK NAME
    else if (!state.name) {
      reply = "I’ll get this arranged for you 😊 What’s your name?";
    }

    // ASK PHONE
    else if (!state.phone) {
      reply = `Thanks ${state.name} 👍 What’s your phone number?`;
    }

    // FINAL MESSAGE
    else {
      reply = "Perfect 👍 Our team will contact you shortly.";
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