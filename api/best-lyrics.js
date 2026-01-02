export default async function handler(req, res) {
  const { title, artist } = req.query;

  if (!title || !artist) {
    res.status(400).json({ error: "Missing title or artist" });
    return;
  }

  try {
    const results = [];
    
    // 1. Try LRCLib first (usually most reliable)
    try {
      const cleanTitle = title.replace(/\([^)]*\)/g, '').trim();
      const cleanArtist = artist.split(',')[0].trim();
      const searchQuery = `${cleanTitle} ${cleanArtist}`;
      
      const lrclibResponse = await fetch(
        `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}&limit=3`
      );
      
      if (lrclibResponse.ok) {
        const lrclibData = await lrclibResponse.json();
        if (lrclibData && lrclibData.length > 0) {
          // Find best match
          const match = lrclibData.find(track => 
            track.artistName && track.artistName.toLowerCase().includes(cleanArtist.toLowerCase())
          ) || lrclibData[0];
          
          if (match.plainLyrics || match.syncedLyrics) {
            const lyrics = match.plainLyrics || match.syncedLyrics.replace(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/g, '').trim();
            if (lyrics && lyrics.length > 50) { // Minimum length check
              results.push({
                source: 'LRCLib',
                lyrics: lyrics,
                score: calculateScore(lyrics, title, artist),
                synced: !!match.syncedLyrics
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('LRCLib error:', e);
    }

    // 2. Try Lyrics.ovh (free lyrics API)
    try {
      const lyricsOvhResponse = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`
      );
      
      if (lyricsOvhResponse.ok) {
        const lyricsOvhData = await lyricsOvhResponse.json();
        if (lyricsOvhData.lyrics && lyricsOvhData.lyrics.length > 50) {
          const cleanLyrics = lyricsOvhData.lyrics
            .replace(/Paroles de la chanson.*?par.*?\n/g, '')
            .replace(/Lyrics.*?\n/g, '')
            .trim();
          
          results.push({
            source: 'Lyrics.ovh',
            lyrics: cleanLyrics,
            score: calculateScore(cleanLyrics, title, artist)
          });
        }
      }
    } catch (e) {
      console.error('Lyrics.ovh error:', e);
    }

    // 3. Try Musixmatch (via alternative API)
    try {
      const musixmatchResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?apikey=${process.env.MUSIXMATCH_API_KEY || ''}&q_track=${encodeURIComponent(title)}&q_artist=${encodeURIComponent(artist)}&format=json`
      );
      
      if (musixmatchResponse.ok && process.env.MUSIXMATCH_API_KEY) {
        const musixmatchData = await musixmatchResponse.json();
        if (musixmatchData.message?.body?.lyrics?.lyrics_body) {
          const lyrics = musixmatchData.message.body.lyrics.lyrics_body;
          if (lyrics && !lyrics.includes('******* This Lyrics is NOT for Commercial use *******') && lyrics.length > 50) {
            results.push({
              source: 'Musixmatch',
              lyrics: lyrics.trim(),
              score: calculateScore(lyrics, title, artist)
            });
          }
        }
      }
    } catch (e) {
      console.error('Musixmatch error:', e);
    }

    // 4. Try AZLyrics scraping (as fallback, requires parsing)
    // Note: This would require HTML parsing, skipping for now

    // Select best result based on score
    if (results.length > 0) {
      results.sort((a, b) => b.score - a.score);
      const best = results[0];
      
      res.json({
        lyrics: best.lyrics,
        source: best.source,
        allSources: results.map(r => ({ source: r.source, score: r.score })),
        synced: best.synced || false
      });
    } else {
      res.json({ 
        error: 'No lyrics found from any source',
        tried: ['LRCLib', 'Lyrics.ovh', 'Musixmatch']
      });
    }
  } catch (error) {
    console.error('Best lyrics API error:', error);
    res.json({ error: error.message });
  }
}

function calculateScore(lyrics, title, artist) {
  let score = 0;
  
  // Base score from length (longer is generally better)
  score += Math.min(lyrics.length / 10, 50);
  
  // Check if title appears in lyrics (good sign)
  if (lyrics.toLowerCase().includes(title.toLowerCase())) {
    score += 20;
  }
  
  // Check if artist appears in lyrics
  const artistParts = artist.toLowerCase().split(/[,\s&]+/);
  artistParts.forEach(part => {
    if (part.length > 2 && lyrics.toLowerCase().includes(part)) {
      score += 10;
    }
  });
  
  // Penalize very short lyrics
  if (lyrics.length < 100) {
    score -= 30;
  }
  
  // Bonus for structured lyrics (has line breaks, verses)
  const lineCount = lyrics.split('\n').length;
  if (lineCount > 10) {
    score += 15;
  }
  
  // Penalize placeholder text
  if (lyrics.toLowerCase().includes('lyrics not available') || 
      lyrics.toLowerCase().includes('instrumental')) {
    score -= 50;
  }
  
  return Math.max(0, score);
}

