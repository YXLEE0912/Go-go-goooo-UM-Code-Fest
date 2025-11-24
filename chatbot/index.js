
import readlineSync from 'readline-sync';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getYahooNews } from './fetchNews/yahooNews.js';
import { getGoogleNews } from './fetchNews/googleNews.js';

dotenv.config();

const NEWS_REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const MAX_CHAT_HISTORY = 20;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function fetchAllNews() {
  const results = await Promise.allSettled([getYahooNews(), getGoogleNews()]);
  let allNews = [];

  results.forEach((res, idx) => {
    const sourceName = idx === 0 ? "Yahoo Finance" : "Google News";
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      allNews.push(...res.value);
      console.log(`✓ Fetched ${res.value.length} articles from ${sourceName}`);
    } else {
      console.warn(`✗ Failed to fetch from ${sourceName}`);
    }
  });

  if (allNews.length === 0) console.warn("⚠️ No news fetched. Context will be empty.");
  return allNews;
}

async function main() {
  console.log("Welcome to the NVIDIA/Semiconductor Chatbot powered by Gemini 2.5 Flash!");
  console.log("Type 'exit' to quit, 'refresh' to reload news.\n");

  const chatHistory = [];
  let cachedNews = await fetchAllNews();
  let lastFetchTime = Date.now();

  console.log(`Total articles fetched: ${cachedNews.length}\n`);

  while (true) {
    const userInput = readlineSync.question("You: ").trim();

    if (userInput.toLowerCase() === "exit") {
      console.log("Goodbye!");
      break;
    }

    if (userInput.toLowerCase() === "refresh" || (Date.now() - lastFetchTime) > NEWS_REFRESH_INTERVAL) {
      console.log("\n[Refreshing news...]");
      cachedNews = await fetchAllNews();
      lastFetchTime = Date.now();
      console.log(`Total articles fetched: ${cachedNews.length}\n`);
      if (userInput.toLowerCase() === "refresh") continue;
    }

    const contextText = cachedNews.length
      ? cachedNews.map((n, i) => `[${i + 1}] ${n.title}: ${n.summary} (${n.provider})`).join("\n")
      : "No recent news available.";

    const systemPrompt = `
You are an expert R&D investment advisor for semiconductor companies.
Use the news context to provide actionable recommendations for optimizing R&D investments.
Focus on: emerging technologies, competitive positioning, market opportunities, risk assessment, and resource allocation.
Cite news snippets using [number] format.
If asked about non-NVIDIA/semiconductor topics, politely redirect to your expertise area.
News Context:
${contextText}
`;

    const geminiHistory = [
      { role: "user", parts: [{ text: systemPrompt }] },
      ...chatHistory.map(([role, content]) => ({
        role: role === "assistant" ? "model" : "user",
        parts: [{ text: content }]
      })),
      { role: "user", parts: [{ text: userInput }] }
    ];

    try {
      const result = await model.generateContent({ contents: geminiHistory });
      const answer = result.response?.text() || "⚠️ No response generated.";

      console.log("\nBot:", answer);

      // Show cited news
      if (cachedNews.length && /\[\d+\]/.test(answer)) {
        console.log("\n📰 Referenced Sources:");
        [...answer.matchAll(/\[(\d+)\]/g)]
          .map(m => parseInt(m[1]))
          .filter((v, i, arr) => arr.indexOf(v) === i) // unique
          .sort((a, b) => a - b)
          .forEach(num => {
            const article = cachedNews[num - 1];
            if (article) console.log(`  [${num}] ${article.title} - ${article.link}`);
          });
      }

      chatHistory.push(["user", userInput]);
      chatHistory.push(["assistant", answer]);

      if (chatHistory.length > MAX_CHAT_HISTORY) chatHistory.splice(0, 2);

    } catch (err) {
      console.error("⚠️ Gemini generateContent error:", err.message);
    }

    console.log();
  }
}

main().catch(console.error);

