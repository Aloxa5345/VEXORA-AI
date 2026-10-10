const openai = require("../config/openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");

const SYSTEM_PROMPT =
  "You are VEXORA AI, a helpful AI developer assistant. Help with programming, debugging, SQL, web development, software testing, and project architecture. Be clear, concise, and friendly.";

// ── Gemini fallback client (lazy-init so env is always fresh) ──
function getGeminiModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    systemInstruction: SYSTEM_PROMPT,
  });
}

// ── Helper: call Gemini with aggressive retry on 503 ─────
const askGemini = async (message, retries = 5, delayMs = 1500) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const model = getGeminiModel();
      const result = await model.generateContent(message);
      return result.response.text();
    } catch (err) {
      const is503 = err.status === 503 || err.message?.includes("503");
      const is429 = err.status === 429 || err.message?.includes("429");
      if ((is503 || is429) && attempt < retries) {
        console.warn(`⚠️ Gemini attempt ${attempt}/${retries} failed (${err.status}), retrying in ${delayMs}ms…`);
        await new Promise(r => setTimeout(r, delayMs));
        delayMs = Math.min(delayMs * 2, 10000); // cap at 10s
      } else {
        throw err;
      }
    }
  }
};

// ── PUBLIC: POST /api/chat ────────────────────────────────
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;

    // Input validation
    if (typeof message !== "string") {
      return res.status(400).json({
        success: false,
        message: "Message must be a string",
      });
    }

    const cleanMessage = message.trim();

    if (!cleanMessage) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (cleanMessage.length > 4000) {
      return res.status(400).json({
        success: false,
        message: "Message cannot exceed 4000 characters",
      });
    }

    let reply = null;

    // ── Try OpenAI first ──────────────────────────────────
    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: cleanMessage },
        ],
        max_tokens: 1000,
      });
      reply = response.choices[0].message.content;
      console.log("✅ OpenAI response received");

    } catch (openaiError) {
      const code = openaiError?.status;
      // 429 = no credits / rate limit, 401 = invalid key — both fall through to Gemini
      if (code === 429 || code === 401) {
        console.warn(`⚠️ OpenAI unavailable (${code}), falling back to Gemini…`);
      } else {
        console.warn("⚠️ OpenAI failed, trying Gemini fallback:", openaiError?.message);
      }

      // ── Fallback to Gemini ────────────────────────────
      try {
        reply = await askGemini(cleanMessage);
        console.log("✅ Gemini fallback response received");
      } catch (geminiError) {
        console.error("❌ Both AI providers failed:", geminiError?.message);
        throw new Error("ALL_AI_FAILED");
      }
    }

    return res.status(200).json({
      success: true,
      reply,
    });

  } catch (error) {
    // Handle known status codes
    if (error.status === 401) {
      return res.status(500).json({
        success: false,
        message: "AI API key is invalid or unauthorized",
      });
    }

    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: "AI usage limit reached. Please try again later.",
      });
    }

    if (error.message === "ALL_AI_FAILED") {
      return res.status(503).json({
        success: false,
        message: "AI service temporarily unavailable. Please try again.",
      });
    }

    console.error("Chat Error:", error?.message);
    return res.status(500).json({
      success: false,
      message: "AI response failed",
    });
  }
};

// ── Save message to DB (auth required) ───────────────────
const saveMessage = async (req, res) => {
  const { session_id, role, message } = req.body;
  const user_id = req.user.id;

  if (!session_id || !role || !message) {
    return res.status(400).json({
      message: "session_id, role, and message are required.",
    });
  }

  try {
    await db.query(
      "INSERT INTO chat_history (user_id, session_id, role, message) VALUES (?, ?, ?, ?)",
      [user_id, session_id, role, message]
    );
    res.status(201).json({ message: "Message saved." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// ── Get chat history by session ───────────────────────────
const getChatHistory = async (req, res) => {
  const { session_id } = req.params;
  const user_id = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT * FROM chat_history WHERE user_id = ? AND session_id = ? ORDER BY created_at ASC",
      [user_id, session_id]
    );
    res.json({ history: rows });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

// ── Get all sessions for user ─────────────────────────────
const getUserSessions = async (req, res) => {
  const user_id = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT DISTINCT session_id, MIN(created_at) as started_at FROM chat_history WHERE user_id = ? GROUP BY session_id ORDER BY started_at DESC",
      [user_id]
    );
    res.json({ sessions: rows });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
};

module.exports = { sendMessage, saveMessage, getChatHistory, getUserSessions };
