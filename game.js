// ============================================================
//  SUIKA GAME â€” EDICIÓN PAREJA & COMIDA
//  Motor: Matter.js + Canvas API (100% Full-Screen â€” Proporciones Suika)
// ============================================================

// ============================================================
//  DOM REFS Y DIMENSIONES VIRTUALES RESPONSIVAS (1600x900)
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const VIRTUAL_W = 1600;
const VIRTUAL_H = 900;
let CW = VIRTUAL_W;
let CH = VIRTUAL_H;

let scale = 1;
let offsetX = 0;
let offsetY = 0;

// Dimensiones fijas relativas en el lienzo virtual (1600 x 900)
const shelfY = 185;

const BOX_W = 460;
const BOX_H = 530;
const BOX_X = Math.round((VIRTUAL_W - BOX_W) / 2); // 570
const BOX_Y = Math.round(shelfY + 20); // 205

// Paredes fÃ­sicas internas (Ajustadas al vidrio interno de caja.png en 1600x900)
const C_LEFT = Math.round(BOX_X + BOX_W * 0.13); // 630
const C_RIGHT = Math.round(BOX_X + BOX_W * 0.87); // 970
const C_TOP = Math.round(BOX_Y + BOX_H * 0.05); // 231.5
const C_BOTTOM = Math.round(BOX_Y + BOX_H * 0.93); // 698
const GO_LINE_Y = Math.round(BOX_Y + BOX_H * 0.14); // 279

const CHAR_W = 165, CHAR_H = 180;
const CHAR_Y = Math.round(shelfY + 5 - CHAR_H / 2); // 100 (El personaje queda 100% visible debajo del borde superior)
const WALL_T = 24;
const MAX_LEVEL = 9;

// --- Paneles laterales fijos en el espacio virtual ---
const leftSpace = BOX_X; // 570
const rightSpace = VIRTUAL_W - BOX_X - BOX_W; // 570

// BURBUJA DE SCORE (IZQUIERDA, ARRIBA)
const SCORE_BUBBLE_R = 90;
const SCORE_BUBBLE_CX = Math.round(leftSpace * 0.5); // 285
const SCORE_BUBBLE_CY = Math.round(BOX_Y + BOX_H * 0.23) + 50; // 377

// TARJETA DE RANKING (IZQUIERDA, ABAJO - CUADRADA)
const RANK_CARD_Y = Math.round(BOX_Y + BOX_H * 0.46) + 70; // 519
const RANK_CARD_H = 265;
const RANK_CARD_W = 265;
const RANK_CARD_X = Math.round((leftSpace - RANK_CARD_W) / 2); // 152

// BURBUJA NEXT (DERECHA, ARRIBA)
const NEXT_BUBBLE_R = 90;
const NEXT_BUBBLE_CX = Math.round(BOX_X + BOX_W + rightSpace * 0.5); // 1315
const NEXT_BUBBLE_CY = Math.round(BOX_Y + BOX_H * 0.23) + 50; // 377

// RUEDA DE EVOLUCIÓN (DERECHA, ABAJO)
const WHEEL_CY = Math.round(RANK_CARD_Y + RANK_CARD_H / 2); // 651
const WHEEL_CX = Math.round(BOX_X + BOX_W + rightSpace * 0.5); // 1315
const WHEEL_R_OUTER = 130;
const WHEEL_R_INNER = 50;


// Nombres y colores de cada nivel de comida
const FOOD_NAMES = [
  'Chocolate Blanco', 'Panqueque', 'Papas Fritas', 'Taco',
  'Pollo', 'Pupusa', 'Pizza', 'Helado', 'CorazÃ³n'
];
const FOOD_COLORS = [
  '#FFF5E6', '#D4A057', '#FFD700', '#CD853F',
  '#FFB347', '#A8D86B', '#FF6347', '#FF85B3', '#FF1493'
];

// Radio de colisiÃ³n de cada nivel (Aumentado sutilmente para ajustar la dificultad)
const FOOD_SIZES = [18, 25, 33, 42, 52, 63, 76, 92, 108];


// Factor de escala visual para compensar mÃ¡rgenes transparentes del PNG y asegurar que las comidas se toquen visualmente
const FOOD_IMG_SCALE = [1.32, 1.28, 1.26, 1.26, 1.30, 1.25, 1.22, 1.25, 1.25];

const FOOD_STROKES = [
  '#E8D5B0', '#B8862D', '#DAA520', '#8B5E3C',
  '#E8942B', '#7CB342', '#E53935', '#E75480', '#C51162'
];

// Pesos de apariciÃ³n aleatoria en la mano: solo niveles 1 a 5 (Chocolate Blanco -> Pollo).
// Pupusa, Pizza, Helado y CorazÃ³n solo se obtienen mediante fusiÃ³n.
const SPAWN_WEIGHTS = [35, 28, 20, 12, 5, 0, 0, 0, 0];

const SCORE_TABLE = [0, 0, 80, 180, 320, 500, 720, 980, 1280, 1620, 2500];
const PARTICLE_COLORS = ['#FF6B9D', '#FFB6C1', '#FF4D6D', '#FFD700', '#FFF', '#FF85A2', '#C71585'];

const HAND_OFFSET_X = -48;
const HAND_OFFSET_Y = -34;

// ============================================================
//  AUDIO (Web Audio API)
// ============================================================
let audioCtx = null;
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// ============================================================
//  BGM y controles de volumen
// ============================================================
let bgm = null;
let bgmTracks = [
  'songs/Please.mp3',
  'songs/잠시.mp3',
  'songs/BTS (방탄소년단) - 작은 것들을 위한 시 (Boy With Luv) feat. Halsey (Official Audio).mp3'
];
let currentTrackIndex = 0;
let bgmVolume = 0.65;
let bgmMuted = false;
let volPanelVisible = false;
let volSliderDragging = false;
let volumeBounds = { x: VIRTUAL_W - 84, y: VIRTUAL_H - 84, w: 60, h: 60 };
let volSliderBounds = { x: VIRTUAL_W - 156, y: VIRTUAL_H - 136, w: 144, h: 10 };
let volNextBounds = { x: VIRTUAL_W - 84, y: VIRTUAL_H - 170, w: 44, h: 38 };
let volHover = false;
let volSliderHover = false;
let volNextHover = false;

function initBgm() {
  try {
    if (!bgm) {
      bgm = new Audio(bgmTracks[currentTrackIndex]);
      bgm.loop = false; // tocar secuencialmente
      bgm.volume = bgmVolume;
      bgm.preload = 'auto';
      bgm.addEventListener('ended', () => {
        nextTrack();
      });
    }
  } catch (e) { console.warn('BGM init failed', e); }
}

function nextTrack() {
  try {
    currentTrackIndex = (currentTrackIndex + 1) % bgmTracks.length;
    if (!bgm) initBgm();
    if (bgm) {
      bgm.src = bgmTracks[currentTrackIndex];
      bgm.currentTime = 0;
      bgm.muted = bgmMuted;
      bgm.volume = bgmVolume;
      const p = bgm.play();
      if (p && p.catch) p.catch(() => { });
    }
  } catch (e) { console.warn('nextTrack failed', e); }
}

function setBgmVolume(v) {
  bgmVolume = Math.max(0, Math.min(1, v));
  if (bgm) bgm.volume = bgmVolume;
  if (bgmVolume === 0) bgmMuted = true; else bgmMuted = false;
}

function toggleMute() {
  bgmMuted = !bgmMuted;
  if (bgm) bgm.muted = bgmMuted;
}

function playFusionSound(level) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const baseFreq = 220 + level * 60;
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.2);
  } catch (_) { }
}

function playHeartSound() {
  try {
    initAudio();
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.12);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.12 + 0.3);
      osc.start(audioCtx.currentTime + i * 0.12);
      osc.stop(audioCtx.currentTime + i * 0.12 + 0.3);
    });
  } catch (_) { }
}

function playDropSound() {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (_) { }
}

function playGameOverSound() {
  try {
    initAudio();
    [300, 250, 200, 150].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + i * 0.15);
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.15 + 0.2);
      osc.start(audioCtx.currentTime + i * 0.15);
      osc.stop(audioCtx.currentTime + i * 0.15 + 0.2);
    });
  } catch (_) { }
}

// ============================================================
//  CARGA DE IMÃGENES
// ============================================================
const ASSET_FOOD_SOURCES = [
  'Assets/Chocolate.png',
  'Assets/panqueque.png',
  'Assets/papas fritas.png',
  'Assets/tacos.png',
  'Assets/pollo.png',
  'Assets/pupusa.png',
  'Assets/pizza.png',
  'Assets/helado.png',
  'Assets/corazon.png'
];

const foodImages = ASSET_FOOD_SOURCES.map(src => {
  const img = new Image();
  img.src = src;
  return img;
});

const characterImg = new Image();
characterImg.src = 'Assets/yo.png';

const boxImg = new Image();
boxImg.src = 'Assets/caja.png';

function isImgReady(img) {
  return img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0;
}

// ============================================================
//  MATTER.JS SETUP
// ============================================================
const { Engine, Bodies, Body, Events, Composite } = Matter;
const engine = Engine.create({ gravity: { x: 0, y: 2.2 } });
const world = engine.world;

const wallOpts = {
  isStatic: true,
  restitution: 0.05,
  friction: 0.1,
  render: { visible: false }
};

let wallLeft, wallRight, wallFloor;

// ============================================================
//  MATRIZ DE ESCALADO RESPONSIVO (VIEWPORT SCALE)
// ============================================================
function updateDimensions() {
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  canvas.width = screenW;
  canvas.height = screenH;

  // Matriz de escalado adaptativa manteniendo proporciones de 1600x900
  scale = Math.min(screenW / VIRTUAL_W, screenH / VIRTUAL_H);
  offsetX = (screenW - VIRTUAL_W * scale) / 2;
  offsetY = (screenH - VIRTUAL_H * scale) / 2;
}

