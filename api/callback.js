export default async function handler(req, res) {
  const code = req.query.code;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET
  });

  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const data = await r.json();

  res.setHeader(
    "Set-Cookie",
    `spotify_refresh=${data.refresh_token}; Path=/; HttpOnly; Secure`
  );

  res.send("Spotify login successful. You can close this tab.");
}
