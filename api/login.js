export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: "user-read-private"
  });

  res.redirect(
    "https://accounts.spotify.com/authorize?" + params.toString()
  );
}