function initWalls() {
  updateDimensions();
  wallLeft = Bodies.rectangle(C_LEFT - WALL_T / 2, (C_TOP + C_BOTTOM) / 2, WALL_T, C_BOTTOM - C_TOP + WALL_T, wallOpts);
  wallRight = Bodies.rectangle(C_RIGHT + WALL_T / 2, (C_TOP + C_BOTTOM) / 2, WALL_T, C_BOTTOM - C_TOP + WALL_T, wallOpts);
  wallFloor = Bodies.rectangle((C_LEFT + C_RIGHT) / 2, C_BOTTOM + WALL_T / 2, C_RIGHT - C_LEFT + WALL_T * 2, WALL_T, wallOpts);
  Composite.add(world, [wallLeft, wallRight, wallFloor]);
}

initWalls();
window.addEventListener('resize', updateDimensions);


// ============================================================
//  ESTADO DEL JUEGO
// ============================================================
let gameState = 'menu';
let showScoreModal = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('suikaFoodHighScore')) || 0;
let characterX = (C_LEFT + C_RIGHT) / 2;
let currentLevel = 0;
let nextLevel = 0;
let foodBodies = [];
let pendingFusions = [];
let particles = [];
let confetti = [];
let celebrationTimer = 0;
let shakeAmount = 0;
let heartAchieved = false;
let dropCooldown = 0;
let overflowStartTime = null;

let showLoveLetterModal = false;
let loveLetterShown = false;
let loveLetterCloseBtnBounds = { x: 0, y: 0, w: 38, h: 38 };

// LÃMITES INTERACTIVOS DE BOTONES (Espacio Virtual 1600x900)
const menuBtnBounds = {
  gameStart: { x: VIRTUAL_W / 2 - 170, y: 460, w: 340, h: 72 },
  myScore: { x: VIRTUAL_W / 2 - 170, y: 555, w: 340, h: 66 }
};

const gameOverBtnBounds = {
  playAgain: { x: VIRTUAL_W / 2 - 180, y: VIRTUAL_H / 2 + 35, w: 165, h: 46 },
  mainMenu: { x: VIRTUAL_W / 2 + 15, y: VIRTUAL_H / 2 + 35, w: 165, h: 46 }
};

const scoreModalCloseBtn = { x: VIRTUAL_W / 2 - 100, y: VIRTUAL_H / 2 + 125, w: 200, h: 48 };


// ============================================================
//  FOOD ITEM â€” CUERPOS FÃSICOS
// ============================================================
function createFoodBody(x, y, level) {
  const radius = FOOD_SIZES[level - 1];
  const body = Bodies.circle(x, y, radius, {
    restitution: 0.05,
    friction: 0.1,
    frictionStatic: 0.1,
    frictionAir: 0.005,
    slop: 0,
    density: 0.0012 + level * 0.0001,
    isFood: true,
    foodLevel: level,
    spawnTime: Date.now(),
    _fused: false
  });
  Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
  return body;
}

function addFoodToWorld(x, y, level) {
  const body = createFoodBody(x, y, level);
  Composite.add(world, body);
  foodBodies.push(body);
  return body;
}

function removeFoodFromWorld(body) {
  Composite.remove(world, body);
  const idx = foodBodies.indexOf(body);
  if (idx !== -1) foodBodies.splice(idx, 1);
}

// ============================================================
//  SELECCIÓN ALEATORIA
// ============================================================
function getRandomFoodLevel() {
  const total = SPAWN_WEIGHTS.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SPAWN_WEIGHTS.length; i++) {
    r -= SPAWN_WEIGHTS[i];
    if (r <= 0) return i + 1;
  }
  return 1;
}

function generateNextPair() {
  if (currentLevel === 0) {
    currentLevel = getRandomFoodLevel();
    nextLevel = getRandomFoodLevel();
  } else {
    currentLevel = nextLevel;
    nextLevel = getRandomFoodLevel();
  }
}

// ============================================================
//  POSICIÓN DE LA MANO
// ============================================================
function getHandPos(levelIndex = currentLevel) {
  const handX = characterX + HAND_OFFSET_X;
  const handY = CHAR_Y + HAND_OFFSET_Y;
  return { handX, handY };
}

// ============================================================
//  SOLTAR ÃTEM
// ============================================================
function dropItem() {
  if (gameState !== 'playing') return;
  if (dropCooldown > 0 || currentLevel === 0) return;

  const levelToDrop = currentLevel;
  const radius = FOOD_SIZES[levelToDrop - 1];
  const { handX, handY } = getHandPos(levelToDrop);
  const dropY = handY + radius * 0.3; // Nace exactamente desde la mano del personaje

  // La mano suelta el objeto y se queda vacÃ­a durante la caÃ­da
  currentLevel = 0;
  dropCooldown = 22;

  addFoodToWorld(handX, dropY, levelToDrop);
  playDropSound();

  // El siguiente Ã­tem aparece en la mano tras una breve pausa realista (200ms)
  setTimeout(() => {
    if (gameState === 'playing' && currentLevel === 0) {
      generateNextPair();
    }
  }, 200);
}


// ============================================================
// ============================================================
//  COLISIÓN Y FUSIÓN DE COMIDAS DE MISMO NIVEL
// ============================================================
function tryRegisterFusion(a, b) {
  if (gameState === 'gameover' || gameState === 'celebration') return;
  if (!a || !b || !a.isFood || !b.isFood) return;
  if (a.foodLevel !== b.foodLevel || a.foodLevel >= MAX_LEVEL) return;
  if (a._fused || b._fused) return;

  const now = Date.now();
  // BrevÃ­sima protecciÃ³n de 30ms para evitar fusiones en cascada en el mismo frame instantÃ¡neo
  if ((a.spawnTime && now - a.spawnTime < 30) || (b.spawnTime && now - b.spawnTime < 30)) {
    return;
  }

  a._fused = true;
  b._fused = true;
  pendingFusions.push({ a, b, level: a.foodLevel });
}

Events.on(engine, 'collisionStart', (event) => {
  for (const pair of event.pairs) {
    tryRegisterFusion(pair.bodyA, pair.bodyB);
  }
});

Events.on(engine, 'collisionActive', (event) => {
  for (const pair of event.pairs) {
    tryRegisterFusion(pair.bodyA, pair.bodyB);
  }
});

function processFusions() {
  if (gameState === 'gameover' || gameState === 'celebration') return;

  // 1) Escanear pares de colisiÃ³n activos directamente en el motor de Matter.js
  if (engine.pairs && engine.pairs.list) {
    for (const pair of engine.pairs.list) {
      if (pair.isActive) {
        tryRegisterFusion(pair.bodyA, pair.bodyB);
      }
    }
  }

  // 2) Escaneo de respaldo por proximidad para asegurar fusiones en reposo o contacto visual continuo
  const now = Date.now();
  for (let i = 0; i < foodBodies.length; i++) {
    for (let j = i + 1; j < foodBodies.length; j++) {
      const a = foodBodies[i];
      const b = foodBodies[j];
      if (a && b && !a._fused && !b._fused &&
        a.foodLevel === b.foodLevel &&
        a.foodLevel < MAX_LEVEL &&
        now - a.spawnTime > 30 && now - b.spawnTime > 30) {

        const radiusA = FOOD_SIZES[a.foodLevel - 1];
        const radiusB = FOOD_SIZES[b.foodLevel - 1];
        const dx = a.position.x - b.position.x;
        const dy = a.position.y - b.position.y;
        const dist = Math.hypot(dx, dy);

        // Tolerancia aumentada y verificación por bounds para cubrir casos de contacto visual
        const TOLERANCE = 18;
        const boundsOverlap = a.bounds && b.bounds && !(a.bounds.max.x < b.bounds.min.x || a.bounds.min.x > b.bounds.max.x || a.bounds.max.y < b.bounds.min.y || a.bounds.min.y > b.bounds.max.y);
        if (dist <= radiusA + radiusB + TOLERANCE || boundsOverlap) {
          tryRegisterFusion(a, b);
        }
      }
    }
  }

  if (pendingFusions.length === 0) return;

  for (const f of pendingFusions) {
    const { a, b, level } = f;
    if (foodBodies.indexOf(a) === -1 || foodBodies.indexOf(b) === -1) continue;

    const mx = (a.position.x + b.position.x) / 2;
    const my = (a.position.y + b.position.y) / 2;

    removeFoodFromWorld(a);
    removeFoodFromWorld(b);

    const newLevel = level + 1; // FusiÃ³n exacta: Nivel N + Nivel N = Nivel N+1
    addFoodToWorld(mx, my, newLevel);

    const pts = SCORE_TABLE[newLevel] || 0;
    score += pts;

    // Al llegar al Nivel 9 (CorazÃ³n) uniendo 2 Helados (Nivel 8)
    if (newLevel === MAX_LEVEL) {
      playHeartSound();
      heartAchieved = true;
      triggerCelebration(mx, my);
    } else {
      playFusionSound(newLevel);
    }

    spawnFusionParticles(mx, my, newLevel);
    shakeAmount = Math.min(shakeAmount + 3, 10);
  }
  pendingFusions = [];

  // Asegurar que cualquier flag _fused quedado en cuerpos que no fueron removidos se restablezca
  for (const body of foodBodies) {
    if (body && body._fused) body._fused = false;
  }
}


// ============================================================
//  PARTÃCULAS
// ============================================================
function spawnFusionParticles(x, y, level) {
  const count = 14 + level * 3;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3.5;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 1,
      decay: 0.015 + Math.random() * 0.012,
      size: 4 + Math.random() * (level === MAX_LEVEL ? 8 : 5),
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      isHeart: Math.random() < 0.4,
      gravity: 0.04
    });
  }
}

