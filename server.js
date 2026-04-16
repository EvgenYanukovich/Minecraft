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
const rooms = new Map();

function leaveRoom(playerId, notify = true) {
  const state = players.get(playerId);
  if (!state || !state.roomCode) return;

  const rc = String(state.roomCode).toUpperCase();
  const room = rooms.get(rc);
  state.roomCode = null;
  if (!room) return;

  room.members.delete(playerId);

  if (notify) {
    const payload = JSON.stringify({ type: "peer_left", clientId: playerId });
    for (const memberId of room.members) {
      const member = players.get(memberId);
      if (member && member.ws.readyState === 1) {
        member.ws.send(payload);
      }
    }
  }

  if (room.members.size === 0) {
    rooms.delete(rc);
  }
}

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

function sendRoomToOthers(room, senderId, message) {
  const payload = JSON.stringify(message);
  for (const memberId of room.members) {
    if (memberId === senderId) continue;
    const member = players.get(memberId);
    if (member && member.ws.readyState === 1) {
      member.ws.send(payload);
    }
  }
}

function sendRoomToAll(room, message) {
  const payload = JSON.stringify(message);
  for (const memberId of room.members) {
    const member = players.get(memberId);
    if (member && member.ws.readyState === 1) {
      member.ws.send(payload);
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

  if (req.url && req.url.startsWith("/api/health")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
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
    nickname: "Player",
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

    if (msg.type === "host_create" || msg.type === "room_join") {
      const rc = String(msg.roomCode || "").trim().toUpperCase();
      if (!rc) {
        ws.send(JSON.stringify({ type: "room_error", reason: "invalid-room-code" }));
        return;
      }

      if (state.roomCode) {
        leaveRoom(id, false);
      }

      let room = rooms.get(rc);
      if (msg.type === "host_create" && room) {
        ws.send(JSON.stringify({ type: "room_error", reason: "room-already-exists" }));
        return;
      }

      if (!room && msg.type === "room_join") {
        ws.send(JSON.stringify({ type: "room_error", reason: "room-not-found" }));
        return;
      }

      if (!room) {
        room = { hostId: id, members: new Set(), blocks: new Map() };
        rooms.set(rc, room);
      }

      const blocks = [];
      for (const [key, value] of room.blocks) {
        const [x, y, z] = key.split(",").map(Number);
        blocks.push({ x, y, z, id: value });
      }

      ws.send(JSON.stringify({ type: "world_sync", blocks }));
      state.roomCode = rc;
      room.members.add(id);
      ws.send(JSON.stringify({ type: "room_joined", roomCode: rc }));

      sendRoomToOthers(room, id, {
        type: "peer_joined",
        clientId: id,
      });
      return;
    }

    if (msg.type === "peer_state") {
      const rc = String(msg.roomCode || state.roomCode || "").trim().toUpperCase();
      const room = rooms.get(rc);
      if (!room || !room.members.has(id)) return;

      const stateMsg = {
        type: "peer_state",
        clientId: id,
        state: {
          nickname: String(msg.state?.nickname || state.nickname || "Player").slice(0, 16),
          x: Number(msg.state?.x) || 0,
          y: Number(msg.state?.y) || 0,
          z: Number(msg.state?.z) || 0,
          yaw: Number(msg.state?.yaw) || 0,
          pitch: Number(msg.state?.pitch) || 0,
        },
      };

      state.nickname = stateMsg.state.nickname;

      sendRoomToOthers(room, id, stateMsg);
      return;
    }

    if (msg.type === "move") {
      state.x = Number(msg.x) || state.x;
      state.y = Number(msg.y) || state.y;
      state.z = Number(msg.z) || state.z;
      state.yaw = Number(msg.yaw) || 0;
      state.pitch = Number(msg.pitch) || 0;
    }

    if (msg.type === "block_set") {
      const rc = String(msg.roomCode || state.roomCode || "").trim().toUpperCase();
      const room = rooms.get(rc);
      if (!room || !room.members.has(id)) return;

      const x = Math.floor(Number(msg.x));
      const y = Math.floor(Number(msg.y));
      const z = Math.floor(Number(msg.z));
      const bid = Math.floor(Number(msg.id));
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z) || !Number.isFinite(bid)) {
        return;
      }

      room.blocks.set(blockKey(x, y, z), bid);
      blockOverrides.set(blockKey(x, y, z), bid);

      sendRoomToAll(room, { type: "block_set", clientId: id, x, y, z, id: bid });
    }
  });

  ws.on("close", () => {
    leaveRoom(id, true);
    players.delete(id);
  });
});

server.listen(PORT, () => {
  console.log(`BrowserCraft server running on http://localhost:${PORT}`);
});
