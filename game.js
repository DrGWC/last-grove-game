(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const canvas = $('world');
  const ctx = canvas.getContext('2d', { alpha: false });
  const mapCanvas = $('minimap');
  const mapCtx = mapCanvas.getContext('2d');
  const SAVE_KEY = 'wuxiaSurvivorV2';
  const VILLAGE = { x: 0, y: 0, w: 1536, h: 1024 };
  const CAMP_SIZE = 1900;
  const TAU = Math.PI * 2;
  const ground = new Image(); ground.src = 'assets/art/forest-ground-v2.jpg';
  const villageArt = new Image(); villageArt.src = 'assets/art/wuxia-village.jpg';
  const heroSprite = new Image(); heroSprite.src = 'assets/art/jianghu-novice.png';
  const banditSprite = new Image(); banditSprite.src = 'assets/art/bandit-swordsman.png';
  const wolfSprite = new Image(); wolfSprite.src = 'assets/art/mountain-wolf.png';
  const wyrmSprite = new Image(); wyrmSprite.src = 'assets/art/crimson-wyrm.png';
  const villagerAtlas = new Image(); villagerAtlas.src = 'assets/art/village-folk.png';
  let groundPattern = null;
  let villageBlend = null;
  let w = 0, h = 0, dpr = 1, scale = 1, zoom = 1, viewW = 0, viewH = 0, cameraX = 0, cameraY = 0;
  let state = null, lastFrame = 0, raf = 0, toastTimer = 0, pointer = null, moveTarget = null;
  let joystick = { x: 0, y: 0, id: null, originX: 0, originY: 0 }, keys = Object.create(null), uiTimer = 0;
  const touchPoints = new Map(); let pinchStartDistance = 0, pinchStartZoom = 1;

  const moveSpecs = {
    woodStaff: { name: '粗木棍', icon: '🪵', kind: '入门兵器', style: 'melee', range: 72, damage: 5, cd: .82, desc: '最低级的短棍，贴近敌人后单体敲击。', color: '#c39a5c' },
    fist: { name: '赤手拳', icon: '✊', kind: '拳脚', style: 'melee', range: 82, damage: 10, cd: .7, desc: '短距离单体拳击，入门招式。', color: '#f1c78b' },
    ironSword: { name: '精钢长剑', icon: '🗡️', kind: '剑法', style: 'slash', range: 330, damage: 24, cd: 1.15, speed: 560, pierce: 1, desc: '迅捷剑气直取前方，可贯穿一名敌人。', color: '#d5e4db' },
    mountainSaber: { name: '断岳刀', icon: '刀', kind: '刀法', style: 'crescent', range: 390, damage: 37, cd: 1.65, speed: 410, pierce: 3, radius: 15, desc: '宽阔刀芒横扫一线，重创沿途敌人。', color: '#f0ad63' },
    cloudSpear: { name: '青云枪', icon: '枪', kind: '枪法', style: 'thrust', range: 370, damage: 29, cd: 1.3, speed: 700, pierce: 5, desc: '长枪劲气穿透一列敌人。', color: '#8cd8c7' },
    dogStaff: { name: '打狗棒', icon: '棍', kind: '棍法', style: 'orbit', range: 118, damage: 18, cd: .65, desc: '棒影环身，近身自动连打。', color: '#c9aa69' },
    ironFan: { name: '铁骨折扇', icon: '扇', kind: '暗器', style: 'fan', range: 290, damage: 16, cd: 1.05, speed: 440, count: 3, desc: '扇骨分射三路，扰乱前方群敌。', color: '#b8d9df' },
    oneYang: { name: '一阳指', icon: '☯', kind: '指法', style: 'beam', range: 520, damage: 41, cd: 1.9, pierce: 6, desc: '凝气成线，贯穿一条直线。', color: '#a7f0d5' },
    dragonPalm: { name: '降龙十八掌', icon: '🐉', kind: '掌法', style: 'palm', range: 350, damage: 31, cd: 1.45, speed: 350, count: 3, radius: 13, desc: '掌劲化作三道龙形气浪。', color: '#f5bf64' },
    rainNeedles: { name: '暴雨梨花针', icon: '针', kind: '暗器', style: 'volley', range: 310, damage: 12, cd: 1.25, speed: 650, count: 7, desc: '七枚细针扇形齐发，攻速迅疾。', color: '#d4e3c2' },
    heavenSword: { name: '倚天剑', icon: '⚔', kind: '剑法', style: 'orbit', range: 150, damage: 24, cd: .58, desc: '剑影环身，近者皆受锋芒。', color: '#c9eff0' },
    dragonBlade: { name: '屠龙刀·破军式', icon: '刀', kind: '刀法', style: 'crescent', range: 450, damage: 76, cd: 2.2, speed: 350, pierce: 6, radius: 24, desc: '沉重刀罡开山裂石，扫过大片敌阵。', color: '#ff9c56', rare: true },
    skyHalberd: { name: '方天画戟', icon: '戟', kind: '戟法', style: 'spin', range: 168, damage: 52, cd: 1.3, desc: '画戟旋舞，四周敌人无处可避。', color: '#e8c36f', rare: true },
    overlordSpear: { name: '霸王枪·贯日', icon: '枪', kind: '枪法', style: 'thrust', range: 520, damage: 59, cd: 1.35, speed: 800, pierce: 9, desc: '霸王枪劲贯穿长阵。', color: '#d3ddd1', rare: true },
    tenThousandSwords: { name: '万剑归宗', icon: '✦', kind: '剑诀', style: 'rain', range: 440, damage: 33, cd: 1.9, speed: 360, count: 5, pierce: 2, desc: '剑气自天而落，追击周围敌人。', color: '#bce8eb', rare: true },
    dragonPalmAwakened: { name: '亢龙有悔', icon: '🐉', kind: '掌法', style: 'palm', range: 420, damage: 44, cd: 1.6, speed: 390, count: 5, radius: 16, desc: '掌劲化出五道金龙，直破敌阵。', color: '#ffcc6f', rare: true, evolutionOnly: true }
  };
  for (const [id, spec] of Object.entries(moveSpecs)) spec.id = id;

  const enemySpecs = {
    bandit: { name: '拦路匪', hp: 34, damage: 8, speed: 72, radius: 15, xp: 10, coin: 2, color: '#9d6448', role: 'melee' },
    runner: { name: '疾行贼', hp: 24, damage: 9, speed: 132, radius: 12, xp: 11, coin: 2, color: '#c4804b', role: 'runner' },
    brute: { name: '山寨刀客', hp: 92, damage: 15, speed: 47, radius: 22, xp: 18, coin: 4, color: '#586a51', role: 'brute' },
    archer: { name: '伏林弓手', hp: 31, damage: 10, speed: 50, radius: 14, xp: 14, coin: 3, color: '#6d7890', role: 'ranged' },
    healer: { name: '邪派药师', hp: 42, damage: 6, speed: 43, radius: 15, xp: 18, coin: 4, color: '#aa718b', role: 'healer' },
    summoner: { name: '摄魂巫师', hp: 48, damage: 7, speed: 45, radius: 16, xp: 22, coin: 5, color: '#806a97', role: 'summoner' },
    wolf: { name: '山林恶狼', hp: 29, damage: 8, speed: 108, radius: 14, xp: 12, coin: 1, color: '#778572', role: 'runner', beast: true },
    chief: { name: '黑风寨主', hp: 430, damage: 20, speed: 54, radius: 30, xp: 100, coin: 35, color: '#49343a', role: 'boss', boss: true },
    dragon: { name: '赤鳞山蛟', hp: 920, damage: 25, speed: 46, radius: 43, xp: 180, coin: 80, color: '#50816a', role: 'dragon', boss: true, beast: true }
  };

  const passiveCards = [
    { id: 'innerQi', name: '吐纳心法', icon: '☯', desc: '内力上限 +12，恢复速度提高；与满级招式共鸣。', max: 5 },
    { id: 'ironQi', name: '剑气淬炼', icon: '🗡️', desc: '招式伤害 +1；剑法伤害再提高 8%，可与精钢长剑共鸣。', max: 5 },
    { id: 'body', name: '铁布衫', icon: '🥋', desc: '气血上限 +18，并立刻恢复 18 点。', max: 5 },
    { id: 'lightness', name: '轻功身法', icon: '〰', desc: '移动速度提高 9%，闪避冷却缩短。', max: 5 },
    { id: 'focus', name: '凝神诀', icon: '🎯', desc: '会心率提高 4%，招式伤害提高 3%。', max: 5 },
    { id: 'magnet', name: '纳气归元', icon: '🧲', desc: '拾取阅历的范围扩大。', max: 4 },
    { id: 'foxPet', name: '灵狐相伴', icon: '🦊', desc: '结识灵狐伙伴，自动扑击附近敌人。', max: 1 }
  ];

  const weatherTypes = [
    { id: 'clear', name: '晴', icon: '☀', tint: null },
    { id: 'rain', name: '细雨', icon: '☂', tint: 'rgba(82,129,157,.12)' },
    { id: 'mist', name: '薄雾', icon: '☁', tint: 'rgba(198,211,188,.12)' },
    { id: 'moon', name: '月明', icon: '☾', tint: 'rgba(93,131,180,.12)' }
  ];

  function freshState() {
    return {
      started: false, ended: false, draftOpen: false, bagOpen: false,
      elapsed: 0, wave: 1, kills: 0, gold: 25, savedVillagers: 0, xp: 0,
      hero: { x: 768, y: 330, level: 1, hp: 100, maxHp: 100, qi: 40, maxQi: 40, damage: 8, speed: 205, crit: .05, invuln: 0, attackCd: .35, attackAnim: 0, facingX: 1, facingY: 0, walking: false, walkTime: 0, dodgeCd: 0, dashTime: 0, vx: 0, vy: 0 },
      moves: [{ id: 'woodStaff', level: 1 }], activeMove: 0, passives: {},
      enemies: [], shots: [], orbs: [], effects: [], floats: [],
      villagers: [
        { id: 'tea', x: 449, y: 422, name: '茶摊掌柜', hp: 100, maxHp: 100, alive: true },
        { id: 'herbalist', x: 1100, y: 397, name: '采药姑娘', hp: 100, maxHp: 100, alive: true },
        { id: 'ferryman', x: 1240, y: 735, name: '摆渡人', hp: 100, maxHp: 100, alive: true }
      ],
      spawnTimer: 1.5, raidTimer: 72, raidWarning: false, nextBossAt: 145, lastRaidId: 0,
      campActive: new Set(), campCleared: new Set(), seed: Math.floor(Math.random() * 0xffffff),
      pet: null, petCd: 0, petX: 720, petY: 565, cameraShake: 0,
      drops: [], choiceCards: [], weather: 0, version: 2
    };
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
  function syncZoomLabel() { const label = $('zoomValue'); if (label) label.textContent = `${Math.round(zoom * 100)}%`; }
  function setZoom(next) { zoom = clamp(next, .65, 1.55); resize(); syncZoomLabel(); }
  function touchDistance() { const points = [...touchPoints.values()]; return points.length < 2 ? 0 : Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y); }
  function resetJoystick() { joystick.id = null; joystick.x = joystick.y = 0; const knob = $('stickKnob'); if (knob) knob.style.transform = ''; }
  function beginTouch(e, repositionStick) {
    touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touchPoints.size >= 2) {
      resetJoystick(); pinchStartDistance = touchDistance(); pinchStartZoom = zoom;
      $('touchStick').style.opacity = '0'; moveTarget = null; return;
    }
    joystick.id = e.pointerId; joystick.originX = e.clientX; joystick.originY = e.clientY; joystick.x = joystick.y = 0;
    if (repositionStick) { $('touchStick').style.left = `${clamp(e.clientX - 45, 8, w - 100)}px`; $('touchStick').style.top = `${clamp(e.clientY - 45, 70, h - 110)}px`; }
    $('touchStick').style.opacity = '1';
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function activeMove() { return state?.moves[state.activeMove] || state?.moves[0] || null; }
  function specFor(move = activeMove()) { return move ? moveSpecs[move.id] : null; }
  function setToast(text, seconds = 2.2) { const el = $('toast'); el.textContent = text; el.classList.add('show'); toastTimer = seconds; }
  function resize() {
    const r = canvas.getBoundingClientRect(); w = r.width; h = r.height;
    if (!w || !h) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    scale = clamp(Math.min(w / 1120, h / 760), .42, 1.25) * zoom;
    viewW = w / scale; viewH = h / scale;
    if (state) draw();
  }
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(canvas);

  function seedFor(x, y) { let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + state.seed; n = Math.imul(n ^ (n >>> 13), 1274126177); return (n ^ (n >>> 16)) >>> 0; }
  function rngFor(x, y) { let s = seedFor(x, y); return () => { s += 0x6d2b79f5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function getPattern() {
    if (groundPattern || !ground.complete || !ground.naturalWidth) return groundPattern;
    const tile = document.createElement('canvas'); tile.width = 1024; tile.height = 1024;
    const g = tile.getContext('2d');
    g.drawImage(ground, 0, 0, ground.naturalWidth, ground.naturalHeight, 0, 0, tile.width, tile.height);
    // Fade the image edges into one another so the wilderness can repeat without hard tile borders.
    const image = g.getImageData(0, 0, tile.width, tile.height), d = image.data, size = tile.width, seam = 62;
    for (let y = seam; y < size - seam; y++) for (let i = 0; i < seam; i++) {
      const t = i / (seam - 1), left = (y * size + i) * 4, right = (y * size + size - seam + i) * 4;
      for (let c = 0; c < 3; c++) { const avg = (d[left + c] + d[right + c]) / 2; d[left + c] = avg * (1 - t) + d[left + c] * t; d[right + c] = avg * (1 - t) + d[right + c] * t; }
    }
    for (let x = 0; x < size; x++) for (let i = 0; i < seam; i++) {
      const t = i / (seam - 1), top = (i * size + x) * 4, bottom = ((size - seam + i) * size + x) * 4;
      for (let c = 0; c < 3; c++) { const avg = (d[top + c] + d[bottom + c]) / 2; d[top + c] = avg * (1 - t) + d[top + c] * t; d[bottom + c] = avg * (1 - t) + d[bottom + c] * t; }
    }
    g.putImageData(image, 0, 0);
    // A larger supertile pushes the texture repeat beyond a normal screen view.
    const worldTiles = 2, worldTile = document.createElement('canvas');
    worldTile.width = worldTile.height = size * worldTiles;
    const t = worldTile.getContext('2d');
    for (let row = 0; row < worldTiles; row++) for (let col = 0; col < worldTiles; col++) {
      const cx = col * size + size / 2, cy = row * size + size / 2;
      t.save(); t.translate(cx, cy); t.scale(col % 2 ? -1 : 1, row % 2 ? -1 : 1);
      t.drawImage(tile, -size / 2, -size / 2, size, size); t.restore();
    }
    groundPattern = ctx.createPattern(worldTile, 'repeat');
    // Offset the motif boundaries away from the town/player spawn so the tile junction
    // never reads as a cross-shaped clearing in the center of the play space.
    if (groundPattern?.setTransform && typeof DOMMatrix !== 'undefined') {
      groundPattern.setTransform(new DOMMatrix().translate(-size / 2, -size / 2));
    }
    return groundPattern;
  }

  function getVillageBlend() {
    if (villageBlend || !villageArt.complete || !villageArt.naturalWidth) return villageBlend;
    const width = VILLAGE.w, height = VILLAGE.h, fadeX = 300, fadeY = 240;
    const art = document.createElement('canvas'); art.width = width; art.height = height;
    const a = art.getContext('2d'); a.drawImage(villageArt, 0, 0, width, height); a.globalCompositeOperation = 'destination-in';
    const horizontal = a.createLinearGradient(0, 0, width, 0);
    horizontal.addColorStop(0, 'transparent'); horizontal.addColorStop(fadeX / width, '#fff'); horizontal.addColorStop(1 - fadeX / width, '#fff'); horizontal.addColorStop(1, 'transparent');
    a.fillStyle = horizontal; a.fillRect(0, 0, width, height);
    const vertical = a.createLinearGradient(0, 0, 0, height);
    vertical.addColorStop(0, 'transparent'); vertical.addColorStop(fadeY / height, '#fff'); vertical.addColorStop(1 - fadeY / height, '#fff'); vertical.addColorStop(1, 'transparent');
    a.fillStyle = vertical; a.fillRect(0, 0, width, height); a.globalCompositeOperation = 'source-over';
    villageBlend = art; return villageBlend;
  }

  function startGame() {
    state = freshState(); state.started = true; cameraX = state.hero.x; cameraY = state.hero.y;
    $('startScreen').hidden = true; $('endScreen').hidden = true; $('levelModal').hidden = true; $('bagModal').hidden = true;
    keys = Object.create(null); moveTarget = null; lastFrame = performance.now(); resize(); refreshUI();
    setToast('招式会自行寻找目标。移动走位，靠近敌人拾取阅历。', 4.5);
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    raf = 0; if (!state?.started) return;
    const dt = Math.min(.04, Math.max(0, (now - lastFrame) / 1000)); lastFrame = now;
    if (!state.ended && !state.draftOpen) update(dt);
    else state.elapsedVisual = (state.elapsedVisual || 0) + dt;
    draw(); uiTimer -= dt; if (uiTimer <= 0) { refreshUI(); uiTimer = .12; }
    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('show'); }
    if (state.bagOpen) renderBag();
    raf = requestAnimationFrame(frame);
  }

  function update(dt) {
    const p = state.hero; state.elapsed += dt; state.wave = 1 + Math.floor(state.elapsed / 60);
    state.weather = Math.floor(state.elapsed / 85) % weatherTypes.length;
    p.invuln = Math.max(0, p.invuln - dt); p.attackCd = Math.max(0, p.attackCd - dt); p.attackAnim = Math.max(0, p.attackAnim - dt); p.dodgeCd = Math.max(0, p.dodgeCd - dt); p.dashTime = Math.max(0, p.dashTime - dt);
    p.qi = Math.min(p.maxQi, p.qi + dt * (.9 + (state.passives.innerQi || 0) * .25)); p.hp = Math.min(p.maxHp, p.hp + dt * .16);
    updateMovement(dt); updateSpawning(dt); updateEnemies(dt); updateAutoMove(dt); updateShots(dt); updateOrbs(dt); updatePet(dt); updateDrops(dt); updateEffects(dt); updateVillage(dt); updateCamps();
    if (state.elapsed >= state.nextBossAt) spawnBoss();
    if (p.hp <= 0) endRun();
    if (Math.floor(state.elapsed) !== Math.floor(state.elapsed - dt)) saveRun();
  }

  function updateMovement(dt) {
    const p = state.hero;
    let mx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joystick.x;
    let my = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + joystick.y;
    if (!mx && !my && moveTarget) { const dx = moveTarget.x - p.x, dy = moveTarget.y - p.y, d = Math.hypot(dx, dy); if (d < 10) moveTarget = null; else { mx = dx / d; my = dy / d; } }
    const len = Math.hypot(mx, my); p.walking = len > .08;
    if (p.walking) { mx /= Math.max(1, len); my /= Math.max(1, len); if (p.dashTime <= 0) { p.x += mx * p.speed * dt; p.y += my * p.speed * dt; } p.facingX = mx; p.facingY = my; p.walkTime += dt * (8 + p.speed * .014); }
    if (p.dashTime > 0) { p.x += p.vx * dt; p.y += p.vy * dt; if (Math.random() < .7) state.effects.push({ kind: 'afterimage', x: p.x, y: p.y, life: .24, max: .24 }); }
  }

  function dodge() {
    if (!state || state.ended || state.hero.dodgeCd > 0) return;
    const p = state.hero; let dx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joystick.x, dy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + joystick.y;
    if (Math.hypot(dx, dy) < .1) { dx = p.facingX; dy = p.facingY; }
    const l = Math.hypot(dx, dy) || 1, factor = 1 + (state.passives.lightness || 0) * .08;
    p.vx = dx / l * 690 * factor; p.vy = dy / l * 690 * factor; p.dashTime = .21; p.invuln = .34; p.dodgeCd = 1.15 / factor;
    state.effects.push({ kind: 'wind', x: p.x, y: p.y, life: .38, max: .38, color: '#b9e4cc' });
  }

  function updateSpawning(dt) {
    state.spawnTimer -= dt; if (state.spawnTimer > 0 || state.enemies.length > 115) return;
    const wave = state.wave, count = Math.min(6, 1 + Math.floor(wave / 2));
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU), d = rand(Math.max(viewW, viewH) * .48, Math.max(viewW, viewH) * .68);
      spawnEnemy(selectEnemy(wave), state.hero.x + Math.cos(a) * d, state.hero.y + Math.sin(a) * d);
    }
    state.spawnTimer = Math.max(.62, 2.25 - wave * .065) * rand(.78, 1.22);
  }

  function selectEnemy(wave) {
    const pool = ['bandit', 'bandit', 'wolf'];
    if (wave >= 2) pool.push('runner', 'runner');
    if (wave >= 3) pool.push('archer');
    if (wave >= 4) pool.push('brute', 'brute');
    if (wave >= 6) pool.push('healer');
    if (wave >= 8) pool.push('summoner');
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function spawnEnemy(type, x, y, extra = {}) {
    const s = enemySpecs[type]; if (!s) return null;
    const factor = 1 + Math.max(0, state.wave - 1) * .13;
    const e = { id: Math.random().toString(36).slice(2), type, name: s.name, x, y, hp: s.hp * factor, maxHp: s.hp * factor, damage: s.damage * (1 + (state.wave - 1) * .045), speed: s.speed * (1 + Math.min(12, state.wave) * .018), radius: s.radius, xp: s.xp, coin: s.coin, color: s.color, role: s.role, boss: !!s.boss, beast: !!s.beast, attackCd: rand(.3, 1.4), windup: 0, tell: 0, anim: rand(0, TAU), hurt: 0, facingX: -1, facingY: 0, target: extra.target || null, summonCd: rand(3, 7), healCd: 3.4, retreat: false, ...extra };
    state.enemies.push(e); return e;
  }

  function updateEnemies(dt) {
    const p = state.hero;
    for (const e of [...state.enemies]) {
      if (e.hp <= 0) continue;
      e.anim += dt * (e.role === 'runner' ? 11 : e.role === 'brute' ? 5 : 7); e.hurt = Math.max(0, e.hurt - dt); e.attackCd -= dt; e.attackPose = Math.max(0, (e.attackPose || 0) - dt * 2.7);
      const wasWindingUp = e.windup > 0;
      e.windup = Math.max(0, e.windup - dt); e.summonCd -= dt; e.healCd -= dt;
      let target = e.target ? state.villagers.find(v => v.id === e.target && v.alive) : null;
      if (!target || (Math.hypot(p.x - e.x, p.y - e.y) < 125 && !e.boss)) target = p;
      if (e.role === 'healer' && e.healCd <= 0) {
        const ally = state.enemies.filter(a => a.hp > 0 && a !== e && dist(a, e) < 190 && a.hp < a.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        if (ally) { ally.hp = Math.min(ally.maxHp, ally.hp + ally.maxHp * .22); state.effects.push({ kind: 'heal', x: ally.x, y: ally.y, life: .7, max: .7 }); }
        e.healCd = 5.5;
      }
      if (e.role === 'summoner' && e.summonCd <= 0 && state.enemies.length < 110) {
        spawnEnemy(Math.random() < .5 ? 'runner' : 'bandit', e.x + rand(-30, 30), e.y + rand(-30, 30));
        state.effects.push({ kind: 'summon', x: e.x, y: e.y, life: .65, max: .65 }); e.summonCd = 8;
      }
      const dx = target.x - e.x, dy = target.y - e.y, d = Math.hypot(dx, dy) || 1;
      e.facingX = dx / d; e.facingY = dy / d;
      if (wasWindingUp) {
        if (e.windup === 0 && !e.resolved) resolveEnemyAttack(e, target);
      } else if (e.role === 'ranged' || e.role === 'summoner') {
        const range = e.boss ? 420 : e.role === 'summoner' ? 355 : 300;
        if (d > range * .85) moveEnemy(e, dx, dy, d, dt);
        else if (d < 145 && target === p) moveEnemy(e, -dx, -dy, d, dt * .8);
        if (e.attackCd <= 0) { e.windup = e.boss ? .8 : e.role === 'summoner' ? .78 : .58; e.attackPose = 1; e.resolved = false; e.aimX = dx / d; e.aimY = dy / d; }
      } else {
        const reach = e.boss ? e.radius + 55 : e.radius + 27;
        if (d > reach) moveEnemy(e, dx, dy, d, dt);
        if (d <= reach && e.attackCd <= 0) { e.windup = e.role === 'runner' ? .32 : e.boss ? .65 : .42; e.attackPose = 1; e.resolved = false; e.aimX = dx / d; e.aimY = dy / d; }
      }
      if (e.windup === 0 && e.attackCd <= 0 && e.resolved) e.attackCd = e.boss ? 1.55 : e.role === 'runner' ? 1.2 : 1.5;
    }
    state.enemies = state.enemies.filter(e => e.hp > 0);
    // Gentle separation prevents a stack of enemies from hiding their telegraphs.
    for (let i = 0; i < state.enemies.length; i++) for (let j = i + 1; j < state.enemies.length; j++) {
      const a = state.enemies[i], b = state.enemies[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, min = (a.radius + b.radius) * .72;
      if (d < min) { const push = (min - d) * .035; a.x -= dx / d * push; a.y -= dy / d * push; b.x += dx / d * push; b.y += dy / d * push; }
    }
  }

  function moveEnemy(e, dx, dy, distance, dt) { e.x += dx / distance * e.speed * dt; e.y += dy / distance * e.speed * dt; }
  function resolveEnemyAttack(e, target) {
    e.resolved = true; e.attackCd = e.boss ? 1.55 : 1.48;
    if (e.role === 'ranged' || e.role === 'summoner' || e.role === 'dragon') {
      const style = e.role === 'dragon' ? 'dragonfire' : e.role === 'summoner' ? 'soulFlame' : 'arrow';
      const color = e.role === 'dragon' ? '#ed7045' : e.role === 'summoner' ? '#c179e8' : '#dfb875';
      const spread = e.role === 'dragon' ? [-.22, 0, .22] : [0];
      for (const offset of spread) {
        const angle = Math.atan2(e.aimY, e.aimX) + offset, speed = e.role === 'dragon' ? 240 : e.role === 'summoner' ? 225 : 330;
        state.shots.push({ side: 'enemy', x: e.x + e.aimX * 22, y: e.y + e.aimY * 22, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.8, r: e.boss ? 12 : e.role === 'summoner' ? 10 : 7, damage: e.role === 'dragon' ? e.damage * .62 : e.damage, style, color, hit: new Set() });
      }
      state.effects.push({ kind: 'weapon', style: e.role === 'dragon' ? 'enemyDragonBreath' : e.role === 'summoner' ? 'enemyRuneCast' : 'enemyBowRelease', x: e.x, y: e.y, angle: Math.atan2(e.aimY, e.aimX), life: .23, max: .23, color });
    } else if (e.target && target !== state.hero) {
      target.hp = Math.max(0, target.hp - e.damage); if (!target.hp) { target.alive = false; setToast(`${target.name}受伤倒地！清除附近强盗可以救下村民。`); }
    } else if (dist(e, state.hero) < e.radius + 48 && state.hero.invuln <= 0) hurtHero(e.damage);
  }

  function updateAutoMove(dt) {
    const move = activeMove(); if (!move) return;
    const spec = moveSpecs[move.id], p = state.hero, rank = move.level || 1;
    p.attackCd -= dt; if (p.attackCd > 0) return;
    const range = spec.range * (1 + (state.passives.focus || 0) * .025) + (rank - 1) * 10;
    const target = nearestEnemy(range);
    if (!target) { p.attackCd = .12; return; }
    const dx = target.x - p.x, dy = target.y - p.y, d = Math.hypot(dx, dy) || 1;
    p.facingX = dx / d; p.facingY = dy / d; p.attackAnim = .28; p.attackCd = Math.max(.2, spec.cd * (1 - (rank - 1) * .055) * (1 - (state.passives.focus || 0) * .035));
    fireMove(spec, rank, target);
  }

  function fireMove(spec, rank, target) {
    const p = state.hero, angle = Math.atan2(target.y - p.y, target.x - p.x), swordQi = ['ironSword', 'tenThousandSwords'].includes(spec.id) ? (state.passives.ironQi || 0) * .08 : 0, power = (p.damage + spec.damage * (1 + (rank - 1) * .22)) * (1 + (state.passives.focus || 0) * .03 + swordQi), crit = Math.random() < p.crit;
    const damage = Math.round(power * (crit ? 1.85 : 1));
    if (crit) state.cameraShake = Math.max(state.cameraShake, 1.7);
    const impact = (enemy, mult = 1) => { spawnImpact(enemy, spec.id === 'woodStaff' ? 'woodStaff' : spec.style, angle, spec.color, crit); damageEnemy(enemy, damage * mult, crit); };
    const style = spec.style;
    if (style === 'melee' || style === 'orbit' || style === 'spin') {
      const radius = style === 'melee' ? spec.range * (1 + (state.passives.focus || 0) * .025) + (rank - 1) * 10 : style === 'spin' ? spec.range : spec.range * .8;
      const targets = enemiesInArc(p, target, radius, style === 'spin' ? -1 : .45, style === 'melee' ? 1 : 4);
      for (const enemy of targets) impact(enemy, style === 'melee' ? 1 : .72);
      state.effects.push({ kind: 'weapon', style: style === 'melee' ? (spec.id === 'woodStaff' ? 'woodStaff' : 'fist') : style === 'spin' ? 'halberd' : spec.id === 'heavenSword' ? 'swordOrbit' : 'staffOrbit', x: p.x, y: p.y, angle, life: .34, max: .34, color: spec.color, radius });
    } else if (style === 'beam') {
      const targets = lineTargets(p, angle, spec.range, 27).slice(0, spec.pierce + rank);
      for (const enemy of targets) impact(enemy, 1.12);
      state.effects.push({ kind: 'weapon', style: 'fingerBeam', x: p.x, y: p.y, angle, length: spec.range, life: .34, max: .34, color: spec.color });
    } else if (style === 'slash') {
      launch(spec, angle, target, damage * 1.06, rank, { radius: 8, pierce: spec.pierce + rank - 1, speed: spec.speed, style: 'swordQi', crit });
      state.effects.push({ kind: 'weapon', style: 'swordDraw', x: p.x, y: p.y, angle, life: .28, max: .28, color: spec.color });
    } else if (style === 'thrust') {
      launch(spec, angle, target, damage, rank, { count: 1, radius: 7, pierce: spec.pierce + rank - 1, speed: spec.speed, style: 'spear' });
      state.effects.push({ kind: 'weapon', style: 'spearThrust', x: p.x, y: p.y, angle, life: .27, max: .27, color: spec.color });
    } else if (style === 'fan' || style === 'palm' || style === 'volley') {
      const count = (spec.count || 3) + (rank >= 4 ? 2 : 0), spread = style === 'volley' ? .72 : style === 'palm' ? .42 : .62;
      for (let i = 0; i < count; i++) { const a = angle + (count === 1 ? 0 : (i / (count - 1) - .5) * spread); launch(spec, a, target, damage * (style === 'volley' ? .66 : 1), rank, { count: 1, radius: style === 'volley' ? 4 : 11, pierce: style === 'palm' ? 1 : 0, speed: spec.speed, style: style === 'volley' ? 'needle' : style === 'fan' ? 'fan' : 'palm', crit }); }
      state.effects.push({ kind: 'weapon', style: style === 'fan' ? 'fanCast' : style === 'palm' ? 'dragonPalm' : 'needleFan', x: p.x, y: p.y, angle, life: style === 'palm' ? .42 : .24, max: style === 'palm' ? .42 : .24, color: spec.color, count });
    } else if (style === 'crescent') {
      launch(spec, angle, target, damage * 1.25, rank, { count: 1, radius: spec.radius || 17, pierce: spec.pierce || 2, speed: spec.speed, style: 'crescent', crit });
      state.effects.push({ kind: 'weapon', style: spec.id === 'dragonBlade' ? 'dragonBlade' : 'saberArc', x: p.x, y: p.y, angle, life: .38, max: .38, color: spec.color, radius: 106 });
    } else if (style === 'rain') {
      const targets = state.enemies.filter(e => dist(e, p) < spec.range + e.radius).sort((a, b) => dist(a, p) - dist(b, p)).slice(0, spec.count);
      for (const enemy of targets) { launch(spec, Math.atan2(enemy.y - p.y, enemy.x - p.x), enemy, damage, rank, { radius: 10, pierce: 2, speed: spec.speed, style: 'swordfall', crit }); }
      state.effects.push({ kind: 'weapon', style: 'swordRain', x: p.x, y: p.y, angle, life: .46, max: .46, color: spec.color, count: targets.length });
    }
    if (crit) state.effects.push({ kind: 'critical', x: target.x, y: target.y, life: .3, max: .3, color: '#ffe180' });
  }

  function enemiesInArc(p, focus, radius, arcDot, limit) {
    const fdx = focus.x - p.x, fdy = focus.y - p.y, fl = Math.hypot(fdx, fdy) || 1;
    return state.enemies.filter(e => dist(e, p) <= radius + e.radius && ((e.x - p.x) * fdx + (e.y - p.y) * fdy) / ((dist(e, p) || 1) * fl) >= arcDot).sort((a, b) => dist(a, p) - dist(b, p)).slice(0, limit);
  }
  function lineTargets(p, angle, length, width) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    return state.enemies.filter(e => { const x = e.x - p.x, y = e.y - p.y, along = x * dx + y * dy, side = Math.abs(x * dy - y * dx); return along > 0 && along < length && side < width + e.radius; }).sort((a, b) => dist(a, p) - dist(b, p));
  }
  function launch(spec, angle, target, damage, rank, opts = {}) {
    const speed = opts.speed || spec.speed || 380;
    state.shots.push({ side: 'hero', weapon: spec.style, weaponId: spec.id, x: state.hero.x + Math.cos(angle) * 21, y: state.hero.y + Math.sin(angle) * 14, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: Math.min(1.65, spec.range / speed + .15), r: opts.radius || 9, damage, pierce: opts.pierce || 0, hit: new Set(), style: opts.style || spec.style, color: spec.color, targetId: target.id, homing: opts.style === 'swordfall' ? .8 : .08, crit: !!opts.crit });
  }

  function updateShots(dt) {
    for (const s of state.shots) {
      s.life -= dt;
      if (s.homing && s.side === 'hero') { const t = state.enemies.find(e => e.id === s.targetId && e.hp > 0); if (t) { const d = dist(s, t) || 1, nx = (t.x - s.x) / d, ny = (t.y - s.y) / d, speed = Math.hypot(s.vx, s.vy); s.vx = s.vx * (1 - s.homing * dt) + nx * speed * s.homing * dt; s.vy = s.vy * (1 - s.homing * dt) + ny * speed * s.homing * dt; } }
      s.px = s.x; s.py = s.y; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.side === 'hero') {
        for (const e of state.enemies) if (!s.hit.has(e.id) && Math.hypot(e.x - s.x, e.y - s.y) < e.radius + s.r) {
          s.hit.add(e.id); spawnImpact(e, s.style, Math.atan2(s.vy, s.vx), s.color, s.crit); damageEnemy(e, s.damage, s.crit); for (let i = 0; i < (s.style === 'needle' ? 2 : 5); i++) spark(e.x, e.y - 12, s.color); if (s.pierce > 0) s.pierce--; else { s.life = 0; break; }
        }
      } else if (Math.hypot(state.hero.x - s.x, state.hero.y - s.y) < 20 + s.r && state.hero.invuln <= 0) {
        hurtHero(s.damage); state.effects.push({ kind: 'impact', style: s.style === 'dragonfire' ? 'dragonBurn' : s.style === 'soulFlame' ? 'soulHit' : 'arrowHit', x: state.hero.x, y: state.hero.y - 18, angle: Math.atan2(s.vy, s.vx), life: .28, max: .28, color: s.color }); s.life = 0;
      }
    }
    state.shots = state.shots.filter(s => s.life > 0);
  }

  function hurtHero(amount) { const p = state.hero; if (p.invuln > 0) return; const defense = (state.passives.body || 0) * .035; p.hp = Math.max(0, p.hp - amount * (1 - defense)); p.invuln = .62; state.effects.push({ kind: 'hit', x: p.x, y: p.y, life: .25, max: .25 }); hitFlash = .16; }
  let hitFlash = 0;
  function damageEnemy(e, amount, crit = false) {
    if (!e || e.hp <= 0) return;
    e.hp -= amount; e.hurt = .11; damageFloat(e, amount, crit); if (crit) state.cameraShake = Math.max(state.cameraShake, e.boss ? 3.2 : 1.7);
    if (e.hp <= 0) defeatEnemy(e);
  }
  function spawnImpact(enemy, style, angle, color, crit = false) {
    const impactStyle = style === 'woodStaff' ? 'woodHit' : style === 'palm' ? 'palmBurst' : style === 'crescent' || style === 'swordQi' ? 'bladeClash' : style === 'needle' ? 'needleHit' : style === 'swordfall' ? 'swordImpact' : style === 'fan' ? 'fanHit' : style === 'spear' ? 'spearHit' : style === 'beam' ? 'fingerHit' : 'fistHit';
    state.effects.push({ kind: 'impact', style: impactStyle, x: enemy.x, y: enemy.y - 15, angle, life: crit ? .48 : .34, max: crit ? .48 : .34, color: crit ? '#fff0a6' : color, radius: enemy.radius + (crit ? 15 : 8), crit });
  }
  function defeatEnemy(e) {
    e.hp = 0; state.kills++; const n = e.boss ? 8 : Math.random() < .2 ? 2 : 1;
    for (let i = 0; i < n; i++) state.orbs.push({ x: e.x + rand(-12, 12), y: e.y + rand(-10, 10), value: e.boss ? 13 : Math.floor(rand(7, 12)), r: e.boss ? 6 : 4, bob: rand(0, TAU) });
    state.drops.push({ type: 'coin', x: e.x + rand(-10, 10), y: e.y + rand(-10, 10), value: e.coin });
    for (let i = 0; i < 12; i++) spark(e.x, e.y - 10, e.boss ? '#ffd174' : '#e9cb85');
    if (e.boss) {
      state.gold += e.coin; state.drops.push({ type: 'manual', x: e.x, y: e.y - 15, value: e.type === 'dragon' ? 'tenThousandSwords' : null });
      state.event = `${e.name}已败，秘籍与珍宝散落四周`; state.eventUntil = state.elapsed + 5; setToast(`击败${e.name}！拾取战利品。`, 3);
      if (e.campKey) state.campCleared.add(e.campKey);
    }
    if (e.target && state.villagers.some(v => v.id === e.target && v.alive)) {
      state.savedVillagers++; state.gold += 8; state.event = '护村成功！百姓送来些许盘缠。'; state.eventUntil = state.elapsed + 4;
    }
    if (Math.random() < (e.boss ? .45 : .035)) state.drops.push({ type: 'manual', x: e.x + 10, y: e.y + 5, value: null });
  }

  function updateOrbs(dt) {
    const p = state.hero, magnet = 78 + (state.passives.magnet || 0) * 76;
    for (const o of state.orbs) { o.bob += dt * 4; const d = dist(o, p); if (d < magnet && d > 2) { const speed = 240 + (magnet - d) * 1.4; o.x += (p.x - o.x) / d * speed * dt; o.y += (p.y - o.y) / d * speed * dt; } if (d < 26) { state.xp = (state.xp || 0) + o.value; o.got = true; checkLevel(); } }
    state.orbs = state.orbs.filter(o => !o.got);
  }

  function checkLevel() {
    const need = xpNeed(); if (state.xp < need || state.draftOpen) return;
    state.xp -= need; state.hero.level = (state.hero.level || 1) + 1; openDraft();
  }
  function xpNeed() { const level = state.hero.level || 1; return Math.round(25 + level * 11 + Math.pow(level, 1.25) * 1.6); }
  function availableCards() {
    const out = [];
    for (const [id, spec] of Object.entries(moveSpecs)) {
      const found = state.moves.find(m => m.id === id);
      if (found && found.level < 5) out.push({ id: `up:${id}`, title: `${spec.name} · 精进`, icon: spec.icon, desc: `招式威力与攻击频率提高。当前第 ${found.level} 重。`, type: 'upgrade', rarity: found.level >= 4 ? '精进' : '武学', level: found.level });
      else if (!found && !spec.evolutionOnly && state.moves.length < 4 && (!spec.rare || state.wave >= 3)) out.push({ id, title: spec.name, icon: spec.icon, desc: spec.desc, type: 'move', rarity: spec.rare ? '绝世神兵' : spec.kind });
    }
    for (const card of passiveCards) { const level = state.passives[card.id] || 0; if (level < card.max) out.push({ ...card, title: card.name, type: 'passive', rarity: card.id === 'foxPet' ? '奇遇' : '心法', level }); }
    const eligibleEvolutions = [
      ['ironSword', 'ironQi', '万剑归宗'], ['mountainSaber', 'innerQi', '屠龙刀·破军式'], ['dragonPalm', 'innerQi', '亢龙有悔'], ['cloudSpear', 'innerQi', '霸王枪·贯日']
    ];
    for (const [base, passive, title] of eligibleEvolutions) { const m = state.moves.find(x => x.id === base); if (m?.level >= 5 && state.passives[passive]) out.push({ id: `evo:${base}`, title, icon: '✦', desc: `第 5 重招式与对应心法相融，蜕变为绝技。`, type: 'evolution', rarity: '武学共鸣' }); }
    return out;
  }
  function openDraft() {
    const pool = availableCards(), picked = [];
    while (picked.length < 3 && pool.length) { const i = Math.floor(Math.random() * pool.length); picked.push(pool.splice(i, 1)[0]); }
    if (!picked.length) picked.push({ id: 'body', title: '铁布衫', icon: '🥋', desc: '气血上限 +18。', type: 'passive', rarity: '心法', level: 0 });
    state.choiceCards = picked; state.draftOpen = true; $('choiceLevel').textContent = state.hero.level || 2;
    $('choiceCards').innerHTML = picked.map((c, i) => `<button class="choice-card" data-index="${i}"><span class="card-top"><span class="card-icon">${c.icon}</span><small class="rarity">${c.rarity}</small></span><b>${c.title}</b><p>${c.desc}</p>${c.type === 'move' ? '<span class="new-tag">新招式 · 可按 1–4 切换</span>' : c.level ? `<span class="new-tag">当前第 ${c.level} 重</span>` : ''}</button>`).join('');
    $('levelModal').hidden = false; $('choiceCards').querySelectorAll('button').forEach(button => button.addEventListener('click', () => takeCard(Number(button.dataset.index))));
  }
  function takeCard(index) {
    const card = state.choiceCards[index]; if (!card) return;
    if (card.type === 'move') state.moves.push({ id: card.id, level: 1 });
    if (card.type === 'upgrade') { const id = card.id.slice(3), move = state.moves.find(m => m.id === id); if (move) move.level = Math.min(5, move.level + 1); }
    if (card.type === 'passive') {
      state.passives[card.id] = (state.passives[card.id] || 0) + 1;
      if (card.id === 'body') { state.hero.maxHp += 18; state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + 18); }
      if (card.id === 'innerQi') { state.hero.maxQi += 12; state.hero.qi += 12; }
      if (card.id === 'ironQi') state.hero.damage += 1;
      if (card.id === 'lightness') state.hero.speed *= 1.09;
      if (card.id === 'focus') { state.hero.crit = Math.min(.55, state.hero.crit + .04); state.hero.damage += 1; }
      if (card.id === 'foxPet' && !state.pet) { state.pet = 'fox'; state.petX = state.hero.x - 26; state.petY = state.hero.y + 28; }
    }
    if (card.type === 'evolution') { const base = card.id.slice(4), move = state.moves.find(m => m.id === base), next = { ironSword: 'tenThousandSwords', mountainSaber: 'dragonBlade', dragonPalm: 'dragonPalmAwakened', cloudSpear: 'overlordSpear' }[base]; if (move && next) { move.id = next; move.level = 1; } }
    if (state.moves.length && state.moves.length === 2 && state.activeMove === 0) state.activeMove = 1;
    state.draftOpen = false; state.choiceCards = []; $('levelModal').hidden = true; refreshUI(); saveRun();
  }

  function nearestEnemy(range = Infinity) { return state.enemies.filter(e => e.hp > 0).map(e => [e, dist(e, state.hero)]).filter(([_, d]) => d <= range).sort((a, b) => a[1] - b[1])[0]?.[0] || null; }
  function damageFloat(enemy, amount, crit) {
    const existing = state.floats.find(f => f.targetId === enemy.id && f.life > f.max * .76);
    if (existing) { existing.value += Math.round(amount); existing.crit ||= crit; existing.text = `${existing.crit ? '会心 ' : ''}${existing.value}`; existing.color = existing.crit ? '#ffe18b' : '#fff0d2'; existing.life = Math.min(existing.max, existing.life + .04); }
    else { const value = Math.round(amount), isCrit = !!crit, max = isCrit ? .78 : .68; state.floats.push({ targetId: enemy.id, x: enemy.x, y: enemy.y - enemy.radius, value, text: `${isCrit ? '会心 ' : ''}${value}`, color: isCrit ? '#ffe18b' : '#fff0d2', crit: isCrit, life: max, max }); }
    if (state.floats.length > 55) state.floats.shift();
  }
  function spark(x, y, color) { state.effects.push({ kind: 'spark', x: x + rand(-8, 8), y: y + rand(-8, 5), vx: rand(-70, 70), vy: rand(-85, 45), life: rand(.18, .38), max: .38, color, size: rand(2, 5) }); }
  function updateEffects(dt) { for (const e of state.effects) { e.life -= dt; e.x += (e.vx || 0) * dt; e.y += (e.vy || 0) * dt; } state.effects = state.effects.filter(e => e.life > 0); if (state.effects.length > 360) state.effects.splice(0, state.effects.length - 360); for (const f of state.floats) { f.y -= 20 * dt; f.life -= dt; } state.floats = state.floats.filter(f => f.life > 0); state.cameraShake = Math.max(0, state.cameraShake - dt * 8); hitFlash = Math.max(0, hitFlash - dt); }

  function updatePet(dt) {
    if (!state.pet) return;
    const p = state.hero; state.petCd -= dt; const dx = p.x - state.petX, dy = p.y - state.petY, d = Math.hypot(dx, dy) || 1;
    if (d > 54) { state.petX += dx / d * 240 * dt; state.petY += dy / d * 240 * dt; }
    const target = nearestEnemy(260);
    if (target && state.petCd <= 0) { state.petCd = 1.8; const a = Math.atan2(target.y - state.petY, target.x - state.petX); state.shots.push({ side: 'hero', x: state.petX, y: state.petY - 10, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: .8, r: 8, damage: 12 + (state.hero.level || 1) * 2, pierce: 0, hit: new Set(), style: 'paw', color: '#efcc7d' }); }
  }

  function updateVillage(dt) {
    state.raidTimer -= dt;
    const alive = state.villagers.filter(v => v.alive);
    if (!state.raidWarning && state.raidTimer <= 12 && alive.length) {
      state.raidWarning = true;
      state.event = '镇南有山贼集结！安平镇即将遇袭'; state.eventUntil = state.elapsed + 7;
      setToast('镇南发现山贼踪迹！赶回安平镇支援（M 查看地图）。', 4.5);
    }
    if (state.raidTimer <= 0) {
      state.lastRaidId++; state.raidTimer = 102; state.raidWarning = false; const villageX = VILLAGE.x + VILLAGE.w / 2, villageY = VILLAGE.y + VILLAGE.h / 2;
      if (alive.length) {
        const count = Math.min(5, 2 + Math.floor(state.wave / 3));
        for (let i = 0; i < count; i++) { const villager = alive[i % alive.length]; const e = spawnEnemy(i === count - 1 && state.wave >= 4 ? 'brute' : 'bandit', villageX + rand(-100, 100), villageY + 530 + rand(-25, 65), { target: villager.id, raidId: state.lastRaidId }); if (e) e.speed *= .9; }
        state.event = '安平镇遇袭！镇南山贼正逼近百姓'; state.eventUntil = state.elapsed + 9;
        if (Math.hypot(state.hero.x - villageX, state.hero.y - villageY) < 1500) setToast('安平镇遇袭！镇南山贼正逼近百姓（M 查看地图回防）。', 4.5);
      }
    }
    for (const v of state.villagers) if (!v.alive && Math.random() < dt * .004) { v.alive = true; v.hp = 50; }
  }

  function spawnBoss() {
    const p = state.hero, a = rand(0, TAU), d = Math.max(viewW, viewH) * .62, useDragon = state.wave >= 7 && Math.random() < .42;
    const e = spawnEnemy(useDragon ? 'dragon' : 'chief', p.x + Math.cos(a) * d, p.y + Math.sin(a) * d);
    if (e) { e.hp *= 1.8; e.maxHp = e.hp; state.event = `${e.name}现身江湖！`; state.eventUntil = state.elapsed + 8; setToast(`${e.name}现身！留意地面红色蓄势范围。`, 4); }
    state.nextBossAt += 180;
  }

  function campData(cx, cy) {
    const rnd = rngFor(cx, cy); if (rnd() > .14) return null;
    const x = cx * CAMP_SIZE + CAMP_SIZE * (.24 + rnd() * .52), y = cy * CAMP_SIZE + CAMP_SIZE * (.24 + rnd() * .52), key = `${cx},${cy}`;
    return { x, y, key, seed: seedFor(cx, cy) };
  }
  function updateCamps() {
    const cx = Math.floor(state.hero.x / CAMP_SIZE), cy = Math.floor(state.hero.y / CAMP_SIZE);
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
      const camp = campData(x, y); if (!camp || state.campActive.has(camp.key) || state.campCleared.has(camp.key) || Math.hypot(camp.x - state.hero.x, camp.y - state.hero.y) > 275) continue;
      state.campActive.add(camp.key); const chief = spawnEnemy('chief', camp.x, camp.y, { campKey: camp.key }); chief.hp *= .72; chief.maxHp = chief.hp;
      for (let i = 0; i < 4; i++) spawnEnemy(i === 3 ? 'archer' : 'bandit', camp.x + rand(-110, 110), camp.y + rand(-110, 110));
      state.event = '你闯入了一处山寨据点'; state.eventUntil = state.elapsed + 6; setToast('山寨头目与守卫冲出营寨！', 3);
    }
  }

  function updateDrops(dt) {
    for (const d of state.drops) { d.bob = (d.bob || 0) + dt * 4; if (dist(d, state.hero) < 34) {
      if (d.type === 'coin') { state.gold += d.value; d.got = true; }
      if (d.type === 'manual') { d.got = true; openDraft(); setToast('拾得秘籍！从三项武学中择一领悟。', 3); }
    } }
    state.drops = state.drops.filter(d => !d.got);
  }

  function saveRun() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, bestKills: Math.max(state.kills, Number(localStorage.getItem(SAVE_KEY + ':best') || 0)), gold: state.gold, seed: state.seed, moves: state.moves, passives: state.passives, wave: state.wave, kills: state.kills })); } catch (_) { /* Private mode may block local storage. */ }
  }
  function endRun() {
    state.ended = true; $('endTitle').textContent = '暂别江湖'; $('endMessage').textContent = `你闯过 ${state.wave} 重，击败 ${state.kills} 名强敌，坚持 ${formatTime(state.elapsed)}。江湖仍在，整装后可再出发。`;
    $('endScreen').hidden = false; saveRun();
  }

  function refreshUI() {
    if (!state) return;
    const p = state.hero, move = activeMove(), spec = specFor(move), alive = state.villagers.filter(v => v.alive).length, weather = weatherTypes[state.weather];
    $('regionName').textContent = regionName(p.x, p.y); $('goldText').textContent = state.gold;
    $('timeText').textContent = formatTime(state.elapsed); $('levelText').textContent = `${realmName(p.level || 1)} · ${p.level || 1}`; $('killText').textContent = state.kills;
    $('weatherText').textContent = weather.name; $('weatherIcon').textContent = weather.icon;
    $('hpText').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`; $('hpBar').style.width = `${clamp(p.hp / p.maxHp * 100, 0, 100)}%`;
    $('qiText').textContent = `${Math.floor(p.qi)} / ${p.maxQi}`; $('qiBar').style.width = `${clamp(p.qi / p.maxQi * 100, 0, 100)}%`;
    $('xpText').textContent = `${Math.floor(state.xp || 0)} / ${xpNeed()}`; $('xpBar').style.width = `${clamp((state.xp || 0) / xpNeed() * 100, 0, 100)}%`;
    $('damageText').textContent = p.damage; $('critText').textContent = Math.round(p.crit * 100); $('speedText').textContent = Math.round(p.speed); $('villagerText').textContent = `${alive}/3`;
    $('weaponName').textContent = spec?.name || '赤手空拳'; $('moveHint').textContent = state.raidWarning ? '安平镇即将遇袭 · 往镇南回防' : state.enemies.length ? `附近 ${state.enemies.length} 名敌人 · ${weather.name}` : '走位避招，收集散落阅历';
    $('skillSlots').innerHTML = Array.from({ length: 4 }, (_, i) => {
      const m = state.moves[i], s = m ? moveSpecs[m.id] : null;
      return `<button class="skill-slot ${i === state.activeMove ? 'active' : ''} ${s ? '' : 'empty'}" ${s ? `data-slot="${i}"` : 'disabled'}><kbd>${i + 1}</kbd><span class="slot-icon">${s?.icon || '·'}</span><b>${s?.name || '空位'}</b><small>${s ? `${s.kind} · ${i === state.activeMove ? '当前施展' : '已习得'}` : '升级可习得'}</small>${m ? `<span class="level-tag">${m.level}重</span>` : ''}</button>`;
    }).join('');
    $('skillSlots').querySelectorAll('[data-slot]').forEach(b => b.addEventListener('click', () => switchMove(Number(b.dataset.slot))));
    const boss = state.enemies.find(e => e.boss && dist(e, p) < Math.max(viewW, viewH) * .78);
    $('bossBar').hidden = !boss;
    if (boss) { $('bossName').textContent = boss.name; $('bossHpText').textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${Math.ceil(boss.maxHp)}`; $('bossHpBar').style.width = `${clamp(boss.hp / boss.maxHp * 100, 0, 100)}%`; }
    $('eventRibbon').hidden = !state.event || state.eventUntil < state.elapsed; $('eventText').textContent = state.event || '';
    if (!$('mapModal').hidden) drawMap();
  }
  function regionName(x, y) { const r = Math.hypot(x - 768, y - 512); return r < 750 ? '安平镇' : r < 2400 ? '青竹林' : r < 5200 ? '黑风岭' : '群山深处'; }
  function realmName(lvl) { return lvl < 3 ? '初入江湖' : lvl < 7 ? '三流武者' : lvl < 12 ? '二流高手' : lvl < 20 ? '一流高手' : '绝世宗师'; }
  function formatTime(n) { return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`; }
  function switchMove(i) { if (state.moves[i]) { state.activeMove = i; refreshUI(); setToast(`切换招式：${moveSpecs[state.moves[i].id].name}`, 1); } }

  function renderBag() {
    if (!state) return;
    $('bagSkills').innerHTML = state.moves.map((m, i) => { const s = moveSpecs[m.id]; return `<div class="bag-item"><i>${s.icon}</i><div><b>${s.name} · 第 ${m.level} 重</b><small>${s.desc}${i === state.activeMove ? ' · 当前施展' : ' · 已习得'}</small></div></div>`; }).join('') || '<small>尚无武学</small>';
    const list = passiveCards.filter(c => state.passives[c.id]);
    $('bagWeapons').innerHTML = list.map(c => `<div class="bag-item"><i>${c.icon}</i><div><b>${c.name} · 第 ${state.passives[c.id]} 重</b><small>${c.desc}</small></div></div>`).join('') + `<div class="bag-item"><i>◈</i><div><b>碎银 ${state.gold}</b><small>用于江湖拾遗与后续补给</small></div></div>`;
  }
  function toggleBag(force) { if (!state || !state.started || state.ended) return; state.bagOpen = typeof force === 'boolean' ? force : !state.bagOpen; $('bagModal').hidden = !state.bagOpen; if (state.bagOpen) renderBag(); }

  function draw() {
    if (!w || !h) return;
    if (!state) state = freshState();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#17251c'; ctx.fillRect(0, 0, w, h);
    const p = state.hero; cameraX += (p.x - cameraX) * .14; cameraY += (p.y - cameraY) * .14;
    const kick = state.cameraShake || 0, shakeX = Math.sin(state.elapsed * 83) * kick, shakeY = Math.cos(state.elapsed * 67) * kick;
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (w / 2 - (cameraX - shakeX) * scale), dpr * (h / 2 - (cameraY - shakeY) * scale));
    drawGround(); drawLandmarks(); drawCamps(); drawVillage(); drawWeather();
    for (const o of state.orbs) drawOrb(o); for (const d of state.drops) drawDrop(d);
    const actors = state.enemies.filter(e => e.hp > 0).map(e => ({ y: e.y, type: 'enemy', ref: e })); actors.push({ y: p.y, type: 'hero', ref: p }); if (state.pet) actors.push({ y: state.petY, type: 'pet', ref: state });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) { if (a.type === 'enemy') drawEnemy(a.ref); else if (a.type === 'hero') drawHero(a.ref); else drawPet(a.ref); }
    drawShots(); drawEffects(); drawFloats(); drawTelegraphs();
    const weather = weatherTypes[state.weather]; if (weather.tint) { ctx.fillStyle = weather.tint; ctx.fillRect(cameraX - viewW / 2, cameraY - viewH / 2, viewW, viewH); }
    const vignette = ctx.createRadialGradient(cameraX, cameraY, Math.min(viewW, viewH) * .3, cameraX, cameraY, Math.max(viewW, viewH) * .65); vignette.addColorStop(0, '#060a0800'); vignette.addColorStop(1, '#060a0830'); ctx.fillStyle = vignette; ctx.fillRect(cameraX - viewW / 2, cameraY - viewH / 2, viewW, viewH);
    if (hitFlash > 0) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(185,55,38,${hitFlash * .34})`; ctx.fillRect(0, 0, w, h); }
  }

  function drawGround() {
    const pattern = getPattern(), left = cameraX - viewW / 2 - 100, top = cameraY - viewH / 2 - 100;
    ctx.fillStyle = '#58603a'; ctx.fillRect(left, top, viewW + 200, viewH + 200);
    if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(left, top, viewW + 200, viewH + 200); }
    else { ctx.fillStyle = '#656340'; ctx.fillRect(left, top, viewW + 200, viewH + 200); }
    // Add repeatable clearings, shrine stones and tree silhouettes around the textured floor.
    const cx1 = Math.floor(left / 900), cx2 = Math.floor((left + viewW + 200) / 900), cy1 = Math.floor(top / 900), cy2 = Math.floor((top + viewH + 200) / 900);
    for (let cx = cx1; cx <= cx2; cx++) for (let cy = cy1; cy <= cy2; cy++) {
      if (Math.hypot(cx * 900 + 450 - 768, cy * 900 + 450 - 512) < 1060) continue;
      const rnd = rngFor(cx, cy), count = 3 + Math.floor(rnd() * 5);
      for (let i = 0; i < count; i++) { const x = cx * 900 + 60 + rnd() * 780, y = cy * 900 + 70 + rnd() * 760, type = rnd(); if (type < .42) drawWorldTree(x, y, 17 + rnd() * 12, rnd()); else if (type < .72) drawWorldRock(x, y, 9 + rnd() * 10); else drawWorldShrub(x, y, 10 + rnd() * 8); }
    }
    const village = getVillageBlend(); if (village) ctx.drawImage(village, VILLAGE.x, VILLAGE.y, VILLAGE.w, VILLAGE.h);
  }
  function drawWorldTree(x, y, r, seed) {
    ctx.fillStyle = '#12191165'; ctx.beginPath(); ctx.ellipse(x, y + 8, r * 1.6, r * .7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#58422b'; ctx.fillRect(x - r * .16, y - 3, r * .32, r * .9);
    const colors = ['#31523b', '#3d6341', '#486943', '#556f47'];
    for (const [dx, dy, rr] of [[-r * .55, -r * .42, r * .62], [r * .16, -r * .77, r * .82], [r * .67, -r * .32, r * .56]]) { ctx.fillStyle = colors[Math.floor(seed * 10 + rr) % colors.length]; ctx.beginPath(); ctx.arc(x + dx, y + dy, rr, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#c0ca83'; ctx.globalAlpha = .45; ctx.beginPath(); ctx.arc(x - r * .22, y - r * .85, 3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  function drawWorldRock(x, y, r) { ctx.fillStyle = '#333c30'; ctx.beginPath(); ctx.ellipse(x, y + 4, r * 1.3, r * .62, -.14, 0, TAU); ctx.fill(); ctx.fillStyle = '#777962'; ctx.beginPath(); ctx.ellipse(x, y, r, r * .65, -.13, 0, TAU); ctx.fill(); ctx.fillStyle = '#c0b68c60'; ctx.beginPath(); ctx.ellipse(x - r * .25, y - r * .15, r * .35, r * .17, -.4, 0, TAU); ctx.fill(); }
  function drawWorldShrub(x, y, r) { ctx.fillStyle = '#42603a'; for (let i = -1; i < 2; i++) { ctx.beginPath(); ctx.arc(x + i * r * .56, y + Math.abs(i) * 2, r * .58, 0, TAU); ctx.fill(); } ctx.fillStyle = '#a8b36b'; ctx.fillRect(x - 2, y - r * .3, 3, 2); }

  function drawVillage() {
    if (Math.abs(state.hero.x - (VILLAGE.x + 768)) > viewW / 2 + 900 || Math.abs(state.hero.y - (VILLAGE.y + 512)) > viewH / 2 + 700) return;
    for (const v of state.villagers) {
      if (!v.alive) { ctx.fillStyle = '#604b35'; ctx.fillRect(v.x - 9, v.y, 18, 5); continue; }
      const bob = Math.sin(state.elapsed * 2 + v.x) * 1.2;
      ctx.fillStyle = 'rgba(24, 20, 14, .23)'; ctx.beginPath(); ctx.ellipse(v.x, v.y + 2, 10, 3.5, 0, 0, TAU); ctx.fill();
      if (villagerAtlas.complete && villagerAtlas.naturalWidth) {
        const atlasW = villagerAtlas.naturalWidth / 3, atlasH = villagerAtlas.naturalHeight;
        const column = v.id === 'tea' ? 0 : v.id === 'herbalist' ? 1 : 2;
        ctx.drawImage(villagerAtlas, column * atlasW, 0, atlasW, atlasH, v.x - 19, v.y - 54 + bob, 38, 57);
      } else {
        ctx.fillStyle = v.id === 'herbalist' ? '#7d5c74' : v.id === 'tea' ? '#95503c' : '#546f5e'; ctx.fillRect(v.x - 10, v.y - 28 + bob, 20, 19);
        ctx.fillStyle = '#d5aa7d'; ctx.fillRect(v.x - 8, v.y - 42 + bob, 16, 15); ctx.fillStyle = '#3a3028'; ctx.fillRect(v.x - 10, v.y - 45 + bob, 20, 6);
        ctx.fillStyle = '#2c2622'; ctx.fillRect(v.x - 4, v.y - 35 + bob, 2, 2); ctx.fillRect(v.x + 3, v.y - 35 + bob, 2, 2);
        ctx.fillStyle = '#43372b'; ctx.fillRect(v.x - 8, v.y - 9, 6, 11); ctx.fillRect(v.x + 2, v.y - 9, 6, 11);
      }
      if (v.hp < v.maxHp) { ctx.fillStyle = '#191512'; ctx.fillRect(v.x - 18, v.y - 52, 36, 4); ctx.fillStyle = '#d36b59'; ctx.fillRect(v.x - 17, v.y - 51, 34 * v.hp / v.maxHp, 2); }
    }
  }
  function drawLandmarks() {
    const distTown = Math.hypot(state.hero.x - 768, state.hero.y - 512);
    if (distTown < 1450) { ctx.save(); ctx.strokeStyle = '#dfc27a66'; ctx.lineWidth = 2; ctx.setLineDash([9, 9]); ctx.beginPath(); ctx.ellipse(768, 512, 90, 35, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.font = 'bold 14px Noto Sans SC'; ctx.textAlign = 'center'; ctx.fillStyle = '#f1dfb7b8'; ctx.shadowColor = '#241b13'; ctx.shadowBlur = 5; ctx.fillText('安平镇', 768, 428); ctx.restore(); }
  }
  function drawCamps() {
    const cx = Math.floor(state.hero.x / CAMP_SIZE), cy = Math.floor(state.hero.y / CAMP_SIZE);
    for (let x = cx - 2; x <= cx + 2; x++) for (let y = cy - 2; y <= cy + 2; y++) {
      const camp = campData(x, y); if (!camp || state.campCleared.has(camp.key)) continue;
      ctx.save(); ctx.strokeStyle = '#b0794a88'; ctx.lineWidth = 3; ctx.setLineDash([8, 8]); ctx.beginPath(); ctx.ellipse(camp.x, camp.y, 112, 62, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#5c3929'; ctx.beginPath(); ctx.moveTo(camp.x - 28, camp.y); ctx.lineTo(camp.x, camp.y - 43); ctx.lineTo(camp.x + 29, camp.y); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#d5b36c'; ctx.fillRect(camp.x - 3, camp.y - 52, 6, 22); ctx.fillStyle = '#a54135'; ctx.beginPath(); ctx.moveTo(camp.x + 3, camp.y - 50); ctx.lineTo(camp.x + 23, camp.y - 45); ctx.lineTo(camp.x + 3, camp.y - 39); ctx.fill();
      ctx.fillStyle = '#efdfb7'; ctx.font = 'bold 11px Noto Sans SC'; ctx.textAlign = 'center'; ctx.fillText(state.campActive.has(camp.key) ? '山寨据点' : '山贼营地', camp.x, camp.y + 22); ctx.restore();
    }
  }

  function drawHero(p) {
    const bob = p.walking ? Math.abs(Math.sin(p.walkTime)) * 3 : Math.sin(state.elapsed * 2.1) * 1;
    ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y + bob)); ctx.scale(1.08, 1.08);
    ctx.fillStyle = 'rgba(18, 16, 13, .34)'; ctx.beginPath(); ctx.ellipse(0, 4, 18, 5.5, 0, 0, TAU); ctx.fill();
    if (p.invuln > 0 && Math.floor(state.elapsed * 18) % 2) ctx.globalAlpha = .45;
    const active = specFor();
    if (heroSprite.complete && heroSprite.naturalWidth) {
      if (p.facingX < -.15) ctx.scale(-1, 1);
      if (p.walking) ctx.rotate(Math.sin(p.walkTime) * .018);
      ctx.drawImage(heroSprite, -32, -74, 64, 75);
      if (active && active.id !== 'fist' && active.style !== 'palm' && active.style !== 'beam' && active.style !== 'rain') drawHeldWeapon(active.id, p.attackAnim, p.facingX, p.facingY);
      if (p.attackAnim > 0 && active?.style === 'melee') {
        ctx.save(); ctx.translate(p.facingX * 16, p.facingY * 12 - 17); ctx.rotate(Math.atan2(p.facingY, p.facingX)); ctx.strokeStyle = '#f6d9a4'; ctx.globalAlpha = .7; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(2, -7 + i * 6); ctx.lineTo(18 + i * 2, -7 + i * 6); ctx.stroke(); } ctx.restore();
      }
      ctx.restore(); return;
    }
    const swing = p.walking ? Math.sin(p.walkTime) * 3 : 0;
    // Road-worn novice: patched cotton robe, cloth belt and bare feet, with readable stitching at gameplay size.
    const cloth = state.passives.body ? '#71815a' : '#75674e';
    pixel(-11, -42, 22, 18, '#342b22'); pixel(-9, -40, 18, 15, '#d7aa7e');
    pixel(-12, -43, 24, 5, '#2b2823'); pixel(-4, -48, 8, 8, '#302a23'); pixel(-2, -46, 4, 4, '#7e5239');
    pixel(-9, -39, 18, 3, '#bd906a'); pixel(-6, -34, 2, 2, '#29231d'); pixel(4, -34, 2, 2, '#29231d'); pixel(-3, -28, 6, 2, '#8c5746');
    pixel(-14, -26, 28, 24, '#372e25'); pixel(-12, -24, 24, 20, cloth); pixel(-15, -22, 5, 14, '#493e30'); pixel(10, -22, 5, 14, '#493e30');
    pixel(-14, -21, 7, 11, cloth); pixel(8, -21, 7, 11, cloth); pixel(-12, -20, 3, 8, '#c7b38b'); pixel(10, -20, 3, 8, '#c7b38b');
    pixel(-7, -23, 7, 19, '#bca578'); pixel(0, -22, 4, 18, '#d5c39a'); pixel(-3, -24, 7, 5, '#e2d1aa'); pixel(-12, -7, 24, 4, '#42382b');
    pixel(-10, -5, 20, 2, '#bea66f'); pixel(-2, -6, 5, 5, '#d6bc78'); pixel(3, -1, 3, 7, '#bca578');
    for (let i = 0; i < 3; i++) pixel(-8 + i * 6, -16 + i * 3, 2, 2, '#d2bd88');
    pixel(-9 + swing, -3, 7, 9, '#493b2d'); pixel(2 - swing, -3, 7, 9, '#493b2d'); pixel(-8 + swing, 5, 6, 3, '#d5aa7e'); pixel(3 - swing, 5, 6, 3, '#d5aa7e');
    if (active && active.id !== 'fist' && active.style !== 'palm' && active.style !== 'beam' && active.style !== 'rain') drawHeldWeapon(active.id, p.attackAnim, p.facingX, p.facingY);
    else {
      pixel(-18, -17, 6, 6, '#d7aa7e');
      ctx.save(); ctx.translate(2, -19); ctx.rotate(Math.atan2(p.facingY, p.facingX)); const reach = p.attackAnim > 0 ? 17 : 10;
      pixel(-3, -2, reach, 5, cloth); pixel(reach - 1, -3, 8, 7, '#d7aa7e');
      if (active?.style === 'palm' && p.attackAnim > 0) { pixel(reach + 3, -4, 9, 2, '#d7aa7e'); pixel(reach + 5, -1, 9, 2, '#d7aa7e'); }
      if (active?.style === 'beam' && p.attackAnim > 0) { pixel(reach + 2, -2, 9, 2, '#d7aa7e'); pixel(reach + 4, -4, 9, 2, '#d7aa7e'); }
      ctx.restore();
    }
    if (p.attackAnim > 0 && active?.style === 'melee') {
      ctx.save(); ctx.translate(p.facingX * 16, p.facingY * 12 - 17); ctx.rotate(Math.atan2(p.facingY, p.facingX)); ctx.strokeStyle = '#f6d9a4'; ctx.globalAlpha = .7; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(2, -7 + i * 6); ctx.lineTo(18 + i * 2, -7 + i * 6); ctx.stroke(); } ctx.restore();
    }
    ctx.restore();
  }
  function drawHeldWeapon(id, anim, facingX = 1, facingY = 0) {
    const aim = Math.atan2(facingY, facingX);
    ctx.save(); ctx.translate(18 + facingX * 3, -24 + facingY * 5 - (anim > 0 ? 3 : 0)); ctx.rotate(aim + Math.PI / 2); if (anim > 0) ctx.rotate(-.2);
    if (id.includes('Spear') || id.includes('spear') || id === 'overlordSpear') { ctx.rotate(-.45); pixel(-2, -28, 4, 40, '#765337'); pixel(-5, -37, 10, 13, '#d0d6c0'); pixel(-2, -46, 4, 12, '#ece8d2'); }
    else if (id.toLowerCase().includes('saber') || id.includes('Blade')) { ctx.rotate(-.6); pixel(-2, -4, 5, 8, '#725034'); pixel(-1, -25, 5, 22, id.includes('dragon') ? '#d98350' : '#d2d5cc'); pixel(-6, -7, 13, 3, '#c5a65c'); }
    else if (id.toLowerCase().includes('staff')) { ctx.rotate(-.3); pixel(-2, -27, 4, 32, '#8a6742'); pixel(-4, -31, 8, 6, '#dbbe75'); }
    else if (id.toLowerCase().includes('fan')) { ctx.rotate(-.6); pixel(-3, -5, 6, 10, '#745438'); for (let i = -2; i <= 2; i++) pixel(i * 3, -24 + Math.abs(i) * 2, 2, 20, '#d8d2ba'); }
    else if (id === 'skyHalberd') { ctx.rotate(-.45); pixel(-2, -26, 4, 35, '#87613c'); pixel(-10, -35, 19, 7, '#d7be79'); pixel(7, -40, 7, 12, '#d7be79'); }
    else if (id === 'rainNeedles') { ctx.rotate(-.55); for (let i = -1; i < 2; i++) pixel(i * 5, -20 + Math.abs(i) * 3, 2, 21, '#e4e6cb'); }
    else if (id === 'oneYang') { ctx.fillStyle = '#b3e5cf'; ctx.shadowBlur = 8; ctx.shadowColor = '#9ae7d0'; ctx.beginPath(); ctx.arc(0, -13, 6, 0, TAU); ctx.fill(); }
    else { ctx.rotate(-.6); pixel(-2, -4, 5, 8, '#765238'); pixel(-1, -24, 4, 20, '#d8ddd4'); pixel(-6, -7, 13, 3, '#c2a15d'); }
    ctx.restore();
  }
  function drawEnemy(e) {
    if (e.role === 'dragon') { drawDragon(e); return; }
    if (e.beast && wolfSprite.complete && wolfSprite.naturalWidth) { drawSpriteEnemy(e, wolfSprite, 72, 48, true); return; }
    if (['bandit', 'runner', 'brute'].includes(e.type) && banditSprite.complete && banditSprite.naturalWidth) {
      const size = e.type === 'brute' ? 1.18 : e.type === 'runner' ? .88 : 1;
      drawSpriteEnemy(e, banditSprite, 48 * size, 62 * size, false); return;
    }
    const bob = Math.sin(e.anim) * (e.boss ? 2 : 1.5), size = e.radius / 15, gait = Math.sin(e.anim), lunge = (e.attackPose || 0) * e.radius * .14;
    ctx.save(); ctx.translate(e.x + e.facingX * lunge, e.y + bob + e.facingY * lunge); if (e.beast) ctx.rotate(Math.atan2(e.facingY, e.facingX)); else ctx.rotate(Math.sin(e.anim * .5) * .025 + e.facingY * .035); ctx.fillStyle = '#0d130e9c'; ctx.beginPath(); ctx.ellipse(0, 3, e.radius * 1.1, e.radius * .4, 0, 0, TAU); ctx.fill();
    if (e.hurt > 0) ctx.filter = 'brightness(1.8)';
    if (e.beast) {
      // Four independently stepping paws and a swaying tail keep the wild beasts from sliding like tokens.
      ctx.strokeStyle = e.color; ctx.lineWidth = 5 * size; ctx.lineCap = 'round';
      for (const [side, phase] of [[-1, 0], [1, Math.PI], [-.55, Math.PI], [.55, 0]]) { const lift = Math.max(0, Math.sin(e.anim + phase)) * 4 * size; ctx.beginPath(); ctx.moveTo(side * 8 * size, -8 * size); ctx.lineTo(side * 10 * size, 1 + lift); ctx.stroke(); }
      ctx.strokeStyle = e.color; ctx.lineWidth = 4 * size; ctx.beginPath(); ctx.moveTo(-e.radius * .72, -12); ctx.quadraticCurveTo(-e.radius * 1.1, -23 + Math.sin(e.anim * .7) * 5, -e.radius * 1.28, -11 + Math.sin(e.anim) * 6); ctx.stroke();
      ctx.fillStyle = e.color; ctx.beginPath(); ctx.ellipse(0, -11, e.radius * 1.05, e.radius * .62, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(12, -15, e.radius * .45, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-8, -23); ctx.lineTo(-13, -35); ctx.lineTo(-1, -26); ctx.moveTo(9, -23); ctx.lineTo(15, -34); ctx.lineTo(15, -22); ctx.fill();
      ctx.fillStyle = '#f3db8f'; ctx.fillRect(15, -18, 3, 3); ctx.fillStyle = '#24201c'; ctx.fillRect(-11, -4, 6, 8); ctx.fillRect(7, -4, 6, 8);
    } else {
      const step = gait * 2.5 * size, prep = e.attackPose || 0;
      // Short cloth tails and layered robe panels give each bandit a readable silhouette in motion.
      ctx.fillStyle = e.role === 'runner' ? '#7a4938' : e.role === 'brute' ? '#333f32' : '#3a3333';
      ctx.beginPath(); ctx.moveTo(-e.radius * .55, -25 * size); ctx.lineTo(-e.radius * .85, -8 * size + gait * 3); ctx.lineTo(-e.radius * .15, -13 * size); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#403327'; ctx.fillRect(-7 * size + step, -5 * size, 6 * size, 10 * size); ctx.fillRect(2 * size - step, -5 * size, 6 * size, 10 * size);
      ctx.fillStyle = '#312b27'; ctx.fillRect(-8 * size + step, 3 * size, 7 * size, 3 * size); ctx.fillRect(1 * size - step, 3 * size, 7 * size, 3 * size);
      ctx.fillStyle = e.color; ctx.fillRect(-e.radius * .75, -27 * size, e.radius * 1.5, 22 * size); ctx.fillRect(-e.radius, -24 * size + gait * 1.4, 5 * size, 16 * size); ctx.fillRect(e.radius * .65, -24 * size - gait * 1.4, 5 * size, 16 * size);
      ctx.fillStyle = '#d4ba85'; ctx.fillRect(-3 * size, -25 * size, 6 * size, 19 * size); ctx.fillStyle = '#564534'; ctx.fillRect(-e.radius * .75, -9 * size, e.radius * 1.5, 3 * size);
      if (e.role === 'brute') { ctx.fillStyle = '#92927a'; ctx.fillRect(-e.radius * .72, -25 * size, 5 * size, 13 * size); ctx.fillRect(e.radius * .4, -26 * size, 5 * size, 14 * size); }
      if (e.role === 'healer') { ctx.fillStyle = '#b4d179'; ctx.fillRect(-e.radius * .7, -26 * size, 4 * size, 12 * size); ctx.fillRect(e.radius * .35, -25 * size, 4 * size, 12 * size); }
      ctx.fillStyle = '#d2a47d'; ctx.fillRect(-8 * size, -41 * size, 16 * size, 16 * size); ctx.fillStyle = e.role === 'runner' ? '#5b3c33' : e.role === 'summoner' ? '#654b7d' : '#332f29'; ctx.fillRect(-10 * size, -44 * size, 20 * size, 5 * size);
      ctx.fillStyle = '#e8d27e'; ctx.fillRect(-5 * size, -35 * size, 2 * size, 2 * size); ctx.fillRect(4 * size, -35 * size, 2 * size, 2 * size);
      // The raised weapon winds back before a strike and follows the enemy's current aim direction.
      ctx.save(); ctx.translate(e.facingX * e.radius * .72, -19 * size); ctx.rotate(Math.atan2(e.facingY, e.facingX) - Math.PI / 2 - prep * .34);
      if (e.role === 'ranged') {
        ctx.strokeStyle = '#a88750'; ctx.lineWidth = 2.2 * size; ctx.beginPath(); ctx.moveTo(0, -12 * size); ctx.quadraticCurveTo(-8 * size, 0, 0, 12 * size); ctx.stroke(); ctx.strokeStyle = '#e8d7aa'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -11 * size); ctx.lineTo(0, 11 * size); ctx.stroke();
      } else if (e.role === 'summoner') {
        ctx.strokeStyle = '#795a42'; ctx.lineWidth = 3 * size; ctx.beginPath(); ctx.moveTo(0, -13 * size); ctx.lineTo(0, 12 * size); ctx.stroke(); ctx.fillStyle = '#c27be8'; ctx.shadowColor = '#c27be8'; ctx.shadowBlur = 7; ctx.beginPath(); ctx.arc(0, -15 * size, 4 * size, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = e.role === 'brute' ? '#8f8065' : '#765338'; ctx.fillRect(-2 * size, -2, 4 * size, 17 * size); ctx.fillStyle = '#d1b96e'; ctx.beginPath(); ctx.moveTo(-3 * size, -5 * size); ctx.lineTo(0, -12 * size); ctx.lineTo(3 * size, -5 * size); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    ctx.filter = 'none'; ctx.restore();
    drawEnemyHealth(e);
  }
  function drawSpriteEnemy(e, sprite, width, height, rotateToAim) {
    const gait = Math.sin(e.anim), prep = e.attackPose || 0;
    const lunge = prep * e.radius * .14;
    ctx.save(); ctx.translate(e.x + e.facingX * lunge, e.y + Math.sin(e.anim * 1.15) * (e.boss ? 2.6 : 1.7) + e.facingY * lunge);
    ctx.fillStyle = 'rgba(22, 19, 14, .28)'; ctx.beginPath(); ctx.ellipse(0, 3, width * .27, Math.max(3, width * .075), 0, 0, TAU); ctx.fill();
    if (e.hurt > 0) ctx.filter = 'brightness(1.65) saturate(1.2)';
    if (rotateToAim) ctx.rotate(Math.atan2(e.facingY, e.facingX) + gait * .035 + prep * .12);
    else { if (e.facingX < 0) ctx.scale(-1, 1); ctx.rotate(Math.sin(e.anim * .55) * .026 + e.facingY * .06 + prep * .15); }
    const bounce = Math.max(0, gait) * (rotateToAim ? 3.2 : 1.8), stride = Math.sin(e.anim * .5) * (rotateToAim ? 1.4 : .8);
    ctx.drawImage(sprite, -width / 2 + stride, -height + 5 - bounce, width, height + bounce);
    if (prep > .35 && !rotateToAim) {
      const swing = clamp((prep - .35) / .65, 0, 1);
      ctx.save(); ctx.translate(width * .23, -height * .61); ctx.rotate(-.8 + swing * .7);
      ctx.strokeStyle = `rgba(255, 213, 145, ${swing * .68})`; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, width * .36, -.78, .42); ctx.stroke();
      ctx.strokeStyle = `rgba(224, 138, 88, ${swing * .42})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, width * .31, -.75, .34); ctx.stroke(); ctx.restore();
    }
    ctx.filter = 'none'; ctx.restore(); drawEnemyHealth(e);
  }
  function drawEnemyHealth(e) {
    if (e.hp < e.maxHp || dist(e, state.hero) < 210 || e.boss) {
      const bw = e.boss ? 78 : 31; ctx.fillStyle = '#121510'; ctx.fillRect(e.x - bw / 2, e.y - e.radius - 10, bw, 4);
      ctx.fillStyle = e.boss ? '#db8a5b' : '#d36d59'; ctx.fillRect(e.x - bw / 2 + 1, e.y - e.radius - 9, (bw - 2) * clamp(e.hp / e.maxHp, 0, 1), 2);
    }
  }
  function drawDragon(e) {
    if (wyrmSprite.complete && wyrmSprite.naturalWidth) {
      const bob = Math.sin(e.anim * .7) * 2.5, lunge = (e.attackPose || 0) * 5;
      ctx.save(); ctx.translate(e.x + e.facingX * lunge, e.y + bob + e.facingY * lunge);
      ctx.fillStyle = '#17150f88'; ctx.beginPath(); ctx.ellipse(0, 8, e.radius * 1.4, e.radius * .42, 0, 0, TAU); ctx.fill();
      if (e.hurt > 0) ctx.filter = 'brightness(1.5) saturate(1.15)';
      ctx.rotate(Math.atan2(e.facingY, e.facingX) + Math.sin(e.anim * .45) * .018);
      ctx.drawImage(wyrmSprite, -e.radius * 2.05, -e.radius * 1.02 + bob, e.radius * 4.1, e.radius * 2.05);
      ctx.filter = 'none'; ctx.restore(); drawEnemyHealth(e); return;
    }
    const bob = Math.sin(e.anim * .7) * 4; ctx.save(); ctx.translate(e.x + e.facingX * (e.attackPose || 0) * 5, e.y + bob + e.facingY * (e.attackPose || 0) * 5); ctx.rotate(Math.atan2(e.facingY, e.facingX));
    ctx.fillStyle = '#111510aa'; ctx.beginPath(); ctx.ellipse(0, 6, 76, 18, 0, 0, TAU); ctx.fill();
    ctx.lineCap = 'round'; ctx.strokeStyle = '#315d48'; ctx.lineWidth = 25; ctx.beginPath(); ctx.moveTo(-6, -13); ctx.bezierCurveTo(-62, -52, -97, -2, -67, 27); ctx.bezierCurveTo(-30, 51, 24, 39, 21, 3); ctx.stroke(); ctx.strokeStyle = e.hurt > 0 ? '#f4e4ae' : '#6ea47a'; ctx.lineWidth = 15; ctx.stroke();
    for (const [x, y] of [[-42,-23],[-69,-1],[-49,28],[-16,38],[8,20]]) { ctx.fillStyle = '#b6ca8c'; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x, y - 12); ctx.lineTo(x + 5, y); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#75a67b'; ctx.beginPath(); ctx.ellipse(32, -17, 28, 20, -.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#d9c17a'; ctx.beginPath(); ctx.moveTo(17, -31); ctx.lineTo(13, -48); ctx.lineTo(27, -31); ctx.moveTo(40, -32); ctx.lineTo(48, -48); ctx.lineTo(49, -28); ctx.fill(); ctx.fillStyle = '#f1d173'; ctx.fillRect(37, -22, 4, 4); ctx.restore(); drawEnemyHealth(e);
  }
  function drawPet() { ctx.fillStyle = '#171a11aa'; ctx.beginPath(); ctx.ellipse(state.petX, state.petY + 2, 15, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#bd784a'; ctx.beginPath(); ctx.ellipse(state.petX, state.petY - 10, 13, 9, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(state.petX + 6, state.petY - 16); ctx.lineTo(state.petX + 18, state.petY - 23); ctx.lineTo(state.petX + 12, state.petY - 11); ctx.fill(); ctx.fillStyle = '#ead9b3'; ctx.fillRect(state.petX - 2, state.petY - 12, 12, 5); }
  function drawShots() {
    for (const s of state.shots) {
      const a = Math.min(1, s.life * 3.5), speed = Math.hypot(s.vx, s.vy) || 1;
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx)); ctx.globalAlpha = a;
      ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = s.side === 'hero' ? 9 : 6; ctx.shadowColor = s.color;
      const trail = s.style === 'palm' ? 43 : s.style === 'swordfall' || s.style === 'crescent' ? 37 : s.style === 'needle' ? 30 : 23;
      const tail = ctx.createLinearGradient(-trail, 0, s.r * 2, 0); tail.addColorStop(0, 'rgba(255,255,255,0)'); tail.addColorStop(.45, s.color + '66'); tail.addColorStop(1, '#fff8df');
      ctx.strokeStyle = tail; ctx.lineCap = 'round'; ctx.lineWidth = s.style === 'palm' ? 8 : s.style === 'needle' ? 2 : 4;
      ctx.beginPath(); ctx.moveTo(-trail, 0); ctx.lineTo(s.r * 1.2, 0); ctx.stroke();
      ctx.fillStyle = s.color;
      if (s.style === 'swordQi') {
        const r = s.r; ctx.shadowBlur = 9;
        ctx.strokeStyle = s.color; ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-r * 3.5, 0); ctx.quadraticCurveTo(0, -r * .5, r * 3.6, 0); ctx.stroke();
        ctx.strokeStyle = '#fbfff0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-r * 2.7, 0); ctx.lineTo(r * 3.1, 0); ctx.stroke();
        ctx.fillStyle = '#dbe8df'; ctx.beginPath(); ctx.moveTo(r * 4.3, 0); ctx.lineTo(r * 2.8, -r * .5); ctx.lineTo(r * 3.2, 0); ctx.lineTo(r * 2.8, r * .5); ctx.closePath(); ctx.fill();
      } else if (s.style === 'crescent') {
        const r = s.r * 1.8; ctx.shadowBlur = 10;
        ctx.strokeStyle = s.color; ctx.lineWidth = Math.max(4, s.r * .7); ctx.beginPath(); ctx.arc(0, 0, r, -.92, .92); ctx.stroke();
        ctx.strokeStyle = '#fff6d4'; ctx.lineWidth = Math.max(1.3, s.r * .15); ctx.beginPath(); ctx.arc(0, 0, r - 1, -.84, .84); ctx.stroke();
        ctx.strokeStyle = s.color + 'aa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * .7, -r * .15); ctx.quadraticCurveTo(0, -r * .2, r * 1.5, 0); ctx.stroke();
      } else if (s.style === 'palm') {
        const r = s.r;
        ctx.strokeStyle = s.color; ctx.lineWidth = r * .62; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-r * 1.7, 1); ctx.bezierCurveTo(-r * .6, -r * 1.65, r * .45, r * 1.7, r * 1.8, -r * .38); ctx.stroke();
        ctx.strokeStyle = '#fff0bf'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-r * 1.25, 0); ctx.bezierCurveTo(-r * .35, -r * 1.15, r * .55, r * 1.15, r * 1.48, -.2); ctx.stroke();
        ctx.fillStyle = '#fff0b1'; ctx.beginPath(); ctx.arc(r * 1.7, -.5, r * .72, 0, TAU); ctx.fill();
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.moveTo(r * 1.3, -r * .6); ctx.lineTo(r * 2.4, -r * 1.05); ctx.lineTo(r * 1.95, -.1); ctx.lineTo(r * 2.4, r * .6); ctx.lineTo(r * 1.3, r * .35); ctx.closePath(); ctx.fill();
        for (let i = 0; i < 3; i++) { ctx.fillStyle = '#ffe0a0aa'; ctx.beginPath(); ctx.arc(-r * .75 + i * r * .65, Math.sin(i * 2.1) * r * .62, 1.5, 0, TAU); ctx.fill(); }
      } else if (s.style === 'fan') {
        const r = s.r; ctx.translate(-r * .6, 0);
        for (let i = -2; i <= 2; i++) { const ang = i * .19; ctx.save(); ctx.rotate(ang); ctx.fillStyle = i % 2 ? '#eee0bb' : s.color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 2.5, -r * .12); ctx.quadraticCurveTo(r * 1.5, 0, r * 2.5, r * .12); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff6d3'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
        ctx.strokeStyle = '#f5dda0'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, r * 2.5, -.42, .42); ctx.stroke();
      } else if (s.style === 'needle') {
        const r = s.r; ctx.fillStyle = '#e9e9cf'; ctx.beginPath(); ctx.moveTo(-r * 2.7, 0); ctx.lineTo(r * 1.8, -r * .24); ctx.lineTo(r * 3, 0); ctx.lineTo(r * 1.8, r * .24); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = s.color; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-r * 2, -r * .65); ctx.lineTo(r * 1.5, -r * .65); ctx.moveTo(-r * 2, r * .65); ctx.lineTo(r * 1.5, r * .65); ctx.stroke();
      } else if (s.style === 'dragonfire' || s.style === 'soulFlame') {
        const r = s.r, base = s.style === 'dragonfire' ? '#ee7043' : '#ba78df';
        ctx.shadowBlur = 15; ctx.shadowColor = base;
        const flame = ctx.createRadialGradient(-r * .4, 0, 1, 0, 0, r * 1.45); flame.addColorStop(0, '#fff3c6'); flame.addColorStop(.28, base); flame.addColorStop(1, base + '00');
        ctx.fillStyle = flame; ctx.beginPath(); ctx.moveTo(-r * 1.5, 0); ctx.quadraticCurveTo(-r * .3, -r * 1.4, r * .9, -r * .3); ctx.quadraticCurveTo(r * 2, 0, r * .9, r * .3); ctx.quadraticCurveTo(-r * .3, r * 1.4, -r * 1.5, 0); ctx.fill();
        ctx.strokeStyle = s.style === 'dragonfire' ? '#ffd47b' : '#f2d5ff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(0, -r * .6, r * 1.25, 0); ctx.quadraticCurveTo(0, r * .6, -r, 0); ctx.stroke();
        if (s.style === 'soulFlame') { ctx.fillStyle = '#f4d6ff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-r * (1 + i * .45), Math.sin(i * 5 + s.life * 9) * r * .75, 1.5, 0, TAU); ctx.fill(); } }
      } else if (s.style === 'arrow') {
        const r = s.r; ctx.strokeStyle = '#e6c889'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-r * 2.6, 0); ctx.lineTo(r * 2.6, 0); ctx.stroke();
        ctx.fillStyle = '#eee5cb'; ctx.beginPath(); ctx.moveTo(r * 3.1, 0); ctx.lineTo(r * 1.9, -3); ctx.lineTo(r * 1.9, 3); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b8664d'; ctx.beginPath(); ctx.moveTo(-r * 2.4, 0); ctx.lineTo(-r * 3.2, -4); ctx.lineTo(-r * 2.5, 0); ctx.lineTo(-r * 3.2, 4); ctx.closePath(); ctx.fill();
      } else if (s.style === 'spear' || s.style === 'swordfall' || s.style === 'dart') {
        const r = s.r, bladeLen = s.style === 'swordfall' ? r * 3.8 : r * 2.8, bladeWide = s.style === 'swordfall' ? r * .72 : r * .45;
        ctx.fillStyle = s.style === 'dart' ? s.color : '#e7e6d3'; ctx.beginPath(); ctx.moveTo(-bladeLen * .65, -bladeWide * .28); ctx.lineTo(bladeLen * .62, -bladeWide * .24); ctx.lineTo(bladeLen, 0); ctx.lineTo(bladeLen * .62, bladeWide * .24); ctx.lineTo(-bladeLen * .65, bladeWide * .28); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = s.color; ctx.lineWidth = Math.max(1.2, bladeWide * .2); ctx.beginPath(); ctx.moveTo(-bladeLen * .8, 0); ctx.lineTo(bladeLen * .82, 0); ctx.stroke();
        if (s.style === 'swordfall') { ctx.fillStyle = '#bd9d5c'; ctx.fillRect(-bladeLen * .62, -bladeWide * .9, 3, bladeWide * 1.8); ctx.fillStyle = '#765337'; ctx.fillRect(-bladeLen * .85, -1, bladeLen * .24, 2); }
      } else {
        ctx.fillStyle = s.color; ctx.beginPath(); ctx.arc(0, 0, s.r, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff7d6'; ctx.beginPath(); ctx.arc(0, 0, Math.max(1.5, s.r * .35), 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }
  function drawOrb(o) { const pulse = 1 + Math.sin(o.bob) * .15; ctx.save(); ctx.shadowColor = '#f4dd88'; ctx.shadowBlur = 14; ctx.fillStyle = '#f6db86'; ctx.beginPath(); ctx.moveTo(o.x, o.y - o.r * pulse); ctx.lineTo(o.x + o.r * .7, o.y); ctx.lineTo(o.x, o.y + o.r * pulse); ctx.lineTo(o.x - o.r * .7, o.y); ctx.closePath(); ctx.fill(); ctx.restore(); }
  function drawDrop(d) { const y = d.y + Math.sin(d.bob || 0) * 4; ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = '#f5d980'; ctx.fillStyle = '#eac96e'; if (d.type === 'coin') { ctx.beginPath(); ctx.arc(d.x, y, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#6d5328'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('◈', d.x, y + 3); } else { ctx.fillStyle = '#f4e3a5'; ctx.fillRect(d.x - 7, y - 8, 14, 17); ctx.fillStyle = '#926c45'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('秘', d.x, y + 4); } ctx.restore(); }
  function drawTelegraphs() {
    for (const e of state.enemies) if (e.windup > 0) {
      const pulse = .52 + Math.sin(state.elapsed * 32) * .2, tellColor = e.role === 'summoner' ? '#c27be8' : e.role === 'dragon' ? '#ff744a' : e.role === 'ranged' ? '#efc879' : '#ed8766';
      ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = tellColor; ctx.fillStyle = tellColor + '25'; ctx.lineWidth = e.boss ? 4 : 2;
      if (e.role === 'dragon') {
        const angle = Math.atan2(e.aimY || 0, e.aimX || 1), len = 255;
        ctx.translate(e.x, e.y); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, -len * .26); ctx.arc(0, 0, len, -.26, .26); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (e.role === 'ranged' || e.role === 'summoner') {
        const len = e.role === 'summoner' ? 320 : 360; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + e.aimX * len, e.y + e.aimY * len); ctx.stroke();
        if (e.role === 'summoner') { ctx.beginPath(); ctx.arc(e.x + e.aimX * 34, e.y + e.aimY * 34, 11 + (1 - e.windup / .78) * 10, 0, TAU); ctx.stroke(); }
      } else { const r = e.radius + 25 + (1 - e.windup / .65) * 25; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.fill(); ctx.stroke(); }
      ctx.restore();
    }
  }
  function drawEffects() {
    for (const e of state.effects) {
      const a = clamp(e.life / e.max, 0, 1), t = 1 - a; ctx.save(); ctx.globalAlpha = a;
      if (e.kind === 'spark') {
        ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(e.vy || 1, e.vx || 1)); ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 7;
        ctx.beginPath(); ctx.moveTo(-e.size * 1.8, 0); ctx.lineTo(0, -e.size * .42); ctx.lineTo(e.size * 2.6, 0); ctx.lineTo(0, e.size * .42); ctx.closePath(); ctx.fill();
      } else if (e.kind === 'weapon') drawWeaponEffect(e, a, t);
      else if (e.kind === 'impact') drawImpact(e, a, t);
      else if (e.kind === 'afterimage') { ctx.fillStyle = '#d9ead377'; ctx.strokeStyle = '#f0dca055'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - 18, 13, 23, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      else if (e.kind === 'wind') { ctx.strokeStyle = e.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, 20 + t * 38, 0, TAU); ctx.stroke(); }
      else if (e.kind === 'heal' || e.kind === 'summon') { ctx.strokeStyle = e.kind === 'heal' ? '#9be7a3' : '#bd87db'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y - 10, 16 + t * 30, 0, TAU); ctx.stroke(); }
      else if (e.kind === 'hit') { ctx.fillStyle = '#f1836c33'; ctx.beginPath(); ctx.arc(e.x, e.y, 36, 0, TAU); ctx.fill(); }
      else if (e.kind === 'critical') { ctx.translate(e.x, e.y - 25); ctx.rotate(t * 1.4); ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 14; drawStarPath(0, 0, 11 + t * 13, 4.5, 8); ctx.fill(); }
      ctx.restore();
    }
  }
  function drawStarPath(x, y, outer, inner, points) {
    ctx.beginPath(); for (let i = 0; i < points * 2; i++) { const r = i % 2 ? inner : outer, a = -Math.PI / 2 + i * Math.PI / points; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath();
  }
  function drawWeaponEffect(e, a, t) {
    ctx.translate(e.x, e.y); ctx.rotate(e.angle || 0); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const color = e.color || '#eed59b';
    if (e.style === 'woodStaff') {
      ctx.translate(18, -16); ctx.rotate(-.3); ctx.lineCap = 'round'; ctx.shadowColor = color; ctx.shadowBlur = 9;
      ctx.strokeStyle = '#6b472c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(1, 16); ctx.quadraticCurveTo(25, 2, 53, -16); ctx.stroke();
      ctx.strokeStyle = '#d6b275'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(1, 14); ctx.quadraticCurveTo(25, 0, 52, -16); ctx.stroke();
      ctx.strokeStyle = '#f4d998'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(46, -10); ctx.lineTo(53, -16); ctx.lineTo(45, -14); ctx.stroke();
    } else if (e.style === 'fist') {
      ctx.translate(14, -14); ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 9; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(5 + t * 8, -13 + i * 8); ctx.lineTo(31 + t * 10, -13 + i * 8); ctx.stroke(); }
      ctx.strokeStyle = '#fff3d2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(43, 0, 7 + t * 16, -.95, .95); ctx.stroke();
      ctx.fillStyle = '#fff1cf'; drawStarPath(48, 0, 5 + t * 6, 2, 4); ctx.fill();
    } else if (e.style === 'saberArc' || e.style === 'dragonBlade') {
      const r = e.style === 'dragonBlade' ? 126 : 96; ctx.translate(8, -16); ctx.shadowColor = color; ctx.shadowBlur = 12;
      const rr = r * (.9 + t * .14), end = e.style === 'dragonBlade' ? 1.18 : .94;
      const blade = ctx.createLinearGradient(0, -rr, rr, rr); blade.addColorStop(0, '#fff1bd'); blade.addColorStop(.22, color); blade.addColorStop(1, color + '22');
      // Layered curved strokes read as a blade edge, instead of a filled wedge that hides the fighters.
      ctx.strokeStyle = blade; ctx.lineWidth = e.style === 'dragonBlade' ? 22 : 15; ctx.beginPath(); ctx.arc(0, 0, rr, -end, end); ctx.stroke();
      ctx.strokeStyle = '#fff7de'; ctx.lineWidth = e.style === 'dragonBlade' ? 4 : 3; ctx.beginPath(); ctx.arc(0, 0, rr - 2, -end * .96, end * .96); ctx.stroke();
      ctx.strokeStyle = color + 'bb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, rr * .76, -end * .72, end * .72); ctx.stroke();
      if (e.style === 'dragonBlade') {
        ctx.strokeStyle = '#ffcf78'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, rr * 1.12, -1.02, 1.02); ctx.stroke();
        for (let i = 0; i < 7; i++) { const ang = -.92 + i * .30, x = Math.cos(ang) * rr * 1.06, y = Math.sin(ang) * rr * 1.06; ctx.fillStyle = '#ffe6a0'; drawStarPath(x, y, 3.5 + t, 1.3, 4); ctx.fill(); }
      }
    } else if (e.style === 'fingerBeam') {
      const len = e.length || 500; ctx.translate(17, -15); ctx.shadowColor = color; ctx.shadowBlur = 18;
      const beam = ctx.createLinearGradient(0, 0, len, 0); beam.addColorStop(0, '#fff8d9'); beam.addColorStop(.18, color); beam.addColorStop(.75, color + 'aa'); beam.addColorStop(1, color + '00');
      ctx.strokeStyle = beam; ctx.lineWidth = 15 * a; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
      ctx.strokeStyle = '#f6fff1'; ctx.lineWidth = 3.5 * a; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * .88, 0); ctx.stroke();
      for (let i = 0; i < 4; i++) { const x = 22 + i * 15 + t * 20; ctx.strokeStyle = '#dffff0aa'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, 0, 5 + t * 4, 14 + t * 5, 0, 0, TAU); ctx.stroke(); }
    } else if (e.style === 'swordDraw') {
      ctx.translate(14, -16); ctx.shadowColor = color; ctx.shadowBlur = 10;
      ctx.strokeStyle = color; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(8, 21); ctx.quadraticCurveTo(42, 4, 76, -18); ctx.stroke();
      ctx.strokeStyle = '#f6fff5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(13, 17); ctx.quadraticCurveTo(43, 1, 77, -18); ctx.stroke();
      ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(23, 24); ctx.lineTo(67, -8); ctx.stroke();
    } else if (e.style === 'spearThrust') {
      ctx.translate(7, -15); const len = 126 * (1 - t * .18); ctx.shadowColor = color; ctx.shadowBlur = 14;
      ctx.fillStyle = color + '66'; ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(len * .83, -4); ctx.lineTo(len, 0); ctx.lineTo(len * .83, 4); ctx.lineTo(0, 9); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#f0fff0'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(16 + i * 18, -13 - i); ctx.lineTo(35 + i * 18, -13 - i); ctx.stroke(); }
    } else if (e.style === 'fanCast') {
      ctx.translate(13, -17); ctx.shadowColor = color; ctx.shadowBlur = 8; const radius = 55;
      for (let i = -3; i <= 3; i++) { const ang = i * .15; ctx.save(); ctx.rotate(ang); ctx.fillStyle = i % 2 ? '#dcebe1aa' : color + 'bb'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(radius, -6); ctx.quadraticCurveTo(radius * .82, 0, radius, 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff0c8'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
      ctx.strokeStyle = '#fff3cb'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, radius, -.47, .47); ctx.stroke();
    } else if (e.style === 'needleFan') {
      ctx.translate(16, -14); ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 8;
      for (let i = -3; i <= 3; i++) { const ang = i * .105; ctx.save(); ctx.rotate(ang); ctx.lineWidth = i % 2 ? 1 : 2; ctx.beginPath(); ctx.moveTo(2, 0); ctx.lineTo(80 + 18 * a, 0); ctx.stroke(); ctx.fillStyle = '#fff5d8'; ctx.beginPath(); ctx.moveTo(80 + 18 * a, 0); ctx.lineTo(72 + 18 * a, -2.3); ctx.lineTo(72 + 18 * a, 2.3); ctx.closePath(); ctx.fill(); ctx.restore(); }
    } else if (e.style === 'dragonPalm') {
      ctx.translate(18, -15); const len = 90 * (1 - t * .12); ctx.shadowColor = color; ctx.shadowBlur = 17;
      ctx.strokeStyle = color + 'bb'; ctx.lineWidth = 15 * a; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(len * .22, -37, len * .42, 37, len * .62, 0); ctx.bezierCurveTo(len * .75, -28, len * .9, 12, len, 0); ctx.stroke();
      ctx.strokeStyle = '#fff0bc'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(len * .22, -37, len * .42, 37, len * .62, 0); ctx.bezierCurveTo(len * .75, -28, len * .9, 12, len, 0); ctx.stroke();
      ctx.fillStyle = '#ffe7a6'; ctx.beginPath(); ctx.arc(len, 0, 8 + t * 7, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#e28e43'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(len, 0, 13 + t * 8, -.9, 1.2); ctx.stroke();
    } else if (e.style === 'swordRain') {
      ctx.translate(0, -60); ctx.shadowColor = color; ctx.shadowBlur = 12;
      const count = Math.max(3, Math.min(7, e.count || 4));
      for (let i = 0; i < count; i++) { const x = (i - (count - 1) / 2) * 27, y = Math.sin(i * 8.4) * 22 - t * 18; ctx.save(); ctx.translate(x, y); ctx.rotate(.28 + (i % 2) * .12); ctx.fillStyle = '#f5edcf'; ctx.fillRect(-2, -23, 4, 27); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(0, 12); ctx.lineTo(2, 4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#d1af66'; ctx.fillRect(-6, 0, 12, 2); ctx.restore(); }
    } else if (e.style === 'enemyBowRelease') {
      ctx.translate(15, -14); ctx.strokeStyle = '#f6d99c'; ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 25, -.6, .6); ctx.stroke(); ctx.strokeStyle = '#fff3d1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -15); ctx.lineTo(34, 0); ctx.lineTo(0, 15); ctx.stroke();
    } else if (e.style === 'enemyRuneCast') {
      ctx.translate(18, -15); ctx.rotate(t * 3); ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 11; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, 18 + t * 15, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#edd9ff'; ctx.beginPath(); ctx.moveTo(-23, 0); ctx.lineTo(23, 0); ctx.moveTo(0, -23); ctx.lineTo(0, 23); ctx.stroke(); ctx.fillStyle = color; drawStarPath(0, 0, 7, 3, 6); ctx.fill();
    } else if (e.style === 'enemyDragonBreath') {
      ctx.translate(20, -21); ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(38, -22, 70, 0); ctx.quadraticCurveTo(38, 22, 0, 0); ctx.stroke(); ctx.strokeStyle = '#ffe6a3'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8, 0); ctx.quadraticCurveTo(38, -13, 62, 0); ctx.stroke();
    } else if (e.style === 'swordOrbit' || e.style === 'staffOrbit' || e.style === 'halberd') {
      ctx.translate(0, -14); const r = e.style === 'halberd' ? 88 : e.radius * .76; ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.lineWidth = e.style === 'halberd' ? 8 : 5;
      ctx.beginPath(); ctx.arc(0, 0, r * (1 + t * .06), -.8, .8); ctx.stroke(); ctx.strokeStyle = '#fff2d0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r - 6, -.68, .68); ctx.stroke();
      const spin = (1 - a) * 2.2; ctx.save(); ctx.rotate(spin); ctx.translate(r, 0); ctx.rotate(-.5); ctx.fillStyle = e.style === 'staffOrbit' ? '#9b7848' : '#e9e5d2'; ctx.fillRect(-3, -20, 6, 40); ctx.fillStyle = color; if (e.style !== 'staffOrbit') { ctx.beginPath(); ctx.moveTo(-3, -23); ctx.lineTo(0, -36); ctx.lineTo(3, -23); ctx.closePath(); ctx.fill(); } ctx.restore();
      if (e.style === 'halberd') { for (let i = 0; i < 3; i++) { const ang = spin + i * TAU / 3; ctx.save(); ctx.rotate(ang); ctx.translate(r, 0); ctx.fillStyle = '#f4d078'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, -9); ctx.lineTo(12, 0); ctx.lineTo(20, 9); ctx.closePath(); ctx.fill(); ctx.restore(); } }
    }
  }
  function drawImpact(e, a, t) {
    ctx.translate(e.x, e.y); ctx.rotate(e.angle || 0); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = e.color; ctx.shadowBlur = 13; ctx.lineCap = 'round';
    const r = e.radius || 22;
    ctx.strokeStyle = e.color; ctx.lineWidth = e.crit ? 3.5 : 2.4; ctx.beginPath(); ctx.arc(0, 0, r * (.45 + t * .95), 0, TAU); ctx.stroke();
    ctx.strokeStyle = '#fff4d4'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(0, 0, r * (.22 + t * .7), -.8, 1.65); ctx.stroke();
    if (e.style === 'woodHit') {
      ctx.strokeStyle = '#d8b477'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * .7, -r * .36); ctx.lineTo(r * .72, r * .22); ctx.moveTo(-r * .45, r * .55); ctx.lineTo(r * .55, -r * .44); ctx.stroke();
      ctx.fillStyle = '#bd8b50'; for (let i = 0; i < 4; i++) { const ang = -.9 + i * .55; ctx.save(); ctx.rotate(ang); ctx.fillRect(r * (.55 + t * .35), -1.2, 7, 2.4); ctx.restore(); }
    } else if (e.style === 'palmBurst') {
      ctx.strokeStyle = '#ffb459'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-r * .8, 0); ctx.bezierCurveTo(-r * .4, -r, r * .2, r, r * .95, -.15); ctx.stroke();
      ctx.strokeStyle = '#fff2bd'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-r * .55, -2); ctx.bezierCurveTo(-r * .24, -r * .64, r * .15, r * .63, r * .72, 0); ctx.stroke();
    } else if (e.style === 'bladeClash' || e.style === 'swordImpact') {
      ctx.strokeStyle = '#fff6d9'; ctx.lineWidth = e.style === 'swordImpact' ? 4 : 2.4;
      for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-r * .45, i * 5 - 7); ctx.lineTo(r * (.7 + t * .25), i * 8); ctx.stroke(); }
      if (e.style === 'swordImpact') { ctx.fillStyle = e.color; ctx.fillRect(-2, -r * (1 + t), 4, r * .75); }
    } else if (e.style === 'needleHit') {
      for (let i = -2; i <= 2; i++) { ctx.strokeStyle = i % 2 ? '#ecf6dc' : e.color; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-4, i * 3); ctx.lineTo(r * (1 + t), i * 7); ctx.stroke(); }
    } else if (e.style === 'fanHit') {
      ctx.fillStyle = e.color + 'bb'; for (let i = 0; i < 5; i++) { const ang = -.7 + i * .35; ctx.save(); ctx.rotate(ang); ctx.beginPath(); ctx.ellipse(r * .5, 0, r * .48, 3, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    } else if (e.style === 'spearHit') {
      ctx.strokeStyle = '#fff5dc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * .4, 0); ctx.lineTo(r * 1.35, 0); ctx.stroke();
      ctx.fillStyle = e.color; ctx.beginPath(); ctx.moveTo(r * 1.45, 0); ctx.lineTo(r * .95, -5); ctx.lineTo(r * .95, 5); ctx.closePath(); ctx.fill();
    } else if (e.style === 'dragonBurn') {
      ctx.strokeStyle = '#f38a4e'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, r * (.55 + t), -.8, 1.5); ctx.stroke(); ctx.fillStyle = '#ffbd69'; drawStarPath(0, 0, r * .55, r * .16, 6); ctx.fill();
    } else if (e.style === 'soulHit') {
      ctx.strokeStyle = e.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r * (.8 + t), -1, 2.6); ctx.stroke(); ctx.fillStyle = '#ecd5ff'; drawStarPath(0, 0, r * .42, r * .14, 7); ctx.fill();
    } else if (e.style === 'arrowHit') {
      ctx.strokeStyle = '#e8d19d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * .5, -r * .28); ctx.lineTo(r, 0); ctx.moveTo(-r * .5, r * .28); ctx.lineTo(r, 0); ctx.stroke();
    } else if (e.style === 'fingerHit') {
      ctx.fillStyle = '#fff7d8'; drawStarPath(0, 0, r * (.9 + t * .3), r * .24, 8); ctx.fill();
    } else {
      ctx.strokeStyle = '#fff3d6'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-r * .8, -r * .8); ctx.lineTo(r * .78, r * .78); ctx.moveTo(-r * .8, r * .8); ctx.lineTo(r * .78, -r * .78); ctx.stroke();
    }
    if (e.crit) { ctx.fillStyle = '#fff2b5'; drawStarPath(0, 0, r * .5, r * .15, 6); ctx.fill(); }
  }
  function drawFloats() { for (const f of state.floats) { const p = 1 - f.life / f.max; ctx.save(); ctx.globalAlpha = clamp(f.life / f.max, 0, 1); ctx.textAlign = 'center'; ctx.font = `bold ${f.crit ? 14 : 12}px Noto Sans SC`; ctx.lineWidth = f.crit ? 4 : 3; ctx.strokeStyle = '#1d1c17'; ctx.shadowColor = f.crit ? '#f2b747' : 'transparent'; ctx.shadowBlur = f.crit ? 9 : 0; ctx.strokeText(f.text, f.x, f.y - p * 18); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y - p * 18); ctx.restore(); } }
  function pixel(x, y, ww, hh, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(ww), Math.round(hh)); }
  function drawWeather() {
    if (state.weather !== 1) return;
    ctx.save(); ctx.strokeStyle = '#b8d9eb45'; ctx.lineWidth = 1;
    for (let i = 0; i < 44; i++) { const x = cameraX - viewW / 2 + (i * 113 + state.elapsed * 220) % viewW, y = cameraY - viewH / 2 + (i * 71 + state.elapsed * 380) % viewH; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 13); ctx.stroke(); }
    ctx.restore();
  }

  function drawMap() {
    const mw = mapCanvas.width, mh = mapCanvas.height, c = mapCtx, p = state.hero;
    c.clearRect(0, 0, mw, mh); c.fillStyle = '#263d2c'; c.fillRect(0, 0, mw, mh);
    const cell = Math.min(mw, mh) / 1180, ox = mw / 2 - p.x * cell, oy = mh / 2 - p.y * cell;
    c.strokeStyle = '#d0b86a88'; c.lineWidth = 2; c.beginPath(); c.arc(ox + 768 * cell, oy + 512 * cell, 72 * cell, 0, TAU); c.stroke();
    c.fillStyle = '#72c9d0'; c.fillRect(ox + 768 * cell - 3, oy + 512 * cell - 3, 6, 6);
    for (const e of state.enemies) { const x = ox + e.x * cell, y = oy + e.y * cell; if (x > 0 && x < mw && y > 0 && y < mh) { c.fillStyle = e.boss ? '#ffd06e' : '#e67f63'; c.beginPath(); c.arc(x, y, e.boss ? 4 : 2.5, 0, TAU); c.fill(); } }
    c.fillStyle = '#fff1a8'; c.beginPath(); c.arc(mw / 2, mh / 2, 5, 0, TAU); c.fill();
    for (const v of state.villagers) if (v.alive) { const x = ox + v.x * cell, y = oy + v.y * cell; c.fillStyle = '#83d8ab'; c.fillRect(x - 2, y - 2, 4, 4); }
  }

  function screenToWorld(x, y) { return { x: cameraX + (x - w / 2) / scale, y: cameraY + (y - h / 2) / scale }; }
  function usePointerMove(e) {
    if (touchPoints.has(e.pointerId)) {
      touchPoints.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touchPoints.size >= 2) { const distance = touchDistance(); if (pinchStartDistance > 0) setZoom(pinchStartZoom * distance / pinchStartDistance); return; }
      if (joystick.id === e.pointerId) { const dx = e.clientX - joystick.originX, dy = e.clientY - joystick.originY, limit = 48, d = Math.hypot(dx, dy); joystick.x = (d > limit ? dx / d * limit : dx) / limit; joystick.y = (d > limit ? dy / d * limit : dy) / limit; const knob = $('stickKnob'); if (knob) knob.style.transform = `translate(${joystick.x * 25}px,${joystick.y * 25}px)`; }
      return;
    }
    if (pointer?.id === e.pointerId && e.pointerType === 'mouse') moveTarget = screenToWorld(e.clientX, e.clientY);
  }
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === 'touch' || e.pointerType === 'pen') { e.preventDefault(); beginTouch(e, true); }
    else { pointer = { id: e.pointerId }; moveTarget = screenToWorld(e.clientX, e.clientY); }
  });
  window.addEventListener('pointermove', usePointerMove);
  function releasePointer(e) {
    if (touchPoints.has(e.pointerId)) touchPoints.delete(e.pointerId);
    if (touchPoints.size === 0) { pinchStartDistance = 0; resetJoystick(); $('touchStick').style.opacity = '1'; }
    else if (touchPoints.size === 1 && pinchStartDistance) { const [[id, point]] = touchPoints.entries(); joystick.id = id; joystick.originX = point.x; joystick.originY = point.y; joystick.x = joystick.y = 0; $('touchStick').style.left = `${clamp(point.x - 45, 8, w - 100)}px`; $('touchStick').style.top = `${clamp(point.y - 45, 70, h - 110)}px`; $('touchStick').style.opacity = '1'; pinchStartDistance = 0; }
    if (pointer?.id === e.pointerId) pointer = null;
  }
  window.addEventListener('pointerup', releasePointer); window.addEventListener('pointercancel', releasePointer);
  $('touchStick').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); $('touchStick').setPointerCapture(e.pointerId); beginTouch(e, false); });

  document.addEventListener('keydown', e => {
    const key = e.key.toLowerCase(); if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) e.preventDefault();
    if (key === 'b') { toggleBag(); return; } if (key === 'm') { $('mapModal').hidden = !$('mapModal').hidden; drawMap(); return; }
    if (key === 'escape') { if (state?.bagOpen) toggleBag(false); else if (!$('mapModal').hidden) $('mapModal').hidden = true; return; }
    if (key === 'shift') dodge(); if (['1', '2', '3', '4'].includes(key)) switchMove(Number(key) - 1); if (key === 'q') switchMove(Math.max(0, (state?.activeMove || 0) - 1)); if (key === 'e') switchMove(Math.min((state?.moves.length || 1) - 1, (state?.activeMove || 0) + 1));
    keys[key] = true;
  });
  document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { keys = Object.create(null); touchPoints.clear(); pinchStartDistance = 0; resetJoystick(); $('touchStick').style.opacity = '1'; });
  $('startButton').addEventListener('click', startGame); $('restartButton').addEventListener('click', () => { state = freshState(); startGame(); });
  $('zoomOut').addEventListener('click', () => setZoom(zoom - .1)); $('zoomIn').addEventListener('click', () => setZoom(zoom + .1)); syncZoomLabel();
  $('bagBtn').addEventListener('click', () => toggleBag()); $('mapBtn').addEventListener('click', () => { $('mapModal').hidden = false; drawMap(); });
  $('touchDodge').addEventListener('click', dodge); $('touchSkill').addEventListener('click', () => switchMove((state.activeMove + 1) % state.moves.length));
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { $(b.dataset.close).hidden = true; if (b.dataset.close === 'bagModal') state.bagOpen = false; }));
  document.querySelectorAll('.modal-shade').forEach(overlay => overlay.addEventListener('pointerdown', e => { if (e.target === overlay && overlay.id !== 'levelModal') { overlay.hidden = true; state.bagOpen = false; } }));

  function villageEntities() { return state.villagers; }
  function drawMapMarker() { /* Reserved for future map labels; landmark positions are already plotted in drawMap. */ }
  function formatVersion() { return 2; }
  window.__WUXIA_GAME__ = { getState: () => state, selectMove: switchMove, dodge, spawnEnemy, checkLevel, moveSpecs, enemySpecs };

  resize();
  state = freshState();
  draw();
})();
