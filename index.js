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

// 🧠 MEMORY STORE
const sessions = {};

app.get("/", (req, res) => {
  res.send("Auxara AI Server is running 🚀");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const clinic = req.body.clinic || "unknown";

  // ✅ UNIQUE SESSION PER USER (IMPORTANT FIX)
  const sessionId =
    req.body.sessionId ||
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress;

  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      messages: [],
      name: null,
      phone: null,
      time: null,
      sent: false,
    };
  }

  const session = sessions[sessionId];

  // 🔍 PHONE DETECTION (RELAXED)
  const phoneMatch = userMessage.match(/\+?\d{8,15}/);
  if (phoneMatch) {
    session.phone = phoneMatch[0];
  }

  // 🔍 NAME DETECTION
  if (!session.name && !phoneMatch && userMessage.length < 40) {
    if (/^[a-zA-Z ]+$/.test(userMessage)) {
      session.name = userMessage.trim();
    }
  }

  // 🔍 TIME DETECTION
  if (!session.time && /(am|pm|\d{1,2})/i.test(userMessage)) {
    session.time = userMessage;
  }

  session.messages.push({ role: "user", content: userMessage });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a high-end dental receptionist focused on converting visitors into booked appointments.

CURRENT STATE:
Name: ${session.name || "missing"}
Phone: ${session.phone || "missing"}
Time: ${session.time || "missing"}

RULES:

- Always acknowledge user first
- Then guide toward booking
- Never repeat questions
- Never assume old booking unless confirmed

FLOW:

- If user asks → answer briefly → then move to booking
- If no name → ask name
- If no phone → ask phone
- If both → ask time
- If time → confirm booking

STYLE:

- 1–2 lines max
- Human tone
- Confident, smooth

EXAMPLES:

Teeth whitening:
"Yes, we do professional whitening 😊 It’s quick and very effective. I can get this arranged for you — what’s your name?"

After phone:
"Perfect 👍 What time works best for you?"

After time:
"Done. I’ll have the clinic confirm your slot shortly 😊"

STRICT:

- Never reuse old booking info
- Never act robotic
- Always move forward
`
        },
        ...session.messages,
      ],
    });

    const reply = completion.choices[0].message.content;

    session.messages.push({ role: "assistant", content: reply });

    // 📩 TELEGRAM FIX (RELIABLE)
    if (session.phone && !session.sent) {
      session.sent = true;

      try {
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
          {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `🔥 NEW LEAD

🏥 Clinic: ${clinic}
👤 Name: ${session.name || "Not provided"}
📞 Phone: ${session.phone}
🕒 Time: ${session.time || "Not provided"}

💬 Message: ${userMessage}
`,
          }
        );
      } catch (err) {
        console.log("Telegram failed:", err.message);
      }
    }

    res.json({ reply });

  } catch (error) {
    console.error(error);

    res.json({
      reply: "Got it 👍 just a second...",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});