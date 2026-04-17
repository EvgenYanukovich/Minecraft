import * as THREE from "https://unpkg.com/three@0.183.2/build/three.module.js";

const debugEl = document.getElementById("debug");
const hotbarEl = document.getElementById("hotbar");
const startMenuEl = document.getElementById("start-menu");
const menuMainEl = document.getElementById("menu-main");
const menuMultiplayerEl = document.getElementById("menu-multiplayer");
const menuJoinEl = document.getElementById("menu-join");
const menuLobbyEl = document.getElementById("menu-lobby");
const nicknameInputEl = document.getElementById("nickname-input");
const roomCodeInputEl = document.getElementById("room-code-input");
const roomCodeValueEl = document.getElementById("room-code-value");
const participantsListEl = document.getElementById("participants-list");
const singleplayerBtnEl = document.getElementById("btn-singleplayer");
const multiplayerBtnEl = document.getElementById("btn-multiplayer");
const settingsBtnEl = document.getElementById("btn-settings");
const becomeHostBtnEl = document.getElementById("btn-be-host");
const becomeGuestBtnEl = document.getElementById("btn-be-guest");
const backMainBtnEl = document.getElementById("btn-back-main");
const joinRoomBtnEl = document.getElementById("btn-join-room");
const backMultiplayerBtnEl = document.getElementById("btn-back-multiplayer");
const copyRoomBtnEl = document.getElementById("btn-copy-room");
const startRoomBtnEl = document.getElementById("btn-start-room");
const leaveLobbyBtnEl = document.getElementById("btn-leave-lobby");
const customizeSkinBtnEl = document.getElementById("btn-customize-skin");
const menuStatusEl = document.getElementById("menu-status");
const chatLogEl = document.getElementById("chat-log");
const chatEl = document.getElementById("chat");
const chatInputEl = document.getElementById("chat-input");
const chatSendEl = document.getElementById("chat-send");
const menuSkin3dEl = document.getElementById("menu-skin-3d");
const pingOverlayEl = document.getElementById("ping-overlay");
const pingListEl = document.getElementById("ping-list");
const menuPanoramaEl = document.getElementById("menu-panorama");
const skinEditorEl = document.getElementById("skin-editor");
const skinEditorCanvasEl = document.getElementById("skin-editor-canvas");
const skinPaletteEl = document.getElementById("skin-palette");
const skinColorEl = document.getElementById("skin-color");
const toolBrushEl = document.getElementById("tool-brush");
const toolEraserEl = document.getElementById("tool-eraser");
const toolUndoEl = document.getElementById("tool-undo");
const toolRedoEl = document.getElementById("tool-redo");
const toolSizeEl = document.getElementById("tool-size");
const partHeadEl = document.getElementById("part-head");
const partBodyEl = document.getElementById("part-body");
const partArmsEl = document.getElementById("part-arms");
const partLegsEl = document.getElementById("part-legs");
const skinImportBtnEl = document.getElementById("skin-import");
const skinExportBtnEl = document.getElementById("skin-export");
const skinImportFileEl = document.getElementById("skin-import-file");
const skinSaveBtnEl = document.getElementById("skin-save");
const skinCloseBtnEl = document.getElementById("skin-close");
const skinPreview3dEl = document.getElementById("skin-preview-3d");
const inventoryEl = document.getElementById("inventory");
const inventoryHeldEl = document.getElementById("inventory-held");
const inventoryGridEl = document.getElementById("inventory-grid");
const inventoryHotbarEl = document.getElementById("inventory-hotbar");

const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 64;
const RENDER_DISTANCE = 4;
const BLOCK_AIR = 0;
const PLAYER_HEIGHT = 1.8;
const PLAYER_RADIUS = 0.32;
const GRAVITY = 28;
const JUMP_SPEED = 9.4;
const WALK_SPEED = 5.8;
const SPRINT_SPEED = 8.2;
const MAX_STEP = 0.04;
const NET_SEND_INTERVAL = 1 / 30;
const HOTBAR_SIZE = 9;
const INVENTORY_MAIN_SIZE = 27;
const INVENTORY_TOTAL_SIZE = INVENTORY_MAIN_SIZE + HOTBAR_SIZE;

const BLOCKS = {
  air: { id: 0, name: "Air", solid: false, hardness: 0 },
  grass: { id: 1, name: "Grass", solid: true, hardness: 0.9 },
  dirt: { id: 2, name: "Dirt", solid: true, hardness: 0.8 },
  stone: { id: 3, name: "Stone", solid: true, hardness: 2.2 },
  wood: { id: 4, name: "Wood", solid: true, hardness: 1.6 },
  leaves: { id: 5, name: "Leaves", solid: true, hardness: 0.45 },
  sand: { id: 6, name: "Sand", solid: true, hardness: 0.7 },
  brick: { id: 7, name: "Brick", solid: true, hardness: 2.8 },
  snow: { id: 8, name: "Snow", solid: true, hardness: 0.35 },
};

const BLOCK_LIST = Object.values(BLOCKS);
const BLOCK_BY_ID = new Map(BLOCK_LIST.map((b) => [b.id, b]));
const HOTBAR = [
  BLOCKS.grass.id,
  BLOCKS.dirt.id,
  BLOCKS.stone.id,
  BLOCKS.wood.id,
  BLOCKS.leaves.id,
  BLOCKS.sand.id,
  BLOCKS.brick.id,
  BLOCKS.snow.id,
  BLOCKS.grass.id,
];

let selectedSlot = 0;
let pointerLocked = false;
const localClientId = `p-${Math.random().toString(36).slice(2, 10)}`;
let localNickname = "Player";
let miningActive = false;
let miningProgress = 0;
let miningKey = null;
let miningGraceTimer = 0;
let chatOpen = false;
let inventoryOpen = false;
let heldInventoryItem = null;
let gameStarted = false;
let currentMenuScreen = "main";
let networkMode = "none";
let isHostRole = false;
let localServerPeerId = null;
let lobbyHostId = null;
let roomParticipants = [];
let chatHideTimer = null;
let chatFadeTimer = null;
let chatAutoVisible = false;
let tabHeld = false;
let pingAccumulator = 0;
let pingRequestCounter = 1;
const pendingPings = new Map();
const playerPings = new Map();
const remoteSkins = new Map();

const skinRect = (x1, y1, x2, y2) => ({
  x: x1 - 1,
  y: y1 - 1,
  w: x2 - x1 + 1,
  h: y2 - y1 + 1,
});

const SKIN_STORAGE_KEY = "browsercraft_skin_v1";
const SKIN_MAX_DATA_URL_LENGTH = 350000;
let localSkinDataUrl = null;
let skinEditorOpen = false;
let skinTool = "brush";
let skinBrushSize = 1;
let skinDrawing = false;
let skinUndoStack = [];
let skinRedoStack = [];
let skinSnapshotCaptured = false;
let skinSourceSize = 64;

const skinSourceCanvas = document.createElement("canvas");
skinSourceCanvas.width = 64;
skinSourceCanvas.height = 64;
const skinSourceCtx = skinSourceCanvas.getContext("2d", { willReadFrequently: true });

const defaultSkinCanvas = document.createElement("canvas");
defaultSkinCanvas.width = 64;
defaultSkinCanvas.height = 64;
const defaultSkinCtx = defaultSkinCanvas.getContext("2d", { willReadFrequently: true });

let skinEditorPreviewRenderer = null;
let skinEditorPreviewScene = null;
let skinEditorPreviewCamera = null;
let skinEditorPreviewAvatar = null;

const SKIN_PALETTE = [
  "#000000", "#ffffff", "#c68642", "#8f5d2b", "#2e6fb7", "#1f4f8b",
  "#3d5db1", "#2b4489", "#58a947", "#3f8f49", "#8b5f3a", "#7d542f",
  "#d8c588", "#9a4c39", "#eef7ff", "#ff6b6b", "#ffd166", "#06d6a0",
];

const SKIN_PART_REGIONS = {
  head: [
    skinRect(9, 1, 16, 8), skinRect(17, 1, 24, 8),
    skinRect(1, 9, 8, 16), skinRect(9, 9, 16, 16),
    skinRect(17, 9, 24, 16), skinRect(25, 9, 32, 16),
    skinRect(41, 1, 48, 8), skinRect(49, 1, 56, 8),
    skinRect(33, 9, 40, 16), skinRect(41, 9, 48, 16),
    skinRect(49, 9, 56, 16), skinRect(57, 9, 64, 16),
  ],
  body: [
    skinRect(21, 17, 28, 20), skinRect(29, 17, 36, 20),
    skinRect(17, 21, 20, 32), skinRect(21, 21, 28, 32),
    skinRect(29, 21, 32, 32), skinRect(33, 21, 40, 32),
    skinRect(21, 33, 28, 36), skinRect(29, 33, 36, 36),
    skinRect(17, 37, 20, 48), skinRect(21, 37, 28, 48),
    skinRect(29, 37, 32, 48), skinRect(33, 37, 40, 48),
  ],
  arms: [
    skinRect(45, 17, 48, 20), skinRect(49, 17, 52, 20),
    skinRect(41, 21, 44, 32), skinRect(45, 21, 48, 32),
    skinRect(49, 21, 52, 32), skinRect(53, 21, 56, 32),
    skinRect(45, 33, 48, 36), skinRect(49, 33, 52, 36),
    skinRect(41, 37, 44, 48), skinRect(45, 37, 48, 48),
    skinRect(49, 37, 52, 48), skinRect(53, 37, 56, 48),
    skinRect(37, 49, 40, 52), skinRect(41, 49, 44, 52),
    skinRect(33, 53, 36, 64), skinRect(37, 53, 40, 64),
    skinRect(41, 53, 44, 64), skinRect(45, 53, 48, 64),
    skinRect(53, 49, 56, 52), skinRect(57, 49, 60, 52),
    skinRect(49, 53, 52, 64), skinRect(53, 53, 56, 64),
    skinRect(57, 53, 60, 64), skinRect(61, 53, 64, 64),
  ],
  legs: [
    skinRect(5, 17, 8, 20), skinRect(9, 17, 12, 20),
    skinRect(1, 21, 4, 32), skinRect(5, 21, 8, 32),
    skinRect(9, 21, 12, 32), skinRect(13, 21, 16, 32),
    skinRect(5, 33, 8, 36), skinRect(9, 33, 12, 36),
    skinRect(1, 37, 4, 48), skinRect(5, 37, 8, 48),
    skinRect(9, 37, 12, 48), skinRect(13, 37, 16, 48),
    skinRect(21, 49, 24, 52), skinRect(25, 49, 28, 52),
    skinRect(17, 53, 20, 64), skinRect(21, 53, 24, 64),
    skinRect(25, 53, 28, 64), skinRect(29, 53, 32, 64),
    skinRect(5, 49, 8, 52), skinRect(9, 49, 12, 52),
    skinRect(1, 53, 4, 64), skinRect(5, 53, 8, 64),
    skinRect(9, 53, 12, 64), skinRect(13, 53, 16, 64),
  ],
};

const inventorySlots = new Array(INVENTORY_TOTAL_SIZE).fill(BLOCK_AIR);
for (let i = 0; i < HOTBAR_SIZE; i += 1) {
  inventorySlots[INVENTORY_MAIN_SIZE + i] = HOTBAR[i] ?? BLOCK_AIR;
}
for (let i = 0; i < INVENTORY_MAIN_SIZE; i += 1) {
  if (i % 5 === 0) inventorySlots[i] = BLOCKS.dirt.id;
  else if (i % 7 === 0) inventorySlots[i] = BLOCKS.stone.id;
}

const mineCracksEl = document.createElement("div");
mineCracksEl.className = "mine-cracks";
document.body.append(mineCracksEl);

let menuSkinRenderer = null;
let menuSkinScene = null;
let menuSkinCamera = null;
let menuSkinAvatar = null;
let panoramaRenderer = null;
let panoramaScene = null;
let panoramaCamera = null;
let panoramaTime = 0;
const panoramaHeightMap = new Map();

function panoramaHeightKey(x, z) {
  return `${x},${z}`;
}

function getPanoramaHeightAt(x, z) {
  return panoramaHeightMap.get(panoramaHeightKey(Math.floor(x), Math.floor(z))) ?? 8;
}

function markPanoramaOccupied(x, z, topY) {
  const key = panoramaHeightKey(x, z);
  const prev = panoramaHeightMap.get(key) ?? -Infinity;
  panoramaHeightMap.set(key, Math.max(prev, topY));
}

