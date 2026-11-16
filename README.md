# Merry Brawl multiplayer server
- Language / runtime: **Node.js 18 or newer** (JavaScript). No dependencies, nothing to install.
- Build command: none (leave empty, or `npm install`)
- Start command: **`node server.js`**  (same as `npm start`)
- Port: reads the `PORT` environment variable (Render, Railway, Fly and Glitch set it for you), default 8080.

## Deploy on Render (free)
1. Put these files in a GitHub repo.
2. render.com > New > Web Service > pick the repo. Runtime: Node. Start Command: `node server.js`. Plan: Free.
3. When it is live, your address is `wss://YOUR-NAME.onrender.com`. Type that in the game under ONLINE > Server address.
Free plans sleep after ~15 min idle; the first connection can take ~30 s to wake it.

Test locally: `node server.js`, then in the game use `ws://YOUR-PC-IP:8080` (same Wi-Fi). `node test.js` runs a self-test.
