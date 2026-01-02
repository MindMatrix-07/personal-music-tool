export default async function handler(req, res) {
  const { title, artist } = req.query;

  if (!title || !artist) {
    res.status(400).json({ error: "Missing title or artist" });
    return;
  }

  try {
    // Tunebat/Songstats API endpoint
    // Note: This requires API key from tunebat.com/API
    const apiKey = process.env.TUNEBAT_API_KEY || '';
    
    if (!apiKey) {
      // Fallback: Try to search Tunebat website (limited without API)
      res.json({ 
        error: 'Tunebat API key not configured',
        message: 'Add TUNEBAT_API_KEY to environment variables'
      });
      return;
    }

    // Search for track using Songstats API
    const searchQuery = `${title} ${artist}`;
    const response = await fetch(
      `https://api.songstats.com/v1/tracks/search?q=${encodeURIComponent(searchQuery)}&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      res.json({ error: 'Tunebat API request failed', status: response.status });
      return;
    }

    const data = await response.json();
    
    if (data.tracks && data.tracks.length > 0) {
      const track = data.tracks[0];
      res.json({
        bpm: track.bpm,
        key: track.key,
        energy: track.energy,
        danceability: track.danceability,
        valence: track.valence,
        acousticness: track.acousticness,
        instrumentalness: track.instrumentalness,
        liveness: track.liveness,
        speechiness: track.speechiness,
        tempo: track.tempo,
        timeSignature: track.time_signature,
        mode: track.mode,
        duration: track.duration_ms
      });
    } else {
      res.json({ error: 'Track not found on Tunebat' });
    }
  } catch (error) {
    console.error('Tunebat API error:', error);
    res.json({ error: error.message });
  }
}