function paintDefaultSkin(ctx) {
  ctx.clearRect(0, 0, skinSourceSize, skinSourceSize);

  const skin = "#c68642";
  const hair = "#7b4a23";
  const shirt = "#2e6fb7";
  const shirtDark = "#1f4f8b";
  const pants = "#3d5db1";
  const pantsDark = "#2b4489";

  const fill = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

  fill(8, 8, 8, 8, skin);
  fill(0, 8, 8, 8, skin);
  fill(16, 8, 8, 8, skin);
  fill(24, 8, 8, 8, skin);
  fill(8, 0, 8, 8, skin);
  fill(16, 0, 8, 8, skin);
  fill(8, 0, 8, 3, hair);
  fill(8, 8, 8, 2, hair);

  fill(20, 20, 8, 12, shirt);
  fill(16, 20, 4, 12, shirtDark);
  fill(28, 20, 4, 12, shirtDark);
  fill(32, 20, 8, 12, shirt);
  fill(20, 16, 8, 4, shirt);
  fill(28, 16, 8, 4, shirtDark);

  fill(44, 20, 4, 12, skin);
  fill(40, 20, 4, 12, skin);
  fill(48, 20, 4, 12, skin);
  fill(52, 20, 4, 12, skin);
  fill(44, 16, 4, 4, skin);
  fill(48, 16, 4, 4, skin);

  fill(36, 52, 4, 12, skin);
  fill(32, 52, 4, 12, skin);
  fill(40, 52, 4, 12, skin);
  fill(44, 52, 4, 12, skin);
  fill(36, 48, 4, 4, skin);
  fill(40, 48, 4, 4, skin);

  fill(4, 20, 4, 12, pants);
  fill(0, 20, 4, 12, pantsDark);
  fill(8, 20, 4, 12, pantsDark);
  fill(12, 20, 4, 12, pants);
  fill(4, 16, 4, 4, pants);
  fill(8, 16, 4, 4, pantsDark);

  fill(20, 52, 4, 12, pants);
  fill(16, 52, 4, 12, pantsDark);
  fill(24, 52, 4, 12, pantsDark);
  fill(28, 52, 4, 12, pants);
  fill(20, 48, 4, 4, pants);
  fill(24, 48, 4, 4, pantsDark);
}

function cloneSkinSnapshot() {
  return skinSourceCtx.getImageData(0, 0, skinSourceSize, skinSourceSize);
}

function restoreSkinSnapshot(imageData) {
  if (!imageData) return;
  skinSourceCtx.putImageData(imageData, 0, 0);
}

function syncSkinToCanvasView() {
  if (!skinEditorCanvasEl) return;
  const ctx = skinEditorCanvasEl.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, skinEditorCanvasEl.width, skinEditorCanvasEl.height);
  ctx.drawImage(skinSourceCanvas, 0, 0);
}

function setSkinSourceSize(size) {
  const next = size === 128 ? 128 : 64;
  if (skinSourceSize === next && skinSourceCanvas.width === next) return;

  const prev = document.createElement("canvas");
  prev.width = skinSourceCanvas.width;
  prev.height = skinSourceCanvas.height;
  prev.getContext("2d").drawImage(skinSourceCanvas, 0, 0);

  skinSourceCanvas.width = next;
  skinSourceCanvas.height = next;
  skinSourceCtx.imageSmoothingEnabled = false;
  skinSourceCtx.clearRect(0, 0, next, next);
  skinSourceCtx.drawImage(prev, 0, 0, prev.width, prev.height, 0, 0, next, next);
  skinSourceSize = next;
}

function syncSkinToDataUrl() {
  localSkinDataUrl = skinSourceCanvas.toDataURL("image/png");
}

function saveSkinToStorage() {
  syncSkinToDataUrl();
  try { localStorage.setItem(SKIN_STORAGE_KEY, localSkinDataUrl); } catch {}
}

function isValidSkinDataUrl(value) {
  if (typeof value !== "string") return false;
  if (!value.startsWith("data:image/png;base64,")) return false;
  if (value.length > SKIN_MAX_DATA_URL_LENGTH) return false;
  return true;
}

function loadSkinFromStorage() {
  let stored = null;
  try { stored = localStorage.getItem(SKIN_STORAGE_KEY); } catch {}
  if (!stored) {
    paintDefaultSkin(defaultSkinCtx);
    setSkinSourceSize(64);
    skinSourceCtx.clearRect(0, 0, skinSourceSize, skinSourceSize);
    skinSourceCtx.drawImage(defaultSkinCanvas, 0, 0);
    syncSkinToDataUrl();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      setSkinSourceSize(img.width === 128 && img.height === 128 ? 128 : 64);
      skinSourceCtx.clearRect(0, 0, skinSourceSize, skinSourceSize);
      skinSourceCtx.drawImage(img, 0, 0, skinSourceSize, skinSourceSize);
      syncSkinToDataUrl();
      resolve();
    };
    img.onerror = () => {
      paintDefaultSkin(defaultSkinCtx);
      setSkinSourceSize(64);
      skinSourceCtx.clearRect(0, 0, skinSourceSize, skinSourceSize);
      skinSourceCtx.drawImage(defaultSkinCanvas, 0, 0);
      syncSkinToDataUrl();
      resolve();
    };
    img.src = stored;
  });
}

function getPartEnabledForPixel(x, y) {
  const checks = [
    ["head", partHeadEl?.checked !== false],
    ["body", partBodyEl?.checked !== false],
    ["arms", partArmsEl?.checked !== false],
    ["legs", partLegsEl?.checked !== false],
  ];
  for (const [part, enabled] of checks) {
    for (const r of SKIN_PART_REGIONS[part]) {
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) {
        return enabled;
      }
    }
  }
  return true;
}

function getEditorPixelFromEvent(evt) {
  const rect = skinEditorCanvasEl.getBoundingClientRect();
  const px = Math.floor(((evt.clientX - rect.left) / rect.width) * skinSourceSize);
  const py = Math.floor(((evt.clientY - rect.top) / rect.height) * skinSourceSize);
  return {
    x: Math.max(0, Math.min(skinSourceSize - 1, px)),
    y: Math.max(0, Math.min(skinSourceSize - 1, py)),
  };
}

function drawOnSkinAt(x, y) {
  const half = Math.floor(skinBrushSize / 2);
  for (let oy = 0; oy < skinBrushSize; oy += 1) {
    for (let ox = 0; ox < skinBrushSize; ox += 1) {
      const tx = x + ox - half;
      const ty = y + oy - half;
      if (tx < 0 || tx > skinSourceSize - 1 || ty < 0 || ty > skinSourceSize - 1) continue;
      if (!getPartEnabledForPixel(tx, ty)) continue;
      if (skinTool === "eraser") {
        skinSourceCtx.clearRect(tx, ty, 1, 1);
      } else {
        skinSourceCtx.fillStyle = skinColorEl.value;
        skinSourceCtx.fillRect(tx, ty, 1, 1);
      }
    }
  }
}

function pushUndoSnapshot() {
  skinUndoStack.push(cloneSkinSnapshot());
  if (skinUndoStack.length > 80) skinUndoStack.shift();
}

function applyCurrentSkinToPreviews() {
  if (menuSkinAvatar) applySkinToAvatar(menuSkinAvatar, skinSourceCanvas);
  if (skinEditorPreviewAvatar) applySkinToAvatar(skinEditorPreviewAvatar, skinSourceCanvas);
}

function setEditorOpen(open) {
  skinEditorOpen = open;
  skinEditorEl.classList.toggle("hidden", !open);
  skinEditorEl.setAttribute("aria-hidden", open ? "false" : "true");
  if (open) {
    syncSkinToCanvasView();
    applyCurrentSkinToPreviews();
  }
}

function getBlockColorById(id) {
  return id === BLOCKS.stone.id ? "#81858d" :
    id === BLOCKS.wood.id ? "#9b6d3f" :
    id === BLOCKS.leaves.id ? "#3f8f49" :
    id === BLOCKS.dirt.id ? "#8b5f3a" :
    id === BLOCKS.sand.id ? "#d8c588" :
    id === BLOCKS.brick.id ? "#9a4c39" :
    id === BLOCKS.snow.id ? "#eef7ff" :
    "#5fae4f";
}

