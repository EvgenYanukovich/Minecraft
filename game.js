/* BrowserCraft - минимальный Minecraft-like прототип */

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const debugEl = document.getElementById("debug");
const hotbarEl = document.getElementById("hotbar");

const WORLD_W = 64;
const WORLD_H = 32;
const WORLD_D = 64;
const SEA_LEVEL = 10;
const NEAR_PLANE = 0.05;
const VIEW_RADIUS = 16;
const VIEW_HEIGHT = 12;

const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,
  LEAF: 5,
};

const BLOCK_INFO = {
  [BLOCK.AIR]: { name: "Air", color: "#00000000", solid: false },
  [BLOCK.GRASS]: { name: "Grass", color: "#63b05a", solid: true },
  [BLOCK.DIRT]: { name: "Dirt", color: "#8a5a3c", solid: true },
  [BLOCK.STONE]: { name: "Stone", color: "#7c7f87", solid: true },
  [BLOCK.WOOD]: { name: "Wood", color: "#966336", solid: true },
  [BLOCK.LEAF]: { name: "Leaf", color: "#3a8f4a", solid: true },
};

const HOTBAR = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.WOOD, BLOCK.LEAF];
let selectedSlot = 0;

const world = new Uint8Array(WORLD_W * WORLD_H * WORLD_D);

function idx(x, y, z) {
  return x + z * WORLD_W + y * WORLD_W * WORLD_D;
}

function inBounds(x, y, z) {
  return x >= 0 && x < WORLD_W && y >= 0 && y < WORLD_H && z >= 0 && z < WORLD_D;
}

function getBlock(x, y, z) {
  if (!inBounds(x, y, z)) return BLOCK.AIR;
  return world[idx(x, y, z)];
}

function setBlock(x, y, z, block) {
  if (!inBounds(x, y, z)) return;
  world[idx(x, y, z)] = block;
}

function heightNoise(x, z) {
  const a = Math.sin(x * 0.17) * 0.5 + 0.5;
  const b = Math.cos(z * 0.19) * 0.5 + 0.5;
  const c = Math.sin((x + z) * 0.08) * 0.5 + 0.5;
  return Math.floor(6 + a * 5 + b * 4 + c * 4);
}

function generateWorld() {
  for (let x = 0; x < WORLD_W; x += 1) {
    for (let z = 0; z < WORLD_D; z += 1) {
      const h = Math.max(3, Math.min(WORLD_H - 2, heightNoise(x, z)));
      for (let y = 0; y <= h; y += 1) {
        if (y === h) setBlock(x, y, z, BLOCK.GRASS);
        else if (y > h - 3) setBlock(x, y, z, BLOCK.DIRT);
        else setBlock(x, y, z, BLOCK.STONE);
      }

      if (Math.random() < 0.03 && h > SEA_LEVEL) {
        placeTree(x, h + 1, z);
      }
    }
  }
}

function placeTree(x, y, z) {
  const trunk = 3 + Math.floor(Math.random() * 2);
  for (let i = 0; i < trunk; i += 1) {
    setBlock(x, y + i, z, BLOCK.WOOD);
  }
  const top = y + trunk;
  for (let ox = -2; ox <= 2; ox += 1) {
    for (let oy = -2; oy <= 2; oy += 1) {
      for (let oz = -2; oz <= 2; oz += 1) {
        const d = Math.abs(ox) + Math.abs(oy) + Math.abs(oz);
        if (d <= 3 && Math.random() > 0.15) {
          const tx = x + ox;
          const ty = top + oy;
          const tz = z + oz;
          if (getBlock(tx, ty, tz) === BLOCK.AIR) {
            setBlock(tx, ty, tz, BLOCK.LEAF);
          }
        }
      }
    }
  }
}

const player = {
  x: WORLD_W / 2,
  y: 20,
  z: WORLD_D / 2,
  vx: 0,
  vy: 0,
  vz: 0,
  yaw: Math.PI * 1.25,
  pitch: -0.2,
  eyeHeight: 1.62,
  radius: 0.32,
  height: 1.8,
  onGround: false,
};

