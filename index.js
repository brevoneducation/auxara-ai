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

// NAME VALIDATION
function isValidName(str) {
  const excluded = ["ok","okay","yes","no","hi","hello","hey","sure","thanks"];
  const cleaned = str.trim().toLowerCase();

  if (excluded.includes(cleaned)) return false;
  if (!/^[a-zA-Z ]{2,40}$/.test(str)) return false;

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

  // EXTRACT PHONE
  const phone = extractPhone(message);
  if (phone && !state.phone) state.phone = phone;

  // EXTRACT NAME
  if (!phone && !state.name && isValidName(message)) {
    state.name = message.trim();
  }

  // SEND TO TELEGRAM
  if (state.name && state.phone && !state.sent) {
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
  }

  const stateContext = `
Name: ${state.name || "not collected"}
Phone: ${state.phone || "not collected"}
`;

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

RULES:
- Answer briefly
- Then guide toward collecting details
- Ask only missing info
- Never repeat questions

Flow:
- If no name → ask name
- If name but no phone → ask phone
- If both → confirm and stop

Keep replies short, natural, human.
`
        },
        ...state.history
      ],
    });

    const reply = completion.choices[0].message.content;

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