function makeCrackTexture(stage) {
  const seg = [
    "M32 4L20 18", "M16 8L11 24", "M42 8L34 19", "M11 25L21 35", "M22 18L35 29",
    "M34 19L44 31", "M21 35L15 49", "M35 29L33 50", "M33 50L46 44", "M44 31L50 21",
  ];
  const lines = seg.slice(0, Math.max(1, Math.min(seg.length, stage + 1)))
    .map((d) => `<path d='${d}' stroke='rgba(12,12,12,0.88)' stroke-width='3' stroke-linecap='round'/>`)
    .join("");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 54 54'>${lines}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const crackTextures = new Array(10).fill(0).map((_, i) => makeCrackTexture(i));

function syncHotbarFromInventory() {
  for (let i = 0; i < HOTBAR_SIZE; i += 1) {
    HOTBAR[i] = inventorySlots[INVENTORY_MAIN_SIZE + i] ?? BLOCK_AIR;
  }
  if (selectedSlot < 0 || selectedSlot >= HOTBAR_SIZE) selectedSlot = 0;
  if (HOTBAR[selectedSlot] === BLOCK_AIR) {
    const fallbackIndex = HOTBAR.findIndex((id) => id !== BLOCK_AIR);
    selectedSlot = fallbackIndex >= 0 ? fallbackIndex : 0;
  }
}

function putHeldItemBackToInventory() {
  if (heldInventoryItem == null || heldInventoryItem === BLOCK_AIR) return;
  const emptyIndex = inventorySlots.findIndex((id) => id === BLOCK_AIR);
  if (emptyIndex >= 0) {
    inventorySlots[emptyIndex] = heldInventoryItem;
  }
  heldInventoryItem = null;
}

function resetMiningState() {
  miningActive = false;
  miningProgress = 0;
  miningKey = null;
  miningGraceTimer = 0;
  mineCracksEl.style.opacity = "0";
}

function isUiBlockingGame() {
  return chatOpen || inventoryOpen;
}

function ensureChatVisible(autoMode) {
  chatEl.classList.remove("hidden");
  chatEl.classList.remove("fade-out");
  chatAutoVisible = Boolean(autoMode);
  if (chatHideTimer) {
    clearTimeout(chatHideTimer);
    chatHideTimer = null;
  }
  if (chatFadeTimer) {
    clearTimeout(chatFadeTimer);
    chatFadeTimer = null;
  }
}

function scheduleChatAutoHide() {
  ensureChatVisible(true);
  chatHideTimer = setTimeout(() => {
    if (chatOpen) return;
    chatEl.classList.add("fade-out");
    chatFadeTimer = setTimeout(() => {
      if (!chatOpen) chatEl.classList.add("hidden");
      chatEl.classList.remove("fade-out");
      chatFadeTimer = null;
    }, 350);
    chatAutoVisible = false;
  }, 10000);
}

function tryReturnControlToGame() {
  if (!gameStarted || inventoryOpen || chatOpen) return;
  if (!pointerLocked) {
    renderer.domElement.requestPointerLock().catch(() => {});
  }
}

function updatePingOverlay() {
  pingListEl.innerHTML = "";
  const rows = [];
  if (localServerPeerId) {
    rows.push({ id: localServerPeerId, nickname: localNickname });
  }
  for (const participant of roomParticipants) {
    if (participant.id === localServerPeerId) continue;
    rows.push(participant);
  }

  rows.forEach((participant) => {
    const row = document.createElement("div");
    row.className = "ping-row";
    const name = document.createElement("span");
    name.textContent = getParticipantDisplayName(participant);
    const ms = document.createElement("span");
    ms.className = "ping-ms";
    const ping = playerPings.get(participant.id);
    ms.textContent = Number.isFinite(ping) && ping >= 0 ? `${Math.round(ping)} ms` : "-- ms";
    row.append(name, ms);
    pingListEl.append(row);
  });
}

function showPingOverlay() {
  if (!gameStarted || !isConnectedToRoom()) return;
  pingOverlayEl.classList.remove("hidden");
  updatePingOverlay();
}

function hidePingOverlay() {
  pingOverlayEl.classList.add("hidden");
}

function setMenuScreen(screen) {
  currentMenuScreen = screen;
  menuMainEl.classList.toggle("hidden", screen !== "main");
  menuMultiplayerEl.classList.toggle("hidden", screen !== "multiplayer");
  menuJoinEl.classList.toggle("hidden", screen !== "join");
  menuLobbyEl.classList.toggle("hidden", screen !== "lobby");
}

function getParticipantDisplayName(item) {
  const nick = String(item.nickname || "Player").trim();
  return nick ? nick : "Player";
}

function renderParticipants() {
  participantsListEl.innerHTML = "";
  if (!roomParticipants.length) {
    const empty = document.createElement("div");
    empty.className = "mc-room-member";
    empty.textContent = "Пока нет участников";
    participantsListEl.append(empty);
    return;
  }

  const ordered = [...roomParticipants].sort((a, b) => {
    if (a.id === lobbyHostId) return -1;
    if (b.id === lobbyHostId) return 1;
    return 0;
  });

  ordered.forEach((participant) => {
    const row = document.createElement("div");
    row.className = "mc-room-member";
    const name = document.createElement("span");
    name.textContent = getParticipantDisplayName(participant);
    row.append(name);

    if (participant.id === lobbyHostId) {
      const badge = document.createElement("span");
      badge.className = "mc-badge-host";
      badge.textContent = "Хост";
      row.append(badge);
    }

    participantsListEl.append(row);
  });
}

function syncLocalNickname() {
  const prev = localNickname;
  const next = String(nicknameInputEl.value || "").trim() || `Player-${localClientId.slice(-4)}`;
  localNickname = next;
  if (localServerPeerId) {
    ensureParticipantById(localServerPeerId, localNickname);
    renderParticipants();
    updatePingOverlay();
  }
  if (prev !== localNickname && isConnectedToRoom()) {
    ws.send(JSON.stringify({
      type: "nickname_update",
      roomCode,
      nickname: localNickname,
    }));
  }
}

function ensureParticipantById(id, nickname = "Player") {
  if (!id) return;
  const idx = roomParticipants.findIndex((p) => p.id === id);
  if (idx >= 0) {
    roomParticipants[idx].nickname = String(nickname || roomParticipants[idx].nickname || "Player").slice(0, 16);
  } else {
    roomParticipants.push({ id, nickname: String(nickname || "Player").slice(0, 16) });
  }
}

function removeParticipantById(id) {
  roomParticipants = roomParticipants.filter((p) => p.id !== id);
}

function resetLobbyState() {
  roomParticipants = [];
  lobbyHostId = null;
  roomCodeValueEl.textContent = "------";
  renderParticipants();
}

function updateLobbyStartButtonState() {
  startRoomBtnEl.disabled = !(localServerPeerId && localServerPeerId === lobbyHostId);
}

function openChat() {
  if (!gameStarted || inventoryOpen || chatOpen) return;
  chatOpen = true;
  ensureChatVisible(false);
  resetMiningState();
  keys.clear();
  if (document.pointerLockElement === renderer.domElement) {
    try { document.exitPointerLock(); } catch {}
  }
  chatInputEl.focus();
}

function closeChat() {
  if (!chatOpen) return;
  chatOpen = false;
  chatInputEl.blur();
  scheduleChatAutoHide();
  tryReturnControlToGame();
}

function renderInventorySlot(slotIndex, selectedHotbarIndex) {
  const slot = document.createElement("button");
  slot.type = "button";
  const isHotbar = slotIndex >= INVENTORY_MAIN_SIZE;
  const hotbarIndex = isHotbar ? slotIndex - INVENTORY_MAIN_SIZE : -1;
  const isActive = isHotbar && selectedHotbarIndex === hotbarIndex;
  const id = inventorySlots[slotIndex];
  slot.className = `inv-slot ${id === BLOCK_AIR ? "empty" : ""} ${isActive ? "active" : ""}`;

  if (id !== BLOCK_AIR) {
    const b = BLOCK_BY_ID.get(id);
    const item = document.createElement("div");
    item.className = "inv-item";
    const c = document.createElement("div");
    c.className = "inv-item-color";
    c.style.background = getBlockColorById(id);
    const t = document.createElement("div");
    t.className = "inv-item-name";
    t.textContent = b?.name || "Block";
    item.append(c, t);
    slot.append(item);
  }

  slot.addEventListener("click", () => {
    const current = inventorySlots[slotIndex];
    if ((heldInventoryItem == null || heldInventoryItem === BLOCK_AIR) && current !== BLOCK_AIR) {
      heldInventoryItem = current;
      inventorySlots[slotIndex] = BLOCK_AIR;
    } else if (heldInventoryItem != null && heldInventoryItem !== BLOCK_AIR) {
      inventorySlots[slotIndex] = heldInventoryItem;
      heldInventoryItem = current;
      if (heldInventoryItem === BLOCK_AIR) heldInventoryItem = null;
    }
    syncHotbarFromInventory();
    renderHotbar();
    renderInventory();
  });

  return slot;
}

function renderInventory() {
  inventoryGridEl.innerHTML = "";
  inventoryHotbarEl.innerHTML = "";
  for (let i = 0; i < INVENTORY_MAIN_SIZE; i += 1) {
    inventoryGridEl.append(renderInventorySlot(i, selectedSlot));
  }
  for (let i = INVENTORY_MAIN_SIZE; i < INVENTORY_TOTAL_SIZE; i += 1) {
    inventoryHotbarEl.append(renderInventorySlot(i, selectedSlot));
  }
  const heldName = heldInventoryItem == null ? "пусто" : (BLOCK_BY_ID.get(heldInventoryItem)?.name || "Block");
  inventoryHeldEl.textContent = `В руке: ${heldName}`;
}

function openInventory() {
  if (!gameStarted || inventoryOpen || chatOpen) return;
  inventoryOpen = true;
  inventoryEl.classList.remove("hidden");
  inventoryEl.setAttribute("aria-hidden", "false");
  resetMiningState();
  keys.clear();
  if (document.pointerLockElement === renderer.domElement) {
    try { document.exitPointerLock(); } catch {}
  }
  renderInventory();
}

function closeInventory() {
  if (!inventoryOpen) return;
  inventoryOpen = false;
  putHeldItemBackToInventory();
  syncHotbarFromInventory();
  renderHotbar();
  inventoryEl.classList.add("hidden");
  inventoryEl.setAttribute("aria-hidden", "true");
}

let ws = null;
let roomCode = null;

const keys = new Set();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = false;
renderer.domElement.classList.add("game-canvas");
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xb9d9ff, 0x5f6248, 1.1);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(35, 50, 20);
scene.add(sun);

const CHUNK_MESH_GROUP = new THREE.Group();
scene.add(CHUNK_MESH_GROUP);

const remotePlayersGroup = new THREE.Group();
scene.add(remotePlayersGroup);

function makePixelTexture(drawFn) {
  const size = 16;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  drawFn(g, size);
  const texture = new THREE.CanvasTexture(c);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function fillNoise(g, size, base, variations) {
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < size * 4; i += 1) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    g.fillStyle = variations[Math.floor(Math.random() * variations.length)];
    g.fillRect(x, y, 1, 1);
  }
}

const textureGrassTop = makePixelTexture((g, s) => {
  fillNoise(g, s, "#5fae4f", ["#4a9a3f", "#74bf61", "#3f8b35"]);
});
const textureGrassSide = makePixelTexture((g, s) => {
  fillNoise(g, s, "#8b5f3a", ["#7d542f", "#9a6b44"]);
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < s; x += 1) {
      g.fillStyle = x % 3 === 0 ? "#67b357" : "#59a94d";
      g.fillRect(x, y, 1, 1);
    }
  }
});
const textureDirt = makePixelTexture((g, s) => {
  fillNoise(g, s, "#8b5f3a", ["#734d30", "#9a6d49", "#7f5837"]);
});
const textureStone = makePixelTexture((g, s) => {
  fillNoise(g, s, "#81858d", ["#73777f", "#969aa3", "#6e737a"]);
});
const textureWoodSide = makePixelTexture((g, s) => {
  fillNoise(g, s, "#9b6d3f", ["#875f37", "#b07b47"]);
  for (let x = 0; x < s; x += 4) {
    g.fillStyle = "#7b542f";
    g.fillRect(x, 0, 1, s);
  }
});
const textureWoodTop = makePixelTexture((g, s) => {
  g.fillStyle = "#98693c";
  g.fillRect(0, 0, s, s);
  g.strokeStyle = "#7e572f";
  for (let r = 2; r < s / 2; r += 2) {
    g.strokeRect(r, r, s - r * 2, s - r * 2);
  }
});
const textureLeaves = makePixelTexture((g, s) => {
  g.fillStyle = "#3f8f49";
  g.fillRect(0, 0, s, s);
  for (let i = 0; i < s * 5; i += 1) {
    g.fillStyle = Math.random() > 0.5 ? "#4ea85a" : "#2e7838";
    g.fillRect(Math.floor(Math.random() * s), Math.floor(Math.random() * s), 1, 1);
  }
});
const textureSand = makePixelTexture((g, s) => {
  fillNoise(g, s, "#d8c588", ["#c9b97f", "#e3d197", "#bfae74"]);
});
const textureBrick = makePixelTexture((g, s) => {
  g.fillStyle = "#9a4c39";
  g.fillRect(0, 0, s, s);
  g.fillStyle = "#b56149";
  for (let y = 0; y < s; y += 4) {
    for (let x = (y % 8 === 0 ? 0 : 2); x < s; x += 4) {
      g.fillRect(x, y, 3, 3);
    }
  }
  g.fillStyle = "#6f3427";
  for (let y = 3; y < s; y += 4) g.fillRect(0, y, s, 1);
});
const textureSnow = makePixelTexture((g, s) => {
  fillNoise(g, s, "#eef7ff", ["#ffffff", "#d9ebfb", "#cfe3f4"]);
});
const textureWater = makePixelTexture((g, s) => {
  fillNoise(g, s, "#4a83cb", ["#3b72b8", "#5f98dd", "#2f5fa3"]);
  for (let y = 0; y < s; y += 4) {
    g.fillStyle = "rgba(255,255,255,0.2)";
    g.fillRect(0, y, s, 1);
  }
});

const materialsById = new Map();
materialsById.set(BLOCKS.grass.id, [
  new THREE.MeshLambertMaterial({ map: textureGrassSide }),
  new THREE.MeshLambertMaterial({ map: textureGrassSide }),
  new THREE.MeshLambertMaterial({ map: textureGrassTop }),
  new THREE.MeshLambertMaterial({ map: textureDirt }),
  new THREE.MeshLambertMaterial({ map: textureGrassSide }),
  new THREE.MeshLambertMaterial({ map: textureGrassSide }),
]);
materialsById.set(BLOCKS.dirt.id, new THREE.MeshLambertMaterial({ map: textureDirt }));
materialsById.set(BLOCKS.stone.id, new THREE.MeshLambertMaterial({ map: textureStone }));
materialsById.set(BLOCKS.wood.id, [
  new THREE.MeshLambertMaterial({ map: textureWoodSide }),
  new THREE.MeshLambertMaterial({ map: textureWoodSide }),
  new THREE.MeshLambertMaterial({ map: textureWoodTop }),
  new THREE.MeshLambertMaterial({ map: textureWoodTop }),
  new THREE.MeshLambertMaterial({ map: textureWoodSide }),
  new THREE.MeshLambertMaterial({ map: textureWoodSide }),
]);
materialsById.set(BLOCKS.leaves.id, new THREE.MeshLambertMaterial({ map: textureLeaves }));
materialsById.set(BLOCKS.sand.id, new THREE.MeshLambertMaterial({ map: textureSand }));
materialsById.set(BLOCKS.brick.id, new THREE.MeshLambertMaterial({ map: textureBrick }));
materialsById.set(BLOCKS.snow.id, new THREE.MeshLambertMaterial({ map: textureSnow }));

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

const worldState = {
  chunks: new Map(),
  chunkMeshes: new Map(),
  overrides: new Map(),
};

const remotePlayers = new Map();

function makePartTexture(base, accents = []) {
  return makePixelTexture((g, s) => {
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);
    for (const a of accents) {
      g.fillStyle = a.color;
      g.fillRect(a.x, a.y, a.w, a.h);
    }
  });
}

