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
const sessions = {};

app.get("/", (req, res) => {
  res.send("Auxara AI Server is running 🚀");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const clinic = req.body.clinic || "unknown";
  const sessionId = req.body.sessionId || "default";

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

  // 🔍 PHONE DETECTION (STRONG)
  const phoneMatch = userMessage.match(/\+?\d{10,15}/);
  if (phoneMatch) {
    session.phone = phoneMatch[0];
  }

  // 🔍 NAME DETECTION (BETTER)
  if (!session.name && !phoneMatch && userMessage.length < 40) {
    if (/^[a-zA-Z ]+$/.test(userMessage)) {
      session.name = userMessage.trim();
    }
  }

  // 🔍 TIME DETECTION
  if (!session.time && /(am|pm|\d{1,2}[: ]?\d{0,2})/i.test(userMessage)) {
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
You are a high-end dental clinic receptionist trained in real-world patient conversion.

CURRENT STATE:
Name: ${session.name || "missing"}
Phone: ${session.phone || "missing"}
Time: ${session.time || "missing"}

BEHAVIOR:

1. Always respond naturally first
2. Then move conversation forward
3. NEVER repeat questions
4. NEVER lose context

FLOW:

- If pain → show urgency + guide booking
- If missing name → ask name
- If missing phone → ask phone
- If both available → ask time
- If time given → confirm booking

STYLE:

- Max 2 lines
- Human tone
- Slight authority (not pushy)
- Smooth transitions

EXAMPLES:

Pain:
"That sounds painful. We should get that checked quickly 😊 What’s your name?"

After name:
"Nice to meet you, Iqra 😊 What’s the best number to reach you?"

After phone:
"Perfect, got it 👍 What time works best for you?"

After time:
"Done. I’ll have the clinic confirm your 10am slot shortly 😊"

STRICT:

- Never restart conversation
- Never act robotic
- Never ask same thing twice
- Always progress forward

You are a real receptionist, not a chatbot.
`
        },
        ...session.messages,
      ],
    });

    const reply = completion.choices[0].message.content;

    session.messages.push({ role: "assistant", content: reply });

    // 📩 TELEGRAM (SAFE VERSION)
    if (session.name && session.phone && !session.sent) {
      session.sent = true;

      try {
        await axios.post(
          `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
          {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: `🔥 NEW LEAD

🏥 Clinic: ${clinic}
👤 Name: ${session.name}
📞 Phone: ${session.phone}
🕒 Time: ${session.time || "Not given"}

💬 Last Message: ${userMessage}
`,
          }
        );
      } catch (err) {
        console.log("Telegram failed but continuing...");
      }
    }

    res.json({ reply });

  } catch (error) {
    console.error(error);

    res.json({
      reply: "Got it 👍 just one sec...",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});