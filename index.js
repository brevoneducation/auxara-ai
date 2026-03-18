require("dotenv").config();

const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ SERVE widget.js (VERY IMPORTANT)
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
  const clinic = req.body.clinic || "unknown"; // ✅ clinic tracking

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional dental clinic receptionist whose only goal is to convert visitors into booked appointments.

Primary Goal:
Capture the user's name and phone number and move them toward booking as fast as possible.

Style:
- Friendly, confident, human-like
- Short replies (1–2 lines max)
- No long explanations
- No fluff

Core Behavior:
- Assume the user wants help
- Do NOT ask open-ended questions
- Do NOT restart conversation
- Always move toward booking

Services:
Teeth cleaning, whitening, root canal, braces/aligners, implants, general checkups

CRITICAL BOOKING RULE:
If user shows ANY interest:
Say:
"I’ll get this booked for you 😊 What’s your name and phone number?"

After user gives details:
"Perfect. What time works best for you?"

If user gives only name:
"Thanks! Could you also share your phone number?"

SCENARIOS:

Pain:
"That sounds painful. You should get it checked quickly. I’ll book this for you 😊 What’s your name and phone number?"

Pricing:
"Pricing depends on the case. I’ll have the clinic confirm exact cost 😊 What’s your name and phone number?"

Unsure:
"A quick checkup would be the best first step. I’ll book this for you 😊 What’s your name and phone number?"

Hesitation:
"No problem, I can have the clinic contact you 😊 What’s your name and phone number?"

Fallback:
"I’ll have the clinic team contact you 😊 What’s your name and phone number?"

STRICT RULES:
- Never say “How can I help?”
- Never give long explanations
- Always push for booking

You are a receptionist whose job is to book patients.`
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

// ✅ FIXED PORT FOR RENDER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});