function buildSkinFaceTexture(skinCanvas, x, y, w, h, flipX = false) {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const g = c.getContext("2d");
  g.imageSmoothingEnabled = false;
  const scale = skinCanvas.width / 64;
  const sx = Math.round(x * scale);
  const sy = Math.round(y * scale);
  const sw = Math.round(w * scale);
  const sh = Math.round(h * scale);
  if (flipX) {
    g.save();
    g.translate(16, 0);
    g.scale(-1, 1);
    g.drawImage(skinCanvas, sx, sy, sw, sh, 0, 0, 16, 16);
    g.restore();
  } else {
    g.drawImage(skinCanvas, sx, sy, sw, sh, 0, 0, 16, 16);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildSkinMaterialSet(skinCanvas, part, side = "right", overlay = false) {
  const f = (x, y, w, h, flipX = false) => ({ x, y, w, h, flipX });
  const R = (x1, y1, x2, y2, flipX = false) => {
    const r = skinRect(x1, y1, x2, y2);
    return f(r.x, r.y, r.w, r.h, flipX);
  };
  let faces;

  if (part === "head" && !overlay) {
    faces = {
      top: R(9, 1, 16, 8),
      bottom: R(17, 1, 24, 8),
      left: R(1, 9, 8, 16),
      front: R(9, 9, 16, 16),
      right: R(17, 9, 24, 16),
      back: R(25, 9, 32, 16),
    };
  } else if (part === "head" && overlay) {
    faces = {
      top: R(41, 1, 48, 8),
      bottom: R(49, 1, 56, 8),
      left: R(33, 9, 40, 16),
      front: R(41, 9, 48, 16),
      right: R(49, 9, 56, 16),
      back: R(57, 9, 64, 16),
    };
  } else if (part === "body" && !overlay) {
    faces = {
      top: R(21, 17, 28, 20),
      bottom: R(29, 17, 36, 20),
      left: R(17, 21, 20, 32),
      front: R(21, 21, 28, 32),
      right: R(29, 21, 32, 32),
      back: R(33, 21, 40, 32),
    };
  } else if (part === "body" && overlay) {
    faces = {
      top: R(21, 33, 28, 36),
      bottom: R(29, 33, 36, 36),
      left: R(17, 37, 20, 48),
      front: R(21, 37, 28, 48),
      right: R(29, 37, 32, 48),
      back: R(33, 37, 40, 48),
    };
  } else if (part === "arm") {
    if (side === "right" && !overlay) {
      faces = {
        top: R(45, 17, 48, 20),
        bottom: R(49, 17, 52, 20),
        left: R(41, 21, 44, 32),
        front: R(45, 21, 48, 32),
        right: R(49, 21, 52, 32),
        back: R(53, 21, 56, 32),
      };
    } else if (side === "right" && overlay) {
      faces = {
        top: R(45, 33, 48, 36),
        bottom: R(49, 33, 52, 36),
        left: R(41, 37, 44, 48),
        front: R(45, 37, 48, 48),
        right: R(49, 37, 52, 48),
        back: R(53, 37, 56, 48),
      };
    } else if (side === "left" && !overlay) {
      faces = {
        top: R(37, 49, 40, 52),
        bottom: R(41, 49, 44, 52),
        left: R(33, 53, 36, 64),
        front: R(37, 53, 40, 64),
        right: R(41, 53, 44, 64),
        back: R(45, 53, 48, 64),
      };
    } else {
      faces = {
        top: R(53, 49, 56, 52),
        bottom: R(57, 49, 60, 52),
        left: R(49, 53, 52, 64),
        front: R(53, 53, 56, 64),
        right: R(57, 53, 60, 64),
        back: R(61, 53, 64, 64),
      };
    }
  } else {
    if (side === "right" && !overlay) {
      faces = {
        top: R(5, 17, 8, 20),
        bottom: R(9, 17, 12, 20),
        left: R(1, 21, 4, 32),
        front: R(5, 21, 8, 32),
        right: R(9, 21, 12, 32),
        back: R(13, 21, 16, 32),
      };
    } else if (side === "right" && overlay) {
      faces = {
        top: R(5, 33, 8, 36),
        bottom: R(9, 33, 12, 36),
        left: R(1, 37, 4, 48),
        front: R(5, 37, 8, 48),
        right: R(9, 37, 12, 48),
        back: R(13, 37, 16, 48),
      };
    } else if (side === "left" && !overlay) {
      faces = {
        top: R(21, 49, 24, 52),
        bottom: R(25, 49, 28, 52),
        left: R(17, 53, 20, 64),
        front: R(21, 53, 24, 64),
        right: R(25, 53, 28, 64),
        back: R(29, 53, 32, 64),
      };
    } else {
      faces = {
        top: R(5, 49, 8, 52),
        bottom: R(9, 49, 12, 52),
        left: R(1, 53, 4, 64),
        front: R(5, 53, 8, 64),
        right: R(9, 53, 12, 64),
        back: R(13, 53, 16, 64),
      };
    }
  }

  const mk = (face) => {
    const info = faces[face];
    return new THREE.MeshLambertMaterial({
      map: buildSkinFaceTexture(skinCanvas, info.x, info.y, info.w, info.h, info.flipX),
      transparent: true,
    });
  };

  return [mk("right"), mk("left"), mk("top"), mk("bottom"), mk("front"), mk("back")];
}

function disposeSkinMaterials(material) {
  const arr = Array.isArray(material) ? material : [material];
  for (const m of arr) {
    if (m?.map) m.map.dispose();
    if (m) m.dispose();
  }
}

function applySkinToAvatar(avatar, skinCanvas) {
  if (!avatar || !skinCanvas) return;
  if (avatar.bodyMesh?.material) disposeSkinMaterials(avatar.bodyMesh.material);
  if (avatar.headMesh?.material) disposeSkinMaterials(avatar.headMesh.material);
  if (avatar.leftArmMesh?.material) disposeSkinMaterials(avatar.leftArmMesh.material);
  if (avatar.rightArmMesh?.material) disposeSkinMaterials(avatar.rightArmMesh.material);
  if (avatar.leftLegMesh?.material) disposeSkinMaterials(avatar.leftLegMesh.material);
  if (avatar.rightLegMesh?.material) disposeSkinMaterials(avatar.rightLegMesh.material);
  if (avatar.headOverlayMesh?.material) disposeSkinMaterials(avatar.headOverlayMesh.material);
  if (avatar.bodyOverlayMesh?.material) disposeSkinMaterials(avatar.bodyOverlayMesh.material);
  if (avatar.leftArmOverlayMesh?.material) disposeSkinMaterials(avatar.leftArmOverlayMesh.material);
  if (avatar.rightArmOverlayMesh?.material) disposeSkinMaterials(avatar.rightArmOverlayMesh.material);
  if (avatar.leftLegOverlayMesh?.material) disposeSkinMaterials(avatar.leftLegOverlayMesh.material);
  if (avatar.rightLegOverlayMesh?.material) disposeSkinMaterials(avatar.rightLegOverlayMesh.material);

  avatar.bodyMesh.material = buildSkinMaterialSet(skinCanvas, "body");
  avatar.headMesh.material = buildSkinMaterialSet(skinCanvas, "head");
  avatar.leftArmMesh.material = buildSkinMaterialSet(skinCanvas, "arm", "left");
  avatar.rightArmMesh.material = buildSkinMaterialSet(skinCanvas, "arm", "right");
  avatar.leftLegMesh.material = buildSkinMaterialSet(skinCanvas, "leg", "left");
  avatar.rightLegMesh.material = buildSkinMaterialSet(skinCanvas, "leg", "right");
  avatar.headOverlayMesh.material = buildSkinMaterialSet(skinCanvas, "head", "right", true);
  avatar.bodyOverlayMesh.material = buildSkinMaterialSet(skinCanvas, "body", "right", true);
  avatar.leftArmOverlayMesh.material = buildSkinMaterialSet(skinCanvas, "arm", "left", true);
  avatar.rightArmOverlayMesh.material = buildSkinMaterialSet(skinCanvas, "arm", "right", true);
  avatar.leftLegOverlayMesh.material = buildSkinMaterialSet(skinCanvas, "leg", "left", true);
  avatar.rightLegOverlayMesh.material = buildSkinMaterialSet(skinCanvas, "leg", "right", true);
}

function createSteveAvatar(options = {}) {
  const skinCanvas = options.skinCanvas || skinSourceCanvas;
  const root = new THREE.Group();

  const bodyMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.72, 0.28),
    buildSkinMaterialSet(skinCanvas, "body")
  );
  bodyMesh.position.set(0, 1.08, 0);
  root.add(bodyMesh);
  const bodyOverlayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.588, 0.748, 0.308),
    buildSkinMaterialSet(skinCanvas, "body", "right", true)
  );
  bodyOverlayMesh.position.set(0, 1.08, 0);
  bodyOverlayMesh.renderOrder = 2;
  root.add(bodyOverlayMesh);

  const headPivot = new THREE.Group();
  headPivot.position.set(0, 1.44, 0);
  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.48, 0.48),
    buildSkinMaterialSet(skinCanvas, "head")
  );
  headMesh.position.set(0, 0.24, 0);
  headPivot.add(headMesh);
  const headOverlayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.504, 0.504, 0.504),
    buildSkinMaterialSet(skinCanvas, "head", "right", true)
  );
  headOverlayMesh.position.set(0, 0.24, 0);
  headOverlayMesh.renderOrder = 2;
  headPivot.add(headOverlayMesh);
  root.add(headPivot);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(0.39, 1.38, 0);
  const leftArmMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.72, 0.22),
    buildSkinMaterialSet(skinCanvas, "arm", "left")
  );
  leftArmMesh.position.set(0, -0.36, 0);
  leftArmPivot.add(leftArmMesh);
  const leftArmOverlayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.242, 0.742, 0.242),
    buildSkinMaterialSet(skinCanvas, "arm", "left", true)
  );
  leftArmOverlayMesh.position.set(0, -0.36, 0);
  leftArmOverlayMesh.renderOrder = 2;
  leftArmPivot.add(leftArmOverlayMesh);
  root.add(leftArmPivot);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(-0.39, 1.38, 0);
  const rightArmMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.72, 0.22),
    buildSkinMaterialSet(skinCanvas, "arm", "right")
  );
  rightArmMesh.position.set(0, -0.36, 0);
  rightArmPivot.add(rightArmMesh);
  const rightArmOverlayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.242, 0.742, 0.242),
    buildSkinMaterialSet(skinCanvas, "arm", "right", true)
  );
  rightArmOverlayMesh.position.set(0, -0.36, 0);
  rightArmOverlayMesh.renderOrder = 2;
  rightArmPivot.add(rightArmOverlayMesh);
  root.add(rightArmPivot);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(0.14, 0.75, 0);
  const leftLegMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.75, 0.24),
    buildSkinMaterialSet(skinCanvas, "leg", "left")
  );
  leftLegMesh.position.set(0, -0.375, 0);
  leftLegPivot.add(leftLegMesh);
  const leftLegOverlayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.262, 0.772, 0.262),
    buildSkinMaterialSet(skinCanvas, "leg", "left", true)
  );
  leftLegOverlayMesh.position.set(0, -0.375, 0);
  leftLegOverlayMesh.renderOrder = 2;
  leftLegPivot.add(leftLegOverlayMesh);
  root.add(leftLegPivot);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(-0.14, 0.75, 0);
  const rightLegMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.75, 0.24),
    buildSkinMaterialSet(skinCanvas, "leg", "right")
  );
  rightLegMesh.position.set(0, -0.375, 0);
  rightLegPivot.add(rightLegMesh);
  const rightLegOverlayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.262, 0.772, 0.262),
    buildSkinMaterialSet(skinCanvas, "leg", "right", true)
  );
  rightLegOverlayMesh.position.set(0, -0.375, 0);
  rightLegOverlayMesh.renderOrder = 2;
  rightLegPivot.add(rightLegOverlayMesh);
  root.add(rightLegPivot);

  const nameCanvas = document.createElement("canvas");
  nameCanvas.width = 256;
  nameCanvas.height = 64;
  const nameCtx = nameCanvas.getContext("2d");
  const nameTexture = new THREE.CanvasTexture(nameCanvas);
  nameTexture.minFilter = THREE.LinearFilter;
  nameTexture.magFilter = THREE.LinearFilter;
  const nameMat = new THREE.SpriteMaterial({ map: nameTexture, transparent: true });
  const nameSprite = new THREE.Sprite(nameMat);
  nameSprite.position.set(0, 2.15, 0);
  nameSprite.scale.set(1.6, 0.4, 1);
  root.add(nameSprite);

  const avatar = {
    root,
    headPivot,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    bodyMesh,
    headMesh,
    leftArmMesh,
    rightArmMesh,
    leftLegMesh,
    rightLegMesh,
    headOverlayMesh,
    bodyOverlayMesh,
    leftArmOverlayMesh,
    rightArmOverlayMesh,
    leftLegOverlayMesh,
    rightLegOverlayMesh,
    targetPos: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    pitch: 0,
    moveIntensity: 0,
    phase: 0,
    prevNetPos: null,
    nickname: "Player",
    nameCanvas,
    nameCtx,
    nameTexture,
    nameSprite,
  };

  updateAvatarNickname(avatar, "Player");
  return avatar;
}

function updateAvatarNickname(avatar, nickname) {
  avatar.nickname = nickname;
  const ctx = avatar.nameCtx;
  const c = avatar.nameCanvas;
  ctx.clearRect(0, 0, c.width, c.height);
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(24, 14, 208, 36);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(nickname || "Player", c.width / 2, c.height / 2 + 1);
  avatar.nameTexture.needsUpdate = true;
}

const player = {
  position: new THREE.Vector3(0, 32, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  yaw: 0,
  pitch: 0,
  onGround: false,
};

const raycaster = new THREE.Raycaster();
raycaster.far = 8;

const wireframeTarget = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01, 1.01, 1.01)),
  new THREE.LineBasicMaterial({ color: 0xffffff })
);
wireframeTarget.visible = false;
scene.add(wireframeTarget);

function chunkKey(cx, cz) {
  return `${cx},${cz}`;
}

