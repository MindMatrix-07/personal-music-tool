export default async function handler(req, res) {
  const { title, artist, spotifyId } = req.query;

  console.log('Spotify Info API called with:', { title, artist, spotifyId });

  if (!spotifyId || spotifyId === 'null' || spotifyId === 'undefined') {
    res.status(400).json({ error: "Spotify track ID is required" });
    return;
  }

  try {
    // Get Spotify access token
    const cookies = req.headers.cookie || "";
    const refresh = cookies
      .split("; ")
      .find(row => row.startsWith("spotify_refresh="))
      ?.split("=")[1];

    let accessToken = null;

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
        accessToken = tokenData.access_token;
      }
    }

    // Fallback to Client Credentials Flow if no refresh token or refresh failed
    if (!accessToken && process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
      console.log('Attempting Client Credentials flow...');
      const tokenBody = new URLSearchParams({
        grant_type: "client_credentials",
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
        accessToken = tokenData.access_token;
      } else {
        console.error('Client Credentials flow failed:', await tokenResponse.text());
      }
    }

    if (!accessToken) {
      res.status(401).json({ error: "Failed to authenticate with Spotify. Please login or check server configuration." });
      return;
    }

    // Get audio features from Spotify
    const featuresResponse = await fetch(
      `https://api.spotify.com/v1/audio-features/${spotifyId}`,
      {
        headers: { Authorization: "Bearer " + accessToken }
      }
    );

    if (!featuresResponse.ok) {
      res.status(featuresResponse.status).json({ 
        error: "Failed to fetch audio features",
        details: await featuresResponse.text().catch(() => '')
      });
      return;
    }

    const features = await featuresResponse.json();

    // Get track info for additional stats
    const trackResponse = await fetch(
      `https://api.spotify.com/v1/tracks/${spotifyId}`,
      {
        headers: { Authorization: "Bearer " + accessToken }
      }
    );

    let trackData = null;
    if (trackResponse.ok) {
      trackData = await trackResponse.json();
    }

    // Get album info if available
    let albumData = null;
    if (trackData && trackData.album && trackData.album.id) {
      const albumResponse = await fetch(
        `https://api.spotify.com/v1/albums/${trackData.album.id}`,
        {
          headers: { Authorization: "Bearer " + accessToken }
        }
      );
      if (albumResponse.ok) {
        albumData = await albumResponse.json();
      }
    }

    // Get artist info if available
    let artistData = null;
    if (trackData && trackData.artists && trackData.artists.length > 0) {
      const artistId = trackData.artists[0].id;
      const artistResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
          headers: { Authorization: "Bearer " + accessToken }
        }
      );
      if (artistResponse.ok) {
        artistData = await artistResponse.json();
      }
    }

    // Combine all data
    const result = {
      // Audio features
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
      
      // Track info
      popularity: trackData?.popularity || 0,
      explicit: trackData?.explicit || false,
      releaseDate: trackData?.album?.release_date || null,
      albumName: trackData?.album?.name || null,
      albumType: trackData?.album?.album_type || null,
      totalTracks: trackData?.album?.total_tracks || null,
      
      // Artist info
      artistGenres: artistData?.genres || [],
      artistFollowers: artistData?.followers?.total || null,
      artistPopularity: artistData?.popularity || null,
      
      // Album info
      albumGenres: albumData?.genres || [],
      label: albumData?.label || null,
      
      source: 'spotify',
      spotifyId: spotifyId
    };

    res.json(result);
  } catch (error) {
    console.error('Spotify Info API error:', error);
    res.status(500).json({ error: error.message });
  }
}

function getKeyName(key, mode) {
  if (key === -1 || key === null || key === undefined) {
    return 'Unknown';
  }
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const modeNames = ['minor', 'major'];
  const keyName = keys[key] || 'Unknown';
  const modeName = modeNames[mode] || 'major';
  return `${keyName} ${modeName}`;
}

