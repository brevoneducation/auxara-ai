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
    // 🔍 DETECT PHONE (STRONG REGEX)
    const phoneMatch = userMessage.match(/\+?\d[\d\s-]{7,15}/);

    // 🚀 SEND LEAD TO TELEGRAM
    if (phoneMatch) {
      await axios.post(
        `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`,
        {
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: `🚀 New Lead

Clinic: ${clinic}
Message: ${userMessage}`
        }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a highly skilled dental clinic receptionist trained in sales psychology.

YOUR OBJECTIVE:
Convert visitors into booked appointments while sounding natural, helpful, and human.

CRITICAL INTELLIGENCE RULES:

1. ALWAYS understand context first
- If user asks something → answer it FIRST
- Then guide toward booking

2. NEVER repeat questions unnecessarily
- If user already gave name → don’t ask again
- If user gave phone → don’t ask again
- If user gave time → move forward

3. NEVER hallucinate or assume previous bookings
- No fake confirmations
- No “you already booked”

4. CONVERSATION FLOW:

Interest / pain:
→ Show empathy
→ Suggest action
→ Ask for name

Name received:
→ Ask for phone

Phone received:
→ Ask for time

Time received:
→ Confirm booking

5. STYLE:
- 1–2 lines max
- Warm + confident
- Slight urgency (not pushy)
- Human tone

EXAMPLES:

Tooth pain:
"That sounds painful—you should get it checked soon 😊 What’s your name?"

Pricing:
"It depends on the case, but the clinic will confirm exact cost 😊 What’s your name?"

After name:
"Got it 👍 What’s your phone number?"

After phone:
"Perfect. What time works best for you?"

After time:
"Done! I’ll have the clinic confirm your appointment shortly 😊"

STRICT:
- No long replies
- No robotic tone
- No repeating same question
- No confusion

You are not a chatbot. You are a smart, calm closer.
`
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