function toChunkCoord(v) {
  return Math.floor(v / CHUNK_SIZE);
}

function localIndex(x, y, z) {
  return x + z * CHUNK_SIZE + y * CHUNK_SIZE * CHUNK_SIZE;
}

function worldToChunkLocal(x, y, z) {
  const cx = toChunkCoord(x);
  const cz = toChunkCoord(z);
  const lx = ((x % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  const lz = ((z % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
  return { cx, cz, lx, y, lz };
}

function pseudoNoise(x, z) {
  const a = Math.sin(x * 0.071) * 0.5 + 0.5;
  const b = Math.cos(z * 0.063) * 0.5 + 0.5;
  const c = Math.sin((x + z) * 0.019) * 0.5 + 0.5;
  return (a * 0.45 + b * 0.35 + c * 0.2);
}

function terrainHeight(x, z) {
  return Math.floor(20 + pseudoNoise(x, z) * 20);
}

function treeChance(x, z) {
  const n = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

function generateChunk(cx, cz) {
  const data = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);

  for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
      const wx = cx * CHUNK_SIZE + lx;
      const wz = cz * CHUNK_SIZE + lz;
      const h = Math.max(3, Math.min(WORLD_HEIGHT - 2, terrainHeight(wx, wz)));

      for (let y = 0; y <= h; y += 1) {
        let id = BLOCKS.stone.id;
        if (y === h) id = BLOCKS.grass.id;
        else if (y > h - 3) id = BLOCKS.dirt.id;
        data[localIndex(lx, y, lz)] = id;
      }

      if (h > 12 && treeChance(wx, wz) > 0.988) {
        const trunk = 3 + Math.floor(treeChance(wx + 11, wz + 17) * 3);
        for (let i = 1; i <= trunk; i += 1) {
          const y = h + i;
          if (y < WORLD_HEIGHT) data[localIndex(lx, y, lz)] = BLOCKS.wood.id;
        }
        const topY = h + trunk;
        for (let ox = -2; ox <= 2; ox += 1) {
          for (let oy = -2; oy <= 2; oy += 1) {
            for (let oz = -2; oz <= 2; oz += 1) {
              const d = Math.abs(ox) + Math.abs(oy) + Math.abs(oz);
              if (d > 3) continue;
              const tx = lx + ox;
              const tz = lz + oz;
              const ty = topY + oy;
              if (tx >= 0 && tx < CHUNK_SIZE && tz >= 0 && tz < CHUNK_SIZE && ty >= 0 && ty < WORLD_HEIGHT) {
                const li = localIndex(tx, ty, tz);
                if (data[li] === BLOCK_AIR) data[li] = BLOCKS.leaves.id;
              }
            }
          }
        }
      }
    }
  }

  return { cx, cz, data };
}

function overrideKey(x, y, z) {
  return `${x},${y},${z}`;
}

function getBlock(x, y, z) {
  if (y < 0 || y >= WORLD_HEIGHT) return BLOCK_AIR;
  const oKey = overrideKey(x, y, z);
  if (worldState.overrides.has(oKey)) return worldState.overrides.get(oKey);

  const { cx, cz, lx, lz } = worldToChunkLocal(x, y, z);
  const key = chunkKey(cx, cz);
  let chunk = worldState.chunks.get(key);
  if (!chunk) {
    chunk = generateChunk(cx, cz);
    worldState.chunks.set(key, chunk);
  }
  return chunk.data[localIndex(lx, y, lz)];
}

function setBlock(x, y, z, id, fromNetwork = false) {
  if (y < 0 || y >= WORLD_HEIGHT) return;
  worldState.overrides.set(overrideKey(x, y, z), id);
  markChunkDirtyAtWorld(x, z);

  if (!fromNetwork && ws && ws.readyState === WebSocket.OPEN && roomCode) {
    ws.send(JSON.stringify({
      type: "block_set",
      roomCode,
      x,
      y,
      z,
      id,
    }));
  }
}

const dirtyChunks = new Set();

function markChunkDirty(cx, cz) {
  dirtyChunks.add(chunkKey(cx, cz));
}

function markChunkDirtyAtWorld(x, z) {
  const cx = toChunkCoord(x);
  const cz = toChunkCoord(z);
  markChunkDirty(cx, cz);
  if (x % CHUNK_SIZE === 0) markChunkDirty(cx - 1, cz);
  if (x % CHUNK_SIZE === CHUNK_SIZE - 1) markChunkDirty(cx + 1, cz);
  if (z % CHUNK_SIZE === 0) markChunkDirty(cx, cz - 1);
  if (z % CHUNK_SIZE === CHUNK_SIZE - 1) markChunkDirty(cx, cz + 1);
}

function ensureChunksAroundPlayer() {
  const pcx = toChunkCoord(Math.floor(player.position.x));
  const pcz = toChunkCoord(Math.floor(player.position.z));

  for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz += 1) {
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx += 1) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const key = chunkKey(cx, cz);
      if (!worldState.chunks.has(key)) {
        worldState.chunks.set(key, generateChunk(cx, cz));
      }
      if (!worldState.chunkMeshes.has(key)) {
        buildChunkMesh(cx, cz);
      }
    }
  }

  const maxDist = RENDER_DISTANCE + 2;
  for (const [key, group] of worldState.chunkMeshes) {
    const [cxS, czS] = key.split(",");
    const cx = Number(cxS);
    const cz = Number(czS);
    if (Math.abs(cx - pcx) > maxDist || Math.abs(cz - pcz) > maxDist) {
      CHUNK_MESH_GROUP.remove(group);
      for (const child of group.children) {
        child.geometry.dispose();
      }
      worldState.chunkMeshes.delete(key);
    }
  }
}

function buildChunkMesh(cx, cz) {
  const key = chunkKey(cx, cz);
  const old = worldState.chunkMeshes.get(key);
  if (old) {
    CHUNK_MESH_GROUP.remove(old);
    for (const child of old.children) {
      child.geometry.dispose();
    }
  }

  const group = new THREE.Group();
  group.position.set(0, 0, 0);

  const perType = new Map();
  for (const block of BLOCK_LIST) {
    if (block.id !== BLOCK_AIR) perType.set(block.id, []);
  }

  const minX = cx * CHUNK_SIZE;
  const minZ = cz * CHUNK_SIZE;
  for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
      for (let y = 0; y < WORLD_HEIGHT; y += 1) {
        const x = minX + lx;
        const z = minZ + lz;
        const id = getBlock(x, y, z);
        if (id === BLOCK_AIR) continue;

        const exposed = (
          getBlock(x + 1, y, z) === BLOCK_AIR ||
          getBlock(x - 1, y, z) === BLOCK_AIR ||
          getBlock(x, y + 1, z) === BLOCK_AIR ||
          getBlock(x, y - 1, z) === BLOCK_AIR ||
          getBlock(x, y, z + 1) === BLOCK_AIR ||
          getBlock(x, y, z - 1) === BLOCK_AIR
        );
        if (!exposed) continue;

        const m = new THREE.Matrix4().makeTranslation(x + 0.5, y + 0.5, z + 0.5);
        perType.get(id).push(m);
      }
    }
  }

  for (const [id, matrices] of perType) {
    if (!matrices.length) continue;
    const mat = materialsById.get(id);
    const mesh = new THREE.InstancedMesh(cubeGeometry, mat, matrices.length);
    mesh.frustumCulled = true;
    for (let i = 0; i < matrices.length; i += 1) {
      mesh.setMatrixAt(i, matrices[i]);
    }
    group.add(mesh);
  }

  CHUNK_MESH_GROUP.add(group);
  worldState.chunkMeshes.set(key, group);
}

function flushDirtyChunks() {
  const items = [...dirtyChunks];
  dirtyChunks.clear();
  for (const key of items) {
    const [cxS, czS] = key.split(",");
    buildChunkMesh(Number(cxS), Number(czS));
  }
}

function isSolid(x, y, z) {
  const id = getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
  const b = BLOCK_BY_ID.get(id);
  return b ? b.solid : false;
}

function collidesAt(pos) {
  const minX = Math.floor(pos.x - PLAYER_RADIUS);
  const maxX = Math.floor(pos.x + PLAYER_RADIUS);
  const minY = Math.floor(pos.y);
  const maxY = Math.floor(pos.y + PLAYER_HEIGHT);
  const minZ = Math.floor(pos.z - PLAYER_RADIUS);
  const maxZ = Math.floor(pos.z + PLAYER_RADIUS);

  for (let x = minX; x <= maxX; x += 1) {
    for (let y = minY; y <= maxY; y += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        if (isSolid(x, y, z)) return true;
      }
    }
  }
  return false;
}

function updateMovement(dt) {
  const speed = keys.has("ShiftLeft") ? SPRINT_SPEED : WALK_SPEED;
  const forward = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0);
  const right = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
  const input = new THREE.Vector2(right, forward);
  if (input.lengthSq() > 0) input.normalize();

  const sin = Math.sin(player.yaw);
  const cos = Math.cos(player.yaw);
  const moveX = (sin * input.y + cos * input.x) * speed;
  const moveZ = (cos * input.y - sin * input.x) * speed;

  const accel = player.onGround ? 22 : 8;
  player.velocity.x += (moveX - player.velocity.x) * Math.min(1, accel * dt);
  player.velocity.z += (moveZ - player.velocity.z) * Math.min(1, accel * dt);

  if (input.lengthSq() === 0 && player.onGround) {
    player.velocity.x *= Math.max(0, 1 - 14 * dt);
    player.velocity.z *= Math.max(0, 1 - 14 * dt);
  }

  if (keys.has("Space") && player.onGround) {
    player.velocity.y = JUMP_SPEED;
    player.onGround = false;
  }

  player.velocity.y -= GRAVITY * dt;

  const next = player.position.clone();

  next.x += player.velocity.x * dt;
  if (!collidesAt(next)) player.position.x = next.x;
  else player.velocity.x = 0;
  next.x = player.position.x;

  next.z += player.velocity.z * dt;
  if (!collidesAt(next)) player.position.z = next.z;
  else player.velocity.z = 0;
  next.z = player.position.z;

  next.y += player.velocity.y * dt;
  if (!collidesAt(next)) {
    player.position.y = next.y;
    player.onGround = false;
  } else {
    if (player.velocity.y < 0) player.onGround = true;
    player.velocity.y = 0;
  }

  if (player.position.y < 2) {
    player.position.y = 40;
    player.velocity.set(0, 0, 0);
  }

  camera.position.set(player.position.x, player.position.y + 1.62, player.position.z);
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}

function spawnAtSafePlace() {
  const x = 0;
  const z = 0;
  const h = terrainHeight(x, z);
  player.position.set(0.5, h + 2, 0.5);
  camera.position.set(player.position.x, player.position.y + 1.62, player.position.z);
}

function updateTargetBlock() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const dir = raycaster.ray.direction;
  const origin = raycaster.ray.origin;

  const step = 0.02;
  let prevCell = null;
  for (let t = 0; t <= raycaster.far; t += step) {
    const x = origin.x + dir.x * t;
    const y = origin.y + dir.y * t;
    const z = origin.z + dir.z * t;
    const cell = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) };
    if (prevCell && cell.x === prevCell.x && cell.y === prevCell.y && cell.z === prevCell.z) {
      continue;
    }
    const id = getBlock(cell.x, cell.y, cell.z);
    if (id !== BLOCK_AIR) {
      wireframeTarget.visible = true;
      wireframeTarget.position.set(cell.x + 0.5, cell.y + 0.5, cell.z + 0.5);
      return { hit: cell, prev: prevCell, id };
    }
    prevCell = cell;
  }

  wireframeTarget.visible = false;
  return null;
}

function wouldBlockPlayerAt(x, y, z) {
  const pMinX = player.position.x - PLAYER_RADIUS;
  const pMaxX = player.position.x + PLAYER_RADIUS;
  const pMinY = player.position.y;
  const pMaxY = player.position.y + PLAYER_HEIGHT;
  const pMinZ = player.position.z - PLAYER_RADIUS;
  const pMaxZ = player.position.z + PLAYER_RADIUS;

  return pMinX < x + 1 && pMaxX > x && pMinY < y + 1 && pMaxY > y && pMinZ < z + 1 && pMaxZ > z;
}

function placeBlock() {
  const target = updateTargetBlock();
  if (!target || !target.prev) return;
  const id = HOTBAR[selectedSlot];
  if (!id || id === BLOCK_AIR) return;
  const { x, y, z } = target.prev;
  if (wouldBlockPlayerAt(x, y, z)) return;
  if (getBlock(x, y, z) !== BLOCK_AIR) return;
  setBlock(x, y, z, id);
}

