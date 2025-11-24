
import Parser from 'rss-parser';
const parser = new Parser();

export async function getGoogleNews(limit = 3) {
  try {
    const feed = await parser.parseURL(
      'https://news.google.com/rss/search?q=NVIDIA+semiconductor&hl=en-US&gl=US&ceid=US:en'
    );

    const items = feed.items || [];

    return items.slice(0, limit).map(item => ({
      title: item.title || 'No title',
      link: item.link || '',
      summary: item.contentSnippet || '',
      provider: item.source || 'Google News'
    }));
  } catch (error) {
    console.error('Error fetching Google News:', error.message || error);
    return [];
  }
}
