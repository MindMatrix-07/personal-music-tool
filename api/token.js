export default async function handler(req, res) {
  const cookies = req.headers.cookie || "";
  const refresh = cookies
    .split("; ")
    .find(row => row.startsWith("spotify_refresh="))
    ?.split("=")[1];

  if (!refresh) {
    res.status(401).json({ error: "Not logged in" });
    return;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refresh,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  });

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const data = await r.json();
  res.json({ access_token: data.access_token });
}
