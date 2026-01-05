export default async function handler(req, res) {
  const { title, artist } = req.query;

  if (!title || !artist) {
    res.status(400).json({ error: "Title and Artist are required" });
    return;
  }

  const query = `${title} ${artist}`;
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`iTunes API failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.resultCount === 0) {
      res.status(404).json({ error: "Song not found on Apple Music" });
      return;
    }

    const track = data.results[0];

    // Map iTunes format to our app's format
    const songInfo = {
      title: track.trackName,
      artist: track.artistName,
      albumName: track.collectionName,
      cover: track.artworkUrl100.replace('100x100', '600x600'),
      releaseDate: track.releaseDate.split('T')[0], // Format YYYY-MM-DD
      artistGenres: [track.primaryGenreName],
      previewUrl: track.previewUrl,
      totalTracks: track.trackCount,
      explicit: track.trackExplicitness === 'explicit',
      duration: track.trackTimeMillis,
      // Audio features are not available in iTunes Search API
      bpm: null,
      key: null,
      energy: null,
      danceability: null,
      valence: null,
      source: 'apple_music'
    };

    res.status(200).json(songInfo);

  } catch (error) {
    console.error('Apple Music API error:', error);
    res.status(500).json({ error: "Failed to fetch from Apple Music" });
  }
}
