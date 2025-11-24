import readlineSync from 'readline-sync';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { getYahooNews } from './fetchNews/yahooNews.js';
import { getGoogleNews } from './fetchNews/googleNews.js';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function fetchAllNews() {
  const results = await Promise.allSettled([
    getYahooNews(),
    getGoogleNews()
  ]);

  let allNews = [];
  
  results.forEach((result, index) => {
    const source = index === 0 ? 'Yahoo Finance' : 'Google News';
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allNews = [...allNews, ...result.value];
      console.log(`✓ Fetched ${result.value.length} articles from ${source}`);
    } else {
      console.warn(`✗ Failed to fetch from ${source}`);
    }
  });

  return allNews;
}

async function main() {
  console.log("Welcome to the NVIDIA/Semiconductor Chatbot powered by GoSense!");
  console.log("Type 'exit' to quit, 'refresh' to reload news.\n");

  const chatHistory = [];
  let cachedNews = [];
  let lastFetchTime = null;

  // Initial news fetch
  console.log("Fetching latest news...");
  cachedNews = await fetchAllNews();
  lastFetchTime = Date.now();
  console.log(`Total articles: ${cachedNews.length}\n`);

  while (true) {
    const userInput = readlineSync.question("You: ");

    if (userInput.toLowerCase() === "exit") {
      console.log("Goodbye!");
      break;
    }

    if (userInput.toLowerCase() === "refresh") {
      console.log("\nRefreshing news...");
      cachedNews = await fetchAllNews();
      lastFetchTime = Date.now();
      console.log(`Total articles: ${cachedNews.length}\n`);
      continue;
    }

    // Auto-refresh if news is older than 30 minutes
    if (lastFetchTime && (Date.now() - lastFetchTime) > 30 * 60 * 1000) {
      console.log("\n[Auto-refreshing news...]");
      cachedNews = await fetchAllNews();
      lastFetchTime = Date.now();
    }

    const contextText = cachedNews.length
      ? cachedNews.map((n, i) => `[${i+1}] ${n.title}: ${n.summary} (${n.provider})`).join('\n')
      : 'No recent news available.';

    const messages = [
      {
        role: "system",
        content: `You are an expert R&D investment advisor for semiconductor companies.
Use the news context to provide actionable recommendations for optimizing R&D investments.
Focus on: emerging technologies, competitive positioning, market opportunities, risk assessment, and resource allocation.
Cite news snippets using [number] format.
If asked about non-NVIDIA/semiconductor topics, politely redirect to your expertise area.`
      },
      { role: "system", content: `News Context:\n${contextText}` },
      ...chatHistory.map(([role, content]) => ({ role, content })),
      { role: "user", content: userInput }
    ];

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 800
      });

      const answer = completion.choices[0].message.content;
      console.log("\nBot:", answer);

      // Show sources if news was used
      if (cachedNews.length && answer.match(/\[\d+\]/)) {
        console.log("\n📰 Referenced Sources:");
        const citedNumbers = [...answer.matchAll(/\[(\d+)\]/g)].map(m => parseInt(m[1]));
        const uniqueCited = [...new Set(citedNumbers)].sort((a, b) => a - b);
        
        uniqueCited.forEach(num => {
          const article = cachedNews[num - 1];
          if (article) {
            console.log(`  [${num}] ${article.title}`);
            console.log(`      ${article.link}`);
          }
        });
      }

      chatHistory.push(["user", userInput]);
      chatHistory.push(["assistant", answer]);

      // Keep chat history manageable (last 10 exchanges)
      if (chatHistory.length > 20) {
        chatHistory.splice(0, 2);
      }

    } catch (error) {
      if (error.status === 429) {
        console.error("\n⚠️  OpenAI rate limit exceeded. Please wait and try again.");
      } else if (error.status === 401) {
        console.error("\n⚠️  Invalid OpenAI API key. Check your .env file.");
      } else {
        console.error("\n⚠️  Error:", error.message);
      }
    }

    console.log(); // Empty line for readability
  }
}

main().catch(console.error);