const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

// Configure CORS to allow requests from production and development origins
const allowedOrigins = [
  'https://slip-server-1.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001', // Common dev port alternative
  process.env.CLIENT_ORIGIN, // Allow custom origin from env
].filter(Boolean); // Remove undefined values

console.log('[SERVER] Allowed CORS origins:', allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or curl)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // In development, allow any origin for easier testing
        if (process.env.NODE_ENV === 'development') {
          console.log('[SERVER] Development mode: allowing origin', origin);
          callback(null, true);
        } else {
          console.warn('[SERVER] Blocked CORS request from:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
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

// ==================== PARTY MODE (Socket.IO) ====================

// In-memory rooms store
// Room shape: {
//   code, createdAt, started, players: [{id, name, ready, isHost}], updatedAt
// }
const rooms = new Map();

const MAX_PLAYERS = 6;
const ROOM_TTL_MS = 60 * 60 * 1000; // 1 hour
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes I,O,0,1

function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function createRoom() {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));
  const room = { code, createdAt: Date.now(), updatedAt: Date.now(), started: false, players: [] };
  rooms.set(code, room);
  return room;
}

function getRoomState(code) {
  const room = rooms.get(code);
  if (!room) return null;
  return {
    code: room.code,
    createdAt: room.createdAt,
    started: room.started,
    players: room.players.map((p) => ({ id: p.id, name: p.name, ready: p.ready, isHost: p.isHost })),
  };
}

function assignNewHost(room) {
  const candidate = room.players[0];
  if (candidate) candidate.isHost = true;
}

function removePlayerFromRooms(socketId) {
  for (const room of rooms.values()) {
    const idx = room.players.findIndex((p) => p.id === socketId);
    if (idx !== -1) {
      const wasHost = room.players[idx].isHost;
      room.players.splice(idx, 1);
      if (wasHost && room.players.length > 0) assignNewHost(room);
      room.updatedAt = Date.now();
      if (room.players.length === 0) {
        rooms.delete(room.code);
        console.log(`[ROOM] Deleted empty room ${room.code}`);
      }
      return room.code;
    }
  }
  return null;
}

// Periodic cleanup of expired rooms
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (now - room.updatedAt > ROOM_TTL_MS || room.players.length === 0) {
      rooms.delete(code);
      console.log(`[ROOM] Expired/empty room cleaned up: ${code}`);
    }
  }
}, 60 * 1000);

// Create HTTP server and bind Socket.IO
const server = http.createServer(app);

// Configure Socket.IO CORS to match Express CORS
// Socket.IO accepts string, array of strings, or function for origin
const socketIoAllowedOrigins = [
  'https://slip-server-1.onrender.com',
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.CLIENT_ORIGIN, // Allow custom origin from env
].filter(Boolean);

