import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.YAHOO_API_KEY; // RapidAPI key
const API_HOST = 'apidojo-yahoo-finance-v1.p.rapidapi.com';

export async function getYahooNews(limit = 3) {
  try {
    const response = await fetch(
      `https://${API_HOST}/stock/get-news?region=US&symbol=NVDA`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': API_KEY,
          'X-RapidAPI-Host': API_HOST
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items || [];

    return items.slice(0, limit).map(item => ({
      title: item.title || 'No title',
      link: item.link || '',
      summary: item.summary || '',
      provider: item.publisher || 'Yahoo Finance'
    }));
  } catch (error) {
    console.error('Error fetching NVIDIA news from Yahoo Finance:', error.message || error);
    return []; // Return empty array on error
  }
}

