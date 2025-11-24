
import Parser from 'rss-parser';
const parser = new Parser();

export async function getYahooNews(limit = 5) {
  try {
    const feed = await parser.parseURL("https://finance.yahoo.com/rss/headline?s=NVDA");
    if (!feed.items || feed.items.length === 0) return [];

    return feed.items.slice(0, limit).map((item, index) => ({
      title: item.title || `Untitled Article ${index + 1}`,
      link: item.link || '',
      summary: item.contentSnippet || item.content || '',
      provider: 'Yahoo Finance'
    }));
  } catch (err) {
    console.error("Failed to fetch Yahoo RSS:", err.message);
    return [];
  }
}

