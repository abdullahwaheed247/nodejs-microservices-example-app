"use strict";

const express = require("express");
const axios = require("axios");

const PORT = process.env.PORT || 80;
const HOST = process.env.HOST || "0.0.0.0";
const USERS_SERVICE_URL = process.env.SERVICE_URL || "http://users";

const app = express();

function getWeatherHTML(weather) {
  const themes = {
    rain: { emoji: "🌧️", msg: "Hello Rainy World!", bg: "#0f2027", accent: "#00b4d8", sub: "Taking it slow today..." },
    snow: { emoji: "❄️", msg: "Bye Bye Snow!", bg: "#1a1a2e", accent: "#e0e0e0", sub: "Brrr... too cold!" },
    sunny: { emoji: "☀️", msg: "Hello Sunny World!", bg: "#1a0a00", accent: "#f4a261", sub: "What a beautiful day!" }
  };
  const t = themes[weather] || themes.sunny;
  return t;
}

function renderPage(title, content, bgColor = "#0a0a0f", accent = "#7c3aed") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@300;400&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg: ${bgColor};
      --accent: ${accent};
      --text: #f0ece8;
      --muted: #888;
      --card: rgba(255,255,255,0.04);
      --border: rgba(255,255,255,0.08);
    }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: 'DM Mono', monospace;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      overflow-x: hidden;
    }

    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 860px;
      width: 100%;
    }

    .badge {
      display: inline-block;
      font-family: 'DM Mono', monospace;
      font-size: 0.7rem;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--accent);
      border: 1px solid var(--accent);
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      margin-bottom: 2rem;
      opacity: 0;
      animation: fadeUp 0.6s ease forwards;
    }

    h1 {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2.5rem, 6vw, 5rem);
      font-weight: 800;
      line-height: 1.05;
      margin-bottom: 1rem;
      opacity: 0;
      animation: fadeUp 0.6s 0.1s ease forwards;
    }

    h1 span { color: var(--accent); }

    .subtitle {
      color: var(--muted);
      font-size: 0.9rem;
      margin-bottom: 3rem;
      opacity: 0;
      animation: fadeUp 0.6s 0.2s ease forwards;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
      opacity: 0;
      animation: fadeUp 0.6s 0.3s ease forwards;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      transition: border-color 0.2s, transform 0.2s;
      text-decoration: none;
      color: inherit;
      display: block;
    }

    .card:hover {
      border-color: var(--accent);
      transform: translateY(-2px);
    }

    .card-label {
      font-size: 0.65rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }

    .card-value {
      font-family: 'Syne', sans-serif;
      font-size: 1.1rem;
      font-weight: 700;
    }

    .weather-strip {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 3rem;
      opacity: 0;
      animation: fadeUp 0.6s 0.4s ease forwards;
    }

    .weather-btn {
      background: var(--card);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: 'DM Mono', monospace;
      font-size: 0.8rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }

    .weather-btn:hover {
      background: var(--accent);
      border-color: var(--accent);
      color: #000;
    }

    .users-section {
      opacity: 0;
      animation: fadeUp 0.6s 0.5s ease forwards;
    }

    .users-title {
      font-size: 0.7rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    .users-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 0.75rem;
    }

    .user-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 0.9rem;
      color: #000;
      flex-shrink: 0;
    }

    .user-name { font-size: 0.9rem; font-weight: 400; }
    .user-email { font-size: 0.72rem; color: var(--muted); margin-top: 2px; }

    .footer {
      margin-top: 3rem;
      font-size: 0.7rem;
      color: var(--muted);
      opacity: 0;
      animation: fadeUp 0.6s 0.6s ease forwards;
    }

    .footer span { color: var(--accent); }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    ${content.extraStyle || ''}
  </style>
</head>
<body>
  <div class="container">
    ${content.html}
  </div>
