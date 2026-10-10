const OpenAI = require("openai");

const apiKey = process.env.OPENAI_API_KEY;

// Validate key presence
if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY is missing. Add it to server/.env"
  );
}

// Validate key is not a placeholder
if (
  apiKey.includes("your_real") ||
  apiKey.includes("replace_with") ||
  apiKey.length < 20
) {
  throw new Error(
    "OPENAI_API_KEY appears invalid. Check your server/.env file."
  );
}

const openai = new OpenAI({ apiKey });

module.exports = openai;