function spawnCelebrationConfetti() {
  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * CW,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3,
      vy: 1 + Math.random() * 2,
      life: 1,
      decay: 0.002 + Math.random() * 0.004,
      size: 4 + Math.random() * 8,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.1,
      isHeart: Math.random() < 0.35,
      gravity: 0.02 + Math.random() * 0.02
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.vy += p.gravity;
    p.y += p.vy;
    p.life -= p.decay;
    if (p.life <= 0 || p.x < -100 || p.x > VIRTUAL_W + 100 || p.y > VIRTUAL_H + 100) {
      particles.splice(i, 1);
    }
  }
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.x += c.vx;
    c.vy += c.gravity;
    c.y += c.vy;
    c.rotation += c.rotSpeed;
    c.life -= c.decay;
    if (c.life <= 0 || c.y > VIRTUAL_H + 50) {
      confetti.splice(i, 1);
    }
  }
}

// ============================================================
//  CELEBRACIÓN Y GAME OVER
// ============================================================
function triggerCelebration(x, y) {
  gameState = 'celebration';
  celebrationTimer = 300;
  spawnCelebrationConfetti();
  spawnFusionParticles(x, y, MAX_LEVEL);
}

function checkGameOver() {
  if (gameState !== 'playing') return;
  const now = Date.now();
  let isOverflowing = false;
  for (const body of foodBodies) {
    if (now - body.spawnTime < 2500) continue;
    const radius = FOOD_SIZES[body.foodLevel - 1];
    const topY = body.position.y - radius;
    if (topY < GO_LINE_Y && Math.abs(body.velocity.y) < 0.3) {
      isOverflowing = true;
      break;
    }
  }
  if (isOverflowing) {
    if (!overflowStartTime) {
      overflowStartTime = now;
    } else if (now - overflowStartTime > 2000) {
      triggerGameOver();
    }
  } else {
    overflowStartTime = null;
  }
}

function triggerGameOver() {
  gameState = 'gameover';
  playGameOverSound();
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('suikaFoodHighScore', highScore.toString());
  }
}

// ============================================================
//  RENDERIZADO â€” FONDO FULL-SCREEN ADAPTABLE
// ============================================================
function drawBackground() {
  const screenW = canvas.width;
  const screenH = canvas.height;

  // Limites en espacio virtual que se extienden al borde fÃ­sico de la pantalla
  const minX = -offsetX / scale;
  const maxX = (screenW - offsetX) / scale;
  const minY = -offsetY / scale;
  const maxY = (screenH - offsetY) / scale;
  const fullWidth = maxX - minX;

  // Pared superior de borgoÃ±a profundo y romÃ¡ntico
  const topGrad = ctx.createLinearGradient(0, minY, 0, shelfY);
  topGrad.addColorStop(0, '#4A0E2E');
  topGrad.addColorStop(1, '#2B071E');
  ctx.fillStyle = topGrad;
  ctx.fillRect(minX, minY, fullWidth, shelfY - minY);

  // Repisa romÃ¡ntica con brillo rosado/morado
  ctx.fillStyle = '#6D1B44';
  ctx.fillRect(minX, shelfY, fullWidth, 10);
  ctx.fillStyle = '#FF7BB8';
  ctx.fillRect(minX, shelfY + 8, fullWidth, 3);

  // Sombra suave de la repisa
  ctx.fillStyle = 'rgba(20, 3, 20, 0.35)';
  ctx.fillRect(minX, shelfY + 11, fullWidth, 8);

  // Fondo principal: degradado romÃ¡ntico morado - borgoÃ±a pastel
  const floorGrad = ctx.createLinearGradient(0, shelfY + 19, 0, maxY);
  floorGrad.addColorStop(0, '#3A0F39');
  floorGrad.addColorStop(1, '#220723');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(minX, shelfY + 19, fullWidth, maxY - (shelfY + 19));

  // Rayas verticales kawaii pastel rosado/morado
  ctx.fillStyle = 'rgba(255, 180, 220, 0.05)';
  const stripeW = 55;
  for (let x = minX; x < maxX; x += stripeW * 2) {
    ctx.fillRect(x, shelfY + 19, stripeW, maxY - (shelfY + 19));
  }

  // Corazoncitos kawaii flotando dinÃ¡micamente en todo el lienzo (pantalla completa)
  const spawnMinX = minX - 100;
  const spawnMaxX = maxX + 100;
  const spawnHeight = maxY - minY + 100;

  if (!window.floatingBgHearts) {
    window.floatingBgHearts = Array.from({ length: 50 }, () => ({
      x: spawnMinX + Math.random() * (spawnMaxX - spawnMinX),
      y: minY + Math.random() * spawnHeight,
      size: 10 + Math.random() * 20,
      speedY: 0.35 + Math.random() * 0.55,
      wobbleSpeed: 0.015 + Math.random() * 0.025,
      wobbleAmp: 12 + Math.random() * 25,
      phase: Math.random() * Math.PI * 2,
      opacity: 0.08 + Math.random() * 0.16
    }));
  }

  for (const h of window.floatingBgHearts) {
    // Mover hacia arriba
    h.y -= h.speedY;
    h.phase += h.wobbleSpeed;
    const wx = h.x + Math.sin(h.phase) * h.wobbleAmp;

    // Resetear al salir por arriba de la pantalla completa (minY - 40)
    if (h.y < minY - 40) {
      h.y = maxY + 40;
      h.x = spawnMinX + Math.random() * (spawnMaxX - spawnMinX);
    }

    drawHeartShape(ctx, wx, h.y, h.size, `rgba(255, 180, 220, ${h.opacity})`);
  }
}

function drawHeartShape(context, cx, cy, size, color) {
  context.save();
  context.fillStyle = color;
  context.beginPath();
  const s = size;
  context.moveTo(cx, cy + s * 0.3);
  context.bezierCurveTo(cx - s * 1.2, cy - s * 0.6, cx - s * 0.4, cy - s * 1.2, cx, cy - s * 0.5);
  context.bezierCurveTo(cx + s * 0.4, cy - s * 1.2, cx + s * 1.2, cy - s * 0.6, cx, cy + s * 0.3);
  context.fill();
  context.restore();
}

// ============================================================
//  RENDERIZADO â€” CAJA DEL JUEGO (ESTILO SUIKA CON BORDE DORADO)
// ============================================================
function drawContainer() {
  ctx.save();

  if (isImgReady(boxImg)) {
    ctx.drawImage(boxImg, BOX_X, BOX_Y, BOX_W, BOX_H);
  } else {
    ctx.fillStyle = 'rgba(255, 245, 247, 0.4)';
    ctx.beginPath();
    ctx.roundRect(C_LEFT, GO_LINE_Y, C_RIGHT - C_LEFT, C_BOTTOM - GO_LINE_Y, 16);
    ctx.fill();

    ctx.strokeStyle = '#FF6B9D';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(C_LEFT, GO_LINE_Y, C_RIGHT - C_LEFT, C_BOTTOM - GO_LINE_Y, 16);
    ctx.stroke();
  }

  ctx.restore();
}

