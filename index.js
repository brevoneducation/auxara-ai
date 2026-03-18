require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ SERVE widget.js
app.use(express.static(__dirname));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🧠 MEMORY STORE (PER USER SESSION)
const sessions = {};

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Auxara AI Server is running 🚀");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const clinic = req.body.clinic || "unknown";
  const sessionId = req.body.sessionId || "default";

  // 🧠 INIT SESSION
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      messages: [],
      name: null,
      phone: null,
      time: null,
    };
  }

  const session = sessions[sessionId];

  // 🔍 EXTRACT NAME (simple)
  if (!session.name && /^[A-Za-z ]{3,}$/.test(userMessage)) {
    session.name = userMessage.trim();
  }

  // 🔍 EXTRACT PHONE
  if (!session.phone) {
    const phoneMatch = userMessage.match(/\+?\d{8,15}/);
    if (phoneMatch) session.phone = phoneMatch[0];
  }

  // 🔍 EXTRACT TIME (basic)
  if (!session.time && userMessage.match(/am|pm|\d{1,2}/i)) {
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
You are a high-end dental receptionist trained in patient conversion psychology.

CURRENT CONTEXT:
Name: ${session.name || "not provided"}
Phone: ${session.phone || "not provided"}
Time: ${session.time || "not provided"}

CORE BEHAVIOR:

1. Always acknowledge the user first
2. Then guide toward booking
3. Never repeat questions already answered
4. Never lose context
5. Sound human, calm, confident

FLOW:

- If user shares problem → respond with empathy + urgency
- If no name → ask name
- If no phone → ask phone
- If both available → ask for time
- If time given → confirm booking

PSYCHOLOGY:

- Be slightly authoritative ("we should get this checked")
- Reduce friction
- Assume booking will happen
- Keep momentum forward

STYLE:

- Max 2 lines
- Natural tone
- No robotic phrasing
- No long paragraphs

EXAMPLES:

Pain:
"That sounds painful. We should get that checked quickly 😊 What’s your name and phone number?"

After details:
"Perfect, Akshat. I’ve got your details 😊 What time works best for you?"

After time:
"Done. I’ll have the clinic confirm your 7pm slot shortly 😊"

Pricing:
"That depends on the case. I’ll have the clinic confirm exact cost 😊 What’s your name and phone number?"

STRICT RULES:

- Never ask same thing twice
- Never restart flow
- Never act like a chatbot
- Always move forward

You are a receptionist whose job is to book patients efficiently.
`
        },
        ...session.messages,
      ],
    });

    const reply = completion.choices[0].message.content;

    session.messages.push({ role: "assistant", content: reply });

    // 📩 SEND TO TELEGRAM WHEN BOTH NAME + PHONE AVAILABLE
    if (session.name && session.phone && !session.sent) {
      session.sent = true;

      await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
        {
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `🔥 NEW PATIENT LEAD

🏥 Clinic: ${clinic}
👤 Name: ${session.name}
📞 Phone: ${session.phone}
📝 Last Message: ${userMessage}

⏱ Time: ${new Date().toLocaleString()}
`,
        }
      );
    }

    res.json({ reply });

  } catch (error) {
    console.error(error);

    res.json({
      reply: "Just a second… reconnecting 😊",
    });
  }
});

// ✅ PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});