console.log('[SERVER] ========== Socket.IO CORS Configuration ==========');
console.log('[SERVER] Allowed origins:', socketIoAllowedOrigins);
console.log('[SERVER] CLIENT_ORIGIN env:', process.env.CLIENT_ORIGIN || '(not set)');
console.log('[SERVER] NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('[SERVER] ====================================================');

// In production, use strict origin list; in development, allow all
const socketIoOriginConfig = process.env.NODE_ENV === 'production' 
  ? socketIoAllowedOrigins 
  : (origin, callback) => {
      // In development, allow all origins for easier testing
      console.log('[SERVER] Socket.IO: Development mode allowing origin', origin);
      callback(null, true);
    };

const io = new Server(server, {
  cors: {
    origin: socketIoOriginConfig,
    methods: ["GET", "POST"], // Socket.IO uses GET for polling, POST for websocket
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
  // CRITICAL: Allow both transports - polling starts first, then upgrades to websocket
  transports: ['polling', 'websocket'],
  allowEIO3: true, // Allow Engine.IO v3 clients for compatibility
  // Render-specific optimizations for stability
  pingInterval: 25000, // Send ping every 25 seconds
  pingTimeout: 60000, // Wait 60 seconds before considering connection dead (increased for Render)
  upgradeTimeout: 10000, // Wait 10 seconds for transport upgrade
  maxHttpBufferSize: 1e6, // 1MB max buffer size
  // Allow connection upgrades (polling -> websocket)
  allowUpgrades: true,
});

console.log('[SERVER] Socket.IO server initialized with transports: ["polling", "websocket"]');
console.log('[SERVER] Socket.IO will handle all requests to /socket.io/*');
console.log('[SERVER] Express static/catch-all routes exclude /socket.io paths');

io.on("connection", (socket) => {
  const clientOrigin = socket.handshake.headers.origin || 'unknown';
  const clientAddress = socket.handshake.address || 'unknown';
  const userAgent = socket.handshake.headers['user-agent'] || 'unknown';
  
  console.log(`[SOCKET] ✅ ========== NEW CONNECTION ==========`);
  console.log(`[SOCKET]   Socket ID: ${socket.id}`);
  console.log(`[SOCKET]   Origin: ${clientOrigin}`);
  console.log(`[SOCKET]   Client address: ${clientAddress}`);
  console.log(`[SOCKET]   Initial transport: ${socket.conn.transport.name}`);
  console.log(`[SOCKET]   User-Agent: ${userAgent.substring(0, 80)}...`);
  console.log(`[SOCKET] ======================================`);

  // Log transport upgrades (polling -> websocket)
  socket.conn.on("upgrade", () => {
    console.log(`[SOCKET] 🔄 ========== TRANSPORT UPGRADE ==========`);
    console.log(`[SOCKET]   Socket ID: ${socket.id}`);
    console.log(`[SOCKET]   Upgraded to: ${socket.conn.transport.name}`);
    console.log(`[SOCKET] ==========================================`);
  });

  // Log transport errors with full details
  socket.conn.on("error", (err) => {
    console.error(`[SOCKET] ❌ ========== TRANSPORT ERROR ==========`);
    console.error(`[SOCKET]   Socket ID: ${socket.id}`);
    console.error(`[SOCKET]   Error:`, err.message || err);
    console.error(`[SOCKET]   Transport: ${socket.conn.transport?.name || 'unknown'}`);
    console.error(`[SOCKET]   Origin: ${clientOrigin}`);
    console.error(`[SOCKET] =========================================`);
  });

  // Log when client closes connection
  socket.conn.on("close", (reason) => {
    console.log(`[SOCKET] 🔌 Connection closed for ${socket.id}`);
    console.log(`[SOCKET]   Reason: ${reason}`);
    console.log(`[SOCKET]   Final transport: ${socket.conn.transport?.name || 'closed'}`);
  });
  
  // Log upgrade errors (if websocket upgrade fails, polling continues)
  socket.conn.on("upgradeError", (err) => {
    console.warn(`[SOCKET] ⚠️ ========== UPGRADE FAILED ==========`);
    console.warn(`[SOCKET]   Socket ID: ${socket.id}`);
    console.warn(`[SOCKET]   Error:`, err.message || err);
    console.warn(`[SOCKET]   Staying on polling transport`);
    console.warn(`[SOCKET]   This is OK - connection will continue to work`);
    console.warn(`[SOCKET] =====================================`);
  });

  function emitError(message) {
    socket.emit("room:error", { message });
  }

  socket.on("room:create", ({ name }) => {
    try {
      const room = createRoom();
      const player = { id: socket.id, name: name?.trim() || "Player", ready: false, isHost: true };
      room.players.push(player);
      room.updatedAt = Date.now();
      socket.join(room.code);
      console.log(`[ROOM] Created ${room.code} by ${socket.id} (${name?.trim() || "Player"})`);
      
      // Emit room state to all players in the room (including creator)
      const roomState = getRoomState(room.code);
      io.to(room.code).emit("room:state", roomState);
      console.log(`[ROOM] Sent room state for ${room.code}:`, roomState);
    } catch (err) {
      console.error("[ROOM] Error creating room:", err);
      emitError("Failed to create room. Please try again.");
    }
  });

  socket.on("room:join", ({ code, name }) => {
    try {
      const roomCode = (code || "").toUpperCase();
      const room = rooms.get(roomCode);
      if (!room) {
        console.log(`[ROOM] Join failed: Room ${roomCode} not found`);
        return emitError("Room not found");
      }
      if (room.started) {
        console.log(`[ROOM] Join failed: Room ${roomCode} already started`);
        return emitError("Game already started");
      }
      if (room.players.length >= MAX_PLAYERS) {
        console.log(`[ROOM] Join failed: Room ${roomCode} is full`);
        return emitError("Room full");
      }
      if (room.players.find((p) => p.id === socket.id)) {
        console.log(`[ROOM] Join failed: ${socket.id} already in room ${roomCode}`);
        return emitError("Already in room");
      }
      const player = { id: socket.id, name: name?.trim() || "Player", ready: false, isHost: false };
      room.players.push(player);
      room.updatedAt = Date.now();
      socket.join(room.code);
      console.log(`[ROOM] ${socket.id} (${name?.trim() || "Player"}) joined ${room.code}`);
      
      // Emit updated room state to all players in the room
      const roomState = getRoomState(room.code);
      io.to(room.code).emit("room:state", roomState);
      console.log(`[ROOM] Sent updated room state for ${room.code}:`, roomState);
    } catch (err) {
      console.error("[ROOM] Error joining room:", err);
      emitError("Failed to join room. Please try again.");
    }
  });

  socket.on("room:setReady", ({ code, ready }) => {
    const room = rooms.get((code || "").toUpperCase());
    if (!room) return emitError("Room not found");
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return emitError("Player not in room");
    player.ready = !!ready;
    room.updatedAt = Date.now();
    io.to(room.code).emit("room:state", getRoomState(room.code));
  });

  socket.on("room:start", ({ code }) => {
    const room = rooms.get((code || "").toUpperCase());
    if (!room) return emitError("Room not found");
    const player = room.players.find((p) => p.id === socket.id);
    if (!player || !player.isHost) return emitError("Only host can start");
    if (room.players.length < 2) return emitError("Need at least 2 players");
    if (!room.players.every((p) => p.ready)) return emitError("All players must be ready");
    room.started = true;
    room.updatedAt = Date.now();
    console.log(`[ROOM] ${room.code} started by host ${socket.id}`);
    io.to(room.code).emit("room:state", getRoomState(room.code));
    io.to(room.code).emit("room:started", { code: room.code });
  });

  socket.on("disconnect", (reason) => {
    const code = removePlayerFromRooms(socket.id);
    if (code) {
      console.log(`[SOCKET] 🚪 Player ${socket.id} left room ${code}`);
      io.to(code).emit("room:state", getRoomState(code));
    }
    console.log(`[SOCKET] ❌ Socket disconnected: ${socket.id}`);
    console.log(`[SOCKET]   Reason: ${reason}`);
    console.log(`[SOCKET]   Final transport: ${socket.conn.transport?.name || 'closed'}`);
  });

  // Log socket-level errors
  socket.on("error", (error) => {
    console.error(`[SOCKET] ❌ Socket error for ${socket.id}:`, error.message || error);
  });
});

// ==================== STATIC FILE SERVING ====================

const path = require("path");

// Serve static files (but exclude Socket.IO paths)
// CRITICAL: Socket.IO requests must NOT be handled by Express middleware
const staticMiddleware = express.static(path.join(__dirname, "../client/build"));
app.use((req, res, next) => {
  // Skip Socket.IO requests - they're handled by the Socket.IO server attached to the HTTP server
  if (req.path.startsWith("/socket.io")) {
    return next(); // Pass to next middleware (but Socket.IO will intercept at HTTP server level)
  }
  staticMiddleware(req, res, next);
});

// Catch-all route for React SPA (but exclude Socket.IO paths)
// CRITICAL: This must NOT intercept /socket.io requests
app.get("*", (req, res, next) => {
  // Don't handle Socket.IO requests - they're handled by Socket.IO server
  // Socket.IO intercepts these at the HTTP server level, before Express routes
  // If a Socket.IO request reaches here, something is misconfigured
  if (req.path.startsWith("/socket.io")) {
    console.error(`[SERVER] ❌ ERROR: Socket.IO request reached Express catch-all: ${req.path}`);
    console.error(`[SERVER] This should not happen - Socket.IO should intercept before Express`);
    // Don't send a response - let Socket.IO handle it (or return 404)
    // Actually, if we're here, Socket.IO didn't handle it, so return 404
    return res.status(404).json({ error: "Socket.IO endpoint not found" });
  }
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`✅ ========== Server Started ==========`);
  console.log(`✅ Slip Game server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CLIENT_ORIGIN env: ${process.env.CLIENT_ORIGIN || 'Not set (using defaults)'}`);
  console.log(`📡 Socket.IO transports: polling (default), websocket (upgrade)`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? "Configured" : "Not Configured (mock mode)"}`);
  console.log(`✅ ===================================`);
  console.log(`✅ Ready to accept Socket.IO connections`);
  console.log(`✅ Expected origin: https://slip-server-1.onrender.com`);
});