function updateMining(dt) {
  if (!miningActive || !pointerLocked || !gameStarted || isUiBlockingGame()) {
    miningProgress = 0;
    miningKey = null;
    mineCracksEl.style.opacity = "0";
    return;
  }

  const target = updateTargetBlock();
  if (!target) {
    miningGraceTimer += dt;
    if (miningGraceTimer >= 0.15) {
      miningProgress = 0;
      miningKey = null;
      mineCracksEl.style.opacity = "0";
    }
    return;
  }
  miningGraceTimer = 0;

  const blockCenter = new THREE.Vector3(target.hit.x + 0.5, target.hit.y + 0.5, target.hit.z + 0.5);
  const screenPos = blockCenter.project(camera);
  const isVisible = screenPos.z >= -1 && screenPos.z <= 1;
  if (!isVisible) {
    mineCracksEl.style.opacity = "0";
    return;
  }
  mineCracksEl.style.left = `${((screenPos.x * 0.5 + 0.5) * window.innerWidth).toFixed(2)}px`;
  mineCracksEl.style.top = `${((-screenPos.y * 0.5 + 0.5) * window.innerHeight).toFixed(2)}px`;

  const key = `${target.hit.x},${target.hit.y},${target.hit.z}`;
  if (miningKey !== key) {
    miningKey = key;
    miningProgress = 0;
    mineCracksEl.style.opacity = "0";
  }

  const info = BLOCK_BY_ID.get(target.id);
  const hardness = Math.max(0.2, Number(info?.hardness || 1));
  miningProgress += dt / hardness;

  const stage = Math.max(0, Math.min(9, Math.floor(miningProgress * 10)));
  mineCracksEl.style.backgroundImage = crackTextures[stage];
  mineCracksEl.style.opacity = "1";

  if (miningProgress >= 1) {
    setBlock(target.hit.x, target.hit.y, target.hit.z, BLOCK_AIR);
    miningProgress = 0;
    miningKey = null;
    mineCracksEl.style.opacity = "0";
  }
}

document.addEventListener("keydown", (e) => {
  const active = document.activeElement;
  const isTyping = active === chatInputEl || active === nicknameInputEl || active === roomCodeInputEl;

    if (e.code === "Escape") {
      if (chatOpen) {
        e.preventDefault();
        closeChat();
        if (active && typeof active.blur === "function") active.blur();
        return;
    }
    if (inventoryOpen) {
      e.preventDefault();
      closeInventory();
      if (active && typeof active.blur === "function") active.blur();
      return;
    }
  }

  if (e.code === "KeyT" && gameStarted && !inventoryOpen && !isTyping) {
    e.preventDefault();
    if (chatOpen) closeChat();
    else openChat();
    return;
  }

  if (e.code === "Tab" && gameStarted && !tabHeld) {
    e.preventDefault();
    tabHeld = true;
    showPingOverlay();
    return;
  }

  if (e.code === "KeyE" && gameStarted && !chatOpen && active !== nicknameInputEl && active !== roomCodeInputEl) {
    e.preventDefault();
    if (inventoryOpen) closeInventory();
    else openInventory();
    return;
  }

    if (isTyping && e.code !== "Escape") {
      if (active === chatInputEl && e.code === "Enter") {
        e.preventDefault();
        const sent = sendChatMessage();
        if (sent) closeChat();
        if (active && typeof active.blur === "function") active.blur();
      }
      return;
    }

  if (isUiBlockingGame()) {
    return;
  }

  keys.add(e.code);
  if (e.code.startsWith("Digit")) {
    const i = Number(e.code.slice(5)) - 1;
    if (i >= 0 && i < HOTBAR_SIZE) {
      selectedSlot = i;
      renderHotbar();
    }
  }

  if (e.code === "Enter") {
    e.preventDefault();
    openChat();
  }
});

document.addEventListener("keyup", (e) => {
  keys.delete(e.code);
  if (e.code === "Tab") {
    tabHeld = false;
    hidePingOverlay();
  }
});

window.addEventListener("blur", () => {
  tabHeld = false;
  hidePingOverlay();
});