const keys = new Set();
let pointerLocked = false;

document.addEventListener("keydown", (e) => {
  keys.add(e.code);
  if (e.code.startsWith("Digit")) {
    const n = Number(e.code.slice(5));
    if (n >= 1 && n <= HOTBAR.length) {
      selectedSlot = n - 1;
      renderHotbar();
    }
  }
});

document.addEventListener("keyup", (e) => {
  keys.delete(e.code);
});

canvas.addEventListener("click", async () => {
  if (!pointerLocked) {
    await canvas.requestPointerLock();
  }
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener("mousemove", (e) => {
  if (!pointerLocked) return;
  const sens = 0.002;
  player.yaw += e.movementX * sens;
  player.pitch -= e.movementY * sens;
  player.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, player.pitch));
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());
canvas.addEventListener("mousedown", (e) => {
  if (!pointerLocked) return;
  if (e.button === 0) {
    mineBlock();
  } else if (e.button === 2) {
    placeBlockFromHotbar();
  }
});

function isSolidAt(x, y, z) {
  const b = getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
  return BLOCK_INFO[b].solid;
}

function collides(px, py, pz) {
  const r = player.radius;
  const minX = Math.floor(px - r);
  const maxX = Math.floor(px + r);
  const minY = Math.floor(py);
  const maxY = Math.floor(py + player.height);
  const minZ = Math.floor(pz - r);
  const maxZ = Math.floor(pz + r);
  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        if (x < 0 || x >= WORLD_W || z < 0 || z >= WORLD_D || y < 0) {
          return true;
        }
        if (y < WORLD_H && BLOCK_INFO[getBlock(x, y, z)].solid) {
          return true;
        }
      }
    }
  }
  return false;
}

function raycast(maxDist = 7) {
  const ox = player.x;
  const oy = player.y + player.eyeHeight;
  const oz = player.z;

  const cp = Math.cos(player.pitch);
  const dx = Math.sin(player.yaw) * cp;
  const dy = Math.sin(player.pitch);
  const dz = Math.cos(player.yaw) * cp;

  let bx = Math.floor(ox);
  let by = Math.floor(oy);
  let bz = Math.floor(oz);

  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;

  const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Number.POSITIVE_INFINITY;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Number.POSITIVE_INFINITY;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dz) : Number.POSITIVE_INFINITY;

  const nextX = stepX > 0 ? bx + 1 : bx;
  const nextY = stepY > 0 ? by + 1 : by;
  const nextZ = stepZ > 0 ? bz + 1 : bz;

  let tMaxX = stepX !== 0 ? (nextX - ox) / dx : Number.POSITIVE_INFINITY;
  let tMaxY = stepY !== 0 ? (nextY - oy) / dy : Number.POSITIVE_INFINITY;
  let tMaxZ = stepZ !== 0 ? (nextZ - oz) / dz : Number.POSITIVE_INFINITY;

  let travel = 0;
  let hitNormalX = 0;
  let hitNormalY = 0;
  let hitNormalZ = 0;

  while (travel <= maxDist) {
    if (!inBounds(bx, by, bz)) break;
    const b = getBlock(bx, by, bz);
    if (b !== BLOCK.AIR) {
      return {
        hit: true,
        block: { x: bx, y: by, z: bz, id: b },
        place: {
          x: bx + hitNormalX,
          y: by + hitNormalY,
          z: bz + hitNormalZ,
        },
      };
    }

    if (tMaxX <= tMaxY && tMaxX <= tMaxZ) {
      bx += stepX;
      travel = tMaxX;
      tMaxX += tDeltaX;
      hitNormalX = -stepX;
      hitNormalY = 0;
      hitNormalZ = 0;
    } else if (tMaxY <= tMaxX && tMaxY <= tMaxZ) {
      by += stepY;
      travel = tMaxY;
      tMaxY += tDeltaY;
      hitNormalX = 0;
      hitNormalY = -stepY;
      hitNormalZ = 0;
    } else {
      bz += stepZ;
      travel = tMaxZ;
      tMaxZ += tDeltaZ;
      hitNormalX = 0;
      hitNormalY = 0;
      hitNormalZ = -stepZ;
    }
  }

  return { hit: false };
}

