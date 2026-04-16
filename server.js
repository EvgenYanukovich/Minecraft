const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const players = new Map();
const blockOverrides = new Map();

function getLanAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const net = nets[name] || [];
    for (const addr of net) {
      if (addr && addr.family === "IPv4" && !addr.internal) {
        return `${addr.address}:${PORT}`;
      }
    }
  }
  return `127.0.0.1:${PORT}`;
}

function blockKey(x, y, z) {
  return `${x},${y},${z}`;
}

function broadcast(message, except = null) {
  const payload = JSON.stringify(message);
  for (const [id, client] of players) {
    if (except && id === except) continue;
    if (client.ws.readyState === 1) {
      client.ws.send(payload);
    }
  }
}

const server = http.createServer((req, res) => {
  if (req.url && req.url.startsWith("/health")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, players: players.size }));
    return;
  }

  if (req.url && req.url.startsWith("/host-info")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, address: getLanAddress() }));
    return;
  }

  let reqPath = req.url === "/" ? "/index.html" : req.url;
  reqPath = decodeURIComponent(reqPath.split("?")[0]);

  const safePath = path.normalize(reqPath).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(__dirname, safePath);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
    res.writeHead(200);
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

let idCounter = 1;

wss.on("connection", (ws) => {
  const id = `p${idCounter++}`;
  players.set(id, {
    ws,
    x: 0,
    y: 40,
    z: 0,
    yaw: 0,
    pitch: 0,
  });

  const overrides = [];
  for (const [key, value] of blockOverrides) {
    const [x, y, z] = key.split(",").map(Number);
    overrides.push({ x, y, z, id: value });
  }

  ws.send(JSON.stringify({ type: "welcome", id, overrides }));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    const state = players.get(id);
    if (!state) return;

    if (msg.type === "move") {
      state.x = Number(msg.x) || state.x;
      state.y = Number(msg.y) || state.y;
      state.z = Number(msg.z) || state.z;
      state.yaw = Number(msg.yaw) || 0;
      state.pitch = Number(msg.pitch) || 0;
    }

    if (msg.type === "block_set") {
      const x = Math.floor(Number(msg.x));
      const y = Math.floor(Number(msg.y));
      const z = Math.floor(Number(msg.z));
      const bid = Math.floor(Number(msg.id));
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(bid)) {
        return;
      }
      blockOverrides.set(blockKey(x, y, z), bid);
      broadcast({ type: "block_set", x, y, z, id: bid }, id);
    }
  });

  ws.on("close", () => {
    players.delete(id);
  });
});

setInterval(() => {
  const playersList = [];
  for (const [id, p] of players) {
    playersList.push({ id, x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch });
  }
  broadcast({ type: "state", players: playersList });
}, 50);

server.listen(PORT, () => {
  console.log(`BrowserCraft server running on http://localhost:${PORT}`);
});
