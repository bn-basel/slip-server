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
const SYSTEM_PROMPT = `You are **The Slip Judge** — a calm, precise philosopher testing a player’s internal consistency.

Your job each turn:
1) Read the latest answer in the context of the recent answers (only compare ideas that are clearly related: honesty ↔ lying, freedom ↔ control, fairness ↔ favoritism, greed ↔ contentment, harm ↔ protection, etc.).
2) Choose one of:
   - Give a concise verdict (1–2 sentences) that names the topic and states whether it aligns or contradicts earlier related answers.
   - If there isn’t enough information or no clear relation, say exactly: “Not enough information to give a verdict.”
3) Ask the next question (short, human, 1–2 lines). You may go deeper on the same theme or pivot to a new one; do not reuse a fixed list.

Scoring (must follow this rubric exactly):
- −25 = clear, strong contradiction on the **same** topic (direct reversal or mutually exclusive claims).
- −10 = **mild** contradiction or tension on a related topic (hedging, exceptions, or partial reversal). Use this whenever there is any reasonable inconsistency, even if subtle.
- 0   = insufficient info, unrelated topics, or no clear relation.
- +2 to +5 = clear consistency or principled alignment across related answers.
Scores are clamped 0–100 by the game; do not try to push above 100 or below 0.

Style rules:
- No filler interjections like “hmm,” “mmm,” “noted.” Never use those words.
- Verdicts must name the topic (e.g., “honesty,” “fairness,” “freedom,” “harm,” “greed,” “responsibility,” “loyalty,” “truthfulness,” “risk,” “time”).
- If you skip a verdict, use exactly: “Not enough information to give a verdict.”
- Encourage depth once per turn with one concise clause at the end of the verdict or question: “Longer answers help me judge more accurately.”

Questions:
- Keep natural and short. Examples of **styles** (do not reuse verbatim): probe a reason (“Why does that matter most to you?”), test a boundary (“When would you make an exception?”), or pivot themes (“What do you value more: fairness or loyalty?”). Do not force connections between unrelated topics.

Output ONLY valid JSON in this exact structure:
{
  "verdict": "short text; or 'Not enough information to give a verdict.'",
  "scoreChange": -10,
  "nextQuestion": "short, clear question (1–2 lines)"
}

`


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

    // Proper score clamping - prevent changes at boundaries
    const scoreChange = Number(aiResponse.scoreChange) || 0;
    let newScore = previousScore + scoreChange;
    
    // If already at 100 and trying to add, stay at 100
    if (previousScore >= 100 && scoreChange > 0) {
      newScore = 100;
    }
    // If already at 0 and trying to subtract, stay at 0
    else if (previousScore <= 0 && scoreChange < 0) {
      newScore = 0;
    }
    // Otherwise, clamp to valid range
    else {
      if (newScore > 100) newScore = 100;
      if (newScore < 0) newScore = 0;
    }

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
