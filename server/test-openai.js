require("dotenv").config();

const openai = require("./config/openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ── Test OpenAI ───────────────────────────────────────────
async function testOpenAI() {
  console.log("\n🔵 Testing OpenAI...");
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "user", content: "Reply with exactly: OpenAI API key is working" }
      ],
      max_tokens: 20,
    });
    console.log("✅ OpenAI OK:", response.choices[0].message.content);
    return true;
  } catch (error) {
    if (error.status === 401) {
      console.error("❌ OpenAI FAILED: Invalid or unauthorized API key");
    } else if (error.status === 429) {
      console.error("❌ OpenAI FAILED: Rate limit or billing quota reached");
    } else {
      console.error("❌ OpenAI FAILED:", error.message);
    }
    return false;
  }
}

// ── Test Gemini ───────────────────────────────────────────
async function testGemini() {
  console.log("\n🟢 Testing Gemini...");
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey || geminiKey.includes("replace_with")) {
    console.warn("⚠️  Gemini SKIPPED: GEMINI_API_KEY not set");
    return false;
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
    const result = await model.generateContent(
      "Reply with exactly: Gemini API key is working"
    );
    console.log("✅ Gemini OK:", result.response.text());
    return true;
  } catch (error) {
    console.error("❌ Gemini FAILED:", error.message);
    return false;
  }
}

// ── Run all tests ─────────────────────────────────────────
async function runTests() {
  console.log("============================================");
  console.log("  VEXORA AI — AI Provider Test");
  console.log("============================================");

  const openaiOK = await testOpenAI();
  const geminiOK = await testGemini();

  console.log("\n============================================");
  console.log("  RESULTS");
  console.log("============================================");
  console.log(`OpenAI : ${openaiOK ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`Gemini : ${geminiOK ? "✅ PASS" : "❌ FAIL"}`);

  if (openaiOK) {
    console.log("\n🎯 Primary AI (OpenAI) is ready!");
  } else if (geminiOK) {
    console.log("\n🎯 Fallback AI (Gemini) is ready!");
  } else {
    console.error("\n🚨 Both AI providers failed. Check your API keys in .env");
    process.exitCode = 1;
  }
}

runTests();
