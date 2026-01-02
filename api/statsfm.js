export default async function handler(req, res) {
  const { title, artist, spotifyId } = req.query;

  if (!title || !artist) {
    res.status(400).json({ error: "Missing title or artist" });
    return;
  }

  try {
    // Stats.fm doesn't have a public API, but we can try to get data from their public pages
    // Alternative: Use Spotify's audio features API which provides similar data
    // For now, we'll use Spotify's audio features if we have a track ID
    
    if (spotifyId) {
      // Get Spotify access token
      const cookies = req.headers.cookie || "";
      const refresh = cookies
        .split("; ")
        .find(row => row.startsWith("spotify_refresh="))
        ?.split("=")[1];

      if (refresh) {
        const tokenBody = new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refresh,
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET
        });

        const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: tokenBody
        });

        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          
          // Get audio features from Spotify
          const featuresResponse = await fetch(
            `https://api.spotify.com/v1/audio-features/${spotifyId}`,
            {
              headers: { Authorization: "Bearer " + tokenData.access_token }
            }
          );

          if (featuresResponse.ok) {
            const features = await featuresResponse.json();
            
            // Get track info for additional stats
            const trackResponse = await fetch(
              `https://api.spotify.com/v1/tracks/${spotifyId}`,
              {
                headers: { Authorization: "Bearer " + tokenData.access_token }
              }
            );

            let popularity = 0;
            if (trackResponse.ok) {
              const trackData = await trackResponse.json();
              popularity = trackData.popularity || 0;
            }

            res.json({
              bpm: Math.round(features.tempo || 0),
              key: getKeyName(features.key, features.mode),
              energy: Math.round((features.energy || 0) * 100),
              danceability: Math.round((features.danceability || 0) * 100),
              valence: Math.round((features.valence || 0) * 100),
              acousticness: Math.round((features.acousticness || 0) * 100),
              instrumentalness: Math.round((features.instrumentalness || 0) * 100),
              liveness: Math.round((features.liveness || 0) * 100),
              speechiness: Math.round((features.speechiness || 0) * 100),
              timeSignature: features.time_signature || 4,
              duration: features.duration_ms || 0,
              popularity: popularity,
              source: 'spotify'
            });
            return;
          }
        }
      }
    }

    // Fallback: Return message that stats.fm requires Spotify track ID
    res.json({ 
      error: 'Stats.fm data requires Spotify track ID',
      message: 'Spotify track ID needed for audio features'
    });
  } catch (error) {
    console.error('Stats.fm API error:', error);
    res.json({ error: error.message });
  }
}

function getKeyName(key, mode) {
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const modeNames = ['minor', 'major'];
  const keyName = keys[key] || 'Unknown';
  const modeName = modeNames[mode] || 'major';
  return `${keyName} ${modeName}`;
}