renderer.domElement.addEventListener("click", async () => {
  if (!gameStarted) return;
  if (isUiBlockingGame()) return;
  if (!pointerLocked) await renderer.domElement.requestPointerLock();
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener("mousemove", (e) => {
  if (!pointerLocked || isUiBlockingGame()) return;
  const s = 0.0022;
  player.yaw -= e.movementX * s;
  player.pitch -= e.movementY * s;
  const limit = Math.PI / 2 - 0.01;
  player.pitch = Math.max(-limit, Math.min(limit, player.pitch));
});

renderer.domElement.addEventListener("contextmenu", (e) => e.preventDefault());
renderer.domElement.addEventListener("mousedown", (e) => {
  if (!gameStarted) return;
  if (isUiBlockingGame()) return;
  if (!pointerLocked) return;
  if (e.button === 0) {
    miningActive = true;
  }
  else if (e.button === 2) placeBlock();
});

renderer.domElement.addEventListener("mouseup", (e) => {
  if (e.button === 0) {
    resetMiningState();
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function renderHotbar() {
  hotbarEl.innerHTML = "";
  HOTBAR.forEach((id, i) => {
    const slot = document.createElement("div");
    slot.className = `slot ${selectedSlot === i ? "active" : ""}`;
    if (id === BLOCK_AIR) {
      const t = document.createElement("div");
      t.className = "slot-name";
      t.textContent = `${i + 1}. Empty`;
      slot.append(t);
      hotbarEl.append(slot);
      return;
    }
    const c = document.createElement("div");
    c.className = "slot-color";
    const b = BLOCK_BY_ID.get(id);
    c.style.background = getBlockColorById(id);
    const t = document.createElement("div");
    t.className = "slot-name";
    t.textContent = `${i + 1}. ${b.name}`;
    slot.append(c, t);
    hotbarEl.append(slot);
  });
}

function encodeSignal(obj) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
}

function decodeSignal(text) {
  return JSON.parse(decodeURIComponent(escape(atob(String(text).trim()))));
}

function randomId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function removeRemotePlayer(id) {
  const rp = remotePlayers.get(id);
  if (!rp) return;
  if (rp.nameTexture) rp.nameTexture.dispose();
  if (rp.nameSprite && rp.nameSprite.material) rp.nameSprite.material.dispose();
  remotePlayersGroup.remove(rp.root);
  remotePlayers.delete(id);
  remoteSkins.delete(id);
}

function clearAllRemotePlayers() {
  for (const [id] of remotePlayers) {
    removeRemotePlayer(id);
  }
}

function isConnectedToRoom() {
  return Boolean(ws && ws.readyState === WebSocket.OPEN && roomCode);
}

function returnToMenuForReconnect(statusText) {
  gameStarted = false;
  pointerLocked = false;
  startMenuEl.classList.remove("hidden");
  menuPanoramaEl?.classList.remove("hidden");
  hidePingOverlay();
  if (chatHideTimer) {
    clearTimeout(chatHideTimer);
    chatHideTimer = null;
  }
  if (chatFadeTimer) {
    clearTimeout(chatFadeTimer);
    chatFadeTimer = null;
  }
  if (statusText) menuStatusEl.textContent = statusText;
  try { document.exitPointerLock(); } catch {}
}

function appendChatMessage(author, text) {
  const row = document.createElement("div");
  row.className = "chat-msg";
  const safeAuthor = String(author || "Player").slice(0, 16);
  row.innerHTML = `<span class="chat-author">${safeAuthor}:</span> ${String(text || "")}`;
  chatLogEl.append(row);
  while (chatLogEl.children.length > 80) {
    chatLogEl.removeChild(chatLogEl.firstChild);
  }
  chatLogEl.scrollTop = chatLogEl.scrollHeight;
  scheduleChatAutoHide();
}

function sendChatMessage() {
  const text = String(chatInputEl.value || "").trim();
  if (!text) return false;
  const payloadText = text.slice(0, 240);

  if (isConnectedToRoom()) {
    ws.send(JSON.stringify({
      type: "chat_message",
      roomCode,
      text: payloadText,
    }));
  } else {
    appendChatMessage(localNickname || "Player", payloadText);
  }

  chatInputEl.value = "";
  scheduleChatAutoHide();
  return true;
}

function handlePeerMessage(peerId, msg) {
  if (msg.type === "move") {
    let rp = remotePlayers.get(peerId);
    if (!rp) {
      const rc = document.createElement("canvas");
      rc.width = 64;
      rc.height = 64;
      const rctx = rc.getContext("2d", { willReadFrequently: true });
      rctx.drawImage(skinSourceCanvas, 0, 0);
      if (remoteSkins.has(peerId)) {
        const img = new Image();
        img.src = remoteSkins.get(peerId);
        img.onload = () => {
          rctx.clearRect(0, 0, 64, 64);
          rctx.drawImage(img, 0, 0, 64, 64);
          applySkinToAvatar(rp, rc);
        };
      }
      rp = createSteveAvatar({ skinCanvas: rc });
      remotePlayersGroup.add(rp.root);
      remotePlayers.set(peerId, rp);
    }

    const nextPos = new THREE.Vector3(msg.x, msg.y, msg.z);
    if (rp.prevNetPos) {
      const dist = rp.prevNetPos.distanceTo(nextPos);
      rp.moveIntensity = Math.min(1, dist * 10);
    } else {
      rp.moveIntensity = 0;
    }
    rp.prevNetPos = nextPos;

    rp.targetPos.copy(nextPos);
    rp.yaw = Number(msg.yaw) || 0;
    rp.pitch = Number(msg.pitch) || 0;
    const nextNickname = String(msg.nickname || "Player");
    if (rp.nickname !== nextNickname) {
      updateAvatarNickname(rp, nextNickname);
    }

  }

  if (msg.type === "block_set") {
    setBlock(msg.x, msg.y, msg.z, msg.id, true);
  }

  if (msg.type === "sync_overrides") {
    for (const block of msg.blocks) {
      worldState.overrides.set(overrideKey(block.x, block.y, block.z), block.id);
      markChunkDirtyAtWorld(block.x, block.z);
    }
  }

  if (msg.type === "peer_left") {
    removeRemotePlayer(String(msg.id || ""));
  }
}

function generateRoomCode() {
  return Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}

function connectToRoom(code, mode) {
  return new Promise((resolve, reject) => {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${location.host}/api/ws`);
    let joined = false;

    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.close(); } catch {}
    }

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: mode === "host" ? "host_create" : "room_join",
        roomCode: code,
        clientId: localClientId,
        nickname: localNickname,
      }));
    };

    socket.onerror = () => {
      if (!joined) reject(new Error("connect-failed"));
    };

    socket.onclose = () => {
      if (!joined) {
        reject(new Error("connect-closed"));
      } else {
        ws = null;
        roomCode = null;
        clearAllRemotePlayers();
        returnToMenuForReconnect("Соединение закрыто. Можно переподключиться.");
      }
    };

    socket.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);

      if (msg.type === "welcome") {
        localServerPeerId = String(msg.id || localServerPeerId || "");
        return;
      }

      if (msg.type === "room_joined") {
        joined = true;
        ws = socket;
        roomCode = msg.roomCode;
        roomCodeValueEl.textContent = msg.roomCode;
        lobbyHostId = String(msg.hostId || lobbyHostId || "");
        localServerPeerId = String(msg.clientId || localServerPeerId || "");
        isHostRole = Boolean(localServerPeerId && localServerPeerId === lobbyHostId);
        roomParticipants = [];
        ensureParticipantById(localServerPeerId || localClientId, localNickname);
        renderParticipants();
        updateLobbyStartButtonState();
        clearAllRemotePlayers();
        resolve(msg.roomCode);
      }

      if (msg.type === "room_members") {
        lobbyHostId = String(msg.hostId || lobbyHostId || "");
        isHostRole = Boolean(localServerPeerId && localServerPeerId === lobbyHostId);
        const list = Array.isArray(msg.members) ? msg.members : [];
        roomParticipants = list.map((item) => ({
          id: String(item.id || ""),
          nickname: String(item.nickname || "Player").slice(0, 16),
        })).filter((item) => item.id);
        renderParticipants();
        updateLobbyStartButtonState();
        updatePingOverlay();
      }

      if (msg.type === "room_error") {
        if (!joined) reject(new Error(msg.reason || "room-error"));
      }

      if (msg.type === "peer_state") {
        handlePeerMessage(msg.clientId, { type: "move", ...msg.state });
      }

      if (msg.type === "peer_joined") {
        ensureParticipantById(String(msg.clientId || ""), String(msg.nickname || "Player"));
        renderParticipants();
        updatePingOverlay();
        if (!gameStarted) menuStatusEl.textContent = "Игрок подключился к комнате.";
      }

      if (msg.type === "nickname_update") {
        ensureParticipantById(String(msg.clientId || ""), String(msg.nickname || "Player"));
        renderParticipants();
        updatePingOverlay();
      }

      if (msg.type === "skin_update") {
        const peerId = String(msg.clientId || "");
        const skin = String(msg.skin || "");
        if (peerId && isValidSkinDataUrl(skin)) {
          remoteSkins.set(peerId, skin);
          const rp = remotePlayers.get(peerId);
          if (rp) {
            const img = new Image();
            img.onload = () => {
              const c = document.createElement("canvas");
              c.width = 64;
              c.height = 64;
              const cctx = c.getContext("2d", { willReadFrequently: true });
              cctx.drawImage(img, 0, 0, 64, 64);
              applySkinToAvatar(rp, c);
            };
            img.src = skin;
          }
        }
      }

      if (msg.type === "block_set") {
        handlePeerMessage(msg.clientId, msg);
      }

      if (msg.type === "peer_left") {
        removeParticipantById(String(msg.clientId || ""));
        renderParticipants();
        playerPings.delete(String(msg.clientId || ""));
        updatePingOverlay();
        handlePeerMessage(msg.clientId, { type: "peer_left", id: msg.clientId });
      }

      if (msg.type === "room_start") {
        beginGame();
      }

      if (msg.type === "world_sync") {
        handlePeerMessage("server", { type: "sync_overrides", blocks: msg.blocks || [] });
      }

      if (msg.type === "chat_message") {
        appendChatMessage(msg.nickname || "Player", msg.text || "");
      }

      if (msg.type === "ping_reply") {
        const reqId = String(msg.requestId || "");
        const started = pendingPings.get(reqId);
        if (!started) return;
        pendingPings.delete(reqId);
        const peerId = String(msg.clientId || "");
        const ping = performance.now() - started;
        if (peerId) {
          playerPings.set(peerId, ping);
          updatePingOverlay();
        }
      }

      if (msg.type === "ping_probe") {
        if (!isConnectedToRoom()) return;
        ws.send(JSON.stringify({
          type: "ping_probe_reply",
          roomCode,
          requesterId: String(msg.requesterId || ""),
          requestId: String(msg.requestId || ""),
        }));
      }
    };
  });
}

function beginGame() {
  if (gameStarted) return;
  gameStarted = true;
  startMenuEl.classList.add("hidden");
  menuPanoramaEl?.classList.add("hidden");
  scheduleChatAutoHide();
  spawnAtSafePlace();
  syncHotbarFromInventory();
  renderHotbar();
  last = performance.now();
  requestAnimationFrame(animate);
}
singleplayerBtnEl.addEventListener("click", () => {
  networkMode = "single";
  isHostRole = false;
  syncLocalNickname();
  beginGame();
});

multiplayerBtnEl.addEventListener("click", () => {
  setMenuScreen("multiplayer");
  menuStatusEl.textContent = "Выбери роль в сетевой игре.";
});

settingsBtnEl.addEventListener("click", () => {
  menuStatusEl.textContent = "Настройки будут добавлены позже.";
});

customizeSkinBtnEl.addEventListener("click", () => {
  setEditorOpen(true);
  menuStatusEl.textContent = "";
});

backMainBtnEl.addEventListener("click", () => {
  setMenuScreen("main");
  menuStatusEl.textContent = "";
});

becomeGuestBtnEl.addEventListener("click", () => {
  setMenuScreen("join");
  menuStatusEl.textContent = "Введи номер комнаты и подключись.";
});

backMultiplayerBtnEl.addEventListener("click", () => {
  setMenuScreen("multiplayer");
  menuStatusEl.textContent = "";
});

becomeHostBtnEl.addEventListener("click", async () => {
  if (gameStarted) return;
  syncLocalNickname();
  networkMode = "multi";
  isHostRole = true;
  menuStatusEl.textContent = "Создание комнаты...";
  resetLobbyState();

  try {
    let room = null;
    for (let i = 0; i < 6; i += 1) {
      const code = generateRoomCode();
      try {
        room = await connectToRoom(code, "host");
        break;
      } catch (error) {
        if (!String(error?.message || "").includes("room-already-exists")) {
          throw error;
        }
      }
    }
    if (!room) throw new Error("room-create-failed");
    roomCodeValueEl.textContent = room;
    setMenuScreen("lobby");
    updateLobbyStartButtonState();
    menuStatusEl.textContent = "Комната создана.";
  } catch {
    menuStatusEl.textContent = "Не удалось создать комнату.";
    setMenuScreen("multiplayer");
  }
});

joinRoomBtnEl.addEventListener("click", async () => {
  if (gameStarted) return;
  syncLocalNickname();
  const code = String(roomCodeInputEl.value || "").trim().toUpperCase();
  if (!code) {
    menuStatusEl.textContent = "Введи номер комнаты.";
    return;
  }

  networkMode = "multi";
  isHostRole = false;
  menuStatusEl.textContent = "Подключение к комнате...";
  resetLobbyState();

  try {
    await connectToRoom(code, "join");
    roomCodeValueEl.textContent = code;
    setMenuScreen("lobby");
    updateLobbyStartButtonState();
    if (!gameStarted) menuStatusEl.textContent = "Подключено к комнате.";
  } catch {
    menuStatusEl.textContent = "Не удалось подключиться к комнате.";
  }
});

copyRoomBtnEl.addEventListener("click", async () => {
  const text = String(roomCodeValueEl.textContent || "").trim();
  if (!text || text === "------") return;
  try {
    await navigator.clipboard.writeText(text);
    menuStatusEl.textContent = "Номер комнаты скопирован.";
  } catch {
    menuStatusEl.textContent = "Не удалось скопировать автоматически.";
  }
});

startRoomBtnEl.addEventListener("click", () => {
  if (!isHostRole || !isConnectedToRoom()) return;
  ws.send(JSON.stringify({ type: "room_start", roomCode }));
});

leaveLobbyBtnEl.addEventListener("click", () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try { ws.close(); } catch {}
  }
  ws = null;
  roomCode = null;
  isHostRole = false;
  networkMode = "none";
  localServerPeerId = null;
  resetLobbyState();
  setMenuScreen("multiplayer");
  menuStatusEl.textContent = "Ты вышел из комнаты.";
});

chatSendEl.addEventListener("click", () => {
  const sent = sendChatMessage();
  if (sent) closeChat();
  tryReturnControlToGame();
});

chatInputEl.addEventListener("focus", () => {
  if (!chatOpen) chatOpen = true;
  ensureChatVisible(false);
  if (document.pointerLockElement === renderer.domElement) {
    try { document.exitPointerLock(); } catch {}
  }
});

chatInputEl.addEventListener("blur", () => {
  if (!chatOpen) scheduleChatAutoHide();
});

nicknameInputEl.addEventListener("input", () => {
  syncLocalNickname();
});


let netAccumulator = 0;
function sendPlayerState(dt) {
  if (!gameStarted || !isConnectedToRoom()) return;
  netAccumulator += dt;
  if (netAccumulator < NET_SEND_INTERVAL) return;
  netAccumulator = 0;

  const payload = {
    id: localClientId,
    nickname: localNickname,
    x: Number(player.position.x.toFixed(3)),
    y: Number(player.position.y.toFixed(3)),
    z: Number(player.position.z.toFixed(3)),
    yaw: Number(player.yaw.toFixed(3)),
    pitch: Number(player.pitch.toFixed(3)),
  };

  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: "peer_state", roomCode, state: payload }));
  }
}

let skinSyncAccumulator = 0;
function sendSkinState(dt) {
  if (!gameStarted || !isConnectedToRoom()) return;
  skinSyncAccumulator += dt;
  if (skinSyncAccumulator < 2) return;
  skinSyncAccumulator = 0;
  if (!localSkinDataUrl) syncSkinToDataUrl();
  if (!isValidSkinDataUrl(localSkinDataUrl)) return;
  ws.send(JSON.stringify({
    type: "skin_update",
    roomCode,
    skin: localSkinDataUrl,
  }));
}

function sendPingRequests(dt) {
  if (!gameStarted || !isConnectedToRoom()) return;
  const now = performance.now();
  for (const [requestId, startedAt] of pendingPings) {
    if (now - startedAt > 5000) {
      pendingPings.delete(requestId);
    }
  }
  pingAccumulator += dt;
  if (pingAccumulator < 1.5) return;
  pingAccumulator = 0;
  const requestId = `${localServerPeerId || localClientId}-${pingRequestCounter++}`;
  pendingPings.set(requestId, now);
  ws.send(JSON.stringify({
    type: "ping_request",
    roomCode,
    requestId,
  }));
}

function updateRemotePlayersAnimation(dt) {
  for (const [, rp] of remotePlayers) {
    rp.root.position.lerp(new THREE.Vector3(rp.targetPos.x, rp.targetPos.y, rp.targetPos.z), Math.min(1, dt * 18));
    rp.root.rotation.y = rp.yaw + Math.PI;
    rp.headPivot.rotation.x = Math.max(-0.45, Math.min(0.45, -rp.pitch * 0.5));

    const speedFactor = rp.moveIntensity;
    rp.phase += dt * (3 + speedFactor * 9);
    const swing = Math.sin(rp.phase) * (0.12 + speedFactor * 0.65);
    const swingOpp = -swing;

    rp.leftArmPivot.rotation.x = swing;
    rp.rightArmPivot.rotation.x = swingOpp;
    rp.leftLegPivot.rotation.x = swingOpp;
    rp.rightLegPivot.rotation.x = swing;
  }
}

function initMenuPanorama() {
  if (!menuPanoramaEl || panoramaRenderer) return;

  panoramaScene = new THREE.Scene();
  panoramaScene.background = new THREE.Color(0x7cb2ff);
  panoramaCamera = new THREE.PerspectiveCamera(62, 1, 0.1, 250);

  const hemi = new THREE.HemisphereLight(0xcfe5ff, 0x6a7a4d, 0.9);
  panoramaScene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(20, 28, 12);
  panoramaScene.add(sun);

  const blockGeo = cubeGeometry;
  const waterMat = new THREE.MeshLambertMaterial({ map: textureWater, transparent: true, opacity: 0.9 });
  const grassMat = materialsById.get(BLOCKS.grass.id);
  const dirtMat = materialsById.get(BLOCKS.dirt.id);
  const stoneMat = materialsById.get(BLOCKS.stone.id);
  const woodMat = materialsById.get(BLOCKS.wood.id);
  const leavesMat = materialsById.get(BLOCKS.leaves.id);

  const radius = 28;
  for (let x = -radius; x <= radius; x += 1) {
    for (let z = -radius; z <= radius; z += 1) {
      const d = Math.sqrt(x * x + z * z);
      if (d > radius) continue;

      const h = Math.max(2, Math.floor(7 + Math.sin(x * 0.18) * 2 + Math.cos(z * 0.16) * 2));
      markPanoramaOccupied(x, z, h);
      for (let y = 0; y < h; y += 1) {
        const m = y === h - 1 ? grassMat : (y > h - 4 ? dirtMat : stoneMat);
        const b = new THREE.Mesh(blockGeo, m);
        b.position.set(x + 0.5, y + 0.5, z + 0.5);
        panoramaScene.add(b);
      }

      if (h <= 6) {
        const w = new THREE.Mesh(blockGeo, waterMat);
        w.position.set(x + 0.5, 6.5, z + 0.5);
        panoramaScene.add(w);
      }

      const treeNoise = Math.abs(Math.sin(x * 11.13 + z * 7.91));
      if (treeNoise > 0.9975 && h > 6 && d < radius - 4) {
        const trunk = 3;
        for (let i = 0; i < trunk; i += 1) {
          const log = new THREE.Mesh(blockGeo, woodMat);
          log.position.set(x + 0.5, h + i + 0.5, z + 0.5);
          panoramaScene.add(log);
          markPanoramaOccupied(x, z, h + i + 1);
        }
        const topY = h + trunk;
        for (let ox = -2; ox <= 2; ox += 1) {
          for (let oz = -2; oz <= 2; oz += 1) {
            for (let oy = -1; oy <= 2; oy += 1) {
              if (Math.abs(ox) + Math.abs(oz) + Math.abs(oy) > 4) continue;
              const leaf = new THREE.Mesh(blockGeo, leavesMat);
              leaf.position.set(x + ox + 0.5, topY + oy + 0.5, z + oz + 0.5);
              panoramaScene.add(leaf);
              markPanoramaOccupied(x + ox, z + oz, topY + oy + 1);
            }
          }
        }
      }
    }
  }

  panoramaRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  panoramaRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  panoramaRenderer.setClearColor(0x7cb2ff, 1);
  menuPanoramaEl.append(panoramaRenderer.domElement);

  function resizePanorama() {
    if (!panoramaRenderer || !panoramaCamera || !menuPanoramaEl) return;
    const w = Math.max(1, menuPanoramaEl.clientWidth);
    const h = Math.max(1, menuPanoramaEl.clientHeight);
    panoramaRenderer.setSize(w, h, false);
    panoramaCamera.aspect = w / h;
    panoramaCamera.updateProjectionMatrix();
  }

  resizePanorama();
  window.addEventListener("resize", resizePanorama);
}

function updateMenuPanorama(dt) {
  if (!panoramaRenderer || !panoramaScene || !panoramaCamera) return;
  panoramaTime += dt;
  const r = 22;
  const angle = panoramaTime * 0.11;
  const camX = Math.cos(angle) * r;
  const camZ = Math.sin(angle) * r;
  const y = 18;
  panoramaCamera.position.set(camX, y, camZ);
  panoramaCamera.lookAt(0, 7.5, 0);
  panoramaRenderer.render(panoramaScene, panoramaCamera);
}

function initMenuSkin3d() {
  if (!menuSkin3dEl || menuSkinRenderer) return;
  menuSkinScene = new THREE.Scene();
  menuSkinScene.background = null;
  menuSkinCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  menuSkinCamera.position.set(1.8, 1.6, 2.8);
  menuSkinCamera.lookAt(0, 1.1, 0);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x7b6a55, 0.95);
  menuSkinScene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.65);
  dirLight.position.set(3, 4, 2);
  menuSkinScene.add(dirLight);

  menuSkinAvatar = createSteveAvatar();
  if (menuSkinAvatar.nameSprite) menuSkinAvatar.nameSprite.visible = false;
  menuSkinAvatar.root.position.set(0, 0, 0);
  menuSkinScene.add(menuSkinAvatar.root);

  menuSkinRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  menuSkinRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  menuSkinRenderer.setClearColor(0x000000, 0);
  menuSkin3dEl.append(menuSkinRenderer.domElement);

  function resizeSkinRenderer() {
    if (!menuSkin3dEl || !menuSkinRenderer || !menuSkinCamera) return;
    const w = Math.max(1, menuSkin3dEl.clientWidth);
    const h = Math.max(1, menuSkin3dEl.clientHeight);
    menuSkinRenderer.setSize(w, h, false);
    menuSkinCamera.aspect = w / h;
    menuSkinCamera.updateProjectionMatrix();
  }

  resizeSkinRenderer();
  window.addEventListener("resize", resizeSkinRenderer);
}

function initSkinEditorPreview() {
  if (!skinPreview3dEl || skinEditorPreviewRenderer) return;
  skinEditorPreviewScene = new THREE.Scene();
  skinEditorPreviewCamera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  skinEditorPreviewCamera.position.set(1.9, 1.6, 2.8);
  skinEditorPreviewCamera.lookAt(0, 1.1, 0);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x7b6a55, 0.95);
  skinEditorPreviewScene.add(hemiLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(3, 4, 2);
  skinEditorPreviewScene.add(dirLight);

  skinEditorPreviewAvatar = createSteveAvatar({ skinCanvas: skinSourceCanvas });
  if (skinEditorPreviewAvatar.nameSprite) skinEditorPreviewAvatar.nameSprite.visible = false;
  skinEditorPreviewScene.add(skinEditorPreviewAvatar.root);

  skinEditorPreviewRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  skinEditorPreviewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  skinEditorPreviewRenderer.setClearColor(0x000000, 0);
  skinPreview3dEl.append(skinEditorPreviewRenderer.domElement);

  function resizePreview() {
    if (!skinEditorPreviewRenderer || !skinEditorPreviewCamera || !skinPreview3dEl) return;
    const w = Math.max(1, skinPreview3dEl.clientWidth);
    const h = Math.max(1, skinPreview3dEl.clientHeight);
    skinEditorPreviewRenderer.setSize(w, h, false);
    skinEditorPreviewCamera.aspect = w / h;
    skinEditorPreviewCamera.updateProjectionMatrix();
  }
  resizePreview();
  window.addEventListener("resize", resizePreview);
}

function updateSkinEditorPreview(dt) {
  if (!skinEditorPreviewRenderer || !skinEditorPreviewScene || !skinEditorPreviewCamera || !skinEditorPreviewAvatar) return;
  if (!skinEditorOpen) return;
  skinEditorPreviewAvatar.root.rotation.y += dt * 1.15;
  skinEditorPreviewAvatar.phase += dt * 6.4;
  const swing = Math.sin(skinEditorPreviewAvatar.phase) * 0.4;
  skinEditorPreviewAvatar.leftArmPivot.rotation.x = swing;
  skinEditorPreviewAvatar.rightArmPivot.rotation.x = -swing;
  skinEditorPreviewAvatar.leftLegPivot.rotation.x = -swing;
  skinEditorPreviewAvatar.rightLegPivot.rotation.x = swing;
  skinEditorPreviewRenderer.render(skinEditorPreviewScene, skinEditorPreviewCamera);
}

function updateMenuSkin3d(dt) {
  if (!menuSkinRenderer || !menuSkinScene || !menuSkinCamera || !menuSkinAvatar) return;
  menuSkinAvatar.root.rotation.y += dt * 1.1;
  menuSkinAvatar.phase += dt * 7.2;
  const swing = Math.sin(menuSkinAvatar.phase) * 0.45;
  menuSkinAvatar.leftArmPivot.rotation.x = swing;
  menuSkinAvatar.rightArmPivot.rotation.x = -swing;
  menuSkinAvatar.leftLegPivot.rotation.x = -swing;
  menuSkinAvatar.rightLegPivot.rotation.x = swing;
  menuSkinRenderer.render(menuSkinScene, menuSkinCamera);
}

function initSkinEditorUi() {
  if (!skinEditorCanvasEl) return;

  skinSourceCtx.imageSmoothingEnabled = false;
  paintDefaultSkin(defaultSkinCtx);

  for (const color of SKIN_PALETTE) {
    const sw = document.createElement("button");
    sw.type = "button";
    sw.className = "skin-color-swatch";
    sw.style.background = color;
    sw.addEventListener("click", () => {
      skinColorEl.value = color;
    });
    skinPaletteEl.append(sw);
  }

  toolBrushEl.addEventListener("click", () => { skinTool = "brush"; });
  toolEraserEl.addEventListener("click", () => { skinTool = "eraser"; });
  toolSizeEl.addEventListener("change", () => {
    skinBrushSize = Math.max(1, Math.min(16, Number(toolSizeEl.value) || 1));
  });

  toolUndoEl.addEventListener("click", () => {
    if (!skinUndoStack.length) return;
    skinRedoStack.push(cloneSkinSnapshot());
    restoreSkinSnapshot(skinUndoStack.pop());
    syncSkinToCanvasView();
    applyCurrentSkinToPreviews();
  });

  toolRedoEl.addEventListener("click", () => {
    if (!skinRedoStack.length) return;
    skinUndoStack.push(cloneSkinSnapshot());
    restoreSkinSnapshot(skinRedoStack.pop());
    syncSkinToCanvasView();
    applyCurrentSkinToPreviews();
  });

  const startDraw = (evt) => {
    evt.preventDefault();
    const point = evt.touches?.[0] ?? evt;
    if (!skinSnapshotCaptured) {
      pushUndoSnapshot();
      skinRedoStack = [];
      skinSnapshotCaptured = true;
    }
    skinDrawing = true;
    const p = getEditorPixelFromEvent(point);
    drawOnSkinAt(p.x, p.y);
    syncSkinToCanvasView();
    applyCurrentSkinToPreviews();
  };

  const moveDraw = (evt) => {
    if (!skinDrawing) return;
    evt.preventDefault();
    const point = evt.touches?.[0] ?? evt;
    const p = getEditorPixelFromEvent(point);
    drawOnSkinAt(p.x, p.y);
    syncSkinToCanvasView();
    applyCurrentSkinToPreviews();
  };

  const endDraw = () => {
    skinDrawing = false;
    skinSnapshotCaptured = false;
  };

  skinEditorCanvasEl.addEventListener("mousedown", startDraw);
  skinEditorCanvasEl.addEventListener("mousemove", moveDraw);
  window.addEventListener("mouseup", endDraw);

  skinEditorCanvasEl.addEventListener("touchstart", (evt) => {
    if (!evt.touches?.length) return;
    startDraw(evt);
  }, { passive: false });
  skinEditorCanvasEl.addEventListener("touchmove", (evt) => {
    if (!evt.touches?.length) return;
    moveDraw(evt);
  }, { passive: false });
  window.addEventListener("touchend", endDraw, { passive: true });

  skinImportBtnEl.addEventListener("click", () => skinImportFileEl.click());
  skinImportFileEl.addEventListener("change", () => {
    const file = skinImportFileEl.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (!((img.width === 64 && img.height === 64) || (img.width === 128 && img.height === 128))) {
          menuStatusEl.textContent = "Импорт поддерживает PNG скины только 64x64 или 128x128.";
          return;
        }
        pushUndoSnapshot();
        skinRedoStack = [];
        setSkinSourceSize(img.width);
        skinSourceCtx.clearRect(0, 0, skinSourceSize, skinSourceSize);
        skinSourceCtx.drawImage(img, 0, 0, skinSourceSize, skinSourceSize);
        saveSkinToStorage();
        syncSkinToCanvasView();
        applyCurrentSkinToPreviews();
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
    skinImportFileEl.value = "";
  });

  skinExportBtnEl.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = skinSourceCanvas.toDataURL("image/png");
    a.download = "skin.png";
    a.click();
  });

  skinSaveBtnEl.addEventListener("click", () => {
    saveSkinToStorage();
    applyCurrentSkinToPreviews();
    menuStatusEl.textContent = "Скин сохранён.";
    setEditorOpen(false);
  });

  skinCloseBtnEl.addEventListener("click", () => {
    setEditorOpen(false);
  });

  const applyPartVisibility = () => {
    if (!skinEditorPreviewAvatar) return;
    skinEditorPreviewAvatar.headMesh.visible = partHeadEl.checked;
    skinEditorPreviewAvatar.headOverlayMesh.visible = partHeadEl.checked;
    skinEditorPreviewAvatar.bodyMesh.visible = partBodyEl.checked;
    skinEditorPreviewAvatar.bodyOverlayMesh.visible = partBodyEl.checked;
    skinEditorPreviewAvatar.leftArmMesh.visible = partArmsEl.checked;
    skinEditorPreviewAvatar.rightArmMesh.visible = partArmsEl.checked;
    skinEditorPreviewAvatar.leftArmOverlayMesh.visible = partArmsEl.checked;
    skinEditorPreviewAvatar.rightArmOverlayMesh.visible = partArmsEl.checked;
    skinEditorPreviewAvatar.leftLegMesh.visible = partLegsEl.checked;
    skinEditorPreviewAvatar.rightLegMesh.visible = partLegsEl.checked;
    skinEditorPreviewAvatar.leftLegOverlayMesh.visible = partLegsEl.checked;
    skinEditorPreviewAvatar.rightLegOverlayMesh.visible = partLegsEl.checked;
  };
  partHeadEl.addEventListener("change", applyPartVisibility);
  partBodyEl.addEventListener("change", applyPartVisibility);
  partArmsEl.addEventListener("change", applyPartVisibility);
  partLegsEl.addEventListener("change", applyPartVisibility);
  applyPartVisibility();
}

let last = performance.now();
function animate(now) {
  if (!gameStarted) return;
  const dt = Math.min(MAX_STEP, (now - last) / 1000);
  last = now;

  ensureChunksAroundPlayer();
  if (!isUiBlockingGame()) {
    updateMovement(dt);
  } else {
    player.velocity.x = 0;
    player.velocity.z = 0;
  }
  updateMining(dt);
  updateTargetBlock();
  flushDirtyChunks();
  sendPlayerState(dt);
  sendSkinState(dt);
  sendPingRequests(dt);
  updateRemotePlayersAnimation(dt);

  debugEl.textContent =
    `XYZ: ${player.position.x.toFixed(2)}, ${player.position.y.toFixed(2)}, ${player.position.z.toFixed(2)} | ` +
    `Chunks: ${worldState.chunkMeshes.size} | ` +
    `Players: ${remotePlayers.size + (localClientId ? 1 : 0)}`;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

let menuLast = performance.now();
function animateMenu(now) {
  const dt = Math.min(MAX_STEP, (now - menuLast) / 1000);
  menuLast = now;
  if (!gameStarted) {
    updateMenuPanorama(dt);
    updateMenuSkin3d(dt);
    updateSkinEditorPreview(dt);
  }
  requestAnimationFrame(animateMenu);
}

setMenuScreen("main");
updateLobbyStartButtonState();
hidePingOverlay();
syncLocalNickname();

Promise.resolve()
  .then(() => loadSkinFromStorage())
  .then(() => {
    initMenuSkin3d();
    initMenuPanorama();
    initSkinEditorPreview();
    initSkinEditorUi();
    applyCurrentSkinToPreviews();
    syncSkinToCanvasView();
    requestAnimationFrame(animateMenu);
  });