function mineBlock() {
  const r = raycast();
  if (!r.hit) return;
  setBlock(r.block.x, r.block.y, r.block.z, BLOCK.AIR);
}

function wouldIntersectPlayer(x, y, z) {
  const r = player.radius;
  const pMinX = player.x - r;
  const pMaxX = player.x + r;
  const pMinY = player.y;
  const pMaxY = player.y + player.height;
  const pMinZ = player.z - r;
  const pMaxZ = player.z + r;

  const bMinX = x;
  const bMaxX = x + 1;
  const bMinY = y;
  const bMaxY = y + 1;
  const bMinZ = z;
  const bMaxZ = z + 1;

  return (
    pMinX < bMaxX && pMaxX > bMinX &&
    pMinY < bMaxY && pMaxY > bMinY &&
    pMinZ < bMaxZ && pMaxZ > bMinZ
  );
}

function placeBlockFromHotbar() {
  const r = raycast();
  if (!r.hit) return;
  const { x, y, z } = r.place;
  if (!inBounds(x, y, z)) return;
  if (getBlock(x, y, z) !== BLOCK.AIR) return;
  if (wouldIntersectPlayer(x, y, z)) return;
  setBlock(x, y, z, HOTBAR[selectedSlot]);
}

function update(dt) {
  const speed = keys.has("ShiftLeft") ? 7 : 5;
  const accel = 24;
  const friction = player.onGround ? 12 : 3;
  const gravity = 22;

  let inputX = 0;
  let inputZ = 0;
  if (keys.has("KeyW")) inputZ += 1;
  if (keys.has("KeyS")) inputZ -= 1;
  if (keys.has("KeyA")) inputX -= 1;
  if (keys.has("KeyD")) inputX += 1;

  const len = Math.hypot(inputX, inputZ) || 1;
  inputX /= len;
  inputZ /= len;

  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);

  const wishX = (sin * inputZ + cos * inputX) * speed;
  const wishZ = (cos * inputZ - sin * inputX) * speed;

  player.vx += (wishX - player.vx) * Math.min(1, accel * dt);
  player.vz += (wishZ - player.vz) * Math.min(1, accel * dt);

  const fr = Math.max(0, 1 - friction * dt);
  if (Math.abs(inputX) < 0.001 && Math.abs(inputZ) < 0.001) {
    player.vx *= fr;
    player.vz *= fr;
  }

  if (keys.has("Space") && player.onGround) {
    player.vy = 8.5;
    player.onGround = false;
  }
  if (keys.has("ShiftLeft") && !player.onGround) {
    player.vy -= 14 * dt;
  }

  player.vy -= gravity * dt;

  let nx = player.x + player.vx * dt;
  if (!collides(nx, player.y, player.z)) {
    player.x = nx;
  } else {
    player.vx = 0;
  }

  let nz = player.z + player.vz * dt;
  if (!collides(player.x, player.y, nz)) {
    player.z = nz;
  } else {
    player.vz = 0;
  }

  let ny = player.y + player.vy * dt;
  if (!collides(player.x, ny, player.z)) {
    player.y = ny;
    player.onGround = false;
  } else {
    if (player.vy < 0) player.onGround = true;
    player.vy = 0;
  }

  player.x = Math.max(1, Math.min(WORLD_W - 2, player.x));
  player.z = Math.max(1, Math.min(WORLD_D - 2, player.z));
  player.y = Math.max(1, Math.min(WORLD_H - 3, player.y));
}

function skyColor() {
  const t = (Math.sin(performance.now() * 0.00005) + 1) * 0.5;
  const r = Math.floor(50 + t * 70);
  const g = Math.floor(90 + t * 90);
  const b = Math.floor(150 + t * 80);
  return `rgb(${r},${g},${b})`;
}

