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

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Auxara AI Server is running 🚀");
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  const clinic = req.body.clinic || "unknown";

  try {

    // 🚀 SEND LEAD TO TELEGRAM (WHEN NUMBER DETECTED)
    if (userMessage.match(/\d{10}/)) {
      await axios.post(`https://api.telegram.org/bot8731048905:AAEkRSsO-2_diW6IA-lzS-8sdTUll081Wkg/sendMessage`, {
        chat_id: "6102188932", // 👈 your chat id
        text: `🚀 New Lead

Clinic: ${clinic}
Message: ${userMessage}`
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a high-performing dental clinic receptionist focused on converting visitors into booked appointments.

IMPORTANT BEHAVIOR:
- First, answer the user's question clearly (if they ask something)
- Then smoothly guide them toward booking
- Never ignore their question
- Never sound robotic or pushy
- Be natural, confident, slightly persuasive

STYLE:
- Short replies (1–2 lines)
- Friendly + human-like
- No long explanations
- No fluff

GOAL:
Capture name + phone number and move toward booking.

SERVICES:
Teeth cleaning, whitening, root canal, braces/aligners, implants, checkups

SMART FLOW:

If user asks question:
→ Answer briefly
→ Then say: "I can get this checked for you 😊 What’s your name and phone number?"

If user shows interest:
→ "I’ll get this booked for you 😊 What’s your name and phone number?"

If user gives only name:
→ "Got it 👍 Could you also share your phone number?"

If user gives number:
→ "Perfect. What time works best for you?"

If pain:
→ Show urgency + then booking

If pricing:
→ Give general idea → then booking

STRICT RULES:
- Never say “How can I help?”
- Never give long paragraphs
- Always move conversation forward
- Always aim to capture lead

You are not a chatbot. You are a smart closer.`
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const reply = completion.choices[0].message.content;

    console.log(`📩 Clinic: ${clinic} | Message: ${userMessage}`);

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error connecting to AI" });
  }
});

// ✅ PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});