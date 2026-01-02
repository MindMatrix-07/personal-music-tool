export default async function handler(req, res) {
  const { title, artist } = req.query;

  if (!title || !artist) {
    res.status(400).json({ error: "Missing title or artist" });
    return;
  }

  try {
    // Search Genius for the song
    const searchQuery = `${title} ${artist}`;
    const searchResponse = await fetch(
      `https://api.genius.com/search?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.GENIUS_ACCESS_TOKEN || ''}`
        }
      }
    );

    if (!searchResponse.ok) {
      // If Genius API fails, return null to fallback to LRCLib
      res.json({ lyrics: null, source: 'genius', error: 'Genius API unavailable' });
      return;
    }

    const searchData = await searchResponse.json();
    
    if (searchData.response && searchData.response.hits && searchData.response.hits.length > 0) {
      const songUrl = searchData.response.hits[0].result.url;
      
      // Note: To get full lyrics, you'd need to scrape the Genius page
      // For now, return the URL. Full implementation would require:
      // 1. Fetching the page HTML
      // 2. Parsing the lyrics from the page
      // This is better done server-side to avoid CORS issues
      
      res.json({ 
        lyrics: null, 
        url: songUrl,
        source: 'genius',
        message: 'Genius lyrics require page scraping. URL provided.'
      });
    } else {
      res.json({ lyrics: null, source: 'genius', error: 'Song not found' });
    }
  } catch (error) {
    console.error('Genius API error:', error);
    res.json({ lyrics: null, source: 'genius', error: error.message });
  }
}

