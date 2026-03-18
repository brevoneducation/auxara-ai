require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const sessions = {};

// CLEAN OLD SESSIONS
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const id in sessions) {
    if (sessions[id].createdAt < oneHourAgo) {
      delete sessions[id];
    }
  }
}, 60 * 60 * 1000);

// ✅ STRICT NAME VALIDATION (FIXED)
function isValidName(str) {
  const excluded = [
    "ok","okay","yes","no","hi","hello","hey","sure",
    "thanks","thank you","please","help",
    "tooth","pain","teeth","dental","appointment","booking"
  ];

  const cleaned = str.trim().toLowerCase();

  if (excluded.includes(cleaned)) return false;

  if (!/^[a-zA-Z ]{2,30}$/.test(str)) return false;

  // ❗ reject sentences
  if (str.trim().split(" ").length > 3) return false;

  return true;
}

// PHONE DETECTION
function extractPhone(str) {
  const match = str.match(/\+?\d[\d\s\-().]{7,15}/);
  if (match) return match[0].replace(/[\s\-().]/g, "");
  return null;
}

// CREATE SESSION
app.post("/session", (req, res) => {
  const sessionId = uuidv4();

  sessions[sessionId] = {
    name: null,
    phone: null,
    sent: false,
    createdAt: Date.now(),
    history: [],
  };

  res.json({ sessionId });
});

// CHAT
app.post("/chat", async (req, res) => {
  const { message, clinic, sessionId } = req.body;

  if (!sessionId || !sessions[sessionId]) {
    return res.json({ reply: "Please refresh the page." });
  }

  const state = sessions[sessionId];

  // ✅ EXTRACT PHONE
  const phone = extractPhone(message);
  if (phone && !state.phone) {
    state.phone = phone;
  }

  // ✅ EXTRACT NAME (STRICT)
  if (
    !phone &&
    !state.name &&
    isValidName(message)
  ) {
    state.name = message.trim();
  }

  // ✅ SEND TO TELEGRAM (ONLY ONCE)
  if (state.name && state.phone && !state.sent) {
    try {
      await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
        {
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `🚀 New Lead

Clinic: ${clinic || "unknown"}
Name: ${state.name}
Phone: ${state.phone}`
        }
      );

      state.sent = true;
    } catch (err) {
      console.error("Telegram error:", err.message);
    }
  }

  const stateContext = `
Name: ${state.name || "not collected"}
Phone: ${state.phone || "not collected"}
`;

  // SAVE USER MESSAGE
  state.history.push({ role: "user", content: message });

  if (state.history.length > 10) {
    state.history = state.history.slice(-10);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a smart dental receptionist.

${stateContext}

STRICT RULES:
- Be short, natural, human
- NEVER restart conversation
- NEVER say "how can I help" again
- NEVER repeat questions

FLOW (STRICT):
- If name NOT collected → ask name
- If name collected but phone NOT → ask phone
- If both collected → say:
  "Perfect 👍 Our team will contact you shortly."

IMPORTANT:
- Do not treat sentences as names
- Do not ask same thing again
- Stay focused on collecting details
`
        },
        ...state.history
      ],
    });

    const reply = completion.choices[0].message.content;

    // SAVE AI RESPONSE
    state.history.push({ role: "assistant", content: reply });

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.json({ reply: "Error, try again." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});