</body>
</html>`;
}

async function main() {

  app.get("/", async (req, res) => {
    let nbLoop = req.query.loop;
    let weather = req.query.weather;

    if (nbLoop !== undefined) generateWork(nbLoop);

    // fetch users for display
    let users = [];
    try {
      const r = await axios.get(USERS_SERVICE_URL + "/api/data");
      users = r.data;
    } catch (_) {}

    if (weather !== undefined) {
      // weather mode
      const themes = {
        rain:  { emoji: "🌧️", msg: "Hello Rainy World!",  bg: "#050d13", accent: "#00b4d8", sub: "Taking it slow..." },
        snow:  { emoji: "❄️",  msg: "Bye Bye Snow!",       bg: "#0d0d1a", accent: "#a5b4fc", sub: "Too cold outside!" },
      };
      const t = themes[weather] || { emoji: "☀️", msg: "Hello Sunny World!", bg: "#0d0800", accent: "#f4a261", sub: "Beautiful day!" };

      if (weather === "snow") res.status(500);
      else if (weather === "rain") await sleep(1500);

      const html = renderPage(t.msg, {
        html: `
          <div class="badge">weather report</div>
          <h1>${t.emoji} <span>${t.msg}</span></h1>
          <p class="subtitle">${t.sub}</p>
          <div class="weather-strip">
            <a href="/?weather=sunny" class="weather-btn">☀️ Sunny</a>
            <a href="/?weather=rain"  class="weather-btn">🌧️ Rain</a>
            <a href="/?weather=snow"  class="weather-btn">❄️ Snow</a>
            <a href="/"               class="weather-btn">← Back</a>
          </div>
          <div class="footer">condition: <span>${weather}</span> · port <span>${PORT}</span></div>
        `
      }, t.bg, t.accent);

      return res.send(html);
    }

    const usersHTML = users.length
      ? users.map(u => `
          <div class="user-card">
            <div class="avatar">${(u.name||'?')[0].toUpperCase()}</div>
            <div>
              <div class="user-name">${u.name || 'Unknown'}</div>
              <div class="user-email">${u.email || ''}</div>
            </div>
          </div>`).join('')
      : `<div class="user-card"><div class="user-name" style="color:var(--muted)">No users found</div></div>`;

    const html = renderPage("Node Microservices", {
      html: `
        <div class="badge">microservices · live</div>
        <h1>Hello <span>World.</span></h1>
        <p class="subtitle">A Node.js microservices app running on Kubernetes.</p>

        <div class="grid">
          <div class="card">
            <div class="card-label">service</div>
            <div class="card-value">web frontend</div>
          </div>
          <div class="card">
            <div class="card-label">port</div>
            <div class="card-value">${PORT}</div>
          </div>
          <div class="card">
            <div class="card-label">users service</div>
            <div class="card-value">${users.length} records</div>
          </div>
          <a href="/api/data" class="card">
            <div class="card-label">endpoint</div>
            <div class="card-value">/api/data →</div>
          </a>
        </div>

        <div class="weather-strip">
          <a href="/?weather=sunny" class="weather-btn">☀️ Sunny</a>
          <a href="/?weather=rain"  class="weather-btn">🌧️ Rain</a>
          <a href="/?weather=snow"  class="weather-btn">❄️ Snow</a>
        </div>

        <div class="users-section">
          <div class="users-title">users from microservice</div>
          <div class="users-grid">${usersHTML}</div>
        </div>

        <div class="footer">running on <span>kubernetes</span> · deployed via <span>argocd</span></div>
      `
    });

    res.send(html);
  });

  app.get("/api/data", (req, res) => {
    axios.get(USERS_SERVICE_URL + "/api/data")
      .then(r => res.json(r.data))
      .catch(err => {
        console.error("Error forwarding request:", err.message);
        res.sendStatus(500);
      });
  });

  await startServer();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateWork(nb) {
  for (let i = 0; i < Number(nb); i++) {
    console.log(`*** DOING SOMETHING ${i}`);
    await sleep(50);
  }
}

function startServer() {
  return new Promise((resolve, reject) => {
    app.listen(PORT, HOST, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

main()
  .then(() => console.log("Online"))
  .catch(err => {
    console.error("Failed to start!");
    console.error((err && err.stack) || err);
  });