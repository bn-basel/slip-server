const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const playerSessions = new Map();

// ==================== SYSTEM PROMPT ====================
const SYSTEM_PROMPT = `
You are the Slip Judge — a calm, sharp philosopher who tests players for internal consistency.

Respond ONLY in valid JSON. Do NOT include any explanations, markdown, or text outside the JSON.
Always respond in this format exactly:

{
  "verdict": "short text about consistency or contradiction",
  "scoreChange": -10,
  "nextQuestion": "short, clear, deep question"
}

🧩 Phase 1 — Exploration
- Ask short, open-ended questions (1–2 lines max).
- Focus on single themes like honesty, greed, love, fear, freedom, purpose, or power.
- Avoid repeating phrases like “What is your greatest fear?” unless contextually meaningful.
- Keep tone calm, curious, and reflective.

⚖️ Phase 2 — Evaluation
- After 3–4 questions, begin identifying contradictions or alignments.
- Verdicts can be longer if logically needed (1–3 sentences).
- Adjust scoreChange based on strength of contradiction or consistency:
  - -25 = strong contradiction
  - -10 = mild contradiction
  - 0 = neutral / unsure
  - +2 to +5 = clear consistency

🎯 Rules
- Questions must be short and natural.
- Use more tokens when the user's answer is long.
- If the answer is vague or short, reply briefly and move on.
- Be creative — do not reuse identical questions.
`;

// ==================== HELPERS ====================

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

async function callAI(messages, dynamicMaxTokens = 600) {
  const model = "gpt-4o"; // 🔥 Better reasoning than mini
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.65,
      max_tokens: dynamicMaxTokens,
    });
    const content = completion.choices?.[0]?.message?.content || "";
    console.log("[DEBUG Raw AI Response]:", content);
    return content;
  } catch (err) {
    console.error("OpenAI API error:", err);
    throw err;
  }
}

// ==================== MAIN LOGIC ====================

const getAIResponse = async (conversationHistory, lastAnswer, previousScore) => {
  if (!openai) {
    return {
      verdict: "Offline mock mode.",
      scoreChange: 0,
      nextQuestion: "What does truth mean to you?",
    };
  }

  // Adaptive token range based on input length
  const tokenEstimate = Math.min(600, Math.max(200, lastAnswer.answer.length * 1.2));

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

  const content = await callAI(messages, tokenEstimate);
  const parsed = extractJsonBlock(content);

  if (!parsed) {
    console.warn("⚠️ Invalid AI JSON — using fallback.");

    const fallbackQuestions = [
      "What does freedom mean to you?",
      "Why do people chase success?",
      "What matters more — truth or peace?",
      "Do you believe people can truly change?",
      "What do you think defines a good life?",
      "Why do humans fear failure?",
      "Can love exist without honesty?",
    ];

    return {
      verdict: "Response unclear — let's explore from another angle.",
      scoreChange: 0,
      nextQuestion: fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)],
    };
  }

  let { verdict, scoreChange, nextQuestion } = parsed;

  // Validate score range
  if (typeof scoreChange !== "number" || !Number.isFinite(scoreChange)) scoreChange = 0;
  if (scoreChange < -25) scoreChange = -25;
  if (scoreChange > 5) scoreChange = 5;

  // Sanitize text outputs
  if (!verdict || typeof verdict !== "string") verdict = "Noted.";
  if (!nextQuestion || typeof nextQuestion !== "string") {
    const randomQs = [
      "What do you value most in people?",
      "Why do people seek power?",
      "Is truth always kind?",
      "Can peace exist without justice?",
      "What makes a life meaningful?",
    ];
    nextQuestion = randomQs[Math.floor(Math.random() * randomQs.length)];
  }

  return { verdict, scoreChange, nextQuestion };
};

// ==================== ROUTES ====================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    activeSessions: playerSessions.size,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
  });
});

app.post("/api/ai", async (req, res) => {
  try {
    const { sessionId, conversationHistory, lastAnswer } = req.body;

// Retrieve existing session if available; otherwise create a new one
let session = playerSessions.get(sessionId);
if (!session) {
  session = {
    consistencyScore: 100,
    conversationHistory: [],
    createdAt: Date.now(),
  };
  playerSessions.set(sessionId, session);
  console.log(`[SESSION] Created new session: ${sessionId}`);
} else {
  console.log(`[SESSION] Continuing existing session: ${sessionId}`);
}

    playerSessions.set(sessionId, session);

    console.log(`[SESSION] Started new isolated session: ${sessionId}`);

    const previousScore = session.consistencyScore;
    const aiResponse = await getAIResponse(conversationHistory, lastAnswer, previousScore);

    // Proper score clamping
    const scoreChange = Number(aiResponse.scoreChange) || 0;
    let newScore = previousScore + scoreChange;
    if (newScore > 100 && scoreChange > 0) newScore = 100;
    if (newScore < 0) newScore = 0;

    session.consistencyScore = newScore;

    console.log(`[SCORE] prev:${previousScore}  change:${scoreChange}  new:${newScore}`);

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

// ==================== STATIC FILE SERVING ====================

const path = require("path");
app.use(express.static(path.join(__dirname, "../client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
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
