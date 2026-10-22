window.APP_CONFIG = {
  // Premier = principal, second = secours. Pour inverser, échange les deux lignes.
  BACKENDS: [
    "https://mern-prenom-api.<subdomaine>.workers.dev", // Cloudflare
    "https://<ton-projet>.vercel.app"                   // Vercel
  ],
  TIMEOUT_MS: 6000
};