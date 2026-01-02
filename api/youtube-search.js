export default async function handler(req, res) {
  const q = req.query.q;

  if (!q) {
    res.status(400).json({ error: "Missing query" });
    return;
  }

  const r = await fetch(
    `https://www.googleapis.com/youtube/v3/search?` +
    `part=snippet&type=video&maxResults=5&q=${encodeURIComponent(q)}` +
    `&key=${process.env.YOUTUBE_API_KEY}`
  );

  const data = await r.json();
  res.json(data);
}