function projectPointInto(wx, wy, wz, out) {
  const ex = wx - player.x;
  const ey = wy - (player.y + player.eyeHeight);
  const ez = wz - player.z;

  const sy = Math.sin(-player.yaw);
  const cy = Math.cos(-player.yaw);
  const x1 = ex * cy - ez * sy;
  const z1 = ex * sy + ez * cy;

  const sp = Math.sin(-player.pitch);
  const cp = Math.cos(-player.pitch);
  const y2 = ey * cp - z1 * sp;
  const z2 = ey * sp + z1 * cp;

  const fov = 75 * Math.PI / 180;
  const focal = (Math.min(canvas.width, canvas.height) * 0.5) / Math.tan(fov / 2);
  const clampedZ = z2 <= NEAR_PLANE ? NEAR_PLANE : z2;

  out.x = canvas.width * 0.5 + (x1 * focal) / clampedZ;
  out.y = canvas.height * 0.5 - (y2 * focal) / clampedZ;
  out.z = clampedZ;
  out.behind = z2 <= NEAR_PLANE;
}

const FACES = [
  { n: [0, 0, -1], c: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], shade: 0.9 },
  { n: [0, 0, 1], c: [[1, 0, 1], [0, 0, 1], [0, 1, 1], [1, 1, 1]], shade: 0.75 },
  { n: [-1, 0, 0], c: [[0, 0, 1], [0, 0, 0], [0, 1, 0], [0, 1, 1]], shade: 0.8 },
  { n: [1, 0, 0], c: [[1, 0, 0], [1, 0, 1], [1, 1, 1], [1, 1, 0]], shade: 0.68 },
  { n: [0, 1, 0], c: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], shade: 1.0 },
  { n: [0, -1, 0], c: [[0, 0, 1], [1, 0, 1], [1, 0, 0], [0, 0, 0]], shade: 0.55 },
];