// ============================================================
//  RENDERIZADO â€” LÃNEA LÃMITE
// ============================================================
function drawGameOverLine() {
  ctx.save();
  if (gameState === 'gameover') {
    ctx.setLineDash([]);
    ctx.strokeStyle = '#FF4D6D';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.8;
  } else {
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#FF7BB8';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
  }
  ctx.beginPath();
  ctx.moveTo(C_LEFT + 4, GO_LINE_Y);
  ctx.lineTo(C_RIGHT - 4, GO_LINE_Y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ============================================================
//  RENDERIZADO â€” ÃTEMS DE COMIDA (GRANDES como en Suika)
// ============================================================
function drawFoodItem(body) {
  const level = body.foodLevel;
  const x = body.position.x;
  const y = body.position.y;
  const radius = FOOD_SIZES[level - 1];
  const imgScale = FOOD_IMG_SCALE[level - 1] || 1.25;
  const angle = body.angle;
  const img = foodImages[level - 1];

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  if (isImgReady(img)) {
    const drawR = radius * imgScale;
    ctx.drawImage(img, -drawR, -drawR, drawR * 2, drawR * 2);
  } else {
    const grad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    grad.addColorStop(0, lightenColor(FOOD_COLORS[level - 1], 40));
    grad.addColorStop(1, FOOD_COLORS[level - 1]);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = FOOD_STROKES[level - 1];
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1, 0, Math.PI * 2);
    ctx.stroke();

  }

  ctx.restore();
}

// ============================================================
//  RENDERIZADO â€” PERSONAJE
// ============================================================
function drawCharacter() {
  const x = characterX;
  const y = CHAR_Y;

  ctx.save();
  if (isImgReady(characterImg)) {
    ctx.drawImage(characterImg, x - CHAR_W / 2, y - CHAR_H / 2, CHAR_W, CHAR_H);
  } else {
    ctx.fillStyle = '#FF6B9D';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ============================================================
//  RENDERIZADO â€” ÃTEM EN LA MANO
// ============================================================
function drawGhostItem() {
  if (gameState !== 'playing' || currentLevel === 0) return;

  const radius = FOOD_SIZES[currentLevel - 1];
  const imgScale = FOOD_IMG_SCALE[currentLevel - 1] || 1.25;
  const { handX, handY } = getHandPos(currentLevel);

  ctx.save();

  // LÃ­nea guÃ­a vertical blanca (nace exactamente de la mano y centro de la comida)
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(handX, handY + radius * 0.5);
  ctx.lineTo(handX, C_BOTTOM - 4);
  ctx.stroke();
  ctx.setLineDash([]);

  // Ãtem en la mano (siempre alineado 100% con la mano y la lÃ­nea guÃ­a)
  ctx.globalAlpha = 0.96;
  const img = foodImages[currentLevel - 1];
  if (isImgReady(img)) {
    const drawR = radius * imgScale;
    ctx.drawImage(img, handX - drawR, handY - drawR, drawR * 2, drawR * 2);
  } else {
    ctx.fillStyle = FOOD_COLORS[currentLevel - 1];
    ctx.beginPath();
    ctx.arc(handX, handY, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================
//  HELPER â€” BURBUJA DE CRISTAL GLOSSY (ESTILO SUIKA GAME)
// ============================================================
function drawGlassBubble(cx, cy, r) {
  ctx.save();

  // Sombra suave morada
  ctx.fillStyle = 'rgba(25, 5, 25, 0.35)';
  ctx.beginPath();
  ctx.arc(cx, cy + 4, r, 0, Math.PI * 2);
  ctx.fill();

  // Esfera de cristal rosa pastel y morado borgoÃ±a
  const bGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  bGrad.addColorStop(0, 'rgba(255, 255, 255, 0.96)');
  bGrad.addColorStop(0.35, 'rgba(255, 225, 245, 0.85)');
  bGrad.addColorStop(0.75, 'rgba(225, 160, 215, 0.60)');
  bGrad.addColorStop(1, 'rgba(150, 60, 140, 0.70)');

  ctx.fillStyle = bGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Borde rosa brillante
  ctx.strokeStyle = 'rgba(255, 220, 245, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Reflejo curvo superior
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.35, r * 0.4, r * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ============================================================
//  BURBUJA DE SCORE GRANDE (IZQUIERDA ARRIBA)
// ============================================================
function drawLeftScoreBubble() {
  const cx = SCORE_BUBBLE_CX;
  const cy = SCORE_BUBBLE_CY;
  const r = SCORE_BUBBLE_R;

  ctx.save();

  // Texto "SCORE" flotando arriba de la burbuja
  ctx.fillStyle = '#FFF';
  ctx.shadowColor = 'rgba(140, 20, 90, 0.8)';
  ctx.shadowBlur = 8;
  ctx.font = `bold ${Math.round(r * 0.28)}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('SCORE', cx, cy - r - Math.round(r * 0.14));
  ctx.shadowBlur = 0;

  // Gran burbuja de cristal brillante
  drawGlassBubble(cx, cy, r);

  // Puntaje actual en tono borgoÃ±a profundo con estilo kawaii
  ctx.fillStyle = '#4D0A2C';
  ctx.font = `900 ${Math.round(r * 0.52)}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(score.toString(), cx, cy - r * 0.14);

  // BEST SCORE subtÃ­tulo
  ctx.fillStyle = 'rgba(145, 45, 105, 0.85)';
  ctx.font = `bold ${Math.round(r * 0.16)}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.fillText('BEST SCORE', cx, cy + r * 0.22);

  // Valor de rÃ©cord
  ctx.fillStyle = '#7A1549';
  ctx.font = `900 ${Math.round(r * 0.28)}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.fillText(highScore.toString(), cx, cy + r * 0.46);

  ctx.restore();
}

// ============================================================
//  HELPER â€” INSIGNIA MEDALLA KAWAII VECTORIAL (1st, 2nd, 3rd)
// ============================================================
function drawKawaiiMedalBadge(context, cx, cy, radius, rank) {
  context.save();

  const r = radius;

  // Ribbon tail colors
  const ribbonGradients = [
    { c1: '#FF6EA7', c2: '#D81B60' }, // 1st - Magenta Pink
    { c1: '#AB47BC', c2: '#673AB7' }, // 2nd - Kawaii Violet
    { c1: '#FF8A80', c2: '#C62828' }  // 3rd - Rose Berry
  ];

  // Ribbon tails
  const rg = ribbonGradients[rank] || ribbonGradients[0];
  context.fillStyle = rg.c1;

  // Cinta izquierda
  context.beginPath();
  context.moveTo(cx - r * 0.3, cy + r * 0.2);
  context.lineTo(cx - r * 0.7, cy + r * 1.15);
  context.lineTo(cx - r * 0.45, cy + r * 1.0);
  context.lineTo(cx - r * 0.1, cy + r * 1.1);
  context.closePath();
  context.fill();

  // Cinta derecha
  context.fillStyle = rg.c2;
  context.beginPath();
  context.moveTo(cx + r * 0.3, cy + r * 0.2);
  context.lineTo(cx + r * 0.7, cy + r * 1.15);
  context.lineTo(cx + r * 0.45, cy + r * 1.0);
  context.lineTo(cx + r * 0.1, cy + r * 1.1);
  context.closePath();
  context.fill();

  // CÃ­rculo principal de la medalla metÃ¡lica brillante
  const mGrad = context.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  if (rank === 0) {
    // BorgoÃ±a / RosÃ© Magenta Kawaii brillante
    mGrad.addColorStop(0, '#FFF0F8');
    mGrad.addColorStop(0.35, '#FF7BB8');
    mGrad.addColorStop(0.75, '#D81B60');
    mGrad.addColorStop(1, '#7A0038');
  } else if (rank === 1) {
    // Plata Kawaii
    mGrad.addColorStop(0, '#FFFFFF');
    mGrad.addColorStop(0.4, '#E0E6F8');
    mGrad.addColorStop(0.8, '#B0BEC5');
    mGrad.addColorStop(1, '#78909C');
  } else {
    // Bronce Rosa Kawaii
    mGrad.addColorStop(0, '#FFE0B2');
    mGrad.addColorStop(0.4, '#FFAB91');
    mGrad.addColorStop(0.8, '#D87060');
    mGrad.addColorStop(1, '#8D6E63');
  }

  context.fillStyle = mGrad;
  context.beginPath();
  context.arc(cx, cy, r, 0, Math.PI * 2);
  context.fill();

  // Borde brillante blanco
  context.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  context.lineWidth = Math.max(1.5, r * 0.12);
  context.beginPath();
  context.arc(cx, cy, r, 0, Math.PI * 2);
  context.stroke();

  // CÃ­rculo interior pastel
  context.fillStyle = 'rgba(255, 255, 255, 0.92)';
  context.beginPath();
  context.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  context.fill();

  // NÃºmero en el centro
  context.fillStyle = rank === 0 ? '#5C0838' : rank === 1 ? '#455A64' : '#6D4C41';
  context.font = `900 ${Math.round(r * 0.75)}px 'Fredoka', 'Sniglet', sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText((rank + 1).toString(), cx, cy + 1);

  // Destello brillante en la esquina de la medalla
  context.fillStyle = '#FFF';
  context.beginPath();
  context.arc(cx - r * 0.4, cy - r * 0.4, r * 0.18, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

// ============================================================
//  TARJETA DE RANKING (IZQUIERDA ABAJO)
// ============================================================
function drawRankingCard() {
  const x = RANK_CARD_X;
  const y = RANK_CARD_Y;
  const w = RANK_CARD_W;
  const h = RANK_CARD_H;

  if (w < 100) return;

  ctx.save();

  // Tarjeta rosa/morado pastel muy suave estilo cristal kawaii
  ctx.fillStyle = 'rgba(255, 242, 250, 0.95)';
  ctx.shadowColor = 'rgba(30, 5, 30, 0.3)';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(175, 60, 130, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 20);
  ctx.stroke();

  const titleSize = Math.round(w * 0.07);
  const rowH = Math.round(h * 0.17);
  const medalRadius = Math.round(rowH * 0.32);
  const rankLabelSize = Math.round(w * 0.065);
  const valueSize = Math.round(w * 0.07);
  let yy = y + 14;

  // TÃ­tulo borgoÃ±a
  ctx.fillStyle = '#4D0A2C';
  ctx.font = `bold ${titleSize}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('LEADERBOARD', x + w / 2, yy);
  yy += titleSize + 12;

  // Filas 1st, 2nd, 3rd en variantes de morado y borgoÃ±a kawaii
  const rowColors = ['rgba(242, 175, 222, 0.75)', 'rgba(215, 195, 245, 0.65)', 'rgba(245, 205, 222, 0.65)'];
  const textColors = ['#5C0838', '#4A2475', '#751A48'];
  const rankSuffixes = ['1st', '2nd', '3rd'];
  const scoreValues = [
    highScore > 0 ? highScore.toString() : '-----',
    highScore > 500 ? Math.floor(highScore * 0.7).toString() : '-----',
    highScore > 1000 ? Math.floor(highScore * 0.4).toString() : '-----'
  ];

  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = rowColors[i];
    ctx.beginPath();
    ctx.roundRect(x + 10, yy, w - 20, rowH, 8);
    ctx.fill();

    // Medalla vectorial kawaii
    const badgeCx = x + 24 + medalRadius;
    const badgeCy = yy + rowH / 2 - 2;
    drawKawaiiMedalBadge(ctx, badgeCx, badgeCy, medalRadius, i);

    // Texto del rango (1st, 2nd, 3rd)
    ctx.fillStyle = textColors[i];
    ctx.font = `bold ${rankLabelSize}px 'Fredoka', 'Sniglet', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(rankSuffixes[i], badgeCx + medalRadius + 12, yy + rowH / 2);

    // Puntaje a la derecha
    ctx.textAlign = 'right';
    ctx.font = `900 ${valueSize}px 'Fredoka', 'Sniglet', sans-serif`;
    ctx.fillText(scoreValues[i], x + w - 18, yy + rowH / 2);

    yy += rowH + 6;
  }

  // Fila AHORA
  yy += 4;
  ctx.fillStyle = 'rgba(255, 225, 242, 0.9)';
  const nowH = Math.round(h * 0.22);
  ctx.beginPath();
  ctx.roundRect(x + 10, yy, w - 20, nowH, 10);
  ctx.fill();

  ctx.fillStyle = 'rgba(130, 30, 90, 0.75)';
  ctx.font = `bold ${Math.round(titleSize * 0.8)}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('NOW', x + w / 2, yy + 6);

  ctx.fillStyle = '#5E0B38';
  ctx.font = `900 ${Math.round(valueSize * 1.35)}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textBaseline = 'bottom';
  ctx.fillText(score.toString(), x + w / 2, yy + nowH - 6);

  ctx.restore();
}

// ============================================================
//  BURBUJA NEXT (DERECHA ARRIBA)
// ============================================================
function drawNextPreview() {
  const cx = NEXT_BUBBLE_CX;
  const cy = NEXT_BUBBLE_CY;
  const r = NEXT_BUBBLE_R;

  ctx.save();

  // Texto "Next"
  ctx.fillStyle = '#FFF';
  ctx.shadowColor = 'rgba(140, 20, 90, 0.8)';
  ctx.shadowBlur = 8;
  ctx.font = `bold ${Math.round(r * 0.3)}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Next', cx, cy - r - Math.round(r * 0.15));
  ctx.shadowBlur = 0;

  // Burbuja grande
  drawGlassBubble(cx, cy, r);

  // Comida siguiente dentro
  if (nextLevel > 0) {
    const previewRadius = Math.round(r * 0.5);
    const img = foodImages[nextLevel - 1];
    if (isImgReady(img)) {
      const drawR = previewRadius * 1.25;
      ctx.drawImage(img, cx - drawR, cy - drawR, drawR * 2, drawR * 2);
    } else {
      ctx.fillStyle = FOOD_COLORS[nextLevel - 1];
      ctx.beginPath();
      ctx.arc(cx, cy, previewRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ============================================================
//  RUEDA DE EVOLUCIÓN GRANDE (DERECHA CENTRO)
// ============================================================
function drawEvolutionWheel() {
  const cx = WHEEL_CX;
  const cy = WHEEL_CY;
  const outerR = WHEEL_R_OUTER;
  const innerR = WHEEL_R_INNER;

  ctx.save();

  // TÃ­tulo rosado/blanco con sombra morada
  ctx.fillStyle = '#FFF';
  ctx.shadowColor = 'rgba(140, 20, 90, 0.8)';
  ctx.shadowBlur = 8;
  ctx.font = `bold ${Math.round(outerR * 0.14)}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('EVOLUTION', cx, cy - outerR - Math.round(outerR * 0.12));
  ctx.shadowBlur = 0;

  // Anillo degradado romÃ¡ntico morado pastel y borgoÃ±a rosa
  const ringGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  ringGrad.addColorStop(0, 'rgba(255, 225, 245, 0.95)');
  ringGrad.addColorStop(0.5, 'rgba(220, 130, 200, 0.95)');
  ringGrad.addColorStop(1, 'rgba(160, 60, 140, 0.95)');

  ctx.fillStyle = ringGrad;
  ctx.shadowColor = 'rgba(30, 5, 30, 0.25)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 200, 235, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.stroke();

  // Las 9 comidas en el anillo
  const midR = (outerR + innerR) / 2;
  const ringHalfThickness = (outerR - innerR) / 2;

  for (let i = 0; i < MAX_LEVEL; i++) {
    const angle = (i / MAX_LEVEL) * Math.PI * 2 - Math.PI / 2;
    const fx = cx + Math.cos(angle) * midR;
    const fy = cy + Math.sin(angle) * midR;
    const miniR = Math.round(ringHalfThickness * (0.50 + (i / (MAX_LEVEL - 1)) * 0.32));

    const img = foodImages[i];
    if (isImgReady(img)) {
      ctx.drawImage(img, fx - miniR, fy - miniR, miniR * 2, miniR * 2);
    } else {
      ctx.fillStyle = FOOD_COLORS[i];
      ctx.beginPath();
      ctx.arc(fx, fy, miniR * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

// ============================================================
//  HELPER â€” BOTÓN DE MENÃš CON EFECTO GLOSSY
// ============================================================
function drawMenuButton(x, y, w, h, text, color1, color2, textColor, fontSize) {
  ctx.save();

  // Sombra
  ctx.fillStyle = 'rgba(20, 5, 20, 0.3)';
  ctx.beginPath();
  ctx.roundRect(x + 3, y + 5, w, h, h / 2);
  ctx.fill();

  // Cuerpo del botÃ³n degradado
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.5, color2);
  grad.addColorStop(1, color1);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();

  // Borde brillante
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.stroke();

  // Reflejo glossy superior
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 3, w - 16, h * 0.4, [h / 3, h / 3, 0, 0]);
  ctx.fill();

  // Texto
  ctx.fillStyle = textColor || '#FFF';
  ctx.font = `900 ${fontSize || 28}px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + w / 2, y + h / 2 + 2);

  ctx.restore();
}

// ============================================================
//  MENÃš PRINCIPAL â€” PANTALLA DE INICIO "FOOD LOVE"
// ============================================================
let menuHeartBounce = 0;

function drawStartMenu() {
  const cx = VIRTUAL_W / 2;

  ctx.save();

  // === LOGO "Food Love" ARCUADO (FORMA DE ARCOÃRIS / MONTAÃ‘A) ===
  const logoY = 330;

  // Letras del tÃ­tulo separadas para formar el arco
  const titleText = "Food Love";
  const fontPt = 115;
  const fontStyle = `900 ${fontPt}px 'Fredoka', 'Sniglet', sans-serif`;

  // ConfiguraciÃ³n de curvatura (ArcoÃ­ris / MontaÃ±a mÃ¡s amplio y separado)
  const radius = 680; // Radio del arco
  const startAngle = -Math.PI / 2 - 0.44; // Ãngulo inicial (mÃ¡s a la izquierda)
  const endAngle = -Math.PI / 2 + 0.44;   // Ãngulo final
  const arcCenterY = logoY + radius - 45;  // Centro del cÃ­rculo virtual abajo

  ctx.font = fontStyle;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const totalChars = titleText.length;

  for (let i = 0; i < totalChars; i++) {
    const char = titleText[i];
    if (char === ' ') continue;

    // Calcular progreso y Ã¡ngulo de cada letra a lo largo del arco
    const t = (i / (totalChars - 1));
    const angle = startAngle + t * (endAngle - startAngle);

    // PosiciÃ³n (X, Y) en la curva
    const lx = cx + Math.cos(angle) * radius;
    const ly = arcCenterY + Math.sin(angle) * radius;

    // RotaciÃ³n de la letra tangente a la curva
    const rot = angle + Math.PI / 2;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);

    // 1) Sombra profunda inferior (BorgoÃ±a/Plum muy oscuro)
    ctx.font = fontStyle;
    ctx.fillStyle = '#200318';
    ctx.fillText(char, 4, 8);

    // 2) Borde exterior borgoÃ±a oscuro grueso
    ctx.strokeStyle = '#4A0527';
    ctx.lineWidth = 16;
    ctx.strokeText(char, 0, 0);

    // 3) Borde blanco intermedio
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 8;
    ctx.strokeText(char, 0, 0);

    // 4) Relleno degradado en variaciones de BorgoÃ±a y Morado (Rosa orquÃ­dea -> BorgoÃ±a carmesÃ­ -> Morado violeta)
    const charGrad = ctx.createLinearGradient(0, -fontPt / 2, 0, fontPt / 2);
    charGrad.addColorStop(0, '#FF85D0');
    charGrad.addColorStop(0.35, '#E61F7A');
    charGrad.addColorStop(0.7, '#A10D5B');
    charGrad.addColorStop(1, '#6A0C5E');
    ctx.fillStyle = charGrad;
    ctx.fillText(char, 0, 0);

    // 5) Reflejo brillante blanco superior recortado por letra
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#FFFFFF';
    ctx.save();
    ctx.beginPath();
    ctx.rect(-fontPt / 2, -fontPt / 2 - 5, fontPt, fontPt * 0.32);
    ctx.clip();
    ctx.fillText(char, 0, 0);
    ctx.restore();

    ctx.restore();
  }

  // === BOTÓN "Game Start" (BorgoÃ±a a Morado vibrante) ===
  const b1 = menuBtnBounds.gameStart;
  drawMenuButton(b1.x, b1.y, b1.w, b1.h, 'Game Start', '#C2185B', '#8E24AA', '#FFF', 32);

  // === BOTÓN "My Score" (Morado real a Morado profundo) ===
  const b2 = menuBtnBounds.myScore;
  drawMenuButton(b2.x, b2.y, b2.w, b2.h, 'My Score', '#7B1FA2', '#4A148C', '#FFF', 28);

  ctx.restore();

  // === MODAL "My Score" ===
  if (showScoreModal) {
    drawMyScoreModal();
  }
}

// ============================================================
//  MODAL "MY SCORE"
// ============================================================
function drawMyScoreModal() {
  ctx.save();

  // Fondo oscuro semi-transparente
  const minX = -offsetX / scale;
  const maxX = (canvas.width - offsetX) / scale;
  const minY = -offsetY / scale;
  const maxY = (canvas.height - offsetY) / scale;
  ctx.fillStyle = 'rgba(20, 5, 20, 0.75)';
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

  const cx = VIRTUAL_W / 2;
  const cy = VIRTUAL_H / 2;
  const mw = 400, mh = 320;

  // Tarjeta modal estilo BorgoÃ±a & Morado elegante
  ctx.fillStyle = 'rgba(255, 242, 250, 0.97)';
  ctx.shadowColor = 'rgba(160, 20, 100, 0.35)';
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.roundRect(cx - mw / 2, cy - mh / 2, mw, mh, 28);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Borde BorgoÃ±a
  ctx.strokeStyle = '#AD1457';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(cx - mw / 2, cy - mh / 2, mw, mh, 28);
  ctx.stroke();

  // TÃ­tulo
  ctx.fillStyle = '#5A0732';
  ctx.font = `900 32px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('My Score', cx, cy - mh / 2 + 50);

  // LÃ­nea divisoria
  ctx.strokeStyle = 'rgba(173, 20, 87, 0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - mw / 2 + 30, cy - mh / 2 + 80);
  ctx.lineTo(cx + mw / 2 - 30, cy - mh / 2 + 80);
  ctx.stroke();

  // Best Score grande
  ctx.fillStyle = '#8E24AA';
  ctx.font = `700 18px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.fillText('BEST SCORE', cx, cy - 30);

  ctx.fillStyle = '#C2185B';
  ctx.font = `900 60px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.fillText(highScore > 0 ? highScore.toString() : '---', cx, cy + 30);

  // BotÃ³n "Close"
  const cb = scoreModalCloseBtn;
  drawMenuButton(cb.x, cb.y, cb.w, cb.h, 'Close', '#C2185B', '#7B1FA2', '#FFF', 22);

  ctx.restore();
}



// ============================================================
//  PARTÃCULAS RENDER
// ============================================================
function drawParticles() {
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life);
    const s = p.size * p.life;
    if (p.isHeart) {
      drawHeartShape(ctx, p.x, p.y, s * 0.7, p.color);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.save();
  for (const c of confetti) {
    ctx.globalAlpha = Math.max(0, c.life);
    ctx.fillStyle = c.color;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation);
    if (c.isHeart) {
      drawHeartShape(ctx, 0, 0, c.size * 0.6, c.color);
    } else {
      ctx.fillRect(-c.size / 2, -2, c.size, 4);
    }
    ctx.restore();
  }
  ctx.restore();
}

// ============================================================
//  OVERLAYS
// ============================================================
function drawGameOverOverlay() {
  ctx.save();

  // Fondo oscuro semi-transparente
  const minX = -offsetX / scale;
  const maxX = (canvas.width - offsetX) / scale;
  const minY = -offsetY / scale;
  const maxY = (canvas.height - offsetY) / scale;
  ctx.fillStyle = 'rgba(20, 5, 20, 0.5)';
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

  // Tarjeta
  const cx = VIRTUAL_W / 2;
  const cy = VIRTUAL_H / 2;
  ctx.fillStyle = 'rgba(255, 238, 244, 0.97)';
  ctx.shadowColor = 'rgba(255, 107, 157, 0.35)';
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.roundRect(cx - 200, cy - 110, 400, 220, 24);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#FF6B9D';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cx - 200, cy - 110, 400, 220, 24);
  ctx.stroke();

  // TÃ­tulo Game Over
  ctx.fillStyle = '#C2185B';
  ctx.font = `900 30px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Game Over!', cx, cy - 70);

  // Score
  ctx.fillStyle = '#E91E63';
  ctx.font = `bold 22px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.fillText('Score: ' + score, cx, cy - 30);

  // Nuevo rÃ©cord
  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#FF6B9D';
    ctx.font = `bold 16px 'Fredoka', 'Sniglet', sans-serif`;
    ctx.fillText('âœ¨ New Record! âœ¨', cx, cy + 5);
  }

  // BotÃ³n "Play Again" (BorgoÃ±a a Morado)
  const b1 = gameOverBtnBounds.playAgain;
  drawMenuButton(b1.x, b1.y, b1.w, b1.h, 'Play Again', '#C2185B', '#8E24AA', '#FFF', 18);

  // BotÃ³n "Main Menu" (Morado real a Morado profundo)
  const b2 = gameOverBtnBounds.mainMenu;
  drawMenuButton(b2.x, b2.y, b2.w, b2.h, 'Main Menu', '#7B1FA2', '#4A148C', '#FFF', 18);

  ctx.restore();
}


// ============================================================
// MODAL CARTA (CORAZÓN MÃXIMO)
// ============================================================
function drawCelebrationOverlay() {
  ctx.save();
  ctx.restore();
}

// ============================================================
//  MODAL CARTA DE AMOR (CORAZÓN MÃXIMO)
// ============================================================
function drawLoveLetterModal() {
  ctx.save();

  const minX = -offsetX / scale;
  const maxX = (canvas.width - offsetX) / scale;
  const minY = -offsetY / scale;
  const maxY = (canvas.height - offsetY) / scale;
  ctx.fillStyle = 'rgba(20, 5, 20, 0.78)';
  ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

  const cx = VIRTUAL_W / 2;
  const cy = VIRTUAL_H / 2;
  const mw = 480;
  const mh = 600;
  const left = cx - mw / 2;
  const top = cy - mh / 2;
  const flapH = 72;
  const paperTop = top + flapH - 8;
  const paperH = mh - flapH + 8;
  const padX = 44;

  // Sombra de la carta
  ctx.fillStyle = 'rgba(20, 5, 20, 0.35)';
  ctx.beginPath();
  ctx.roundRect(left + 8, top + 12, mw, mh, 6);
  ctx.fill();

  // === CUERPO DEL PAPEL (estilo carta escrita) ===
  const paperGrad = ctx.createLinearGradient(left, paperTop, left + mw, paperTop + paperH);
  paperGrad.addColorStop(0, '#FFF9FC');
  paperGrad.addColorStop(0.5, '#FFF3F8');
  paperGrad.addColorStop(1, '#FFEAF4');
  ctx.fillStyle = paperGrad;
  ctx.shadowColor = 'rgba(160, 20, 100, 0.35)';
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.roundRect(left, paperTop, mw, paperH, [0, 0, 8, 8]);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Borde interior tipo mÃ¡rgenes de cuaderno
  ctx.strokeStyle = 'rgba(173, 20, 87, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(left + 14, paperTop + 14, mw - 28, paperH - 28, 4);
  ctx.stroke();

  // LÃ­neas horizontales sutiles (papel rayado romÃ¡ntico)
  ctx.strokeStyle = 'rgba(194, 24, 91, 0.07)';
  ctx.lineWidth = 1;
  for (let ly = paperTop + 58; ly < paperTop + paperH - 36; ly += 28) {
    ctx.beginPath();
    ctx.moveTo(left + padX - 8, ly);
    ctx.lineTo(left + mw - padX + 8, ly);
    ctx.stroke();
  }

  // Margen vertical rosado (como cuaderno)
  ctx.fillStyle = 'rgba(255, 123, 184, 0.12)';
  ctx.fillRect(left + padX - 18, paperTop + 20, 3, paperH - 40);

  // === SOLAPA DEL SOBRE (parte superior de la carta) ===
  const flapGrad = ctx.createLinearGradient(left, top, left, top + flapH);
  flapGrad.addColorStop(0, '#A10D5B');
  flapGrad.addColorStop(0.55, '#C2185B');
  flapGrad.addColorStop(1, '#7B1FA2');
  ctx.fillStyle = flapGrad;
  ctx.beginPath();
  ctx.moveTo(left - 2, paperTop);
  ctx.lineTo(cx, top + 18);
  ctx.lineTo(left + mw + 2, paperTop);
  ctx.closePath();
  ctx.fill();

  // Borde dorado/rosa en la solapa
  ctx.strokeStyle = 'rgba(255, 220, 245, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, paperTop);
  ctx.lineTo(cx, top + 18);
  ctx.lineTo(left + mw, paperTop);
  ctx.stroke();

  // Pliegue de la solapa
  ctx.strokeStyle = 'rgba(90, 7, 50, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left + 20, paperTop - 2);
  ctx.lineTo(cx, top + 32);
  ctx.lineTo(left + mw - 20, paperTop - 2);
  ctx.stroke();

  // === SELLO DE CERA con corazÃ³n ===
  const sealR = 34;
  const sealX = cx;
  const sealY = paperTop + 2;
  ctx.fillStyle = 'rgba(20, 5, 20, 0.25)';
  ctx.beginPath();
  ctx.ellipse(sealX + 2, sealY + 4, sealR, sealR * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  const sealGrad = ctx.createRadialGradient(sealX - 8, sealY - 10, 4, sealX, sealY, sealR);
  sealGrad.addColorStop(0, '#FF85D0');
  sealGrad.addColorStop(0.45, '#C2185B');
  sealGrad.addColorStop(1, '#6A0C5E');
  ctx.fillStyle = sealGrad;
  ctx.beginPath();
  ctx.ellipse(sealX, sealY, sealR, sealR * 0.88, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(sealX, sealY, sealR - 3, sealR * 0.88 - 3, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Esquinas decorativas (ornamento tipo carta vintage)
  function drawCornerOrnament(ox, oy, flipX, flipY) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(flipX, flipY);
    ctx.strokeStyle = 'rgba(173, 20, 87, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 22);
    ctx.quadraticCurveTo(0, 0, 22, 0);
    ctx.stroke();
    ctx.restore();
  }
  drawCornerOrnament(left + 22, paperTop + 22, 1, 1);
  drawCornerOrnament(left + mw - 22, paperTop + 22, -1, 1);
  drawCornerOrnament(left + 22, paperTop + paperH - 22, 1, -1);
  drawCornerOrnament(left + mw - 22, paperTop + paperH - 22, -1, -1);

  // === CUERPO DEL MENSAJE ===
  ctx.fillStyle = '#4A082C';
  ctx.font = `600 15px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const textLines = [
    'A veces pienso en todo lo que hemos vivido',
    'y en c\u00f3mo llegaste a mi vida, y la verdad',
    'siento que no me robaste el coraz\u00f3n, sino',
    'que me hiciste sentir que lo ten\u00eda de vuelta.',
    'Me devolviste algo que no sab\u00eda que',
    'necesitaba, y desde entonces entend\u00ed lo',
    'especial que eres para m\u00ed.',
    '',
    'Me gusta pensar que hasta en los peque\u00f1os',
    'detalles tenemos una conexi\u00f3n, como nuestras',
    'manos, que tienen el mismo tama\u00f1o. Ojal\u00e1',
    'que cada vez que mires las tuyas recuerdes',
    'las m\u00edas, incluso cuando no estamos juntos.',
    '',
    'Podr\u00eda decirte que morir\u00eda por ti, pero',
    'te estar\u00eda mintiendo, porque yo quiero vivir',
    'para estar a tu lado. Dicen que el insomnio',
    'es por falta de sue\u00f1o, pero el m\u00edo es por',
    'tu falta, porque t\u00fa te volviste mi sue\u00f1o.'
  ];

  const textCenter = left + mw / 2;
  let textY = paperTop + 50;
  const lineHeight = 21;
  for (const line of textLines) {
    if (line) ctx.fillText(line, textCenter, textY);
    textY += lineHeight;
  }

  // === FIRMA ===
  const signatureY = paperTop + paperH - 32;
  ctx.fillStyle = '#7A1549';
  ctx.font = `700 16px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Anthony Andino', left + mw - padX, signatureY);

  // === BOTÓN CERRAR (sello pequeÃ±o en esquina) ===
  const bw = 36;
  const bh = 36;
  const bx = left + mw - 52;
  const by = top + 14;
  loveLetterCloseBtnBounds = { x: bx, y: by, w: bw, h: bh };

  ctx.fillStyle = 'rgba(20, 5, 20, 0.28)';
  ctx.beginPath();
  ctx.arc(bx + bw / 2, by + bh / 2 + 2, bw / 2, 0, Math.PI * 2);
  ctx.fill();

  const closeGrad = ctx.createLinearGradient(bx, by, bx, by + bh);
  closeGrad.addColorStop(0, '#E61F7A');
  closeGrad.addColorStop(1, '#6A0C5E');
  ctx.fillStyle = closeGrad;
  ctx.beginPath();
  ctx.arc(bx + bw / 2, by + bh / 2, bw / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(bx + bw / 2, by + bh / 2, bw / 2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `900 18px 'Fredoka', 'Sniglet', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('X', bx + bw / 2, by + bh / 2 + 1);

  ctx.restore();
}

// ============================================================
//  COOLDOWN
// ============================================================
function drawDropCooldown() {
  if (dropCooldown > 0) {
    const pct = 1 - dropCooldown / 18;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 107, 157, 0.2)';
    ctx.fillRect(C_LEFT + 8, C_TOP - 3, (C_RIGHT - C_LEFT - 16) * pct, 3);
    ctx.restore();
  }
}

// ============================================================
//  RENDER PRINCIPAL
// ============================================================
function drawVolumeControl() {
  volumeBounds = { x: VIRTUAL_W - 84, y: VIRTUAL_H - 84, w: 60, h: 60 };
  volNextBounds = { x: VIRTUAL_W - 84, y: VIRTUAL_H - 154, w: 44, h: 38 };
  volSliderBounds = { x: VIRTUAL_W - 77, y: VIRTUAL_H - 116, w: 46, h: 10 };

  const pulse = Date.now() / 1000;
  const pulseVal = (Math.sin(pulse * 2.5) + 1) / 2;
  const muted = bgmMuted || bgmVolume === 0;

  // === Next Track Button (glass mini) ===
  ctx.save();
  const ncx = volNextBounds.x + volNextBounds.w / 2;
  const ncy = volNextBounds.y + volNextBounds.h / 2;
  const nr = volNextBounds.h / 2;
  const ng = ctx.createRadialGradient(ncx - nr * 0.2, ncy - nr * 0.3, nr * 0.1, ncx, ncy, nr);
  ng.addColorStop(0, 'rgba(255,255,255,0.95)');
  ng.addColorStop(0.5, 'rgba(255,215,235,0.75)');
  ng.addColorStop(1, 'rgba(200,120,180,0.50)');
  ctx.fillStyle = ng;
  ctx.beginPath();
  ctx.arc(ncx, ncy, nr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ncx, ncy, nr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#6A0C5E';
  ctx.beginPath();
  ctx.moveTo(ncx - 5, ncy - 7);
  ctx.lineTo(ncx + 5, ncy);
  ctx.lineTo(ncx - 5, ncy + 7);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(ncx + 3, ncy - 7);
  ctx.lineTo(ncx + 13, ncy);
  ctx.lineTo(ncx + 3, ncy + 7);
  ctx.closePath();
  ctx.fill();
  if (volNextHover) {
    ctx.beginPath();
    ctx.arc(ncx, ncy, nr + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,107,157,0.3)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();

  // === Main Music Button (glass bubble) ===
  ctx.save();
  const cx = volumeBounds.x + volumeBounds.w / 2;
  const cy = volumeBounds.y + volumeBounds.h / 2;
  const r = 30;
  const bg = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  bg.addColorStop(0, 'rgba(255,255,255,0.96)');
  bg.addColorStop(0.35, 'rgba(255,225,245,0.85)');
  bg.addColorStop(0.75, 'rgba(225,160,215,0.60)');
  bg.addColorStop(1, 'rgba(150,60,140,0.70)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,245,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.35, r * 0.35, r * 0.18, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Music note (beamed eighth notes)
  const ns = r * 0.44;
  ctx.fillStyle = muted ? 'rgba(106,12,94,0.35)' : '#6A0C5E';
  ctx.beginPath();
  ctx.ellipse(cx - ns * 0.45, cy + ns * 0.1, ns * 0.4, ns * 0.28, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + ns * 0.45, cy + ns * 0.1, ns * 0.4, ns * 0.28, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - ns * 0.25, cy - ns * 0.85, ns * 0.07, ns * 1.0);
  ctx.fillRect(cx + ns * 0.35, cy - ns * 0.85, ns * 0.07, ns * 1.0);
  ctx.fillRect(cx - ns * 0.25, cy - ns * 0.92, ns * 0.67, ns * 0.12);

  if (muted) {
    ctx.strokeStyle = 'rgba(200,30,60,0.6)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - ns * 0.7, cy - ns * 0.7);
    ctx.lineTo(cx + ns * 0.7, cy + ns * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + ns * 0.7, cy - ns * 0.7);
    ctx.lineTo(cx - ns * 0.7, cy + ns * 0.7);
    ctx.stroke();
  } else if (bgmVolume > 0) {
    const ga = 0.12 + pulseVal * 0.14;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2 + pulseVal * 3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,107,157,${ga.toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  if (volHover) {
    ctx.beginPath();
    ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,107,157,0.08)';
    ctx.lineWidth = 6;
    ctx.stroke();
  }
  ctx.restore();

  // === Volume Panel (glass slider) ===
  if (volPanelVisible) {
    ctx.save();
    const pX = volSliderBounds.x - 12;
    const pY = volSliderBounds.y - 16;
    const pW = volSliderBounds.w + 24;
    const pH = 44;
    ctx.fillStyle = 'rgba(20,8,20,0.55)';
    ctx.beginPath();
    ctx.roundRect(pX, pY, pW, pH, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,235,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(pX, pY, pW, pH, 14);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(volSliderBounds.x, volSliderBounds.y, volSliderBounds.w, volSliderBounds.h, volSliderBounds.h / 2);
    ctx.fill();

    const fw = volSliderBounds.w * bgmVolume;
    if (fw > 2) {
      const fg = ctx.createLinearGradient(volSliderBounds.x, 0, volSliderBounds.x + volSliderBounds.w, 0);
      fg.addColorStop(0, '#FF6B9D');
      fg.addColorStop(1, '#D81B60');
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.roundRect(volSliderBounds.x, volSliderBounds.y, fw, volSliderBounds.h, volSliderBounds.h / 2);
      ctx.fill();
    }

    const tx = volSliderBounds.x + volSliderBounds.w * bgmVolume;
    const ty = volSliderBounds.y + volSliderBounds.h / 2;
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(tx, ty, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = volSliderHover ? '#FF6B9D' : 'rgba(255,107,157,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(tx, ty, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `600 11px 'Fredoka', 'Sniglet', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(Math.round(bgmVolume * 100) + '%', pX + pW / 2, pY + 4);
    ctx.restore();
  }
}
function render() {
  ctx.save();

  // Limpiar lienzo completo en coordenadas fÃ­sicas de pantalla
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Aplicar matriz de escalado para espacio virtual de 1600x900
  ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

  // ===== MENÃš PRINCIPAL =====
  if (gameState === 'menu') {
    drawBackground();
    drawStartMenu();
    ctx.restore();
    return;
  }

  // ===== JUEGO EN CURSO =====
  if (shakeAmount > 0.5) {
    const sx = (Math.random() - 0.5) * shakeAmount;
    const sy = (Math.random() - 0.5) * shakeAmount;
    ctx.translate(sx, sy);
    shakeAmount *= 0.88;
    if (shakeAmount < 0.5) shakeAmount = 0;
  }

  // 1) Fondo full-screen
  drawBackground();

  // 2) Caja centrada
  drawContainer();

  // 3) LÃ­nea lÃ­mite
  drawGameOverLine();

  // 4) Personaje (se dibuja primero para que las comidas caigan POR ENCIMA de Ã©l)
  drawCharacter();

  // 5) Comida en la mano (vista previa sostenida por el personaje)
  if (gameState === 'playing') {
    drawGhostItem();
  }

  // 6) Comidas caÃ­das y en caÃ­da libre (se dibujan POR ENCIMA del personaje)
  ctx.save();
  ctx.beginPath();
  ctx.rect(C_LEFT - 4, 0, C_RIGHT - C_LEFT + 8, C_BOTTOM);
  ctx.clip();

  for (const body of foodBodies) {
    drawFoodItem(body);
  }
  ctx.restore();

  // 7) Cooldown
  drawDropCooldown();

  // 8) IZQUIERDA: Burbuja grande de Score
  drawLeftScoreBubble();

  // 9) IZQUIERDA: Tarjeta de Ranking
  drawRankingCard();

  // 10) DERECHA: Burbuja Next
  drawNextPreview();

  // 11) DERECHA: Rueda de EvoluciÃ³n grande
  drawEvolutionWheel();

  // 12) PartÃ­culas y confeti
  drawParticles();

  // 13) Overlays
  if (gameState === 'celebration') {
    drawCelebrationOverlay();
  } else if (gameState === 'gameover') {
    drawGameOverOverlay();
  }

  // 14) Carta de Amor (se dibuja sobre todo)
  if (showLoveLetterModal) {
    drawLoveLetterModal();
  }

  // Icono y panel de volumen
  drawVolumeControl();

  ctx.restore();
}


// ============================================================
//  UTILIDAD
// ============================================================
function lightenColor(hex, amt) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  let r = parseInt(c.substring(0, 2), 16);
  let g = parseInt(c.substring(2, 4), 16);
  let b = parseInt(c.substring(4, 6), 16);
  r = Math.min(255, r + amt);
  g = Math.min(255, g + amt);
  b = Math.min(255, b + amt);
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ============================================================
//  CONTROLES CON MAPEO A ESPACIO VIRTUAL
// ============================================================
function getCanvasCoords(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const rawX = clientX - rect.left;
  const rawY = clientY - rect.top;
  return {
    x: (rawX - offsetX) / scale,
    y: (rawY - offsetY) / scale
  };
}


function updateCharacterX(screenX) {
  const pos = getCanvasCoords(screenX, 0);
  const radius = FOOD_SIZES[currentLevel > 0 ? currentLevel - 1 : 0] || 22;
  const minHandX = C_LEFT + radius + 2;
  const maxHandX = C_RIGHT - radius - 2;

  // Permitir que la mano del personaje llegue pegadita a la pared izquierda o derecha
  const targetHandX = Math.max(minHandX, Math.min(maxHandX, pos.x));
  characterX = targetHandX - HAND_OFFSET_X;
}

canvas.addEventListener('mousemove', (e) => {
  e.preventDefault();
  const pos = getCanvasCoords(e.clientX, e.clientY);
  volHover = hitTest(pos.x, pos.y, volumeBounds);
  volNextHover = hitTest(pos.x, pos.y, volNextBounds);
  volSliderHover = volPanelVisible && hitTest(pos.x, pos.y, volSliderBounds);

  if (volSliderDragging) {
    const relX = Math.max(0, Math.min(1, (pos.x - volSliderBounds.x) / volSliderBounds.w));
    setBgmVolume(relX);
    if (bgm) bgm.muted = false;
  }

  if (volHover || volNextHover || volSliderHover) {
    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'default';
  }
  if (gameState === 'playing') updateCharacterX(e.clientX);
});

canvas.addEventListener('mousedown', (e) => {
  const pos = getCanvasCoords(e.clientX, e.clientY);
  if (volPanelVisible && hitTest(pos.x, pos.y, volSliderBounds)) {
    volSliderDragging = true;
    const relX = Math.max(0, Math.min(1, (pos.x - volSliderBounds.x) / volSliderBounds.w));
    setBgmVolume(relX);
    if (bgm) bgm.muted = false;
    e.preventDefault();
  }
});

document.addEventListener('mouseup', () => {
  volSliderDragging = false;
});

// Helper: Â¿El punto (vx,vy) estÃ¡ dentro del rectÃ¡ngulo btn?
function hitTest(vx, vy, btn) {
  return vx >= btn.x && vx <= btn.x + btn.w && vy >= btn.y && vy <= btn.y + btn.h;
}

function handlePointerAction(clientX, clientY) {
  initAudio();
  const { x: vx, y: vy } = getCanvasCoords(clientX, clientY);

  // Volumen: next, toggle, slider
  // Siguiente pista (botón encima del icono)
  if (hitTest(vx, vy, volNextBounds)) {
    nextTrack();
    return;
  }
  // Si se hace click sobre el icono, alterna visibilidad del panel
  if (hitTest(vx, vy, volumeBounds)) {
    volPanelVisible = !volPanelVisible;
    return;
  }
  if (volPanelVisible && hitTest(vx, vy, volSliderBounds)) {
    const relX = Math.max(0, Math.min(1, (vx - volSliderBounds.x) / volSliderBounds.w));
    setBgmVolume(relX);
    if (bgm) bgm.muted = false;
    return;
  }
  // ===== MENÃš PRINCIPAL =====
  if (gameState === 'menu') {
    if (showScoreModal) {
      // Cerrar modal "My Score"
      if (hitTest(vx, vy, scoreModalCloseBtn)) {
        showScoreModal = false;
      }
      return;
    }
    if (hitTest(vx, vy, menuBtnBounds.gameStart)) {
      resetGame();
      startGame();
      return;
    }
    if (hitTest(vx, vy, menuBtnBounds.myScore)) {
      showScoreModal = true;
      return;
    }
    return;
  }

  // ===== CARTA DE AMOR (CORAZÓN MÃXIMO) =====
  if (showLoveLetterModal) {
    if (hitTest(vx, vy, loveLetterCloseBtnBounds)) {
      showLoveLetterModal = false;
    }
    return;
  }

  if (gameState === 'celebration') {
    return;
  }

  // ===== GAME OVER =====
  if (gameState === 'gameover') {
    if (hitTest(vx, vy, gameOverBtnBounds.playAgain)) {
      resetGame();
      startGame();
      return;
    }
    if (hitTest(vx, vy, gameOverBtnBounds.mainMenu)) {
      resetGame();
      gameState = 'menu';
      return;
    }
    return;
  }
}

canvas.addEventListener('click', (e) => {
  e.preventDefault();
  const pos = getCanvasCoords(e.clientX, e.clientY);
  // permitir interacción con controles de audio incluso en `playing`
  if (hitTest(pos.x, pos.y, volumeBounds) || hitTest(pos.x, pos.y, volNextBounds) || (volPanelVisible && hitTest(pos.x, pos.y, volSliderBounds))) {
    handlePointerAction(e.clientX, e.clientY);
    return;
  }
  if (gameState === 'menu' || gameState === 'gameover' || gameState === 'celebration' || showLoveLetterModal) {
    handlePointerAction(e.clientX, e.clientY);
    return;
  }
  if (gameState === 'playing') dropItem();
});

let touchSliderDrag = false;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  initAudio();
  const t = e.changedTouches[0];
  const pos = getCanvasCoords(t.clientX, t.clientY);
  if (volPanelVisible && hitTest(pos.x, pos.y, volSliderBounds)) {
    touchSliderDrag = true;
    const relX = Math.max(0, Math.min(1, (pos.x - volSliderBounds.x) / volSliderBounds.w));
    setBgmVolume(relX);
    if (bgm) bgm.muted = false;
    return;
  }
  if (hitTest(pos.x, pos.y, volumeBounds) || hitTest(pos.x, pos.y, volNextBounds) || (volPanelVisible && hitTest(pos.x, pos.y, volSliderBounds))) {
    handlePointerAction(t.clientX, t.clientY);
    return;
  }
  if (gameState === 'menu' || gameState === 'gameover' || gameState === 'celebration' || showLoveLetterModal) {
    handlePointerAction(t.clientX, t.clientY);
    return;
  }
  if (gameState === 'playing') updateCharacterX(t.clientX);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (touchSliderDrag) {
    const t = e.changedTouches[0];
    const pos = getCanvasCoords(t.clientX, t.clientY);
    const relX = Math.max(0, Math.min(1, (pos.x - volSliderBounds.x) / volSliderBounds.w));
    setBgmVolume(relX);
    if (bgm) bgm.muted = false;
    return;
  }
  if (gameState === 'playing') updateCharacterX(e.changedTouches[0].clientX);
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  if (touchSliderDrag) {
    touchSliderDrag = false;
    return;
  }
  if (gameState === 'playing') dropItem();
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    initAudio();
    if (showLoveLetterModal) {
      showLoveLetterModal = false;
      return;
    }
    if (gameState === 'celebration') {
      return;
    }
    if (gameState === 'menu' && !showScoreModal) {
      resetGame();
      startGame();
      return;
    }
    if (gameState === 'menu' && showScoreModal) {
      showScoreModal = false;
      return;
    }
    if (gameState === 'gameover') {
      resetGame();
      startGame();
      return;
    }
    if (gameState === 'playing') dropItem();
  }
  if (e.key === 'Escape') {
    if (showLoveLetterModal) {
      showLoveLetterModal = false;
      return;
    }
    if (gameState === 'celebration') {
      return;
    }
    if (showScoreModal) { showScoreModal = false; return; }
  }
  if (gameState === 'playing') {
    const step = 14;
    const radius = FOOD_SIZES[currentLevel > 0 ? currentLevel - 1 : 0] || 22;
    const minHandX = C_LEFT + radius + 2;
    const maxHandX = C_RIGHT - radius - 2;
    const currentHandX = characterX + HAND_OFFSET_X;

    if (e.key === 'ArrowLeft' || e.key === 'a') {
      const newHandX = Math.max(minHandX, currentHandX - step);
      characterX = newHandX - HAND_OFFSET_X;
    }
    if (e.key === 'ArrowRight' || e.key === 'd') {
      const newHandX = Math.min(maxHandX, currentHandX + step);
      characterX = newHandX - HAND_OFFSET_X;
    }
  }
});


// ============================================================
//  GAME LOOP
// ============================================================
function gameLoop() {
  Engine.update(engine, 16.67);
  processFusions();
  updateParticles();
  if (gameState === 'playing') checkGameOver();
  if (dropCooldown > 0) dropCooldown--;

  if (gameState === 'celebration') {
    celebrationTimer--;
    if (celebrationTimer % 30 === 0 && celebrationTimer > 60) spawnCelebrationConfetti();
    if (celebrationTimer <= 0) {
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('suikaFoodHighScore', highScore.toString());
      }
      if (!loveLetterShown) {
        showLoveLetterModal = true;
        loveLetterShown = true;
      }
      gameState = 'playing';
    }
  }

  render();
  requestAnimationFrame(gameLoop);
}

// ============================================================
//  INICIO / REINICIO
// ============================================================
function startGame() {
  gameState = 'playing';
  score = 0;
  heartAchieved = false;
  loveLetterShown = false;
  currentLevel = 0;
  nextLevel = 0;
  overflowStartTime = null;
  generateNextPair();
  characterX = (C_LEFT + C_RIGHT) / 2 - HAND_OFFSET_X;
  // Iniciar música de fondo (requiere interacción del usuario)
  try {
    initBgm();
    if (bgm) {
      bgm.muted = bgmMuted;
      bgm.volume = bgmVolume;
      bgm.play().catch(() => { /* autoplay bloqueado hasta interacción */ });
    }
  } catch (e) { console.warn('play bgm failed', e); }
}

function resetGame() {
  for (const body of [...foodBodies]) removeFoodFromWorld(body);
  foodBodies = [];
  pendingFusions = [];
  particles = [];
  confetti = [];
  celebrationTimer = 0;
  shakeAmount = 0;
  heartAchieved = false;
  loveLetterShown = false;
  dropCooldown = 0;
  overflowStartTime = null;
  // Save high score on reset if needed
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('suikaFoodHighScore', highScore.toString());
  }
  score = 0;
  currentLevel = 0;
  nextLevel = 0;
  characterX = (C_LEFT + C_RIGHT) / 2 - HAND_OFFSET_X;
  // Pausar BGM al reiniciar
  try { if (bgm) { bgm.pause(); bgm.currentTime = 0; } } catch (_) { }
}

// ============================================================
//  INIT
// ============================================================
gameState = 'menu';
showScoreModal = false;
gameLoop();



