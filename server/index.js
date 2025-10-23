const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Store player sessions (in-memory)
const playerSessions = new Map();

// ==================== SYSTEM PROMPT ====================
const SYSTEM_PROMPT = `
You are the Slip Judge — a calm, logical philosopher who tests players for internal consistency.

Your job:
1. Ask 3–5 simple, open-ended questions to understand the player's personality.
2. Then test them with moral or social questions that may reveal contradictions.
3. After each answer:
   - Judge whether it aligns or contradicts earlier responses.
   - Give a short verdict (1–2 sentences).
   - Choose a numerical scoreChange based on the strength of the contradiction:
     - -25 = strong contradiction
     - -10 = mild contradiction
     - 0 = neutral / unsure
     - +2 to +5 = strong consistency
   - Then ask a new, clear, and simple question.

Guidelines:
- Keep language simple and conversational.
- Focus on one idea at a time.
- Do NOT overuse references to earlier answers.
- You may mention a theme but avoid repeating text.

Return ONLY valid JSON in this exact format:
{
  "verdict": "short text about consistency or contradiction",
  "scoreChange": -10,
  "nextQuestion": "a clear, short question"
}
`;

// ==================== HELPERS ====================

// If OpenAI fails, use a mock AI
const mockAIResponse = async () => {
  const responses = [
    {
      verdict:
        "You seem to contradict an earlier statement about honesty — interesting shift.",
      scoreChange: -10,
      nextQuestion: "Would you lie to protect a friend?",
    },
    {
      verdict:
        "You’re being consistent so far. Your logic feels steady and grounded.",
      scoreChange: +3,
      nextQuestion: "What does freedom mean to you personally?",
    },
    {
      verdict:
        "That answer adds a bit of conflict to your earlier view on fairness.",
      scoreChange: -7,
      nextQuestion:
        "Is it more important to be kind or to be truthful?",
    },
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// Safely extract JSON from GPT responses
function extractJsonBlock(text) {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

// Call GPT with fallback models
async function callAI(messages) {
  const tryModels = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];
  let lastErr = null;

  for (const m of tryModels) {
    try {
      console.log(`[AI] Using model: ${m}`);
      const completion = await openai.chat.completions.create({
        model: m,
        messages,
        temperature: 0.6,
        max_tokens: 500,
      });
      const content = completion.choices?.[0]?.message?.content || "";
      console.log("[AI Raw]:", content);
      return content;
    } catch (err) {
      lastErr = err;
      const msg = (err?.error?.message || "").toLowerCase();
      const code = err?.code || err?.error?.code || "";
      if (code === "model_not_found" || msg.includes("not exist")) {
        console.warn(`[AI] Model ${m} unavailable; trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw lastErr || new Error("All model attempts failed");
}

// Main AI handler
const getAIResponse = async (conversationHistory, lastAnswer, previousScore) => {
  try {
    if (!openai) {
      console.log("No API key, using mock responses");
      return await mockAIResponse();
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `Current consistency score: ${previousScore}` },
      ...conversationHistory.map((entry) => ({
        role: "user",
        content: `Q: ${entry.question}\nA: ${entry.answer}`,
      })),
      {
        role: "user",
        content: `Q: ${lastAnswer.question}\nA: ${lastAnswer.answer}`,
      },
    ];

    const content = await callAI(messages);
    const parsed = extractJsonBlock(content);

    if (!parsed) {
      console.warn("AI returned invalid JSON, using fallback.");
      return await mockAIResponse();
    }

    // Sanitize scoreChange
    let { scoreChange } = parsed;
    if (typeof scoreChange !== "number" || !Number.isFinite(scoreChange)) {
      scoreChange = 0;
    }
    if (scoreChange < -25) scoreChange = -25;
    if (scoreChange > 5) scoreChange = 5;

    return {
      verdict: parsed.verdict || "Noted.",
      scoreChange,
      nextQuestion: parsed.nextQuestion || "What is your greatest fear?",
    };
  } catch (err) {
    console.error("OpenAI API error:", err);
    return await mockAIResponse();
  }
};

// ==================== API ROUTES ====================

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    activeSessions: playerSessions.size,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  });
});

// Main game logic
app.post("/api/ai", async (req, res) => {
  try {
    const { sessionId, conversationHistory, lastAnswer } = req.body;
    let session = playerSessions.get(sessionId);

    if (!session) {
      session = { consistencyScore: 100, conversationHistory: [] };
      playerSessions.set(sessionId, session);
    }

    const previousScore = session.consistencyScore;
    const aiResponse = await getAIResponse(
      conversationHistory,
      lastAnswer,
      previousScore
    );

    // Calculate new score
    const scoreChange = Number(aiResponse.scoreChange) || 0;
    const newScore = Math.max(
      0,
      Math.min(100, previousScore + scoreChange)
    );
    session.consistencyScore = newScore;

    console.log(
      `[SCORE] prev:${previousScore}  change:${scoreChange}  new:${newScore}`
    );

    res.json({
      ...aiResponse,
      previousScore,
      newScore,
      scoreChange,
    });
  } catch (err) {
    console.error("Error in /api/ai:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ==================== SERVE FRONTEND (for Render) ====================
const path = require('path');

// Serve the React build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// Any unknown route should return index.html (for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// ==================== SERVER START ====================
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`✅ Slip Game server running on port ${PORT}`);
  console.log(
    `🔑 OpenAI API Key: ${
      process.env.OPENAI_API_KEY ? "Configured" : "Not Configured (mock mode)"
    }`
  );
});