function multiplyColor(hex, k) {
  const m = hex.match(/^#(..)(..)(..)$/);
  if (!m) return hex;
  const r = Math.floor(parseInt(m[1], 16) * k);
  const g = Math.floor(parseInt(m[2], 16) * k);
  const b = Math.floor(parseInt(m[3], 16) * k);
  return `rgb(${r},${g},${b})`;
}

const renderFacePool = [];
const activeFaces = [];

function createFaceData() {
  return {
    points: [
      { x: 0, y: 0, z: 0, behind: false },
      { x: 0, y: 0, z: 0, behind: false },
      { x: 0, y: 0, z: 0, behind: false },
      { x: 0, y: 0, z: 0, behind: false },
    ],
    depth: 0,
    color: "#000",
  };
}

function faceCenterForNormal(x, y, z, n) {
  return {
    x: x + (n[0] === 1 ? 1 : n[0] === -1 ? 0 : 0.5),
    y: y + (n[1] === 1 ? 1 : n[1] === -1 ? 0 : 0.5),
    z: z + (n[2] === 1 ? 1 : n[2] === -1 ? 0 : 0.5),
  };
}

function renderWorld() {
  const r = VIEW_RADIUS;
  const px = Math.floor(player.x);
  const py = Math.floor(player.y);
  const pz = Math.floor(player.z);
  const camX = player.x;
  const camY = player.y + player.eyeHeight;
  const camZ = player.z;

  activeFaces.length = 0;
  let poolCursor = 0;

  for (let y = Math.max(0, py - VIEW_HEIGHT); y < Math.min(WORLD_H, py + VIEW_HEIGHT); y += 1) {
    for (let z = Math.max(0, pz - r); z < Math.min(WORLD_D, pz + r); z += 1) {
      for (let x = Math.max(0, px - r); x < Math.min(WORLD_W, px + r); x += 1) {
        const id = getBlock(x, y, z);
        if (id === BLOCK.AIR) continue;

        for (const face of FACES) {
          const nx = x + face.n[0];
          const ny = y + face.n[1];
          const nz = z + face.n[2];
          const neighbor = getBlock(nx, ny, nz);
          if (neighbor !== BLOCK.AIR) continue;

          const center = faceCenterForNormal(x, y, z, face.n);
          const toCamX = camX - center.x;
          const toCamY = camY - center.y;
          const toCamZ = camZ - center.z;
          const faceToCam = face.n[0] * toCamX + face.n[1] * toCamY + face.n[2] * toCamZ;
          if (faceToCam <= 0) continue;

          let faceData = renderFacePool[poolCursor];
          if (!faceData) {
            faceData = createFaceData();
            renderFacePool.push(faceData);
          }

          let depth = 0;
          let anyInFront = false;
          for (let i = 0; i < face.c.length; i += 1) {
            const [ox, oy, oz] = face.c[i];
            const point = faceData.points[i];
            projectPointInto(x + ox, y + oy, z + oz, point);
            if (!point.behind) anyInFront = true;
            depth += point.z;
          }
          if (!anyInFront) continue;

          faceData.depth = depth / 4;
          faceData.color = multiplyColor(BLOCK_INFO[id].color, face.shade);
          activeFaces.push(faceData);
          poolCursor += 1;
        }
      }
    }
  }

  activeFaces.sort((a, b) => b.depth - a.depth);

  for (const f of activeFaces) {
    ctx.beginPath();
    ctx.moveTo(f.points[0].x, f.points[0].y);
    for (let i = 1; i < f.points.length; i += 1) {
      ctx.lineTo(f.points[i].x, f.points[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = f.color;
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.18)";
    ctx.stroke();
  }
}

function renderSelectedOutline() {
  const target = raycast();
  if (!target.hit) return;
  const { x, y, z } = target.block;
  const corners = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
  ];
  const pts = corners.map(() => ({ x: 0, y: 0, z: 0, behind: false }));
  let anyInFront = false;
  for (let i = 0; i < corners.length; i += 1) {
    const [ox, oy, oz] = corners[i];
    projectPointInto(x + ox, y + oy, z + oz, pts[i]);
    if (!pts[i].behind) anyInFront = true;
  }
  if (!anyInFront) return;

  const lines = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  ctx.strokeStyle = "#fff3";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const [a, b] of lines) {
    const p1 = pts[a];
    const p2 = pts[b];
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
  }
  ctx.stroke();
  ctx.lineWidth = 1;
}

function renderHotbar() {
  hotbarEl.innerHTML = "";
  HOTBAR.forEach((id, i) => {
    const slot = document.createElement("div");
    slot.className = `slot ${i === selectedSlot ? "active" : ""}`;
    const sw = document.createElement("div");
    sw.className = "slot-color";
    sw.style.background = BLOCK_INFO[id].color;
    const nm = document.createElement("div");
    nm.className = "slot-name";
    nm.textContent = `${i + 1}. ${BLOCK_INFO[id].name}`;
    slot.append(sw, nm);
    hotbarEl.append(slot);
  });
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resize);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, skyColor());
  grad.addColorStop(1, "#d8eefc");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  renderWorld();
  renderSelectedOutline();

  const target = raycast();
  const targetName = target.hit ? BLOCK_INFO[target.block.id].name : "none";
  debugEl.textContent =
    `XYZ: ${player.x.toFixed(2)}, ${player.y.toFixed(2)}, ${player.z.toFixed(2)} | ` +
    `OnGround: ${player.onGround ? "yes" : "no"} | ` +
    `Target: ${targetName}`;

  requestAnimationFrame(frame);
}

function spawnPlayer() {
  for (let y = WORLD_H - 2; y >= 2; y -= 1) {
    const b = getBlock(Math.floor(player.x), y, Math.floor(player.z));
    const above = getBlock(Math.floor(player.x), y + 1, Math.floor(player.z));
    const above2 = getBlock(Math.floor(player.x), y + 2, Math.floor(player.z));
    if (BLOCK_INFO[b].solid && above === BLOCK.AIR && above2 === BLOCK.AIR) {
      player.y = y + 1;
      return;
    }
  }
}

generateWorld();
spawnPlayer();
resize();
renderHotbar();
requestAnimationFrame(frame);
