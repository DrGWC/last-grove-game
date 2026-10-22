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
  const groundTextures = Object.fromEntries(Object.entries({
    grove: 'open-ground.jpg', bamboo: 'bamboo-ground.jpg', mountain: 'mountain-ground-v2.jpg',
    wetland: 'wetland-ground.jpg', plum: 'plum-ground.jpg'
  }).map(([id, file]) => { const image = new Image(); image.src = `assets/art/${file}`; return [id, image]; }));
  const villageArt = new Image(); villageArt.src = 'assets/art/wuxia-village.jpg';
  const heroSprite = new Image(); heroSprite.src = 'assets/art/jianghu-novice.png';
  const banditSprite = new Image(); banditSprite.src = 'assets/art/bandit-swordsman.png';
  const runnerSprite = new Image(); runnerSprite.src = 'assets/art/bandit-runner.png';
  const bruteSprite = new Image(); bruteSprite.src = 'assets/art/bandit-brute.png';
  const wolfSprite = new Image(); wolfSprite.src = 'assets/art/mountain-wolf.png';
  const boarSprite = new Image(); boarSprite.src = 'assets/art/stone-mane-boar.png';
  const guardianSprite = new Image(); guardianSprite.src = 'assets/art/temple-stone-guardian.png';
  const serpentSprite = new Image(); serpentSprite.src = 'assets/art/marsh-venom-serpent.png';
  const foxSprite = new Image(); foxSprite.src = 'assets/art/spirit-fox.png';
  const companionSprite = new Image(); companionSprite.src = 'assets/art/wuxia-companions.png';
  const woodlandTreeSprite = new Image(); woodlandTreeSprite.src = 'assets/art/woodland-tree.png';
  const woodlandPineSprite = new Image(); woodlandPineSprite.src = 'assets/art/woodland-pine.png';
  const woodlandFoliageSprite = new Image(); woodlandFoliageSprite.src = 'assets/art/woodland-foliage.png';
  const woodlandStoneSprite = new Image(); woodlandStoneSprite.src = 'assets/art/woodland-stones.png';
  const mountainCliffSprite = new Image(); mountainCliffSprite.src = 'assets/art/mountain-cliff.png';
  const lotusPondSprite = new Image(); lotusPondSprite.src = 'assets/art/lotus-pond.png';
  const bambooClumpSprite = new Image(); bambooClumpSprite.src = 'assets/art/bamboo-clump.png';
  const bambooLowSprite = new Image(); bambooLowSprite.src = 'assets/art/bamboo-clump-wide.png';
  const bambooGateSprite = new Image(); bambooGateSprite.src = 'assets/art/bamboo-gate.png';
  const plumTreeSprite = new Image(); plumTreeSprite.src = 'assets/art/plum-blossom-tree.png';
  const wyrmSprite = new Image(); wyrmSprite.src = 'assets/art/crimson-wyrm.png';
  const villagerAtlas = new Image(); villagerAtlas.src = 'assets/art/village-folk.png';
  const buddhaPalmSprite = new Image(); buddhaPalmSprite.src = 'assets/art/buddha-palm-vfx.png';
  const groundPatterns = new Map(), groundTiles = new Map(), regionGrounds = new Map();
  let villageBlend = null;
  let w = 0, h = 0, dpr = 1, scale = 1, zoom = 1, viewW = 0, viewH = 0, cameraX = 0, cameraY = 0;
  let state = null, lastFrame = 0, raf = 0, toastTimer = 0, pointer = null, moveTarget = null;
  let joystick = { x: 0, y: 0, id: null, originX: 0, originY: 0 }, keys = Object.create(null), uiTimer = 0;
  const touchPoints = new Map(); let pinchStartDistance = 0, pinchStartZoom = 1;

  const moveSpecs = {
    woodStaff: { name: '粗木棍', icon: '🪵', category: '外功', kind: '近战兵器', style: 'melee', range: 64, damage: 11, cd: .86, desc: '贴身重击，近距离单体命中。', color: '#c39a5c' },
    fist: { name: '赤手拳', icon: '✊', category: '外功', kind: '拳脚', style: 'melee', range: 74, damage: 16, cd: .72, desc: '短距离重拳，贴近后爆发伤害。', color: '#f1c78b' },
    ironSword: { name: '精钢长剑', icon: '🗡️', category: '外功', kind: '近战剑法', style: 'melee', range: 94, damage: 28, cd: 1.08, desc: '近身斩击，剑锋扫及前方两人。', color: '#d5e4db' },
    mountainSaber: { name: '断岳刀', icon: '刀', category: '外功', kind: '刀罡', style: 'crescent', range: 330, damage: 16, cd: 1.65, speed: 410, pierce: 3, radius: 15, desc: '中距离刀罡穿阵；近身兵器仍有更高单击伤害。', color: '#f0ad63' },
    cloudSpear: { name: '青云枪', icon: '枪', category: '外功', kind: '近战枪法', style: 'thrust', range: 118, damage: 34, cd: 1.3, speed: 700, pierce: 5, desc: '长枪近身突刺，命中一线敌人。', color: '#8cd8c7' },
    dogStaff: { name: '打狗棒', icon: '棍', category: '外功', kind: '棍法', style: 'orbit', range: 118, damage: 21, cd: .65, desc: '棒影环身，近身自动连打。', color: '#c9aa69' },
    ironFan: { name: '铁骨折扇', icon: '扇', category: '外功', kind: '远程暗器', style: 'fan', range: 290, damage: 15, cd: 1.05, speed: 440, count: 3, desc: '扇骨分射三路，射程较远、单击较轻。', color: '#b8d9df' },
    oneYang: { name: '一阳指', icon: '☯', category: '内功', kind: '指法', style: 'beam', range: 520, damage: 32, cd: 1.9, pierce: 6, desc: '真气凝于指尖，贯日指光穿阵；精进后分化为连环指劲。', color: '#a7f0d5' },
    dragonPalm: { name: '降龙十八掌', icon: '🐉', category: '内功', kind: '掌法', style: 'palm', range: 350, damage: 28, cd: 1.45, speed: 350, count: 3, radius: 13, desc: '赤金游龙护身盘旋，聚势后化作龙形掌劲扑入敌阵。', color: '#f5bf64' },
    rulaiPalm: { name: '如来神掌', icon: '佛', category: '内功', kind: '掌法', style: 'buddhaPalm', range: 440, damage: 58, cd: 4.2, radius: 122, desc: '佛印蓄势，召下金色巨掌，震开并重创落点周围的敌人。', color: '#ffd477', rare: true },
    absorbStar: { name: '吸星大法', icon: '☯', category: '内功', kind: '化劲', style: 'absorbVortex', range: 315, damage: 31, cd: 3.8, radius: 132, desc: '凝出幽紫气旋，牵引周围敌人后震散其内力，并将少量气血化为己用。', color: '#b58bea', rare: true },
    rainNeedles: { name: '暴雨梨花针', icon: '针', category: '外功', kind: '远程暗器', style: 'volley', range: 310, damage: 12, cd: 1.25, speed: 650, count: 7, desc: '七枚细针扇形齐发，攻速迅疾。', color: '#d4e3c2' },
    heavenSword: { name: '倚天剑', icon: '⚔', category: '外功', kind: '近战剑法', style: 'orbit', range: 150, damage: 27, cd: .58, desc: '剑影环身，贴近者皆受锋芒。', color: '#c9eff0' },
    dragonBlade: { name: '屠龙刀·破军式', icon: '刀', category: '外功', kind: '刀罡', style: 'crescent', range: 390, damage: 38, cd: 2.2, speed: 350, pierce: 6, radius: 24, desc: '沉重刀罡开山裂石，扫过大片敌阵。', color: '#ff9c56', rare: true },
    skyHalberd: { name: '方天画戟', icon: '戟', category: '外功', kind: '近战戟法', style: 'spin', range: 168, damage: 52, cd: 1.3, desc: '画戟旋舞，四周敌人无处可避。', color: '#e8c36f', rare: true },
    overlordSpear: { name: '霸王枪·贯日', icon: '枪', category: '外功', kind: '枪罡', style: 'thrustQi', range: 440, damage: 36, cd: 1.35, speed: 800, pierce: 9, desc: '枪罡贯穿长阵，远程伤害低于贴身枪刺。', color: '#d3ddd1', rare: true },
    tenThousandSwords: { name: '万剑归宗', icon: '✦', category: '内功', kind: '剑诀', style: 'rain', range: 440, damage: 33, cd: 1.9, speed: 360, count: 5, pierce: 2, desc: '剑气自天而落，追击周围敌人。', color: '#bce8eb', rare: true },
    dragonPalmAwakened: { name: '亢龙有悔', icon: '🐉', category: '内功', kind: '掌法', style: 'palm', range: 420, damage: 36, cd: 1.6, speed: 390, count: 5, radius: 16, desc: '金龙绕身咆哮，五道龙劲同时扑出。', color: '#ffcc6f', rare: true, evolutionOnly: true },
    cloudStep: { name: '凌波微步', icon: '〰', category: '轻功', kind: '闪身步法', style: 'lightness', range: 165, damage: 15, cd: 10, desc: '敌人逼近时每约 10 秒自动侧闪，短暂无敌并提高移速，期间有机会闪避攻击。', color: '#9ce4c1' }
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
    boar: { name: '岩鬃山魈', hp: 78, damage: 14, speed: 86, radius: 22, xp: 21, coin: 5, color: '#a65d36', role: 'charger', beast: true },
    guardian: { name: '古刹石傀', hp: 156, damage: 19, speed: 36, radius: 28, xp: 34, coin: 9, color: '#6b8173', role: 'guardian', beast: true },
    serpent: { name: '瘴泽毒蛟', hp: 72, damage: 12, speed: 54, radius: 23, xp: 26, coin: 7, color: '#7977a5', role: 'serpent', beast: true },
    chief: { name: '黑风寨主', hp: 430, damage: 20, speed: 54, radius: 30, xp: 100, coin: 35, color: '#49343a', role: 'boss', boss: true },
    dragon: { name: '赤鳞山蛟', hp: 920, damage: 25, speed: 46, radius: 43, xp: 180, coin: 80, color: '#50816a', role: 'dragon', boss: true, beast: true }
  };

  const passiveCards = [
    { id: 'innerQi', name: '吐纳心法', icon: '☯', desc: '内力上限 +12，恢复速度提高；与满级招式共鸣。', max: 5 },
    { id: 'ironQi', name: '剑气淬炼', icon: '🗡️', desc: '招式伤害 +1；剑法伤害再提高 8%，可与精钢长剑共鸣。', max: 5 },
    { id: 'body', name: '铁布衫', icon: '🥋', desc: '气血上限 +18，并立刻恢复 18 点。', max: 5 },
    { id: 'lightness', name: '轻功身法', icon: '〰', desc: '移速提高 9%；闪身距离、伤害和无敌时间提升，轻功招式冷却缩短。', max: 5 },
    { id: 'focus', name: '凝神诀', icon: '🎯', desc: '会心率提高 4%，招式伤害提高 3%。', max: 5 },
    { id: 'magnet', name: '纳气归元', icon: '🧲', desc: '拾取阅历的范围扩大。', max: 4 },
    { id: 'foxPet', name: '灵狐相伴', icon: '🦊', desc: '灵狐以灵爪远击敌人，攻速最快。', max: 1 },
    { id: 'cranePet', name: '云鹤相伴', icon: '🕊️', desc: '云鹤展翼射出灵羽；主人受伤时每隔数秒疗愈气血。', max: 1 },
    { id: 'tigerPet', name: '山君相伴', icon: '🐅', desc: '山君扑向近处敌人，以重爪撕开一道扇形伤口。', max: 1 },
    { id: 'tortoisePet', name: '玄甲相伴', icon: '🐢', desc: '玄甲灵龟周期性结成护阵，替主人削减所受伤害。', max: 1 }
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
      hero: { x: 750, y: 330, level: 1, hp: 100, maxHp: 100, qi: 40, maxQi: 40, damage: 8, speed: 205, crit: .05, invuln: 0, attackCd: .35, attackAnim: 0, facingX: 1, facingY: 0, walking: false, walkTime: 0, dodgeCd: 0, dashTime: 0, vx: 0, vy: 0 },
      // Start with a true unarmed external art; weapons appear as part of the
      // kung fu that uses them instead of treating a basic stick as a skill.
      moves: [{ id: 'fist', level: 1 }], passives: {},
      enemies: [], shots: [], orbs: [], effects: [], floats: [],
      villagers: [
        { id: 'tea', x: 449, y: 422, name: '茶摊掌柜', hp: 100, maxHp: 100, alive: true },
        { id: 'herbalist', x: 1100, y: 397, name: '采药姑娘', hp: 100, maxHp: 100, alive: true },
        { id: 'ferryman', x: 1240, y: 735, name: '摆渡人', hp: 100, maxHp: 100, alive: true }
      ],
      spawnTimer: 1.5, raidTimer: 72, raidWarning: false, nextBossAt: 145, lastRaidId: 0,
      campActive: new Set(), campCleared: new Set(), seed: Math.floor(Math.random() * 0xffffff),
      pet: null, petCd: 0, petX: 720, petY: 565, petWalkTime: 0, petFacingX: 1, petAttack: 0, petPounce: null, petGuardTimer: 0, regionId: 'town', cameraShake: 0,
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
  function displayWeaponMove() { return state?.moves.find(m => moveSpecs[m.id]?.category === '外功') || null; }
  function specFor(move = displayWeaponMove()) { return move ? moveSpecs[move.id] : null; }
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
  function getGroundTile(textureId = 'grove') {
    if (groundTiles.has(textureId)) return groundTiles.get(textureId);
    const ground = groundTextures[textureId] || groundTextures.grove;
    if (!ground?.complete || !ground.naturalWidth) return null;
    const tile = document.createElement('canvas'); tile.width = 768; tile.height = 768;
    const g = tile.getContext('2d', { willReadFrequently: true });
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
    const variants = [
      { turns: 0, flipX: 1, flipY: 1 }, { turns: 1, flipX: 1, flipY: -1 },
      { turns: 3, flipX: -1, flipY: 1 }, { turns: 2, flipX: 1, flipY: 1 }
    ];
    worldTile.width = worldTile.height = size * worldTiles;
    const t = worldTile.getContext('2d');
    for (let row = 0; row < worldTiles; row++) for (let col = 0; col < worldTiles; col++) {
      const cx = col * size + size / 2, cy = row * size + size / 2, variant = variants[row * worldTiles + col];
      t.save(); t.translate(cx, cy); t.rotate(variant.turns * Math.PI / 2); t.scale(variant.flipX, variant.flipY);
      t.drawImage(tile, -size / 2, -size / 2, size, size); t.restore();
    }
    // Adjacent rotated tiles and the outer repeat can have different edge colors.
    // Blend narrow bands on every join so neither the 2x2 junction nor the repeat
    // boundary appears as a hard horizontal or vertical seam.
    const mosaicCtx = worldTile.getContext('2d', { willReadFrequently: true });
    const mosaic = mosaicCtx.getImageData(0, 0, worldTile.width, worldTile.height), pixels = mosaic.data;
    const mosaicSize = worldTile.width, half = size, band = 92;
    const blend = (a, b, t) => {
      for (let c = 0; c < 3; c++) { const avg = (pixels[a + c] + pixels[b + c]) * .5; pixels[a + c] = avg * (1 - t) + pixels[a + c] * t; pixels[b + c] = avg * (1 - t) + pixels[b + c] * t; }
    };
    for (let y = 0; y < mosaicSize; y++) for (let i = 0; i < band; i++) {
      const t = i / (band - 1), row = y * mosaicSize * 4;
      blend(row + (half - 1 - i) * 4, row + (half + i) * 4, t);
      blend(row + i * 4, row + (mosaicSize - 1 - i) * 4, t);
    }
    for (let x = 0; x < mosaicSize; x++) for (let i = 0; i < band; i++) {
      const t = i / (band - 1), col = x * 4;
      blend(((half - 1 - i) * mosaicSize) * 4 + col, ((half + i) * mosaicSize) * 4 + col, t);
      blend(i * mosaicSize * 4 + col, ((mosaicSize - 1 - i) * mosaicSize) * 4 + col, t);
    }
    mosaicCtx.putImageData(mosaic, 0, 0);
    groundTiles.set(textureId, worldTile);
    return worldTile;
  }
  function getPattern(textureId = 'grove') {
    if (groundPatterns.has(textureId)) return groundPatterns.get(textureId);
    const tile = getGroundTile(textureId); if (!tile) return null;
    const pattern = ctx.createPattern(tile, 'repeat');
    if (pattern?.setTransform && typeof DOMMatrix !== 'undefined') pattern.setTransform(new DOMMatrix().translate(-384, -384));
    groundPatterns.set(textureId, pattern);
    return pattern;
  }
  function getRegionGround(region) {
    if (regionGrounds.has(region.id)) return regionGrounds.get(region.id);
    const textureId = region.id === 'bamboo' ? 'bamboo'
      : ['ridge', 'temple', 'crag'].includes(region.id) ? 'mountain'
      : ['lotus', 'marsh'].includes(region.id) ? 'wetland'
      : region.id === 'peach' ? 'plum' : 'grove';
    const tile = getGroundTile(textureId); if (!tile) return null;
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
    const layer = canvas.getContext('2d');
    const pattern = layer.createPattern(tile, 'repeat');
    if (pattern?.setTransform && typeof DOMMatrix !== 'undefined') pattern.setTransform(new DOMMatrix().scale(.36));
    layer.fillStyle = pattern || '#62674b'; layer.fillRect(0, 0, canvas.width, canvas.height);
    layer.globalCompositeOperation = 'destination-in';
    const mask = layer.createRadialGradient(512, 512, 0, 512, 512, 512);
    mask.addColorStop(0, 'rgba(255,255,255,.94)'); mask.addColorStop(.56, 'rgba(255,255,255,.82)');
    mask.addColorStop(.84, 'rgba(255,255,255,.48)'); mask.addColorStop(1, 'rgba(255,255,255,0)');
    layer.fillStyle = mask; layer.fillRect(0, 0, 1024, 1024);
    regionGrounds.set(region.id, canvas);
    return canvas;
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
    state = freshState(); terrainCache.clear(); state.started = true; cameraX = state.hero.x; cameraY = state.hero.y;
    $('startScreen').hidden = true; $('endScreen').hidden = true; $('levelModal').hidden = true; $('bagModal').hidden = true;
    keys = Object.create(null); moveTarget = null; lastFrame = performance.now(); resize(); refreshUI();
    setToast('外功、内功、轻功各自寻找目标并同步施展。贴身外功威力更强。', 4.5);
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
    p.invuln = Math.max(0, p.invuln - dt); p.attackCd = Math.max(0, p.attackCd - dt); p.attackAnim = Math.max(0, p.attackAnim - dt); p.dodgeCd = Math.max(0, p.dodgeCd - dt); p.dashTime = Math.max(0, p.dashTime - dt); p.lightnessSpeedTimer = Math.max(0, (p.lightnessSpeedTimer || 0) - dt);
    p.qi = Math.min(p.maxQi, p.qi + dt * (.9 + (state.passives.innerQi || 0) * .25)); p.hp = Math.min(p.maxHp, p.hp + dt * .16);
    updateMovement(dt); updateLandscapeAwareness(); updateSpawning(dt); updateEnemies(dt); updateAutoMove(dt); updateShots(dt); updateOrbs(dt); updatePet(dt); updateDrops(dt); updateEffects(dt); updateVillage(dt); updateCamps();
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
    if (p.walking) {
      mx /= Math.max(1, len); my /= Math.max(1, len);
      if (p.dashTime <= 0) {
        const stride = p.speed * (p.lightnessSpeedTimer > 0 ? 1.3 : 1) * dt;
        if (!moveBody(p, mx * stride, my * stride, 11)) {
          // Keep collision solid, but let continuous movement naturally trace
          // an obstacle's edge instead of pinning the hero against one point.
          const slide = stride * .72, sideX = -my * slide, sideY = mx * slide;
          if (!moveBody(p, sideX, sideY, 11)) moveBody(p, -sideX, -sideY, 11);
        }
      }
      p.facingX = mx; p.facingY = my; p.walkTime += dt * (8 + p.speed * .014);
    }
    if (p.dashTime > 0) {
      const oldX = p.x, oldY = p.y; moveBody(p, p.vx * dt, p.vy * dt, 11);
      if (Math.hypot(p.x - oldX, p.y - oldY) > 1 && Math.random() < .85) state.effects.push({ kind: 'afterimage', x: p.x, y: p.y, life: .3, max: .3 });
      for (const enemy of state.enemies) if (!p.dashHits?.has(enemy.id) && Math.hypot(enemy.x - p.x, enemy.y - p.y) < enemy.radius + 20) {
        p.dashHits ||= new Set(); p.dashHits.add(enemy.id); const direction = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        spawnImpact(enemy, 'lightness', direction, '#b9f0d1'); damageEnemy(enemy, 9 + (state.passives.lightness || 0) * 4, false);
        if (!enemy.boss) moveBody(enemy, Math.cos(direction) * 15, Math.sin(direction) * 15, enemy.radius * .72);
      }
    }
  }

  function updateLandscapeAwareness() {
    const p = state.hero, regionData = getLandscapeRegion(p.x, p.y);
    const inTown = p.x >= VILLAGE.x - 150 && p.x <= VILLAGE.x + VILLAGE.w + 150 && p.y >= VILLAGE.y - 150 && p.y <= VILLAGE.y + VILLAGE.h + 150;
    const id = regionData?.region.id || (inTown ? 'town' : 'grove');
    if (id === state.regionId) return;
    state.regionId = id;
    const region = regionData?.region;
    setToast(region ? `进入「${region.name}」 · 沿山径继续探索` : inTown ? '回到安平镇 · 茶摊与村民就在前方' : '踏入青林野地 · 留意林间山径', 2.8);
  }

  function dodge() {
    if (!state || state.ended || state.hero.dodgeCd > 0) return;
    const p = state.hero; let dx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joystick.x, dy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0) + joystick.y;
    if (Math.hypot(dx, dy) < .1) { dx = p.facingX; dy = p.facingY; }
    const l = Math.hypot(dx, dy) || 1, rank = state.passives.lightness || 0, factor = 1 + rank * .1;
    p.vx = dx / l * 720 * factor; p.vy = dy / l * 720 * factor; p.dashTime = .24 + rank * .018; p.invuln = .32 + rank * .025; p.dodgeCd = 1.05 / factor; p.dashHits = new Set();
    state.effects.push({ kind: 'wind', x: p.x, y: p.y, life: .48, max: .48, color: '#b9e4cc' }); state.cameraShake = Math.max(state.cameraShake, .75);
  }

  const terrainCache = new Map();
  const LANDSCAPE_REGIONS = [
    { id: 'bamboo', name: '翠竹海', x: 3540, y: 520, rx: 1880, ry: 1640, tint: '68,119,77', trail: [[-1850,650],[-1050,320],[-320,530],[520,350],[1800,-160]] },
    { id: 'ridge', name: '断云岭', x: -2810, y: 460, rx: 1810, ry: 1570, tint: '133,120,100', trail: [[-1750,640],[-1060,40],[-330,210],[420,-200],[1740,-740]] },
    { id: 'temple', name: '寒山古刹', x: 760, y: -2860, rx: 1750, ry: 1540, tint: '154,139,113', trail: [[-1700,640],[-1000,220],[-380,-50],[380,160],[1620,650]] },
    { id: 'lotus', name: '莲灯溪谷', x: 760, y: 3520, rx: 1800, ry: 1600, tint: '77,126,119', trail: [[-1750,-580],[-1000,-150],[-350,-240],[420,180],[1750,610]] },
    { id: 'peach', name: '落梅坡', x: 3520, y: -2860, rx: 1690, ry: 1510, tint: '151,100,111', trail: [[-1660,620],[-900,280],[-300,-120],[400,-260],[1600,-660]] },
    { id: 'crag', name: '黑石关', x: -2810, y: -2850, rx: 1760, ry: 1580, tint: '113,118,126', trail: [[-1710,-620],[-990,-280],[-350,60],[400,280],[1700,720]] },
    { id: 'marsh', name: '芦花泽', x: 3540, y: 3520, rx: 1850, ry: 1590, tint: '112,136,93', trail: [[-1800,-600],[-990,-240],[-350,140],[400,220],[1760,560]] },
    { id: 'pass', name: '黑风寨道', x: -2820, y: 3520, rx: 1800, ry: 1580, tint: '145,106,75', trail: [[-1710,-550],[-1040,-140],[-360,-250],[420,90],[1700,650]] }
  ];
  function getLandscapeRegion(x, y) {
    if (Math.hypot(x - (VILLAGE.x + 768), y - (VILLAGE.y + 512)) < 1390) return null;
    let chosen = null, best = Infinity;
    for (const region of LANDSCAPE_REGIONS) {
      const d = Math.hypot((x - region.x) / region.rx, (y - region.y) / region.ry);
      if (d < best && d < 1.48) { best = d; chosen = region; }
    }
    if (!chosen) return null;
    const t = clamp((1.48 - best) / .43, 0, 1);
    return { region: chosen, strength: t * t * (3 - 2 * t), distance: best };
  }
  function pointToSegment(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1,t=clamp(((x-ax)*dx+(y-ay)*dy)/l,0,1);return Math.hypot(x-(ax+t*dx),y-(ay+t*dy));}
  function nearRegionTrail(region,x,y,padding=116){for(let i=1;i<region.trail.length;i++){const a=region.trail[i-1],b=region.trail[i],d=pointToSegment(x,y,region.x+a[0],region.y+a[1],region.x+b[0],region.y+b[1]);if(d<padding)return true;}return false;}
  function landscapeLandmarkBlocked(x,y,radius){
    for(const region of LANDSCAPE_REGIONS){let obstacles=[];
      if(region.id==='temple')obstacles=[[370,-150,58]];else if(region.id==='lotus')obstacles=[[250,-130,180]];
      else if(region.id==='peach')obstacles=[[-76,108,72],[170,100,83],[416,91,70]];else if(region.id==='pass')obstacles=[[110,-60,68]];
      else if(region.id==='ridge')obstacles=[[160,-180,72],[250,-140,78],[340,-100,70]];else if(region.id==='bamboo')obstacles=[[-220,-120,13],[-140,-120,13]];
      else if(region.id==='crag')obstacles=[[-205,128,38],[-144,116,45],[-95,108,34]];else obstacles=[[150,-80,53]];
      for(const [ox,oy,rr] of obstacles)if(Math.hypot(x-(region.x+ox),y-(region.y+oy))<rr+radius)return true;
    }
    return false;
  }
  function smoothTrail(region) {
    const pts = region.trail;
    ctx.beginPath(); ctx.moveTo(region.x + pts[0][0], region.y + pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) {
      const x = region.x + pts[i][0], y = region.y + pts[i][1];
      const nx = region.x + pts[i + 1][0], ny = region.y + pts[i + 1][1];
      ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2);
    }
    const last = pts[pts.length - 1]; ctx.lineTo(region.x + last[0], region.y + last[1]);
  }
  function drawRegionLandscapes(left, top, width, height) {
    const right = left + width, bottom = top + height;
    for (const region of LANDSCAPE_REGIONS) {
      if (region.x + region.rx * 1.5 < left || region.x - region.rx * 1.5 > right || region.y + region.ry * 1.5 < top || region.y - region.ry * 1.5 > bottom) continue;
      const groundLayer = getRegionGround(region);
      if (groundLayer) {
        ctx.save(); ctx.globalAlpha = .95;
        ctx.drawImage(groundLayer, region.x - region.rx * 1.48, region.y - region.ry * 1.48, region.rx * 2.96, region.ry * 2.96);
        ctx.restore();
      }
      ctx.save(); ctx.translate(region.x, region.y); ctx.scale(region.rx, region.ry);
      const tint = ctx.createRadialGradient(0, 0, .12, 0, 0, 1.48);
      tint.addColorStop(0, `rgba(${region.tint}, .17)`); tint.addColorStop(.62, `rgba(${region.tint}, .10)`); tint.addColorStop(1, `rgba(${region.tint}, 0)`);
      ctx.fillStyle = tint; ctx.beginPath(); ctx.arc(0, 0, 1.48, 0, TAU); ctx.fill(); ctx.restore();
      const extent = Math.max(region.rx, region.ry) * 1.48;
      if (Math.abs(cameraX - region.x) > viewW / 2 + extent || Math.abs(cameraY - region.y) > viewH / 2 + extent) continue;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const rockyTrail = region.id === 'ridge' || region.id === 'crag';
      smoothTrail(region); ctx.strokeStyle = '#342c2328'; ctx.lineWidth = rockyTrail ? 44 : 38; ctx.stroke();
      smoothTrail(region); ctx.strokeStyle = region.id === 'temple' || region.id === 'crag' ? '#a99b8236' : '#b59c722e'; ctx.lineWidth = rockyTrail ? 32 : 27; ctx.stroke();
      ctx.restore();
      if (region.id === 'temple') drawMountainShrine(region.x + 370, region.y - 150);
      else if (region.id === 'lotus') drawLotusPool(region.x + 250, region.y - 130, 92);
      else if (region.id === 'peach') drawBlossomGrove(region.x + 170, region.y + 100, 112);
      else if (region.id === 'pass') drawBanditWaystation(region.x + 110, region.y - 60);
      else if (region.id === 'ridge') drawCliffCrown(region.x + 250, region.y - 140);
      else if (region.id === 'bamboo') drawBambooGate(region.x - 180, region.y - 120);
      else if (region.id === 'crag') drawStoneMonolith(region.x - 170, region.y + 120);
      else drawMarshPier(region.x + 150, region.y - 80);
    }
  }
  const villageStructureRects = [
    [0, 0, 590, 170], [850, 0, 1280, 158],
    [0, 170, 550, 390], [875, 150, 1280, 390],
    [0, 402, 500, 665], [900, 540, 1265, 850],
    [0, 680, 410, 1005], [420, 760, 580, 910], [750, 760, 875, 910]
  ];
  let villageWaterMask = null;
  function getVillageWaterMask() {
    if (villageWaterMask || !villageArt.complete || !villageArt.naturalWidth) return villageWaterMask;
    const scratch = document.createElement('canvas'); scratch.width = VILLAGE.w; scratch.height = VILLAGE.h;
    const sample = scratch.getContext('2d', { willReadFrequently: true }); sample.drawImage(villageArt, 0, 0, VILLAGE.w, VILLAGE.h);
    const pixels = sample.getImageData(0, 0, VILLAGE.w, VILLAGE.h).data, mask = new Uint8Array(VILLAGE.w * VILLAGE.h);
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
      const red = pixels[p], green = pixels[p + 1], blue = pixels[p + 2];
      // Water stays impassable while the tan stone and timber bridge pixels remain walkable.
      if (blue > 82 && blue > red * 1.2 && blue > green * 1.06) mask[i] = 1;
    }
    villageWaterMask = mask; return villageWaterMask;
  }
  function villageWaterBlocked(x, y, radius) {
    const mask = getVillageWaterMask(); if (!mask) return false;
    const waterAt = (px, py) => {
      const ix = Math.floor(px - VILLAGE.x), iy = Math.floor(py - VILLAGE.y);
      return ix >= 0 && iy >= 0 && ix < VILLAGE.w && iy < VILLAGE.h && mask[iy * VILLAGE.w + ix] === 1;
    };
    if (waterAt(x, y)) return true;
    for (const ring of [.56, 1]) for (let i = 0; i < 12; i++) {
      const angle = i * TAU / 12, reach = (radius + 2) * ring;
      if (waterAt(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach)) return true;
    }
    return false;
  }
  function villageStructureBlocked(x, y, radius) {
    if (x < VILLAGE.x || y < VILLAGE.y || x > VILLAGE.x + VILLAGE.w || y > VILLAGE.y + VILLAGE.h) return false;
    return villageStructureRects.some(([left, top, right, bottom]) => x + radius > left && x - radius < right && y + radius > top && y - radius < bottom);
  }
  function worldPropsForCell(cx, cy) {
    const key = `${cx},${cy}`; if (terrainCache.has(key)) return terrainCache.get(key);
    const props = [];
    {
      const rnd = rngFor(cx, cy), cellRegion = getLandscapeRegion(cx * 900 + 450, cy * 900 + 450);
      const strength = cellRegion?.strength || 0;
      // Strong biome interiors get clustered flora; weak transition cells stay open so borders do not become walls.
      const count = 14 + Math.floor(rnd() * 5) + Math.round(strength * 3) + Math.floor(rnd() * strength * 5);
      for (let i = 0; i < count; i++) {
        const x = cx * 900 + 60 + rnd() * 780, y = cy * 900 + 70 + rnd() * 760, roll = rnd();
        // Keep the village art clear and leave a short, readable runout beyond its north gate.
        if ((x > VILLAGE.x - 72 && x < VILLAGE.x + VILLAGE.w + 72
          && y > VILLAGE.y - 72 && y < VILLAGE.y + VILLAGE.h + 72)
          || (x > VILLAGE.x + 660 && x < VILLAGE.x + 840
            && y > VILLAGE.y - 340 && y < VILLAGE.y - 72)) continue;
        const regionData = getLandscapeRegion(x, y);
        if(regionData?.strength>.52&&nearRegionTrail(regionData.region,x,y))continue;
        if (regionData?.region.id === 'bamboo' && regionData.strength > .45
          && Math.hypot(x - (regionData.region.x - 180), y - (regionData.region.y - 120)) < 170) continue;
        const region = regionData && rnd() < regionData.strength ? regionData.region.id : 'grove';
        const seed = rnd(), r = 11 + rnd() * 19;
        if (region === 'bamboo') {
          if (roll < .5) props.push({ type: 'bamboo', x, y, r: 18 + rnd() * 14, seed });
          else if (roll < .74) props.push({ type: 'rock', x, y, r: r * .68 });
          else props.push({ type: 'bamboo-shrub', x, y, r: r * .8, seed });
        } else if (region === 'ridge') {
          if (roll < .44) props.push({ type: 'cliff', x, y, r: r * 1.25, seed });
          else if (roll < .75) props.push({ type: 'rock', x, y, r: r * 1.1 });
          else props.push({ type: 'pine', x, y, r: r * 1.2, seed });
        } else if (region === 'temple') {
          if (roll < .35) props.push({ type: 'pillar', x, y, r: r * .9, seed });
          else if (roll < .62) props.push({ type: 'rock', x, y, r: r * .82 });
          else if (roll < .84) props.push({ type: 'pine', x, y, r: r, seed });
          else props.push({ type: 'shrub', x, y, r: r * .7 });
        } else if (region === 'lotus' || region === 'marsh') {
          if (roll < .38) props.push({ type: 'reed', x, y, r: r * 1.2, seed });
          else if (roll < .68) props.push({ type: 'lotus', x, y, r: r * .95, seed });
          else if (roll < .82) props.push({ type: 'willow', x, y, r: r * 1.3, seed });
          else props.push({ type: 'shrub', x, y, r: r * .75 });
        } else if (region === 'peach') {
          if (roll < .48) props.push({ type: 'blossom', x, y, r: r * 1.3, seed });
          else if (roll < .7) props.push({ type: 'shrub', x, y, r: r * .8 });
          else props.push({ type: 'rock', x, y, r: r * .68 });
        } else if (region === 'crag') {
          if (roll < .55) props.push({ type: 'cliff', x, y, r: r * 1.2, seed });
          else if (roll < .82) props.push({ type: 'rock', x, y, r: r * 1.1 });
          else props.push({ type: 'dead-tree', x, y, r: r * 1.05, seed });
        } else if (region === 'pass') {
          if (roll < .4) props.push({ type: 'rock', x, y, r: r * 1.05 });
          else if (roll < .72) props.push({ type: 'shrub', x, y, r: r * .78 });
          else props.push({ type: 'banner', x, y, r: r * .9, seed });
        } else if (roll < .36) props.push({ type: 'tree', x, y, r: r * .95, seed });
        else if (roll < .48) props.push({ type: 'pine', x, y, r: r * 1.05, seed });
        else if (roll < .63) props.push({ type: 'rock', x, y, r: r * .72, seed });
        else props.push({ type: 'shrub', x, y, r: r * .8, seed });
      }
      // A light understory layer breaks up the large bare stretches between
      // blocking trees and rocks. It is decorative only, so it never changes
      // movement or the readable biome trails.
      const coverRnd = rngFor(cx + 2849, cy - 1733);
      const coverCount = 22 + Math.floor(coverRnd() * 8) + Math.round(strength * 5);
      for (let i = 0; i < coverCount; i++) {
        const x = cx * 900 + 24 + coverRnd() * 852, y = cy * 900 + 24 + coverRnd() * 852;
        if ((x > VILLAGE.x - 72 && x < VILLAGE.x + VILLAGE.w + 72
          && y > VILLAGE.y - 72 && y < VILLAGE.y + VILLAGE.h + 72)
          || (x > VILLAGE.x + 660 && x < VILLAGE.x + 840
            && y > VILLAGE.y - 340 && y < VILLAGE.y - 72)) continue;
        const regionData = getLandscapeRegion(x, y);
        if (regionData?.strength > .52 && nearRegionTrail(regionData.region, x, y, 92)) continue;
        const region = regionData && coverRnd() < regionData.strength ? regionData.region.id : 'grove';
        props.push({ type: 'ground-cover', x, y, r: 14 + coverRnd() * 7, seed: coverRnd(), region });
      }
    }
    terrainCache.set(key, props); if (terrainCache.size > 480) terrainCache.delete(terrainCache.keys().next().value);
    return props;
  }
  function terrainBlocked(x, y, radius = 10) {
    if (villageWaterBlocked(x, y, radius) || villageStructureBlocked(x, y, radius) || landscapeLandmarkBlocked(x,y,radius)) return true;
    const cx = Math.floor(x / 900), cy = Math.floor(y / 900);
    for (let gx = cx - 1; gx <= cx + 1; gx++) for (let gy = cy - 1; gy <= cy + 1; gy++) {
      for (const prop of worldPropsForCell(gx, gy)) {
        if (prop.type === 'ground-cover' || prop.type === 'shrub' || prop.type === 'bamboo-shrub' || prop.type === 'reed' || prop.type === 'banner') continue;
        if (prop.type === 'lotus') {
          // The painted pond is a wide, shallow ellipse. A circular .8r
          // blocker only covered its center and let land creatures walk over
          // the visible water around the edges.
          const variation = lotusPondSprite.complete && lotusPondSprite.naturalWidth ? .91 + prop.seed * .18 : 1;
          const waterRx = prop.r * (lotusPondSprite.complete && lotusPondSprite.naturalWidth ? 1.98 : 1.84) * variation + radius;
          const waterRy = prop.r * (lotusPondSprite.complete && lotusPondSprite.naturalWidth ? 1.16 : .79) * variation + radius;
          const rotation = lotusPondSprite.complete && lotusPondSprite.naturalWidth ? (prop.seed - .5) * .10 : -.08;
          const dx = x - prop.x, dy = y - (prop.y + 2), cos = Math.cos(rotation), sin = Math.sin(rotation);
          const localX = cos * dx + sin * dy, localY = -sin * dx + cos * dy;
          if ((localX * localX) / (waterRx * waterRx) + (localY * localY) / (waterRy * waterRy) < 1) return true;
          continue;
        }
        const obstacleRadius = prop.type === 'rock' ? prop.r * 1.12 : prop.type === 'cliff' ? prop.r * .72 : prop.type === 'pillar' || prop.type === 'stone' ? prop.r * .48 : prop.type === 'bamboo' ? prop.r * .22 : prop.r * .23 + 5;
        const ox = prop.x, oy = ['tree', 'pine', 'blossom', 'willow', 'dead-tree'].includes(prop.type) ? prop.y + 6 : prop.y;
        if (Math.hypot(x - ox, y - oy) < radius + obstacleRadius) return true;
      }
    }
    return false;
  }
  function moveBody(body, dx, dy, radius = 10) {
    const ox = body.x, oy = body.y;
    if (!terrainBlocked(body.x + dx, body.y, radius)) body.x += dx;
    if (!terrainBlocked(body.x, body.y + dy, radius)) body.y += dy;
    return Math.hypot(body.x - ox, body.y - oy) > .01;
  }
  function terrainPathBlocked(x1, y1, x2, y2, radius = 2) {
    const length = Math.hypot(x2 - x1, y2 - y1), steps = Math.ceil(length / 12);
    for (let i = 1; i <= steps; i++) { const t = i / steps; if (terrainBlocked(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, radius)) return true; }
    return false;
  }

  function updateSpawning(dt) {
    state.spawnTimer -= dt; if (state.spawnTimer > 0 || state.enemies.length > 115) return;
    // Put a small crowd on screen early, then increase pack size every other wave.
    const wave = state.wave, count = Math.min(8, 2 + Math.floor((wave - 1) / 2));
    for (let i = 0; i < count; i++) {
      const a = rand(0, TAU), d = rand(Math.max(viewW, viewH) * .40, Math.max(viewW, viewH) * .58);
      const x = state.hero.x + Math.cos(a) * d, y = state.hero.y + Math.sin(a) * d;
      spawnEnemy(selectEnemy(wave, x, y), x, y);
    }
    state.spawnTimer = Math.max(.62, 2.0 - wave * .065) * rand(.80, 1.20);
  }

  function selectEnemy(wave, x = state.hero.x, y = state.hero.y) {
    const villageX = VILLAGE.x + VILLAGE.w / 2, villageY = VILLAGE.y + VILLAGE.h / 2;
    const distance = Math.hypot(x - villageX, y - villageY), regionData = getLandscapeRegion(x, y);
    // Difficulty rises with both travel distance and regional depth. A biome's
    // visual boundary must not suddenly replace village-level enemies with elites.
    const travelPressure = clamp((distance - 1350) / 2350, 0, 1);
    const regionalPressure = regionData ? travelPressure * regionData.strength : 0;
    const basePool = ['bandit', 'bandit', 'wolf'];
    if (wave >= 2) basePool.push('runner', 'runner');
    if (wave >= 3) basePool.push('archer');
    if (wave >= 5) basePool.push('brute');
    if (wave >= 7) basePool.push('healer');

    if (!regionData || regionalPressure < .14) {
      return basePool[Math.floor(Math.random() * basePool.length)];
    }
    const biomePools = {
      bamboo: ['wolf', 'wolf', 'boar', 'runner'],
      ridge: ['boar', 'boar', 'guardian', 'brute'],
      crag: ['guardian', 'guardian', 'boar', 'summoner'],
      temple: ['guardian', 'guardian', 'archer', 'summoner'],
      lotus: ['serpent', 'serpent', 'wolf', 'healer'],
      marsh: ['serpent', 'serpent', 'wolf', 'healer'],
      peach: ['wolf', 'boar', 'healer', 'runner'],
      pass: ['bandit', 'runner', 'brute', 'archer']
    };
    const regionalPool = {
      bamboo: ['wolf', 'runner', ...(wave >= 5 ? ['boar'] : [])],
      ridge: ['wolf', 'bandit', ...(wave >= 5 ? ['brute', 'boar'] : [])],
      crag: ['bandit', ...(wave >= 3 ? ['archer'] : []), ...(wave >= 5 ? ['brute', 'guardian'] : [])],
      temple: ['bandit', 'wolf', ...(wave >= 3 ? ['archer'] : []), ...(wave >= 5 ? ['brute', 'guardian'] : [])],
      lotus: ['wolf', 'runner', ...(wave >= 6 ? ['healer', 'serpent'] : [])],
      marsh: ['wolf', 'bandit', ...(wave >= 5 ? ['healer', 'serpent'] : [])],
      peach: ['runner', 'wolf', ...(wave >= 5 ? ['boar', 'healer'] : [])],
      pass: ['bandit', 'runner', ...(wave >= 4 ? ['archer'] : []), ...(wave >= 5 ? ['brute'] : [])]
    };
    const pool = regionalPool[regionData.region.id] || basePool;
    const deepPool = (biomePools[regionData.region.id] || basePool).filter(type => {
      if (['brute', 'boar', 'guardian', 'serpent'].includes(type)) return wave >= 5;
      if (type === 'summoner') return wave >= 7;
      if (type === 'healer') return wave >= 6;
      if (type === 'archer') return wave >= 3;
      if (type === 'runner') return wave >= 2;
      return true;
    });
    const deepChance = clamp((regionalPressure - .58) / .37, 0, .78);
    const regionalChance = clamp((regionalPressure - .12) / .58, 0, .88);
    const chosenPool = Math.random() < deepChance && deepPool.length
      ? deepPool
      : Math.random() < regionalChance ? pool : basePool;
    return chosenPool[Math.floor(Math.random() * chosenPool.length)];
  }

  function spawnEnemy(type, x, y, extra = {}) {
    const s = enemySpecs[type]; if (!s) return null;
    const factor = 1 + Math.max(0, state.wave - 1) * .13;
    const e = { id: Math.random().toString(36).slice(2), type, name: s.name, x, y, hp: s.hp * factor, maxHp: s.hp * factor, damage: s.damage * (1 + (state.wave - 1) * .045), speed: s.speed * (1 + Math.min(12, state.wave) * .018), radius: s.radius, xp: s.xp, coin: s.coin, color: s.color, role: s.role, boss: !!s.boss, beast: !!s.beast, attackCd: rand(.3, 1.4), windup: 0, tell: 0, anim: rand(0, TAU), hurt: 0, moving: false, facingX: -1, facingY: 0, target: extra.target || null, summonCd: rand(3, 7), healCd: 3.4, retreat: false, ...extra };
    if (terrainBlocked(e.x, e.y, e.radius * .62)) {
      let placed = false;
      for (let ring = 24; ring <= 300 && !placed; ring += 18) for (let step = 0; step < 16; step++) {
        const angle = step * TAU / 16, nx = x + Math.cos(angle) * ring, ny = y + Math.sin(angle) * ring;
        if (!terrainBlocked(nx, ny, e.radius * .62)) { e.x = nx; e.y = ny; placed = true; break; }
      }
    }
    state.enemies.push(e); return e;
  }

  function updateEnemies(dt) {
    const p = state.hero;
    for (const e of [...state.enemies]) {
      if (e.hp <= 0) continue;
      e.moving = false;
      e.anim += dt * (e.role === 'runner' ? 11 : e.role === 'brute' ? 5 : 7); e.hurt = Math.max(0, e.hurt - dt); e.attackCd -= dt; e.attackPose = Math.max(0, (e.attackPose || 0) - dt * 2.7);
      const wasWindingUp = e.windup > 0;
      e.windup = Math.max(0, e.windup - dt); e.summonCd -= dt; e.healCd -= dt;
      if (wasWindingUp) {
        const windupDuration = e.windupDuration || (e.role === 'guardian' ? .84 : e.role === 'serpent' ? .72 : e.role === 'summoner' ? .78 : e.role === 'runner' ? .32 : e.boss ? .8 : .58);
        e.attackPose = .12 + .88 * clamp(1 - e.windup / windupDuration, 0, 1);
      }
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
      // A windup locks its attack direction. Keep the creature's body aligned
      // with that lock so its pose agrees with the telegraph and eventual hit.
      e.facingX = wasWindingUp ? (e.aimX ?? dx / d) : dx / d;
      e.facingY = wasWindingUp ? (e.aimY ?? dy / d) : dy / d;
      if (e.chargeTime > 0) {
        // Keep the sprite aligned with its locked charge direction even if the player dodges aside.
        e.facingX = e.chargeX; e.facingY = e.chargeY;
        const oldX = e.x, oldY = e.y, moved = moveBody(e, e.chargeX * e.chargeSpeed * dt, e.chargeY * e.chargeSpeed * dt, e.radius * .62);
        e.moving = moved;
        e.chargeTime = Math.max(0, e.chargeTime - dt); e.attackPose = Math.max(e.attackPose || 0, .72);
        if (Math.hypot(state.hero.x - e.x, state.hero.y - e.y) < e.radius + 20 && !e.chargeHit) {
          e.chargeHit = true; if (state.hero.invuln <= 0) hurtHero(e.damage * 1.45);
          state.effects.push({ kind: 'weapon', style: 'boarImpact', x: e.x, y: e.y, life: .34, max: .34, color: '#f4a56a', radius: 46 }); e.chargeTime = 0;
        }
        if (moved && Math.hypot(e.x - oldX, e.y - oldY) > 1 && Math.random() < .55) state.effects.push({ kind: 'chargeTrail', x: oldX, y: oldY, life: .25, max: .25, color: '#c98b5d' });
        if (!moved) e.chargeTime = 0;
        continue;
      }
      if (wasWindingUp) {
        if (e.windup === 0 && !e.resolved) resolveEnemyAttack(e, target);
      } else if (e.role === 'ranged' || e.role === 'summoner' || e.role === 'serpent') {
        const range = e.boss ? 420 : e.role === 'serpent' ? 245 : e.role === 'summoner' ? 355 : 300;
        if (d > range * .85) moveEnemy(e, dx, dy, d, dt);
        else if (d < 145 && target === p) moveEnemy(e, -dx, -dy, d, dt * .8);
        if (e.attackCd <= 0) { e.windup = e.boss ? .8 : e.role === 'serpent' ? .72 : e.role === 'summoner' ? .78 : .58; e.windupDuration = e.windup; e.attackPose = 0; e.resolved = false; e.aimX = dx / d; e.aimY = dy / d; e.poisonAimX = target.x; e.poisonAimY = target.y; }
      } else if (e.role === 'charger') {
        if (d > 260) moveEnemy(e, dx, dy, d, dt);
        else if (d < 118) moveEnemy(e, -dx, -dy, d, dt * .45);
        else if (e.attackCd <= 0) { e.windup = .72; e.windupDuration = e.windup; e.attackPose = 0; e.resolved = false; e.aimX = dx / d; e.aimY = dy / d; }
      } else if (e.role === 'guardian') {
        if (d > 208) moveEnemy(e, dx, dy, d, dt);
        else if (e.attackCd <= 0) { e.windup = .84; e.windupDuration = e.windup; e.attackPose = 0; e.resolved = false; e.slamX = target.x; e.slamY = target.y; e.aimX = dx / d; e.aimY = dy / d; }
      } else {
        const reach = e.boss ? e.radius + 55 : e.radius + 27;
        if (d > reach) moveEnemy(e, dx, dy, d, dt);
        if (d <= reach && e.attackCd <= 0) { e.windup = e.role === 'runner' ? .32 : e.boss ? .65 : .42; e.windupDuration = e.windup; e.attackPose = 0; e.resolved = false; e.aimX = dx / d; e.aimY = dy / d; }
      }
      if (e.windup === 0 && e.attackCd <= 0 && e.resolved) e.attackCd = e.boss ? 1.55 : e.role === 'runner' ? 1.2 : 1.5;
    }
    state.enemies = state.enemies.filter(e => e.hp > 0);
    // Give enemy sprites enough breathing room for their silhouettes and windups to stay readable.
    for (let i = 0; i < state.enemies.length; i++) for (let j = i + 1; j < state.enemies.length; j++) {
      const a = state.enemies[i], b = state.enemies[j], dx = b.x - a.x, dy = b.y - a.y, rawD = Math.hypot(dx, dy);
      const angle = rawD > .001 ? Math.atan2(dy, dx) : ((((parseInt(a.id.slice(0, 6), 36) || 1) ^ (parseInt(b.id.slice(0, 6), 36) || 2)) % 6283) / 1000);
      const nx = Math.cos(angle), ny = Math.sin(angle), min = (a.radius + b.radius) * 1.05;
      if (rawD < min) { const push = (min - rawD) * .06; moveBody(a, -nx * push, -ny * push, a.radius * .62); moveBody(b, nx * push, ny * push, b.radius * .62); }
    }
  }

  function moveEnemy(e, dx, dy, distance, dt) {
    const vx = dx / distance * e.speed * dt, vy = dy / distance * e.speed * dt;
    const originX = e.x, originY = e.y, radius = e.radius * .62;
    // Axis-separated collision can allow a tiny sliver of movement beside an
    // obstacle. Treat that as blocked and roll it back, or enemies keep trying
    // the same barely-open axis and never reach the sidestep routes below.
    const minProgress = Math.min(1, Math.max(.35, e.speed * dt * .22));
    const tryStep = (sx, sy) => {
      e.x = originX; e.y = originY;
      const moved = moveBody(e, sx, sy, radius);
      if (Math.hypot(e.x - originX, e.y - originY) >= minProgress) return true;
      e.x = originX; e.y = originY; return false;
    };
    if (tryStep(vx, vy)) { e.moving = true; return true; }
    const nx = dx / distance, ny = dy / distance, side = (parseInt(e.id.slice(0, 5), 36) || 1) % 2 ? 1 : -1, tx = -ny * side, ty = nx * side;
    // If a direct approach hits a rock or tree, try both sides of it. A single
    // fixed sidestep leaves enemies wedged when the preferred side is blocked.
    const routes = [[tx, ty], [-tx, -ty], [.38 * nx + .92 * tx, .38 * ny + .92 * ty], [.38 * nx - .92 * tx, .38 * ny - .92 * ty], [.7 * nx + .72 * tx, .7 * ny + .72 * ty], [.7 * nx - .72 * tx, .7 * ny - .72 * ty]];
    for (const [rx, ry] of routes) if (tryStep(rx * e.speed * dt, ry * e.speed * dt)) { e.moving = true; return true; }
    e.x = originX; e.y = originY;
    return false;
  }
  function resolveEnemyAttack(e, target) {
    e.resolved = true; e.attackCd = e.boss ? 1.55 : 1.48;
    if (e.role === 'charger') {
      e.attackCd = 3.3; e.chargeTime = .56; e.chargeX = e.aimX; e.chargeY = e.aimY; e.chargeSpeed = 505; e.chargeHit = false;
      state.effects.push({ kind: 'weapon', style: 'boarRush', x: e.x, y: e.y, angle: Math.atan2(e.aimY, e.aimX), life: .32, max: .32, color: '#f4a56a', radius: 105 });
    } else if (e.role === 'guardian') {
      e.attackCd = 3.25;
      state.effects.push({ kind: 'weapon', style: 'guardianSlam', x: e.slamX, y: e.slamY, life: .74, max: .74, hitAt: .31, damage: e.damage * 1.28, radius: 96, color: '#8de0b2' });
      state.cameraShake = Math.max(state.cameraShake, .65);
    } else if (e.role === 'ranged' || e.role === 'summoner' || e.role === 'serpent' || e.role === 'dragon') {
      const style = e.role === 'dragon' ? 'dragonfire' : e.role === 'serpent' ? 'venomGlob' : e.role === 'summoner' ? 'soulFlame' : 'arrow';
      const color = e.role === 'dragon' ? '#ed7045' : e.role === 'serpent' ? '#a88be0' : e.role === 'summoner' ? '#c179e8' : '#dfb875';
      const spread = e.role === 'dragon' ? [-.22, 0, .22] : [0];
      for (const offset of spread) {
        const aimX = e.role === 'serpent' ? e.poisonAimX - e.x : e.aimX, aimY = e.role === 'serpent' ? e.poisonAimY - e.y : e.aimY, aimD = Math.hypot(aimX, aimY) || 1;
        const angle = Math.atan2(aimY / aimD, aimX / aimD) + offset, speed = e.role === 'dragon' ? 240 : e.role === 'serpent' ? 255 : e.role === 'summoner' ? 225 : 330;
        const startX = e.x + e.aimX * 22, startY = e.y + e.aimY * 22;
        const venomLife = e.role === 'serpent' ? clamp(Math.hypot(e.poisonAimX - startX, e.poisonAimY - startY) / speed, .28, 1.55) : 1.8;
        state.shots.push({ side: 'enemy', x: startX, y: startY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: venomLife, r: e.boss ? 12 : e.role === 'serpent' ? 10 : e.role === 'summoner' ? 10 : 7, damage: e.role === 'dragon' ? e.damage * .62 : e.damage, style, color, targetX: e.poisonAimX, targetY: e.poisonAimY, hit: new Set() });
      }
      state.effects.push({ kind: 'weapon', style: e.role === 'dragon' ? 'enemyDragonBreath' : e.role === 'serpent' ? 'enemyVenomCast' : e.role === 'summoner' ? 'enemyRuneCast' : 'enemyBowRelease', x: e.x, y: e.y, angle: Math.atan2(e.aimY, e.aimX), life: .3, max: .3, color });
    } else if (e.target && target !== state.hero) {
      target.hp = Math.max(0, target.hp - e.damage); if (!target.hp) { target.alive = false; setToast(`${target.name}受伤倒地！清除附近强盗可以救下村民。`); }
    } else if (dist(e, state.hero) < e.radius + 48 && state.hero.invuln <= 0) hurtHero(e.damage);
  }

  function updateAutoMove(dt) {
    const p = state.hero;
    const targetsThisVolley = new Set();
    for (const move of state.moves) {
      const spec = moveSpecs[move.id]; if (!spec) continue;
      const rank = move.level || 1; move.cooldown = Math.max(0, (move.cooldown || 0) - dt);
      if (move.cooldown > 0) continue;
      const range = spec.style === 'lightness' ? Math.min(132 + rank * 5, 165) : spec.range * (1 + (state.passives.focus || 0) * .025) + Math.floor(rank / 2) * 7;
      const reservedTargets = new Set(targetsThisVolley);
      for (const otherMove of state.moves) if (otherMove !== move && otherMove.targetId) reservedTargets.add(otherMove.targetId);
      const target = nearestEnemy(range, reservedTargets);
      if (!target) { move.cooldown = .1; continue; }
      targetsThisVolley.add(target.id); move.targetId = target.id;
      const dx = target.x - p.x, dy = target.y - p.y, d = Math.hypot(dx, dy) || 1;
      p.facingX = dx / d; p.facingY = dy / d; p.attackAnim = Math.max(p.attackAnim, .28);
      const baseCooldown = spec.style === 'lightness' ? Math.max(8.2, spec.cd - (rank - 1) * .3) : spec.cd * (1 - (rank - 1) * .075) * (1 - (state.passives.focus || 0) * .035);
      move.cooldown = Math.max(.28, baseCooldown);
      fireMove(spec, rank, target);
    }
  }

  function fireMove(spec, rank, target) {
    const p = state.hero, angle = Math.atan2(target.y - p.y, target.x - p.x), swordQi = ['ironSword', 'tenThousandSwords'].includes(spec.id) ? (state.passives.ironQi || 0) * .08 : 0;
    const contact = spec.category === '外功' && ['melee', 'thrust', 'orbit', 'spin'].includes(spec.style);
    const damageReach = ['beam', 'fan', 'palm', 'buddhaPalm', 'absorbVortex', 'volley', 'rain', 'crescent', 'thrustQi'].includes(spec.style);
    const reachPower = contact ? 1.85 : damageReach ? .66 : 1;
    const power = (p.damage + spec.damage * (1 + (rank - 1) * .25)) * (1 + (state.passives.focus || 0) * .03 + swordQi) * reachPower, crit = Math.random() < p.crit;
    const damage = Math.round(power * (crit ? 1.85 : 1));
    if (crit) state.cameraShake = Math.max(state.cameraShake, 2.2);
    const impact = (enemy, mult = 1) => {
      spawnImpact(enemy, spec.id === 'woodStaff' ? 'woodStaff' : spec.style, angle, spec.color, crit, rank);
      damageEnemy(enemy, damage * mult, crit);
      if (contact && !enemy.boss) { const d = Math.hypot(enemy.x - p.x, enemy.y - p.y) || 1; moveBody(enemy, (enemy.x - p.x) / d * (18 + rank * 4), (enemy.y - p.y) / d * (18 + rank * 4), enemy.radius * .62); }
    };
    const style = spec.style;
    if (style === 'melee' || style === 'orbit' || style === 'spin') {
      const radius = (style === 'melee' ? spec.range : style === 'spin' ? spec.range : spec.range * .8) + Math.floor(rank / 2) * 4;
      const limit = style === 'melee' ? (rank >= 5 ? 3 : rank >= 3 ? 2 : 1) : 4 + Math.floor((rank - 1) / 2);
      const targets = enemiesInArc(p, target, radius, style === 'spin' ? -1 : style === 'melee' ? .35 : .15, limit);
      for (const enemy of targets) impact(enemy, style === 'melee' ? 1 : .82);
      const slashStyle = style === 'melee' ? (spec.id === 'woodStaff' ? 'woodStaff' : spec.id === 'ironSword' ? 'saberArc' : 'fist') : style === 'spin' ? 'halberd' : spec.id === 'heavenSword' ? 'swordOrbit' : 'staffOrbit';
      state.effects.push({ kind: 'weapon', style: slashStyle, x: p.x, y: p.y, angle, life: .38, max: .38, color: spec.color, radius, rank });
      if (contact) state.cameraShake = Math.max(state.cameraShake, .55 + rank * .1);
    } else if (style === 'beam') {
      const beamX = p.x + Math.cos(angle) * 17 + Math.sin(angle) * 15;
      const beamY = p.y + Math.sin(angle) * 17 - Math.cos(angle) * 15;
      const beamRange = Math.max(0, spec.range - 23);
      const beamRadius = 4 + rank * 1.1, beamWidth = 10 + rank * 2.2;
      const targets = lineTargets({ x: beamX, y: beamY }, angle, beamRange, beamWidth, beamRadius).slice(0, spec.pierce + Math.floor(rank / 2));
      for (const enemy of targets) impact(enemy, 1.12);
      const length = terrainVisibleLength(beamX, beamY, angle, beamRange, beamRadius);
      state.effects.push({ kind: 'weapon', style: 'fingerBeam', x: p.x, y: p.y, angle, length, life: .48, max: .48, color: spec.color, rank });
    } else if (style === 'buddhaPalm') {
      const radius = spec.radius + Math.max(0, rank - 1) * 15;
      state.effects.push({ kind: 'weapon', style: 'buddhaPalm', x: target.x, y: target.y, angle: angle + Math.PI / 2, life: 1.06, max: 1.06, hitAt: .48, damage, radius, crit, color: spec.color, rank });
      state.effects.push({ kind: 'weapon', style: 'buddhaSeal', x: target.x, y: target.y, angle, life: .68, max: .68, radius, color: spec.color, rank });
    } else if (style === 'absorbVortex') {
      const radius = spec.radius + Math.max(0, rank - 1) * 12;
      state.effects.push({ kind: 'weapon', style, x: target.x, y: target.y, angle, life: 1.02, max: 1.02, hitAt: .42, damage, radius, crit, color: spec.color, rank });
    } else if (style === 'slash') {
      launch(spec, angle, target, damage * 1.06, rank, { radius: 8, pierce: spec.pierce + rank - 1, speed: spec.speed, style: 'swordQi', crit });
      state.effects.push({ kind: 'weapon', style: 'swordDraw', x: p.x, y: p.y, angle, life: .28, max: .28, color: spec.color, rank });
    } else if (style === 'thrust') {
      const targets = enemiesInArc(p, target, spec.range + Math.floor(rank / 2) * 7, .72, rank >= 5 ? 3 : rank >= 3 ? 2 : 1);
      for (const enemy of targets) impact(enemy, 1.12);
      state.effects.push({ kind: 'weapon', style: 'spearThrust', x: p.x, y: p.y, angle, life: .3, max: .3, color: spec.color, rank });
    } else if (style === 'thrustQi') {
      launch(spec, angle, target, damage, rank, { count: 1, radius: 8, pierce: spec.pierce + rank - 1, speed: spec.speed, style: 'spear' });
      state.effects.push({ kind: 'weapon', style: 'spearThrust', x: p.x, y: p.y, angle, life: .3, max: .3, color: spec.color, rank });
    } else if (style === 'fan' || style === 'palm' || style === 'volley') {
      const count = (spec.count || 3) + (rank >= 3 ? 1 : 0) + (rank >= 5 ? 2 : 0), spread = style === 'volley' ? .72 : style === 'palm' ? .42 : .62;
      if (style === 'palm') state.effects.push({ kind: 'weapon', style: 'dragonCoil', followHero: true, x: p.x, y: p.y, angle, life: .82, max: .82, color: spec.color, count, rank });
      for (let i = 0; i < count; i++) { const a = angle + (count === 1 ? 0 : (i / (count - 1) - .5) * spread); launch(spec, a, target, damage * (style === 'volley' ? .66 : 1), rank, { count: 1, radius: style === 'volley' ? 4 : 11, pierce: style === 'palm' ? 1 : 0, speed: spec.speed, style: style === 'volley' ? 'needle' : style === 'fan' ? 'fan' : 'palm', crit }); }
      state.effects.push({ kind: 'weapon', style: style === 'fan' ? 'fanCast' : style === 'palm' ? 'dragonPalm' : 'needleFan', x: p.x, y: p.y, angle, life: style === 'palm' ? .48 : .24, max: style === 'palm' ? .48 : .24, color: spec.color, count, rank });
    } else if (style === 'crescent') {
      launch(spec, angle, target, damage * 1.25, rank, { count: 1, radius: spec.radius || 17, pierce: (spec.pierce || 2) + Math.floor(rank / 2), speed: spec.speed, style: 'crescent', crit });
      state.effects.push({ kind: 'weapon', style: spec.id === 'dragonBlade' ? 'dragonBlade' : 'saberArc', x: p.x, y: p.y, angle, life: .42, max: .42, color: spec.color, radius: 106, rank });
    } else if (style === 'rain') {
      const targets = state.enemies.filter(e => dist(e, p) < spec.range + e.radius).sort((a, b) => dist(a, p) - dist(b, p)).slice(0, spec.count + Math.floor((rank - 1) / 2));
      for (const enemy of targets) { launch(spec, Math.atan2(enemy.y - p.y, enemy.x - p.x), enemy, damage, rank, { radius: 10, pierce: 2, speed: spec.speed, style: 'swordfall', crit }); }
      state.effects.push({ kind: 'weapon', style: 'swordRain', x: p.x, y: p.y, angle, life: .46, max: .46, color: spec.color, count: targets.length, rank });
    } else if (style === 'lightness') {
      const awayX = -Math.cos(angle), awayY = -Math.sin(angle), side = Math.cos(state.elapsed * 3.1) >= 0 ? 1 : -1;
      let dx = awayX * .42 - Math.sin(angle) * side * .91, dy = awayY * .42 + Math.cos(angle) * side * .91; const len = Math.hypot(dx, dy) || 1;
      const factor = 1 + (state.passives.lightness || 0) * .1;
      p.vx = dx / len * (555 + rank * 22) * factor; p.vy = dy / len * (555 + rank * 22) * factor; p.dashTime = .19 + rank * .015; p.invuln = Math.max(p.invuln, .24 + rank * .018); p.dashHits = new Set();
      p.lightnessSpeedTimer = Math.max(p.lightnessSpeedTimer || 0, 2.8 + rank * .25); p.lightnessDodgeChance = Math.min(.45, .24 + rank * .035);
      state.effects.push({ kind: 'wind', x: p.x, y: p.y, life: .58, max: .58, color: spec.color });
      state.effects.push({ kind: 'weapon', style: 'lightnessArc', x: p.x, y: p.y, angle: angle + side * 1.35, life: .42, max: .42, color: spec.color, rank });
    }
    if (crit) state.effects.push({ kind: 'critical', x: target.x, y: target.y, life: .3, max: .3, color: '#ffe180' });
  }

  function enemiesInArc(p, focus, radius, arcDot, limit) {
    const fdx = focus.x - p.x, fdy = focus.y - p.y, fl = Math.hypot(fdx, fdy) || 1;
    return state.enemies.filter(e => dist(e, p) <= radius + e.radius && ((e.x - p.x) * fdx + (e.y - p.y) * fdy) / ((dist(e, p) || 1) * fl) >= arcDot && !terrainPathBlocked(p.x, p.y, e.x, e.y, 2)).sort((a, b) => dist(a, p) - dist(b, p)).slice(0, limit);
  }
  function lineTargets(p, angle, length, width, terrainRadius = 2) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    return state.enemies.filter(e => { const x = e.x - p.x, y = e.y - p.y, along = x * dx + y * dy, side = Math.abs(x * dy - y * dx); return along > 0 && along < length && side < width + e.radius && !terrainPathBlocked(p.x, p.y, e.x, e.y, terrainRadius); }).sort((a, b) => dist(a, p) - dist(b, p));
  }
  function terrainVisibleLength(x, y, angle, maxLength, radius = 4) {
    const dx = Math.cos(angle), dy = Math.sin(angle), step = 8, steps = Math.ceil(maxLength / step);
    for (let i = 1; i <= steps; i++) {
      const distance = Math.min(maxLength, i * step);
      if (terrainBlocked(x + dx * distance, y + dy * distance, radius)) return Math.max(0, distance - step);
    }
    return maxLength;
  }
  function launch(spec, angle, target, damage, rank, opts = {}) {
    const speed = opts.speed || spec.speed || 380;
    state.shots.push({ side: 'hero', weapon: spec.style, weaponId: spec.id, rank, x: state.hero.x + Math.cos(angle) * 21, y: state.hero.y + Math.sin(angle) * 14, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: Math.min(1.65, spec.range / speed + .15), r: opts.radius || 9, damage, pierce: opts.pierce || 0, hit: new Set(), style: opts.style || spec.style, color: spec.color, targetId: target.id, homing: opts.style === 'swordfall' ? .8 : .08, crit: !!opts.crit });
  }

  function updateShots(dt) {
    for (const s of state.shots) {
      s.life -= dt;
      if (s.homing && s.side === 'hero') { const t = state.enemies.find(e => e.id === s.targetId && e.hp > 0); if (t) { const d = dist(s, t) || 1, nx = (t.x - s.x) / d, ny = (t.y - s.y) / d, speed = Math.hypot(s.vx, s.vy); s.vx = s.vx * (1 - s.homing * dt) + nx * speed * s.homing * dt; s.vy = s.vy * (1 - s.homing * dt) + ny * speed * s.homing * dt; } }
      s.px = s.x; s.py = s.y; s.x += s.vx * dt; s.y += s.vy * dt;
      if (terrainPathBlocked(s.px, s.py, s.x, s.y, Math.max(2, s.r * .28))) { if (s.style === 'venomGlob') spawnVenomPool(s, s.px, s.py); s.life = 0; continue; }
      if (s.side === 'hero') {
        for (const e of state.enemies) if (!s.hit.has(e.id) && Math.hypot(e.x - s.x, e.y - s.y) < e.radius + s.r) {
          s.hit.add(e.id); spawnImpact(e, s.style, Math.atan2(s.vy, s.vx), s.color, s.crit); damageEnemy(e, s.damage, s.crit); for (let i = 0; i < (s.style === 'needle' ? 2 : 5); i++) spark(e.x, e.y - 12, s.color); if (s.pierce > 0) s.pierce--; else { s.life = 0; break; }
        }
      } else if (Math.hypot(state.hero.x - s.x, state.hero.y - s.y) < 20 + s.r && state.hero.invuln <= 0) {
        hurtHero(s.damage);
        if (s.style === 'venomGlob') spawnVenomPool(s, s.x, s.y);
        state.effects.push({ kind: 'impact', style: s.style === 'dragonfire' ? 'dragonBurn' : s.style === 'soulFlame' ? 'soulHit' : s.style === 'venomGlob' ? 'venomHit' : 'arrowHit', x: state.hero.x, y: state.hero.y - 18, angle: Math.atan2(s.vy, s.vx), life: .34, max: .34, color: s.color }); s.life = 0;
      }
      // A missed venom shot still lands at its telegraphed point and leaves a brief area hazard.
      if (s.style === 'venomGlob' && s.life <= 0) spawnVenomPool(s, s.targetX ?? s.x, s.targetY ?? s.y);
    }
    state.shots = state.shots.filter(s => s.life > 0);
  }
  function spawnVenomPool(shot, x, y) {
    if (shot.areaCreated) return;
    shot.areaCreated = true;
    state.effects.push({ kind: 'hazard', style: 'venomPool', x, y, life: 3.2, max: 3.2, radius: 58, color: '#a88be0', tick: .35 });
    state.effects.push({ kind: 'impact', style: 'venomHit', x, y: y - 8, angle: 0, life: .4, max: .4, color: '#c29be5', radius: 38 });
  }

  function hurtHero(amount) {
    const p = state.hero; if (p.invuln > 0) return;
    if (p.lightnessSpeedTimer > 0 && Math.random() < (p.lightnessDodgeChance || .24)) {
      p.invuln = .24; state.effects.push({ kind: 'weapon', style: 'lightnessEvade', x: p.x, y: p.y, angle: Math.atan2(p.facingY, p.facingX), life: .42, max: .42, color: '#b9f1d1', rank: 1 }); return;
    }
    const defense = Math.min(.5, (state.passives.body || 0) * .035 + (state.petGuardTimer > 0 ? .22 : 0)); p.hp = Math.max(0, p.hp - amount * (1 - defense)); p.invuln = .62; state.effects.push({ kind: 'hit', x: p.x, y: p.y, life: .25, max: .25 }); hitFlash = .16;
  }
  let hitFlash = 0;
  function damageEnemy(e, amount, crit = false) {
    if (!e || e.hp <= 0) return;
    e.hp -= amount; e.hurt = .11; damageFloat(e, amount, crit); if (crit) state.cameraShake = Math.max(state.cameraShake, e.boss ? 3.2 : 1.7);
    if (e.hp <= 0) defeatEnemy(e);
  }
  function spawnImpact(enemy, style, angle, color, crit = false, rank = 1) {
    const impactStyle = style === 'lightness' ? 'lightnessHit' : style === 'woodStaff' ? 'woodHit' : style === 'palm' ? 'palmBurst' : style === 'absorbVortex' ? 'absorbHit' : style === 'beastSwipe' ? 'beastSwipe' : style === 'feather' ? 'featherHit' : style === 'crescent' || style === 'swordQi' ? 'bladeClash' : style === 'needle' ? 'needleHit' : style === 'swordfall' ? 'swordImpact' : style === 'fan' ? 'fanHit' : style === 'spear' ? 'spearHit' : style === 'beam' ? 'fingerHit' : 'fistHit';
    state.effects.push({ kind: 'impact', style: impactStyle, x: enemy.x, y: enemy.y - 15, angle, life: crit ? .48 : .34, max: crit ? .48 : .34, color: crit ? '#fff0a6' : color, radius: enemy.radius + (crit ? 15 : 8) + Math.max(0, rank - 1) * 3.5, rank, crit });
  }
  function defeatEnemy(e) {
    e.hp = 0; state.kills++; const n = e.boss ? 8 : Math.random() < .2 ? 2 : 1;
    for (let i = 0; i < n; i++) dropExperience(e.x + rand(-12, 12), e.y + rand(-10, 10), e.boss ? 13 : Math.floor(rand(7, 12)));
    dropCoins(e.x + rand(-10, 10), e.y + rand(-10, 10), e.coin);
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

  function dropExperience(x, y, value) {
    // Enemies often fall together in packs; combine nearby experience into
    // fewer, brighter crystals without changing the amount awarded.
    const bundle = state.orbs.find(o => !o.got && Math.hypot(o.x - x, o.y - y) < 36);
    if (bundle) {
      bundle.value += value;
      bundle.r = Math.min(9, 4 + Math.sqrt(bundle.value) * .42);
      bundle.x = (bundle.x + x) * .5; bundle.y = (bundle.y + y) * .5;
    } else state.orbs.push({ x, y, value, r: Math.min(9, 4 + Math.sqrt(value) * .42), bob: rand(0, TAU) });
  }
  function dropCoins(x, y, value) {
    // Show one readable coin pile where a group of enemies fell instead of a
    // trail of identical icons scattered across the fight.
    const pile = state.drops.find(d => d.type === 'coin' && Math.hypot(d.x - x, d.y - y) < 42);
    if (pile) {
      pile.value += value; pile.count = (pile.count || 1) + 1;
      pile.x = (pile.x + x) * .5; pile.y = (pile.y + y) * .5;
    } else state.drops.push({ type: 'coin', x, y, value, count: 1, bob: rand(0, TAU) });
  }

  function updateOrbs(dt) {
    const p = state.hero, magnet = 118 + (state.passives.magnet || 0) * 76;
    for (const o of state.orbs) { o.bob += dt * 4; const d = dist(o, p); if (d < magnet && d > 2) { const speed = 300 + (magnet - d) * 1.35; o.x += (p.x - o.x) / d * speed * dt; o.y += (p.y - o.y) / d * speed * dt; } if (d < 28) { state.xp = (state.xp || 0) + o.value; o.got = true; checkLevel(); } }
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
      if (found && found.level < 5) out.push({ id: `up:${id}`, title: `${spec.name} · 精进`, icon: spec.icon, desc: upgradeDescription(spec, found.level + 1), type: 'upgrade', rarity: found.level >= 4 ? '精进' : spec.category, level: found.level });
      else if (!found && !spec.evolutionOnly && state.moves.length < 8 && (!spec.rare || state.wave >= 3)) out.push({ id, title: spec.name, icon: spec.icon, desc: spec.desc, type: 'move', rarity: spec.rare ? '绝世神功' : spec.category });
    }
    const petCards = ['foxPet', 'cranePet', 'tigerPet', 'tortoisePet'];
    for (const card of passiveCards) { const level = state.passives[card.id] || 0; if (level < card.max && !(state.pet && petCards.includes(card.id))) out.push({ ...card, title: card.name, type: 'passive', rarity: petCards.includes(card.id) ? '奇遇' : '心法', level }); }
    const eligibleEvolutions = [
      ['ironSword', 'ironQi', '万剑归宗'], ['mountainSaber', 'innerQi', '屠龙刀·破军式'], ['dragonPalm', 'innerQi', '亢龙有悔'], ['cloudSpear', 'innerQi', '霸王枪·贯日']
    ];
    for (const [base, passive, title] of eligibleEvolutions) { const m = state.moves.find(x => x.id === base); if (m?.level >= 5 && state.passives[passive]) out.push({ id: `evo:${base}`, title, icon: '✦', desc: `第 5 重招式与对应心法相融，蜕变为绝技。`, type: 'evolution', rarity: '武学共鸣' }); }
    return out;
  }
  function upgradeDescription(spec, nextRank) {
    const parts = [`招式基础威力 +25%`, `出招间隔缩短 7.5%`];
    if (spec.style === 'melee' || spec.style === 'thrust') {
      if (nextRank % 2 === 0) parts.push('攻击距离 +7');
      if (nextRank === 3) parts.push('一次命中人数 +1');
      if (nextRank === 5) parts.push('一次命中人数 +1，冲击更强');
    } else if (['palm', 'fan', 'volley'].includes(spec.style) && (nextRank === 3 || nextRank === 5)) parts.push(`每轮飞射数量 +${nextRank === 3 ? 1 : 2}`);
    else if (spec.style === 'beam' && nextRank % 2 === 0) parts.push('贯穿人数 +1');
    else if (spec.style === 'rain' && nextRank % 2 === 1) parts.push('追击目标 +1');
    else if (spec.style === 'lightness') parts.push('触发范围 +5 · 无敌更久 · 移速加成与闪避率提高');
    else if (spec.style === 'buddhaPalm') { if (nextRank % 2 === 0) parts.push('索敌距离 +7'); parts.push('掌印范围 +15'); }
    else if (spec.style === 'absorbVortex') { if (nextRank % 2 === 0) parts.push('索敌距离 +7'); parts.push('气旋范围 +12、牵引更强 · 命中回气提高'); }
    else if (nextRank % 2 === 0) parts.push('攻击范围 +7');
    parts.push('气劲外显更强');
    return `升至第 ${nextRank} 重：${parts.join(' · ')}。`;
  }
  function openDraft() {
    const pool = availableCards(), picked = [];
    const owned = new Set(state.moves.map(m => moveSpecs[m.id]?.category));
    for (const category of ['内功', '轻功']) {
      if (owned.has(category) || picked.length >= 3) continue;
      const option = pool.find(card => card.type === 'move' && moveSpecs[card.id]?.category === category);
      if (option) { picked.push(option); pool.splice(pool.indexOf(option), 1); }
    }
    while (picked.length < 3 && pool.length) { const i = Math.floor(Math.random() * pool.length); picked.push(pool.splice(i, 1)[0]); }
    if (!picked.length) picked.push({ id: 'body', title: '铁布衫', icon: '🥋', desc: '气血上限 +18。', type: 'passive', rarity: '心法', level: 0 });
    state.choiceCards = picked; state.draftOpen = true; $('choiceLevel').textContent = state.hero.level || 2;
    $('choiceCards').innerHTML = picked.map((c, i) => {
      const category = c.type === 'move' ? moveSpecs[c.id]?.category : c.type === 'upgrade' ? moveSpecs[c.id.slice(3)]?.category : c.type === 'evolution' ? moveSpecs[c.id.slice(4)]?.category : '';
      const note = c.type === 'move' ? `${category} · 学会后同步施展` : c.type === 'upgrade' ? `当前第 ${c.level} 重 → 第 ${c.level + 1} 重` : c.level ? `当前第 ${c.level} 重` : '';
      return `<button class="choice-card" data-category="${category || ''}" data-index="${i}"><span class="card-top"><span class="card-icon">${c.icon}</span><small class="rarity">${c.rarity}</small></span><b>${c.title}</b><p>${c.desc}</p>${note ? `<span class="new-tag">${note}</span>` : ''}</button>`;
    }).join('');
    $('levelModal').hidden = false; $('choiceCards').querySelectorAll('button').forEach(button => button.addEventListener('click', () => takeCard(Number(button.dataset.index))));
  }
  function takeCard(index) {
    const card = state.choiceCards[index]; if (!card) return;
    if (card.type === 'move') { state.moves.push({ id: card.id, level: 1, cooldown: .25 }); const s = moveSpecs[card.id]; state.effects.push({ kind: 'rankUp', x: state.hero.x, y: state.hero.y - 25, life: .8, max: .8, color: s.color, rank: 1, label: `${s.name} · 入门` }); }
    if (card.type === 'upgrade') { const id = card.id.slice(3), move = state.moves.find(m => m.id === id); if (move) { move.level = Math.min(5, move.level + 1); move.cooldown = .15; const s = moveSpecs[id]; state.effects.push({ kind: 'rankUp', x: state.hero.x, y: state.hero.y - 25, life: .9, max: .9, color: s.color, rank: move.level, label: `${s.name} · 第 ${move.level} 重` }); } }
    if (card.type === 'passive') {
      state.passives[card.id] = (state.passives[card.id] || 0) + 1;
      if (card.id === 'body') { state.hero.maxHp += 18; state.hero.hp = Math.min(state.hero.maxHp, state.hero.hp + 18); }
      if (card.id === 'innerQi') { state.hero.maxQi += 12; state.hero.qi += 12; }
      if (card.id === 'ironQi') state.hero.damage += 1;
      if (card.id === 'lightness') state.hero.speed *= 1.09;
      if (card.id === 'focus') { state.hero.crit = Math.min(.55, state.hero.crit + .04); state.hero.damage += 1; }
      const newPet = { foxPet: 'fox', cranePet: 'crane', tigerPet: 'tiger', tortoisePet: 'tortoise' }[card.id];
      if (newPet && !state.pet) { state.pet = newPet; state.petX = state.hero.x - 68; state.petY = state.hero.y + 42; state.petCd = .6; }
    }
    if (card.type === 'evolution') { const base = card.id.slice(4), move = state.moves.find(m => m.id === base), next = { ironSword: 'tenThousandSwords', mountainSaber: 'dragonBlade', dragonPalm: 'dragonPalmAwakened', cloudSpear: 'overlordSpear' }[base]; if (move && next) { move.id = next; move.level = 1; } }
    if (card.type === 'passive' && card.id === 'lightness') state.effects.push({ kind: 'rankUp', x: state.hero.x, y: state.hero.y - 25, life: .9, max: .9, color: '#9ce4c1', rank: state.passives.lightness, label: `轻功身法 · 第 ${state.passives.lightness} 重` });
    state.draftOpen = false; state.choiceCards = []; $('levelModal').hidden = true; refreshUI(); saveRun();
  }

  function nearestEnemy(range = Infinity, reserved = null) {
    const p = state.hero;
    const candidates = state.enemies.filter(e => e.hp > 0 && dist(e, p) <= range).sort((a, b) => dist(a, p) - dist(b, p));
    let nearestVisible = null;
    for (const enemy of candidates) {
      // Physical hits and projectiles need a clear line; don't spend a cooldown
      // on a target hidden behind a tree, rock, wall, or river bend.
      if (terrainPathBlocked(p.x, p.y, enemy.x, enemy.y, 2)) continue;
      if (!nearestVisible) nearestVisible = enemy;
      if (!reserved?.has(enemy.id)) return enemy;
    }
    // If this volley has fewer visible enemies than ready moves, let the
    // remaining skills reinforce the nearest target instead of sitting idle.
    return nearestVisible;
  }
  function damageFloat(enemy, amount, crit) {
    const existing = state.floats.find(f => f.targetId === enemy.id && f.life > f.max * .76);
    if (existing) { existing.value += Math.round(amount); existing.crit ||= crit; existing.text = `${existing.crit ? '会心 ' : ''}${existing.value}`; existing.color = existing.crit ? '#ffe18b' : '#fff0d2'; existing.life = Math.min(existing.max, existing.life + .04); }
    else { const value = Math.round(amount), isCrit = !!crit, max = isCrit ? .78 : .68; state.floats.push({ targetId: enemy.id, x: enemy.x, y: enemy.y - enemy.radius, value, text: `${isCrit ? '会心 ' : ''}${value}`, color: isCrit ? '#ffe18b' : '#fff0d2', crit: isCrit, life: max, max }); }
    if (state.floats.length > 55) state.floats.shift();
  }
  function spark(x, y, color) { state.effects.push({ kind: 'spark', x: x + rand(-8, 8), y: y + rand(-8, 5), vx: rand(-70, 70), vy: rand(-85, 45), life: rand(.18, .38), max: .38, color, size: rand(2, 5) }); }
  function updateEffects(dt) {
    for (const e of [...state.effects]) {
      if (e.kind === 'hazard') {
        e.tick -= dt;
        if (e.tick <= 0) { e.tick += .78; if (dist(e, state.hero) < e.radius && state.hero.invuln <= 0) { hurtHero(4); state.effects.push({ kind: 'impact', style: 'venomHit', x: state.hero.x, y: state.hero.y - 14, angle: 0, life: .24, max: .24, color: e.color }); } }
      }
      if (e.kind === 'weapon' && e.style === 'guardianSlam' && !e.struck) {
        e.hitAt = Math.max(0, e.hitAt - dt);
        if (e.hitAt === 0) { e.struck = true; if (dist(e, state.hero) <= e.radius && state.hero.invuln <= 0) hurtHero(e.damage); state.cameraShake = Math.max(state.cameraShake, dist(e, state.hero) <= e.radius ? 2 : .5); }
      }
      if (e.kind === 'weapon' && e.style === 'absorbVortex' && !e.struck) {
        e.hitAt = Math.max(0, e.hitAt - dt);
        if (e.hitAt > 0) for (const enemy of state.enemies) {
          const d = dist(enemy, e);
          if (enemy.hp > 0 && d < e.radius + enemy.radius && d > 25 && !terrainPathBlocked(enemy.x, enemy.y, e.x, e.y, 2)) {
            const pull = Math.min(d - 25, 138 * dt);
            moveBody(enemy, (e.x - enemy.x) / d * pull, (e.y - enemy.y) / d * pull, enemy.radius * .55);
          }
        }
        if (e.hitAt === 0) {
          e.struck = true; let hits = 0;
          for (const enemy of state.enemies) if (enemy.hp > 0 && dist(enemy, e) <= e.radius + enemy.radius && !terrainPathBlocked(enemy.x, enemy.y, e.x, e.y, 2)) {
            damageEnemy(enemy, e.damage * (enemy.boss ? .72 : 1), e.crit);
            spawnImpact(enemy, 'absorbVortex', Math.atan2(e.y - enemy.y, e.x - enemy.x), e.color, e.crit, e.rank); hits++;
          }
          const p = state.hero;
          p.hp = Math.min(p.maxHp, p.hp + Math.min(9, hits * (1.2 + e.rank * .2)));
          p.qi = Math.min(p.maxQi, p.qi + hits * (3 + Math.floor(e.rank / 2)));
          state.effects.push({ kind: 'weapon', style: 'absorbBurst', x: e.x, y: e.y, life: .52, max: .52, radius: e.radius, hits, color: e.color, rank: e.rank });
          if (hits) state.cameraShake = Math.max(state.cameraShake, 1.1 + Math.min(1, hits * .12));
        }
      }
      if (e.kind === 'weapon' && e.style === 'buddhaPalm' && !e.struck) {
        e.hitAt = Math.max(0, e.hitAt - dt);
        if (e.hitAt === 0) {
          e.struck = true; let hits = 0;
          for (const enemy of state.enemies) if (enemy.hp > 0 && dist(enemy, e) <= e.radius + enemy.radius) {
            damageEnemy(enemy, e.damage * (enemy.boss ? .78 : 1), e.crit); hits++;
            spawnImpact(enemy, 'palm', e.angle - Math.PI / 2, e.color, e.crit, e.rank);
          }
          state.cameraShake = Math.max(state.cameraShake, hits ? 2.8 + Math.min(2, hits * .22) : .8);
          state.effects.push({ kind: 'weapon', style: 'palmShockwave', x: e.x, y: e.y, angle: e.angle, life: .62, max: .62, radius: e.radius, color: e.color, rank: e.rank, hits });
        }
      }
      e.life -= dt;
      if (e.followHero) { e.x = state.hero.x; e.y = state.hero.y; }
      else { e.x += (e.vx || 0) * dt; e.y += (e.vy || 0) * dt; }
    }
    state.effects = state.effects.filter(e => e.life > 0);
    if (state.effects.length > 360) state.effects.splice(0, state.effects.length - 360);
    for (const f of state.floats) { f.y -= 20 * dt; f.life -= dt; }
    state.floats = state.floats.filter(f => f.life > 0);
    state.cameraShake = Math.max(0, state.cameraShake - dt * 8); hitFlash = Math.max(0, hitFlash - dt);
  }

  function updatePet(dt) {
    const p = state.hero; state.petGuardTimer = Math.max(0, (state.petGuardTimer || 0) - dt);
    if (!state.pet) return;
    state.petCd -= dt; state.petAttack = Math.max(0, (state.petAttack || 0) - dt);
    if (state.pet === 'tiger' && state.petPounce) {
      const pounce = state.petPounce, target = state.enemies.find(e => e.id === pounce.targetId && e.hp > 0);
      if (!target) { state.petPounce = null; state.petAttack = Math.min(state.petAttack, .12); return; }
      const dx = target.x - state.petX, dy = target.y - state.petY, d = Math.hypot(dx, dy) || 1;
      state.petFacingX = dx / d; pounce.elapsed += dt; state.petWalkTime += dt * 14;
      const stopAt = target.radius + 26, step = Math.min(520 * dt, Math.max(0, d - stopAt));
      let moved = step <= .1;
      if (step > .1) {
        const pet = { x: state.petX, y: state.petY };
        moveBody(pet, dx / d * step, dy / d * step, 9);
        moved = Math.hypot(pet.x - state.petX, pet.y - state.petY) > .35;
        if (moved) { state.petX = pet.x; state.petY = pet.y; }
      }
      const remaining = Math.hypot(target.x - state.petX, target.y - state.petY);
      if (remaining <= stopAt + 8) {
        const hitAngle = Math.atan2(target.y - state.petY, target.x - state.petX);
        state.petAttack = .22;
        damageEnemy(target, 24 + (p.level || 1) * 4);
        spawnImpact(target, 'beastSwipe', hitAngle, '#f3a45b', false, p.level || 1);
        state.effects.push({ kind: 'weapon', style: 'tigerPounce', x: target.x, y: target.y, angle: hitAngle, life: .42, max: .42, color: '#f3a45b', rank: 1 });
        state.cameraShake = Math.max(state.cameraShake, .65);
        state.petPounce = null;
      } else if (!moved || pounce.elapsed > .46) {
        state.petPounce = null; state.petAttack = Math.min(state.petAttack, .1);
      }
      return;
    }
    const dx = p.x - state.petX, dy = p.y - state.petY, d = Math.hypot(dx, dy) || 1;
    if (d > 80) {
      const pet = { x: state.petX, y: state.petY }, step = Math.min(260 * dt, d - 80);
      if (moveBody(pet, dx / d * step, dy / d * step, 9)) { state.petX = pet.x; state.petY = pet.y; state.petFacingX = dx / d; state.petWalkTime += dt * 10; }
    } else state.petWalkTime += dt * .9;
    const target = nearestEnemy(260);
    if (state.pet === 'tortoise' && state.petCd <= 0) {
      state.petCd = 7.6; state.petGuardTimer = 3.4;
      state.effects.push({ kind: 'weapon', style: 'turtleWard', followHero: true, x: p.x, y: p.y, life: 3.4, max: 3.4, color: '#8de1c5', rank: 1 });
    } else if (state.pet === 'crane' && state.petCd <= 0) {
      state.petCd = 6.4; state.petAttack = .42;
      const healed = Math.min(p.maxHp - p.hp, 4 + Math.floor((p.level || 1) / 3));
      if (healed > 0) { p.hp += healed; state.effects.push({ kind: 'heal', x: p.x, y: p.y, life: .82, max: .82 }); }
      if (target) {
        const a = Math.atan2(target.y - state.petY, target.x - state.petX); state.petFacingX = Math.cos(a);
        state.shots.push({ side: 'hero', x: state.petX + Math.cos(a) * 20, y: state.petY - 22 + Math.sin(a) * 9, vx: Math.cos(a) * 480, vy: Math.sin(a) * 480, life: .75, r: 7, damage: 17 + (p.level || 1) * 2, pierce: 1, hit: new Set(), style: 'feather', color: '#bde8df' });
      }
    } else if (state.pet === 'tiger' && state.petCd <= 0) {
      if (target && dist(target, { x: state.petX, y: state.petY }) < 205 && !terrainPathBlocked(state.petX, state.petY, target.x, target.y, 3)) {
        state.petCd = 2.8; state.petPounce = { targetId: target.id, elapsed: 0 };
        state.petFacingX = Math.sign(target.x - state.petX) || 1; state.petAttack = .46;
      } else state.petCd = .18;
    } else if (state.pet === 'fox' && target && state.petCd <= 0) {
      state.petCd = 1.8; const a = Math.atan2(target.y - state.petY, target.x - state.petX); state.petAttack = .32; state.petFacingX = Math.cos(a);
      state.shots.push({ side: 'hero', x: state.petX + Math.cos(a) * 18, y: state.petY - 18 + Math.sin(a) * 9, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, life: .8, r: 9, damage: 12 + (p.level || 1) * 2, pierce: 0, hit: new Set(), style: 'paw', color: '#efcc7d' });
      state.effects.push({ kind: 'spark', x: state.petX + Math.cos(a) * 20, y: state.petY - 23 + Math.sin(a) * 8, vx: Math.cos(a) * 25, vy: -20, life: .3, max: .3, color: '#9de6c6', size: 5 });
    }
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
    const p = state.hero, facing = Math.hypot(p.facingX, p.facingY) > .01 ? Math.atan2(p.facingY, p.facingX) : 0;
    const a = facing + rand(-.52, .52), d = Math.max(viewW, viewH) * .62, region = getLandscapeRegion(p.x, p.y);
    const biomeBoss = { bamboo: 'boar', ridge: 'boar', temple: 'guardian', crag: 'guardian', lotus: 'serpent', marsh: 'serpent', peach: 'chief', pass: 'chief' };
    const remoteBoss = region?.strength > .62 && state.wave >= 4 ? biomeBoss[region.region.id] : null;
    const useDragon = state.wave >= 7 && (!remoteBoss || ['lotus', 'marsh'].includes(region?.region.id)) && Math.random() < .42;
    const type = useDragon ? 'dragon' : remoteBoss || 'chief';
    const e = spawnEnemy(type, p.x + Math.cos(a) * d, p.y + Math.sin(a) * d, { boss: true, regionalBoss: !!remoteBoss });
    if (e) {
      e.hp *= 1.8; e.maxHp = e.hp; e.damage *= 1.08; e.radius *= 1.2;
      state.event = `${e.name}现身江湖！看上方金色箭头追踪`; state.eventUntil = state.elapsed + 8; setToast(`${e.name}现身！金色指引标出方位，迎上去或先清周围敌人。`, 4);
    }
    state.nextBossAt += 180;
  }

  function campData(cx, cy) {
    const rnd = rngFor(cx, cy); if (rnd() > .14) return null;
    const x = cx * CAMP_SIZE + CAMP_SIZE * (.24 + rnd() * .52), y = cy * CAMP_SIZE + CAMP_SIZE * (.24 + rnd() * .52), key = `${cx},${cy}`;
    const villageBuffer = 250;
    if (x >= VILLAGE.x - villageBuffer && x <= VILLAGE.x + VILLAGE.w + villageBuffer
      && y >= VILLAGE.y - villageBuffer && y <= VILLAGE.y + VILLAGE.h + villageBuffer) return null;
    return { x, y, key, seed: seedFor(cx, cy) };
  }
  function updateCamps() {
    const cx = Math.floor(state.hero.x / CAMP_SIZE), cy = Math.floor(state.hero.y / CAMP_SIZE);
    for (let x = cx - 1; x <= cx + 1; x++) for (let y = cy - 1; y <= cy + 1; y++) {
      const camp = campData(x, y); if (!camp || state.campActive.has(camp.key) || state.campCleared.has(camp.key) || Math.hypot(camp.x - state.hero.x, camp.y - state.hero.y) > 275) continue;
      state.campActive.add(camp.key); const chief = spawnEnemy('chief', camp.x, camp.y, { campKey: camp.key }); chief.hp *= .72; chief.maxHp = chief.hp;
      for (let i = 0; i < 4; i++) { const x = camp.x + rand(-110, 110), y = camp.y + rand(-110, 110); spawnEnemy(selectEnemy(state.wave, x, y), x, y); }
      state.event = '你闯入了一处山寨据点'; state.eventUntil = state.elapsed + 6; setToast('山寨头目与守卫冲出营寨！', 3);
    }
  }

  function updateDrops(dt) {
    for (const d of state.drops) {
      d.bob = (d.bob || 0) + dt * 4;
      const distance = dist(d, state.hero);
      // Coins gently follow when nearby so the player can keep moving through
      // a fight and still collect the reward. Secret manuals remain deliberate pickups.
      if (d.type === 'coin' && distance < 132 && distance > 2) {
        const speed = 330 + (132 - distance) * 1.1;
        d.x += (state.hero.x - d.x) / distance * speed * dt;
        d.y += (state.hero.y - d.y) / distance * speed * dt;
      }
      if (dist(d, state.hero) < (d.type === 'coin' ? 28 : 38)) {
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
    const p = state.hero, move = displayWeaponMove(), spec = specFor(move), alive = state.villagers.filter(v => v.alive).length, weather = weatherTypes[state.weather];
    $('regionName').textContent = regionName(p.x, p.y); $('goldText').textContent = state.gold;
    $('timeText').textContent = formatTime(state.elapsed); $('levelText').textContent = `${realmName(p.level || 1)} · ${p.level || 1}`; $('killText').textContent = state.kills;
    $('weatherText').textContent = weather.name; $('weatherIcon').textContent = weather.icon;
    $('hpText').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`; $('hpBar').style.width = `${clamp(p.hp / p.maxHp * 100, 0, 100)}%`;
    $('qiText').textContent = `${Math.floor(p.qi)} / ${p.maxQi}`; $('qiBar').style.width = `${clamp(p.qi / p.maxQi * 100, 0, 100)}%`;
    $('xpText').textContent = `${Math.floor(state.xp || 0)} / ${xpNeed()}`; $('xpBar').style.width = `${clamp((state.xp || 0) / xpNeed() * 100, 0, 100)}%`;
    $('damageText').textContent = p.damage; $('critText').textContent = Math.round(p.crit * 100); $('speedText').textContent = Math.round(p.speed * (p.lightnessSpeedTimer > 0 ? 1.3 : 1)); $('villagerText').textContent = `${alive}/3`;
    $('weaponName').textContent = spec?.name || '赤手空拳'; $('moveHint').textContent = state.raidWarning ? '安平镇即将遇袭 · 往镇南回防' : state.petGuardTimer > 0 ? `玄甲护阵 · 伤害减免 22% · ${state.petGuardTimer.toFixed(1)} 秒` : p.lightnessSpeedTimer > 0 ? `凌波微步 · 移速 +30% · 闪避 ${Math.round((p.lightnessDodgeChance || .24) * 100)}%` : state.enemies.length ? `已学招式同步出手 · 附近 ${state.enemies.length} 敌` : '走位避招，收集散落阅历';
    $('skillSlots').innerHTML = Array.from({ length: 8 }, (_, i) => {
      const m = state.moves[i], s = m ? moveSpecs[m.id] : null;
      return `<div class="skill-slot ${s ? 'learned' : 'empty'}" ${s ? `data-category="${s.category}"` : ''}><span class="slot-icon">${s?.icon || '·'}</span><b>${s?.name || '空位'}</b><small>${s ? `<span class="slot-category">${s.category}</span><span class="slot-kind"> · ${s.kind}</span>` : '升级可习得'}</small>${m ? `<span class="level-tag">${m.level}重</span>` : ''}</div>`;
    }).join('');
    const boss = state.enemies.filter(e => e.boss && e.hp > 0).sort((a, b) => dist(a, p) - dist(b, p))[0];
    $('bossBar').hidden = !boss;
    if (boss) {
      $('bossName').textContent = boss.name; $('bossHpText').textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${Math.ceil(boss.maxHp)}`; $('bossHpBar').style.width = `${clamp(boss.hp / boss.maxHp * 100, 0, 100)}%`;
      const screenX = w / 2 + (boss.x - cameraX) * scale, screenY = h / 2 + (boss.y - cameraY) * scale;
      const offscreen = screenX < 30 || screenX > w - 30 || screenY < 158 || screenY > h - 165;
      $('bossDirection').hidden = !offscreen;
      if (offscreen) {
        $('bossDirectionArrow').style.transform = `rotate(${Math.atan2(screenY - h / 2, screenX - w / 2)}rad)`;
        const distance = dist(boss, p); $('bossDirectionDistance').textContent = distance >= 1000 ? `${(distance / 1000).toFixed(1)}km` : `${Math.round(distance)}m`;
      }
    } else $('bossDirection').hidden = true;
    $('eventRibbon').hidden = !state.event || state.eventUntil < state.elapsed; $('eventText').textContent = state.event || '';
    if (!$('mapModal').hidden) drawMap();
  }
  function regionName(x, y) {
    const inTown = x >= VILLAGE.x - 120 && x <= VILLAGE.x + VILLAGE.w + 120 && y >= VILLAGE.y - 120 && y <= VILLAGE.y + VILLAGE.h + 120;
    if (inTown) return '安平镇';
    return getLandscapeRegion(x, y)?.region.name || '青林野地';
  }
  function realmName(lvl) { return lvl < 3 ? '初入江湖' : lvl < 7 ? '三流武者' : lvl < 12 ? '二流高手' : lvl < 20 ? '一流高手' : '绝世宗师'; }
  function formatTime(n) { return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(Math.floor(n % 60)).padStart(2, '0')}`; }
  function renderBag() {
    if (!state) return;
    $('bagSkills').innerHTML = ['外功', '内功', '轻功'].map(category => {
      const moves = state.moves.filter(m => moveSpecs[m.id]?.category === category);
      const items = moves.map(m => { const s = moveSpecs[m.id]; return `<div class="bag-item"><i>${s.icon}</i><div><b>${s.name} · 第 ${m.level} 重</b><small>${s.desc} · 独立冷却，自动施展</small></div></div>`; }).join('') || '<small>尚未习得</small>';
      return `<section class="bag-skill-group" data-category="${category}"><h4>${category}<small>并行出招</small></h4>${items}</section>`;
    }).join('');
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
    const sceneryProps = drawGround(); drawCamps(); drawVillage(); drawWeather();
    for (const o of state.orbs) drawOrb(o); for (const d of state.drops) drawDrop(d);
    const actors = state.enemies.filter(e => e.hp > 0).map(e => ({ y: e.y, type: 'enemy', ref: e })); actors.push({ y: p.y, type: 'hero', ref: p }); if (state.pet) actors.push({ y: state.petY, type: 'pet', ref: state });
    for (const prop of sceneryProps) actors.push({ y: prop.y, type: 'prop', ref: prop });
    actors.sort((a, b) => a.y - b.y);
    for (const a of actors) { if (a.type === 'enemy') drawEnemy(a.ref); else if (a.type === 'hero') drawHero(a.ref); else if (a.type === 'pet') drawPet(a.ref); else drawWorldProp(a.ref); }
    drawLandmarks();
    // Keep the player readable when a crowd's feet sorting would otherwise hide the whole sprite.
    if (state.enemies.some(e => e.hp > 0 && dist(e, p) < e.radius + 18)) {
      ctx.save(); ctx.strokeStyle = '#f2d68a'; ctx.lineWidth = 2; ctx.globalAlpha = .82; ctx.shadowColor = '#efc76f'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 3, 25, 9, 0, 0, TAU); ctx.stroke(); ctx.restore();
      drawHero(p);
    }
    // The summoned dragon is an aura around the martial artist; render it over foliage and combatants.
    drawDragonCoils();
    // Keep the martial artist readable when the dragon crosses the foreground of its orbit.
    if (state.effects.some(e => e.kind === 'weapon' && e.style === 'dragonCoil')) drawHero(p);
    drawShots(); drawEffects(); drawFloats(); drawTelegraphs();
    const weather = weatherTypes[state.weather]; if (weather.tint) { ctx.fillStyle = weather.tint; ctx.fillRect(cameraX - viewW / 2, cameraY - viewH / 2, viewW, viewH); }
    const vignette = ctx.createRadialGradient(cameraX, cameraY, Math.min(viewW, viewH) * .3, cameraX, cameraY, Math.max(viewW, viewH) * .65); vignette.addColorStop(0, '#060a0800'); vignette.addColorStop(1, '#060a0830'); ctx.fillStyle = vignette; ctx.fillRect(cameraX - viewW / 2, cameraY - viewH / 2, viewW, viewH);
    if (hitFlash > 0) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(185,55,38,${hitFlash * .34})`; ctx.fillRect(0, 0, w, h); }
  }

  function drawGround() {
    const pattern = getPattern('grove'), left = cameraX - viewW / 2 - 100, top = cameraY - viewH / 2 - 100;
    ctx.fillStyle = '#737552'; ctx.fillRect(left, top, viewW + 200, viewH + 200);
    if (pattern) { ctx.globalAlpha = .68; ctx.fillStyle = pattern; ctx.fillRect(left, top, viewW + 200, viewH + 200); ctx.globalAlpha = 1; }
    else { ctx.fillStyle = '#656340'; ctx.fillRect(left, top, viewW + 200, viewH + 200); }
    drawRegionLandscapes(left, top, viewW + 200, viewH + 200);
    // Regions use their own flora, ground colors and winding trails so exploration changes the whole scene.
    const cx1 = Math.floor(left / 900), cx2 = Math.floor((left + viewW + 200) / 900), cy1 = Math.floor(top / 900), cy2 = Math.floor((top + viewH + 200) / 900);
    const visibleProps = [];
    for (let cx = cx1; cx <= cx2; cx++) for (let cy = cy1; cy <= cy2; cy++) visibleProps.push(...worldPropsForCell(cx, cy));
    visibleProps.sort((a, b) => a.y - b.y);
    const village = getVillageBlend(); if (village) ctx.drawImage(village, VILLAGE.x, VILLAGE.y, VILLAGE.w, VILLAGE.h);
    return visibleProps;
  }
  function drawWorldProp(prop) {
    const p = state.hero, tallFoliage = ['tree', 'pine', 'bamboo', 'willow', 'blossom', 'dead-tree'].includes(prop.type);
    if (tallFoliage && prop.y >= p.y - 4) {
      const halfWidth = prop.r * (prop.type === 'tree' || prop.type === 'pine' ? 2.08 : prop.type === 'bamboo' ? 1.72 : prop.type === 'willow' ? 1.48 : prop.type === 'blossom' ? 1.2 : .82);
      const height = prop.r * (prop.type === 'blossom' ? 2.15 : prop.type === 'dead-tree' ? 1.4 : prop.type === 'bamboo' ? 3.8 : 4.18);
      const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
      const overlapX = smooth((halfWidth + 34 - Math.abs(prop.x - p.x)) / 42);
      const overlapY = smooth((height + 34 - (prop.y - p.y)) / 38);
      const overlap = overlapX * overlapY;
      ctx.save(); if (overlap > 0) ctx.globalAlpha *= 1 - overlap * .62;
    }
    if (prop.type === 'tree') drawWorldTree(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'rock') drawWorldRock(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'ground-cover') drawGroundCover(prop);
    else if (prop.type === 'shrub') drawWorldShrub(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'bamboo') drawBamboo(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'bamboo-shrub') drawBambooLeaves(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'pine') drawWorldPine(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'cliff') drawWorldCliff(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'pillar') drawWorldPillar(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'reed') drawWorldReeds(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'lotus') drawWorldLotus(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'willow') drawWorldWillow(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'blossom') drawWorldBlossom(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'dead-tree') drawWorldDeadTree(prop.x, prop.y, prop.r, prop.seed);
    else if (prop.type === 'banner') drawWorldBanner(prop.x, prop.y, prop.r, prop.seed);
    if (tallFoliage && prop.y >= p.y - 4) ctx.restore();
  }
  function drawWorldTree(x, y, r, seed) {
    if (woodlandTreeSprite.complete && woodlandTreeSprite.naturalWidth) {
      const variation = .92 + seed * .18, width = r * 4.05 * variation, height = r * 4.18 * variation;
      ctx.save(); ctx.translate(x, y + 4); ctx.rotate(Math.sin(state.elapsed * 1.2 + seed * TAU) * .006);
      if (seed > .5) ctx.scale(-1, 1);
      ctx.drawImage(woodlandTreeSprite, -width / 2, -height, width, height); ctx.restore(); return;
    }
    drawProceduralTree(x, y, r, seed);
  }
  function drawProceduralTree(x, y, r, seed) {
    const parentAlpha = ctx.globalAlpha;
    ctx.fillStyle = '#12191165'; ctx.beginPath(); ctx.ellipse(x, y + 8, r * 1.6, r * .7, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#64452a'; ctx.fillRect(x - r * .14, y - 4, r * .28, r * .94); ctx.fillStyle = '#8c633b'; ctx.fillRect(x - r * .05, y + 1, r * .09, r * .8);
    const hues = seed > .62 ? ['#31543b','#3e6745','#58804e','#79915a'] : ['#344f37','#456542','#5d7548','#718755'];
    const lobes = [[-.62,-.38,.62],[.12,-.79,.82],[.70,-.34,.58],[-.06,-.28,.67]];
    for (let i=0;i<lobes.length;i++) { const [dx,dy,rr]=lobes[i]; ctx.fillStyle=hues[(i+Math.floor(seed*4))%hues.length]; ctx.beginPath(); ctx.arc(x+dx*r,y+dy*r,rr*r,0,TAU); ctx.fill(); }
    ctx.fillStyle = '#9ead68'; ctx.globalAlpha = .42;
    for (let i=0;i<5;i++) { const a=seed*TAU+i*1.3; ctx.beginPath(); ctx.ellipse(x+Math.cos(a)*r*.45,y-r*.53+Math.sin(a)*r*.27,r*.14,r*.07,a,0,TAU); ctx.fill(); }
    ctx.globalAlpha = parentAlpha;
  }
  function drawWorldRock(x, y, r, seed) {
    const variationSeed = Number.isFinite(seed) ? seed : (Math.sin(x * .17 + y * .11) + 1) * .5;
    if (woodlandStoneSprite.complete && woodlandStoneSprite.naturalWidth) {
      const variation = .9 + variationSeed * .18, width = r * 3.15 * variation, height = r * 2.12 * variation;
      ctx.save(); ctx.translate(x, y + 4); if (variationSeed > .5) ctx.scale(-1, 1);
      ctx.drawImage(woodlandStoneSprite, -width / 2, -height, width, height); ctx.restore(); return;
    }
    ctx.fillStyle = '#333c30'; ctx.beginPath(); ctx.ellipse(x, y + 4, r * 1.3, r * .62, -.14, 0, TAU); ctx.fill(); ctx.fillStyle = '#777962'; ctx.beginPath(); ctx.ellipse(x, y, r, r * .65, -.13, 0, TAU); ctx.fill(); ctx.fillStyle = '#c0b68c60'; ctx.beginPath(); ctx.ellipse(x - r * .25, y - r * .15, r * .35, r * .17, -.4, 0, TAU); ctx.fill();
  }
  function drawWorldShrub(x, y, r, seed) {
    const variationSeed = Number.isFinite(seed) ? seed : (Math.sin(x * .09 + y * .17) + 1) * .5;
    if (woodlandFoliageSprite.complete && woodlandFoliageSprite.naturalWidth) {
      const variation = .88 + variationSeed * .22, width = r * 3.15 * variation, height = r * 2.05 * variation;
      ctx.save(); ctx.translate(x, y + 2); if (variationSeed > .5) ctx.scale(-1, 1);
      ctx.drawImage(woodlandFoliageSprite, -width / 2, -height, width, height); ctx.restore(); return;
    }
    ctx.fillStyle = '#42603a'; for (let i = -1; i < 2; i++) { ctx.beginPath(); ctx.arc(x + i * r * .56, y + Math.abs(i) * 2, r * .58, 0, TAU); ctx.fill(); } ctx.fillStyle = '#a8b36b'; ctx.fillRect(x - 2, y - r * .3, 3, 2);
  }
  function drawGroundCover(prop) {
    const { x, y, r, seed, region } = prop;
    const palettes = {
      grove: ['#385a3c', '#587447', '#789056', '#9a9d63'],
      bamboo: ['#356344', '#4c7950', '#769253', '#9eaa67'],
      ridge: ['#465a3e', '#65734a', '#828457', '#a39a69'],
      temple: ['#40583e', '#63764b', '#82915a', '#b0a477'],
      lotus: ['#416856', '#63836a', '#8c9c6d', '#a4aa78'],
      marsh: ['#3d6554', '#5f8061', '#849364', '#a0a06b'],
      peach: ['#536c42', '#71864b', '#b17b70', '#d0a075'],
      pass: ['#536447', '#768154', '#a28a5d', '#c2a56c'],
      crag: ['#46573e', '#67734d', '#89815b', '#a69a73']
    };
    const colors = palettes[region] || palettes.grove, sway = Math.sin(state.elapsed * .8 + seed * TAU) * .045;
    ctx.save(); ctx.translate(x, y); ctx.rotate((seed - .5) * .8 + sway);
    ctx.fillStyle = '#19201935'; ctx.beginPath(); ctx.ellipse(0, r * .13, r * 1.12, r * .28, 0, 0, TAU); ctx.fill();
    const blades = 4 + Math.floor(seed * 4);
    for (let i = 0; i < blades; i++) {
      const angle = (i / blades - .5) * 1.55 + (seed - .5) * .4, length = r * (.86 + ((i * 7 + Math.floor(seed * 9)) % 5) * .1), width = length * (.2 + ((i * 3) % 3) * .045);
      const baseX = Math.sin((i / blades - .5) * Math.PI) * r * .17;
      ctx.save(); ctx.translate(baseX, r * .08); ctx.rotate(angle);
      ctx.fillStyle = colors[(i + Math.floor(seed * 4)) % colors.length]; ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-width * .82, -length * .28, -width * .58, -length * .76, 0, -length);
      ctx.bezierCurveTo(width * .58, -length * .76, width * .82, -length * .28, 0, 0); ctx.fill();
      ctx.strokeStyle = '#d4c98b45'; ctx.lineWidth = .65; ctx.beginPath(); ctx.moveTo(0, -1); ctx.quadraticCurveTo(0, -length * .53, 0, -length * .83); ctx.stroke(); ctx.restore();
    }
    if (seed > .95 && (region === 'peach' || region === 'lotus' || region === 'marsh' || (region === 'grove' && seed > .985))) {
      const petal = region === 'peach' ? '#e8b9a0' : region === 'marsh' || region === 'lotus' ? '#e2d3a1' : '#d7ca8b';
      const fx = r * (seed - .87) * 3.1, fy = -r * (.36 + seed * .18);
      ctx.fillStyle = petal;
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * r * .12, fy + Math.sin(a) * r * .12, r * .11, r * .07, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#e1b65e'; ctx.beginPath(); ctx.arc(fx, fy, Math.max(1, r * .065), 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function drawBamboo(x,y,r,seed) {
    if (bambooClumpSprite.complete && bambooClumpSprite.naturalWidth) {
      const low = seed < .38 && bambooLowSprite.complete && bambooLowSprite.naturalWidth;
      const sprite = low ? bambooLowSprite : bambooClumpSprite;
      const variation = .88 + seed * .22, width = r * (low ? 4.1 : 3.35) * variation, height = r * (low ? 3.0 : 3.8) * variation;
      ctx.fillStyle = '#17231e28'; ctx.beginPath(); ctx.ellipse(x, y + 4, width * (low ? .34 : .25), r * .24, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(x, y + 2); ctx.rotate(Math.sin(state.elapsed * .7 + seed * TAU) * .009 + (seed - .5) * .04);
      if (seed > .5) ctx.scale(-1, 1);
      ctx.drawImage(sprite, -width / 2, -height, width, height); ctx.restore(); return;
    }
    ctx.fillStyle='#1221184a'; ctx.beginPath(); ctx.ellipse(x,y+5,r*1.55,r*.48,-.08,0,TAU); ctx.fill();
    const count=5+Math.floor(seed*4); ctx.lineCap='round';
    for(let i=0;i<count;i++){ const u=(i/(count-1)-.5)*1.5, h=r*(1.6+((i*7)%4)*.21), bx=x+u*r*.9, lean=(seed-.5)*r*.28+u*r*.12, top= y-h;
      ctx.strokeStyle=i%3===0?'#365f3b':'#547d49';ctx.lineWidth=Math.max(1.8,r*.13);ctx.beginPath();ctx.moveTo(bx,y);ctx.quadraticCurveTo(bx+lean*.25,y-h*.54,bx+lean,top);ctx.stroke();
      ctx.strokeStyle='#a3b36a';ctx.lineWidth=1;for(let n=1;n<4;n++){const ny=y-h*n/4;ctx.beginPath();ctx.moveTo(bx+lean*n/4-r*.07,ny+2);ctx.lineTo(bx+lean*n/4+r*.07,ny+2);ctx.stroke();}
      if(i%2===0){ctx.strokeStyle='#789758';ctx.lineWidth=1.5;for(const sign of [-1,1]){ctx.beginPath();ctx.moveTo(bx+lean,top+r*.2);ctx.quadraticCurveTo(bx+lean+sign*r*.3,top-r*.05,bx+lean+sign*r*.52,top-r*.32);ctx.stroke();}}
    }
  }
  function drawBambooLeaves(x,y,r,seed){ctx.fillStyle='#17302035';ctx.beginPath();ctx.ellipse(x,y+3,r*1.2,r*.45,0,0,TAU);ctx.fill();for(let i=0;i<7;i++){const a=seed*TAU+i*.9,rr=r*(.35+(i%3)*.17);ctx.fillStyle=i%2?'#507a49':'#77945a';ctx.beginPath();ctx.ellipse(x+Math.cos(a)*rr,y+Math.sin(a)*rr*.48,rr*.38,rr*.13,a,0,TAU);ctx.fill();}}
  function drawWorldPine(x, y, r, seed) {
    const variationSeed = Number.isFinite(seed) ? seed : (Math.sin(x * .13 + y * .19) + 1) * .5;
    if (woodlandPineSprite.complete && woodlandPineSprite.naturalWidth) {
      const variation = .9 + variationSeed * .2, width = r * 4.15 * variation, height = r * 4.05 * variation;
      ctx.save(); ctx.translate(x, y + 4); ctx.rotate(Math.sin(state.elapsed * 1.05 + variationSeed * TAU) * .004);
      if (variationSeed > .5) ctx.scale(-1, 1);
      ctx.drawImage(woodlandPineSprite, -width / 2, -height, width, height); ctx.restore(); return;
    }
    ctx.fillStyle = '#17201866'; ctx.beginPath(); ctx.ellipse(x, y + 7, r * 1.25, r * .5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#51412f'; ctx.fillRect(x - r * .09, y - r * .06, r * .18, r * .75);
    for (let i = 0; i < 4; i++) { const yy = y - r * (.22 + i * .32), width = r * (1.2 - i * .2); ctx.fillStyle = ['#293f35','#36523c','#476548','#5d7650'][i]; ctx.beginPath(); ctx.moveTo(x, yy - r * .43); ctx.lineTo(x - width * .55, yy + r * .28); ctx.quadraticCurveTo(x, yy + r * .05, x + width * .55, yy + r * .28); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#a1ae72'; ctx.globalAlpha = .55; ctx.beginPath(); ctx.arc(x - r * .1, y - r * .55, 2.5, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
  }
  function drawWorldCliff(x,y,r,seed){
    const variationSeed = Number.isFinite(seed) ? seed : (Math.sin(x * .13 + y * .19) + 1) * .5;
    if (mountainCliffSprite.complete && mountainCliffSprite.naturalWidth) {
      const variation = .9 + variationSeed * .18, width = r * 3.65 * variation, height = r * 2.75 * variation;
      ctx.save(); ctx.translate(x, y + 4); if (variationSeed > .5) ctx.scale(-1, 1);
      ctx.drawImage(mountainCliffSprite, -width / 2, -height, width, height); ctx.restore(); return;
    }
    drawWorldRock(x, y, r * 1.1, variationSeed);
  }
  function drawWorldPillar(x, y, r, seed) {
    const variation = Number.isFinite(seed) ? seed : .5;
    const width = r * (.82 + variation * .2), height = r * (1.16 + variation * .18);
    const lean = (variation - .5) * r * .18;
    ctx.save(); ctx.translate(x, y + 3); ctx.rotate((variation - .5) * .08);
    ctx.fillStyle = '#20292262'; ctx.beginPath(); ctx.ellipse(0, 4, width * .82, r * .34, 0, 0, TAU); ctx.fill();

    // Broken footing stones make these read as old ruins rather than map markers.
    ctx.fillStyle = '#454c45'; ctx.beginPath();
    ctx.moveTo(-width * .66, 1); ctx.lineTo(-width * .54, -r * .22); ctx.lineTo(-width * .20, -r * .28);
    ctx.lineTo(width * .08, -r * .18); ctx.lineTo(width * .60, -r * .24); ctx.lineTo(width * .72, 2);
    ctx.lineTo(width * .36, r * .10); ctx.lineTo(-width * .38, r * .08); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#777d6c'; ctx.beginPath();
    ctx.moveTo(-width * .55, -r * .02); ctx.lineTo(-width * .43, -r * .20); ctx.lineTo(-width * .16, -r * .22);
    ctx.lineTo(width * .04, -r * .12); ctx.lineTo(width * .48, -r * .19); ctx.lineTo(width * .58, -r * .02);
    ctx.lineTo(width * .28, r * .02); ctx.lineTo(-width * .34, r * .02); ctx.closePath(); ctx.fill();

    const top = -height;
    ctx.beginPath(); ctx.moveTo(-width * .43, 0); ctx.lineTo(-width * .38, top * .76);
    ctx.lineTo(-width * .26, top * .91); ctx.lineTo(-width * .12, top * .84);
    ctx.lineTo(width * .02, top); ctx.lineTo(width * .20, top * .94);
    ctx.lineTo(width * .43, top * .80); ctx.lineTo(width * .38, 0); ctx.closePath();
    const stone = ctx.createLinearGradient(-width * .4, top, width * .4, 0);
    stone.addColorStop(0, '#a49d84'); stone.addColorStop(.48, '#858573'); stone.addColorStop(1, '#5b6258');
    ctx.fillStyle = stone; ctx.fill();
    ctx.strokeStyle = '#c0b694'; ctx.lineWidth = Math.max(.8, r * .045); ctx.beginPath();
    ctx.moveTo(-width * .38, top * .76); ctx.lineTo(-width * .26, top * .91); ctx.lineTo(-width * .12, top * .84);
    ctx.lineTo(width * .02, top); ctx.stroke();

    // Weathered face, chipped corners, a worn seal and a few readable cracks.
    ctx.fillStyle = '#686d61'; ctx.beginPath();
    ctx.moveTo(width * .17, top * .94); ctx.lineTo(width * .43, top * .80); ctx.lineTo(width * .38, 0);
    ctx.lineTo(width * .18, -r * .05); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#d0c5a2a8'; ctx.lineWidth = Math.max(.7, r * .035);
    ctx.beginPath(); ctx.moveTo(-width * .29, top * .79); ctx.lineTo(-width * .27, -r * .36); ctx.stroke();
    ctx.strokeStyle = '#424940'; ctx.lineWidth = Math.max(.8, r * .04);
    ctx.beginPath(); ctx.moveTo(lean - width * .05, top * .22); ctx.lineTo(lean + width * .04, top * .34); ctx.lineTo(lean - width * .01, top * .47); ctx.lineTo(lean + width * .11, top * .57); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width * .27, top * .59); ctx.lineTo(width * .16, top * .66); ctx.lineTo(width * .19, top * .75); ctx.stroke();
    ctx.strokeStyle = '#b4a987'; ctx.lineWidth = Math.max(.6, r * .025);
    ctx.beginPath(); ctx.arc(-lean * .2, top * .43, r * .14, 0, TAU); ctx.moveTo(-r * .20, top * .43); ctx.lineTo(r * .20, top * .43); ctx.moveTo(0, top * .60); ctx.lineTo(0, top * .30); ctx.stroke();
    ctx.fillStyle = '#74805a'; ctx.globalAlpha = .8;
    ctx.beginPath(); ctx.ellipse(-width * .24, -r * .12, width * .16, r * .075, -.12, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(width * .31, top * .72, width * .10, r * .06, .35, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawWorldReeds(x,y,r,seed){ctx.fillStyle='#1c292344';ctx.beginPath();ctx.ellipse(x,y+3,r*1.2,r*.4,0,0,TAU);ctx.fill();for(let i=0;i<7;i++){const bx=x+(i/6-.5)*r*1.25,h=r*(.7+((i*3)%4)*.24),lean=(seed-.5)*r*.45+(i-3)*r*.08;ctx.strokeStyle=i%2?'#738553':'#98a365';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(bx,y);ctx.quadraticCurveTo(bx+lean*.3,y-h*.55,bx+lean,y-h);ctx.stroke();if(i%2===0){ctx.fillStyle='#806743';ctx.beginPath();ctx.ellipse(bx+lean,y-h,r*.07,r*.17,lean*.01,0,TAU);ctx.fill();}}}
  function drawWorldLotus(x,y,r,seed){
    if (lotusPondSprite.complete && lotusPondSprite.naturalWidth) {
      const variation = .91 + seed * .18, width = r * 4.5 * variation, height = r * 3.0 * variation;
      ctx.save(); ctx.translate(x, y + 2); ctx.rotate((seed - .5) * .10); if (seed > .5) ctx.scale(-1, 1);
      ctx.drawImage(lotusPondSprite, -width / 2, -height / 2, width, height);
      ctx.globalAlpha = .48;
      for (let i = 0; i < 4; i++) {
        const phase = state.elapsed * (.55 + i * .06) + seed * 8 + i * 1.91;
        const gx = Math.sin(phase) * width * .27, gy = Math.cos(phase * .78) * height * .22;
        ctx.strokeStyle = i % 2 ? '#d3f5dd' : '#fff0c2'; ctx.lineWidth = 1 + (i % 2) * .6;
        ctx.beginPath(); ctx.ellipse(gx, gy, width * (.045 + (i % 2) * .018), height * .014, phase * .12, .25, 2.2); ctx.stroke();
      }
      ctx.restore(); return;
    }
    const waterRx = r * 1.58, waterRy = r * .72;
    ctx.save();
    ctx.fillStyle = '#14252245'; ctx.beginPath(); ctx.ellipse(x, y + r * .13, waterRx * 1.08, waterRy * 1.12, -.08, 0, TAU); ctx.fill();
    const water = ctx.createRadialGradient(x - r * .35, y - r * .32, r * .06, x, y, waterRx * 1.18);
    water.addColorStop(0, '#8dbcb260'); water.addColorStop(.58, '#4d928cdd'); water.addColorStop(1, '#285d5bdd');
    ctx.fillStyle = water; ctx.beginPath(); ctx.ellipse(x, y, waterRx, waterRy, -.08, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#c1e0c544'; ctx.lineWidth = Math.max(1, r * .018);
    for (let i = 0; i < 3; i++) { const phase = seed * 3 + i * 1.7, rx = waterRx * (.34 + (i % 2) * .12); ctx.beginPath(); ctx.ellipse(x + Math.cos(phase) * r * .18, y + Math.sin(phase) * r * .12, rx, rx * .20, -.08, .28, 2.28); ctx.stroke(); }
    const padCount = r > 45 ? 5 : 3;
    for (let i = 0; i < padCount; i++) {
      const angle = seed * TAU + i * TAU / padCount, orbitX = waterRx * (.16 + (i % 2) * .27), orbitY = waterRy * (.12 + ((i + 1) % 3) * .13);
      const px = x + Math.cos(angle) * orbitX, py = y + Math.sin(angle) * orbitY;
      const padRx = r * (.19 + ((i * 7) % 3) * .035), padRy = padRx * .56;
      ctx.fillStyle = '#244c3e99'; ctx.beginPath(); ctx.ellipse(px + 1, py + 2, padRx * 1.08, padRy * 1.18, angle * .18, 0, TAU); ctx.fill();
      ctx.fillStyle = i % 2 ? '#72945c' : '#98a968'; ctx.beginPath(); ctx.ellipse(px, py, padRx, padRy, angle * .18, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#d3d38c90'; ctx.lineWidth = Math.max(1, r * .014); ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px - Math.sin(angle) * padRy * .3, py - padRy * .12, px - Math.cos(angle) * padRx * .72, py - Math.sin(angle) * padRy * .65); ctx.stroke();
      ctx.fillStyle = '#69aaa278'; ctx.beginPath(); ctx.ellipse(px - padRx * .16, py - padRy * .28, padRx * .35, padRy * .18, angle * .2, 0, TAU); ctx.fill();
    }
    const flowerX = x + Math.cos(seed * TAU + .45) * waterRx * .16, flowerY = y + Math.sin(seed * TAU + .45) * waterRy * .16;
    ctx.save(); ctx.translate(flowerX, flowerY); ctx.rotate(seed * .8);
    const petals = r > 45 ? 7 : 5, petal = Math.max(1.2, r * .075);
    for (let i = 0; i < petals; i++) { ctx.rotate(TAU / petals); ctx.fillStyle = i % 2 ? '#f2d3ad' : '#ffe8c3'; ctx.beginPath(); ctx.ellipse(0, -petal * .9, petal * .48, petal, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#d7aa60'; ctx.beginPath(); ctx.arc(0, 0, petal * .3, 0, TAU); ctx.fill(); ctx.restore();
    ctx.restore();
  }
  function drawWorldWillow(x,y,r,seed){drawProceduralTree(x,y,r,seed);ctx.strokeStyle='#81916a';ctx.lineWidth=1.2;for(let i=0;i<9;i++){const side=i%2?1:-1,sx=x+side*r*.45,sy=y-r*.35+(i%4)*r*.12;ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+side*r*.3,sy+r*.55,sx+side*r*.24,sy+r*.95);ctx.stroke();}}
  function drawWorldBlossom(x,y,r,seed){
    if (plumTreeSprite.complete && plumTreeSprite.naturalWidth) {
      const sway = Math.sin(state.elapsed * 1.4 + seed * 8) * .012;
      const scale = .9 + seed * .18;
      ctx.save(); ctx.translate(x, y); ctx.rotate(sway + (seed - .5) * .1); ctx.scale(seed > .5 ? -scale : scale, scale);
      ctx.drawImage(plumTreeSprite, -r * 1.18, -r * 1.75, r * 2.36, r * 2.15); ctx.restore(); return;
    }
    ctx.fillStyle='#18201755';ctx.beginPath();ctx.ellipse(x,y+7,r*1.35,r*.58,0,0,TAU);ctx.fill();ctx.fillStyle='#65452d';ctx.lineWidth=r*.16;ctx.beginPath();ctx.moveTo(x,y+3);ctx.quadraticCurveTo(x-r*.25,y-r*.4,x-r*.35,y-r*.9);ctx.moveTo(x,y-r*.32);ctx.quadraticCurveTo(x+r*.5,y-r*.55,x+r*.75,y-r*.72);ctx.stroke();for(let i=0;i<8;i++){const a=seed*TAU+i*2.3,rr=r*(.23+(i%3)*.2),px=x+Math.cos(a)*r*.48,py=y-r*.55+Math.sin(a)*r*.3;ctx.fillStyle=['#bb7481','#d28a8e','#e2a6a1','#c77a87'][i%4];ctx.beginPath();ctx.arc(px,py,rr,0,TAU);ctx.fill();ctx.fillStyle='#f0c79f';ctx.beginPath();ctx.arc(px-rr*.28,py-rr*.3,rr*.23,0,TAU);ctx.fill();}}
  function drawWorldDeadTree(x,y,r,seed){ctx.fillStyle='#24242066';ctx.beginPath();ctx.ellipse(x,y+4,r*1.2,r*.42,0,0,TAU);ctx.fill();ctx.strokeStyle='#514638';ctx.lineWidth=Math.max(3,r*.16);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-r*.12,y-r);ctx.lineTo(x-r*.48,y-r*1.35);ctx.moveTo(x-r*.18,y-r*.82);ctx.lineTo(x+r*.3,y-r*1.12);ctx.moveTo(x-r*.42,y-r*1.29);ctx.lineTo(x-r*.61,y-r*1.2);ctx.stroke();}
  function drawWorldBanner(x,y,r,seed){ctx.fillStyle='#181c1666';ctx.beginPath();ctx.ellipse(x,y+4,r*.75,r*.27,0,0,TAU);ctx.fill();ctx.strokeStyle='#65472d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-r*1.35);ctx.stroke();ctx.fillStyle=seed>.5?'#8f4137':'#526b51';ctx.beginPath();ctx.moveTo(x+1,y-r*1.3);ctx.lineTo(x+r*.8,y-r*1.18);ctx.lineTo(x+r*.65,y-r*.68);ctx.lineTo(x+1,y-r*.77);ctx.closePath();ctx.fill();ctx.strokeStyle='#c6a16d';ctx.lineWidth=.8;ctx.stroke();}
  function drawMountainShrine(x,y){ctx.fillStyle='#25302c44';ctx.beginPath();ctx.ellipse(x,y+14,96,22,0,0,TAU);ctx.fill();for(let i=0;i<4;i++){ctx.fillStyle=['#877c68','#989079','#a49a80','#b0a58a'][i];ctx.fillRect(x-56+i*6,y+4-i*7,112-i*12,8);}ctx.fillStyle='#5b564d';ctx.fillRect(x-40,y-35,80,38);ctx.fillStyle='#887859';ctx.beginPath();ctx.moveTo(x-52,y-34);ctx.lineTo(x,y-68);ctx.lineTo(x+52,y-34);ctx.lineTo(x+39,y-29);ctx.lineTo(x,y-56);ctx.lineTo(x-39,y-29);ctx.closePath();ctx.fill();ctx.fillStyle='#c0a36d';ctx.fillRect(x-4,y-22,8,22);ctx.fillStyle='#d6c28f';ctx.fillRect(x-2,y-18,3,9);}
  function drawLotusPool(x,y,r){drawWorldLotus(x,y,r,.37);drawWorldLotus(x+r*1.78,y-r*.26,r*.34,.83);}
  function drawBlossomGrove(x,y,r){drawWorldBlossom(x-r*.75,y+8,r*.68,.26);drawWorldBlossom(x+r*.75,y-9,r*.58,.72);drawWorldBlossom(x,y-r*.55,r*.74,.48);}
  function drawBanditWaystation(x,y){ctx.fillStyle='#33281e66';ctx.beginPath();ctx.ellipse(x,y+11,82,20,0,0,TAU);ctx.fill();ctx.fillStyle='#49362b';ctx.beginPath();ctx.moveTo(x-55,y+4);ctx.lineTo(x,y-38);ctx.lineTo(x+55,y+4);ctx.closePath();ctx.fill();ctx.fillStyle='#9b4939';ctx.beginPath();ctx.moveTo(x-58,y+2);ctx.lineTo(x,y-42);ctx.lineTo(x+58,y+2);ctx.closePath();ctx.fill();ctx.fillStyle='#5b3a2b';ctx.fillRect(x-38,y+2,76,20);ctx.fillStyle='#d5ae70';ctx.fillRect(x-3,y-20,6,18);}
  function drawCliffCrown(x,y){for(let i=0;i<4;i++)drawWorldCliff(x+(i-1.5)*29,y+(i%2)*20,43+(i%2)*9,.2+i*.17);}
  function drawBambooGate(x,y){
    if (bambooGateSprite.complete && bambooGateSprite.naturalWidth) {
      const width = 246, height = 205;
      ctx.drawImage(bambooGateSprite, x - width / 2, y - height, width, height);
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 12px "Noto Serif SC", "Songti SC", serif';
      ctx.lineWidth = 3; ctx.strokeStyle = '#3c281dcc'; ctx.fillStyle = '#f0d69a';
      ctx.strokeText('翠竹海', x, y - height * .50); ctx.fillText('翠竹海', x, y - height * .50); ctx.restore(); return;
    }
    ctx.fillStyle='#19231d66';ctx.fillRect(x-51,y+9,102,7);ctx.fillStyle='#634a30';ctx.fillRect(x-43,y-23,8,34);ctx.fillRect(x+35,y-23,8,34);ctx.fillStyle='#715436';ctx.fillRect(x-54,y-26,108,7);ctx.fillStyle='#8c6d43';ctx.beginPath();ctx.moveTo(x-62,y-26);ctx.lineTo(x,y-48);ctx.lineTo(x+62,y-26);ctx.closePath();ctx.fill();ctx.fillStyle='#c9ac72';ctx.fillRect(x-3,y-23,6,17);
  }
  function drawStoneMonolith(x,y){drawWorldPillar(x-35,y+8,35,.2);drawWorldPillar(x+26,y-4,44,.7);ctx.strokeStyle='#bfad83';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y+12,68,.15,Math.PI-.15);ctx.stroke();}
  function drawMarshPier(x,y){ctx.fillStyle='#19221d55';ctx.fillRect(x-55,y+4,110,16);ctx.fillStyle='#785a39';ctx.fillRect(x-50,y-12,100,12);ctx.fillStyle='#ae8959';for(let i=0;i<5;i++)ctx.fillRect(x-45+i*22,y-10,2,8);ctx.fillStyle='#5d442d';for(const dx of [-40,40])ctx.fillRect(x+dx,y-18,5,32);}

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
    const regionData = getLandscapeRegion(state.hero.x, state.hero.y);
    if (regionData?.strength > .52) {
      ctx.save(); ctx.font = 'bold 14px Noto Sans SC'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const name = regionData.region.name, width = ctx.measureText(name).width + 32, x = state.hero.x, y = state.hero.y - 120;
      ctx.fillStyle = '#26362fd9'; ctx.strokeStyle = '#dbc38b'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.roundRect(x - width / 2, y - 14, width, 28, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f3e3bd'; ctx.fillText(name, x, y); ctx.restore();
    }
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
    const bossScale = e.boss ? 1.28 : 1;
    if (e.type === 'boar' && boarSprite.complete && boarSprite.naturalWidth) { drawSpriteEnemy(e, boarSprite, 91 * bossScale, 79 * bossScale, true); return; }
    if (e.type === 'guardian' && guardianSprite.complete && guardianSprite.naturalWidth) { drawSpriteEnemy(e, guardianSprite, 92 * bossScale, 94 * bossScale, true); return; }
    if (e.type === 'serpent' && serpentSprite.complete && serpentSprite.naturalWidth) { drawSpriteEnemy(e, serpentSprite, 88 * bossScale, 92 * bossScale, true); return; }
    if (e.beast && wolfSprite.complete && wolfSprite.naturalWidth) { drawSpriteEnemy(e, wolfSprite, 72, 48, false); return; }
    if (['bandit', 'runner', 'brute'].includes(e.type)) {
      const sprite = e.type === 'runner' && runnerSprite.complete && runnerSprite.naturalWidth ? runnerSprite
        : e.type === 'brute' && bruteSprite.complete && bruteSprite.naturalWidth ? bruteSprite : banditSprite;
      if (sprite.complete && sprite.naturalWidth) {
        const size = e.type === 'brute' ? 1.3 : e.type === 'runner' ? .84 : 1;
        drawSpriteEnemy(e, sprite, 48 * size, 62 * size, false); return;
      }
    }
    const moving = e.moving || e.chargeTime > 0, gait = moving ? Math.sin(e.anim) : Math.sin(e.anim * .36) * .12;
    const bob = moving ? Math.abs(gait) * (e.boss ? 2 : 1.5) : Math.sin(e.anim * .48) * .55, size = e.radius / 15, lunge = (e.attackPose || 0) * e.radius * .14;
    ctx.save(); ctx.translate(e.x + e.facingX * lunge, e.y + bob + e.facingY * lunge); if (e.facingX < 0) ctx.scale(-1, 1); ctx.rotate(Math.sin(e.anim * .5) * .018); ctx.fillStyle = '#0d130e9c'; ctx.beginPath(); ctx.ellipse(0, 3, e.radius * 1.1, e.radius * .4, 0, 0, TAU); ctx.fill();
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
    const moving = e.moving || e.chargeTime > 0, runner = e.type === 'runner', brute = e.type === 'brute';
    const gait = moving ? Math.sin(e.anim) : Math.sin(e.anim * .34) * .16, prep = e.attackPose || 0;
    const lunge = prep * e.radius * (brute ? .22 : runner ? .18 : .14);
    const bobRate = runner ? 1.42 : brute ? .76 : 1.15, bobSize = runner ? 2.7 : brute ? .85 : e.boss ? 2.3 : 1.4;
    const bodyBob = moving ? Math.sin(e.anim * bobRate) * bobSize : Math.sin(e.anim * .52) * .65;
    ctx.save(); ctx.translate(e.x + e.facingX * lunge, e.y + bodyBob + e.facingY * lunge);
    ctx.fillStyle = 'rgba(22, 19, 14, .28)'; ctx.beginPath(); ctx.ellipse(0, 3, width * .27, Math.max(3, width * .075), 0, 0, TAU); ctx.fill();
    if (e.hurt > 0) ctx.filter = 'brightness(1.65) saturate(1.2)';
    else if (runner) ctx.filter = 'saturate(1.16) brightness(1.06)';
    else if (brute) ctx.filter = 'saturate(.72) brightness(.86) contrast(1.1)';
    if (rotateToAim) {
      // Keep the creature upright when it turns behind the player. These source
      // paintings face east, west, and north-east respectively.
      const baseAngle = e.type === 'guardian' ? Math.PI : e.type === 'serpent' ? -Math.PI * .22 : 0;
      const aimAngle = Math.atan2(e.facingY, e.facingX), turn = Math.atan2(Math.sin(aimAngle - baseAngle), Math.cos(aimAngle - baseAngle));
      ctx.rotate(aimAngle);
      if (Math.abs(turn) > Math.PI / 2) ctx.scale(1, -1);
      ctx.rotate(-baseAngle + gait * .035 + prep * .12);
    }
    else {
      // The scout and baseline outlaw art face right; the heavy enforcer art
      // faces left. Mirror each source only when it needs to turn around.
      const sourceFacesRight = e.type !== 'brute';
      if ((e.facingX >= 0) !== sourceFacesRight) ctx.scale(-1, 1);
      const lean = runner ? Math.sin(e.anim * .72) * .045 : brute ? Math.sin(e.anim * .38) * .016 : Math.sin(e.anim * .55) * .026;
      ctx.rotate(lean + e.facingY * .06 + prep * (runner ? .2 : brute ? -.17 : .15));
    }
    if (runner && sprite === banditSprite) {
      // Keep a fallback scarf in case the dedicated runner art has not loaded.
      const flutter = Math.sin(e.anim * 1.65) * height * .045 + Math.cos(e.anim * .8) * height * .018;
      ctx.save(); ctx.globalAlpha *= moving ? .96 : .82; ctx.fillStyle = '#315b56'; ctx.beginPath();
      ctx.moveTo(-width * .03, -height * .72); ctx.bezierCurveTo(-width * .28, -height * .82 + flutter, -width * .46, -height * .5 + flutter, -width * .82, -height * .36 + flutter);
      ctx.quadraticCurveTo(-width * .63, -height * .56 + flutter, -width * .37, -height * .59); ctx.quadraticCurveTo(-width * .2, -height * .63, -width * .03, -height * .72); ctx.fill();
      ctx.strokeStyle = '#b7c995'; ctx.lineWidth = Math.max(1, width * .035); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-width * .11, -height * .7); ctx.quadraticCurveTo(-width * .4, -height * .6 + flutter, -width * .7, -height * .42 + flutter); ctx.stroke(); ctx.restore();
    }
    if (brute && moving) {
      const stomp = .12 + Math.max(0, Math.sin(e.anim * .5)) * .13; ctx.globalAlpha *= stomp; ctx.strokeStyle = '#b6a27c'; ctx.lineWidth = 1.4;
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.ellipse(side * width * .26, 5, width * (.12 + stomp * .12), 2.2, 0, Math.PI * .12, Math.PI * .88); ctx.stroke(); }
      ctx.globalAlpha /= stomp;
    }
    const bounce = Math.max(0, gait) * (rotateToAim ? 3.2 : runner ? 3.1 : brute ? .9 : 1.8);
    const stride = Math.sin(e.anim * (runner ? .82 : .5)) * (rotateToAim ? 1.4 : runner ? 1.8 : brute ? .45 : .8);
    ctx.drawImage(sprite, -width / 2 + stride, -height + 5 - bounce, width, height + bounce);
    ctx.filter = 'none';
    if (brute && sprite === banditSprite) {
      // Keep fallback armor until the dedicated heavy-enforcer art loads.
      ctx.lineJoin = 'round';
      for (const side of [-1, 1]) {
        ctx.fillStyle = '#292e28'; ctx.strokeStyle = '#a3946d'; ctx.lineWidth = 1.3; ctx.beginPath();
        ctx.moveTo(side * width * .08, -height * .52); ctx.lineTo(side * width * .3, -height * .56);
        ctx.lineTo(side * width * .42, -height * .43); ctx.lineTo(side * width * .33, -height * .35);
        ctx.lineTo(side * width * .1, -height * .4); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ded0a1aa'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(side * width * .14, -height * .5); ctx.lineTo(side * width * .29, -height * .53); ctx.stroke();
        ctx.fillStyle = '#e2c47c'; ctx.beginPath(); ctx.arc(side * width * .25, -height * .43, 1.4, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#303a32'; ctx.strokeStyle = '#a3946d'; ctx.lineWidth = 1.1; ctx.beginPath();
      ctx.moveTo(-width * .17, -height * .43); ctx.lineTo(-width * .1, -height * .5); ctx.lineTo(width * .12, -height * .48);
      ctx.lineTo(width * .17, -height * .3); ctx.lineTo(width * .08, -height * .27); ctx.lineTo(-width * .13, -height * .3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d4b66f'; ctx.beginPath(); ctx.arc(width * .025, -height * .37, 1.8, 0, TAU); ctx.fill();
    }
    if (prep > .35 && !rotateToAim) {
      const swing = clamp((prep - .35) / .65, 0, 1);
      const arcRadius = width * (brute ? .5 : runner ? .32 : .36), arcAlpha = swing * (brute ? .78 : .62);
      ctx.save(); ctx.translate(width * (brute ? .18 : .23), -height * (brute ? .55 : .61)); ctx.rotate((brute ? -1.02 : runner ? -.62 : -.8) + swing * (brute ? 1.02 : .7));
      ctx.strokeStyle = brute ? `rgba(255, 187, 105, ${arcAlpha})` : runner ? `rgba(255, 229, 174, ${arcAlpha})` : `rgba(255, 213, 145, ${arcAlpha})`;
      ctx.lineWidth = brute ? 4.6 : runner ? 1.8 : 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, arcRadius, brute ? -.92 : -.78, brute ? .78 : .42); ctx.stroke();
      ctx.strokeStyle = brute ? `rgba(183, 78, 52, ${swing * .48})` : runner ? `rgba(224, 167, 110, ${swing * .38})` : `rgba(224, 138, 88, ${swing * .42})`;
      ctx.lineWidth = brute ? 7 : runner ? 2.8 : 4; ctx.beginPath(); ctx.arc(0, 0, arcRadius * .83, brute ? -.9 : -.75, brute ? .72 : .34); ctx.stroke(); ctx.restore();
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
      const moving = e.moving || e.chargeTime > 0, gait = moving ? Math.sin(e.anim * .8) : Math.sin(e.anim * .34) * .14;
      const bob = moving ? Math.sin(e.anim * .7) * 2 : Math.sin(e.anim * .36) * .65, lunge = (e.attackPose || 0) * 3;
      ctx.save(); ctx.translate(e.x + e.facingX * lunge, e.y + bob + e.facingY * lunge);
      ctx.fillStyle = '#17150fb8'; ctx.beginPath(); ctx.ellipse(0, 5, e.radius * 1.5, e.radius * .44, 0, 0, TAU); ctx.fill();
      if (e.hurt > 0) ctx.filter = 'brightness(1.5) saturate(1.15)';
      const baseAngle = -.3, aimAngle = Math.atan2(e.facingY, e.facingX), turn = Math.atan2(Math.sin(aimAngle - baseAngle), Math.cos(aimAngle - baseAngle));
      ctx.rotate(aimAngle); if (Math.abs(turn) > Math.PI / 2) ctx.scale(1, -1);
      ctx.rotate(-baseAngle + gait * .035 + (e.attackPose || 0) * .06);
      ctx.drawImage(wyrmSprite, -e.radius * 2.05, -e.radius * 1.02, e.radius * 4.1, e.radius * 2.05);
      ctx.filter = 'none'; ctx.restore(); drawEnemyHealth(e); return;
    }
    const bob = Math.sin(e.anim * .7) * 1.5, aimAngle = Math.atan2(e.facingY, e.facingX); ctx.save(); ctx.translate(e.x + e.facingX * (e.attackPose || 0) * 3, e.y + bob + e.facingY * (e.attackPose || 0) * 3);
    ctx.rotate(aimAngle); if (Math.abs(aimAngle) > Math.PI / 2) ctx.scale(1, -1);
    ctx.fillStyle = '#111510aa'; ctx.beginPath(); ctx.ellipse(0, 6, 76, 18, 0, 0, TAU); ctx.fill();
    ctx.lineCap = 'round'; ctx.strokeStyle = '#315d48'; ctx.lineWidth = 25; ctx.beginPath(); ctx.moveTo(-6, -13); ctx.bezierCurveTo(-62, -52, -97, -2, -67, 27); ctx.bezierCurveTo(-30, 51, 24, 39, 21, 3); ctx.stroke(); ctx.strokeStyle = e.hurt > 0 ? '#f4e4ae' : '#6ea47a'; ctx.lineWidth = 15; ctx.stroke();
    for (const [x, y] of [[-42,-23],[-69,-1],[-49,28],[-16,38],[8,20]]) { ctx.fillStyle = '#b6ca8c'; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x, y - 12); ctx.lineTo(x + 5, y); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#75a67b'; ctx.beginPath(); ctx.ellipse(32, -17, 28, 20, -.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#d9c17a'; ctx.beginPath(); ctx.moveTo(17, -31); ctx.lineTo(13, -48); ctx.lineTo(27, -31); ctx.moveTo(40, -32); ctx.lineTo(48, -48); ctx.lineTo(49, -28); ctx.fill(); ctx.fillStyle = '#f1d173'; ctx.fillRect(37, -22, 4, 4); ctx.restore(); drawEnemyHealth(e);
  }
  function drawPet() {
    const x = state.petX, y = state.petY, moving = Math.hypot(state.hero.x - x, state.hero.y - y) > 84;
    const pounce = state.petAttack > 0 ? state.petAttack / (state.pet === 'tiger' ? .46 : state.pet === 'crane' ? .42 : .32) : 0;
    const leap = state.petPounce ? Math.sin(clamp(state.petPounce.elapsed / .34, 0, 1) * Math.PI) : 0;
    const hover = state.pet === 'crane' ? Math.sin(state.elapsed * 6.2) * 5 : 0;
    const bob = (state.pet === 'crane' ? hover : moving ? Math.abs(Math.sin(state.petWalkTime)) * (state.pet === 'tortoise' ? 1.5 : 2.8) : Math.sin(state.elapsed * 2.5) * 1.1) - leap * 11;
    const sizes = { fox: [60, 60], crane: [80, 80], tiger: [74, 68], tortoise: [76, 70] }, [spriteW, spriteH] = sizes[state.pet] || sizes.fox;
    ctx.save(); ctx.translate(x + (state.petFacingX || 1) * (pounce * (state.pet === 'tiger' ? 8 : 4) + leap * 8), y + bob - pounce * 2);
    ctx.fillStyle = `rgba(17, 20, 18, ${.38 * (1 - leap * .62)})`; ctx.beginPath(); ctx.ellipse(0, 1, spriteW * .34 * (1 - leap * .18), 5.5 * (1 - leap * .68), 0, 0, TAU); ctx.fill();
    if ((state.petFacingX || 1) < 0) ctx.scale(-1, 1);
    const idleSway = state.pet === 'tortoise' ? Math.sin(state.elapsed * 1.7) * .018 : Math.sin(state.petWalkTime * .8) * .025;
    ctx.rotate(idleSway + pounce * (state.pet === 'tiger' ? -.1 : .04) - leap * (state.pet === 'tiger' ? .17 : 0));
    if (pounce > 0) { ctx.shadowColor = state.pet === 'crane' ? '#b9f4cf' : state.pet === 'tortoise' ? '#78d8c0' : '#f3bd70'; ctx.shadowBlur = 13 * pounce; }
    if (state.pet === 'fox' && foxSprite.complete && foxSprite.naturalWidth) {
      ctx.drawImage(foxSprite, -spriteW / 2, -spriteH, spriteW, spriteH);
    } else if (companionSprite.complete && companionSprite.naturalWidth >= 2100) {
      const cell = state.pet === 'crane' ? 0 : state.pet === 'tiger' ? 1 : 2, cellW = companionSprite.naturalWidth / 3;
      if (state.pet === 'crane') ctx.scale(1, 1 + Math.sin(state.elapsed * 10) * .035);
      if (state.pet === 'tiger') ctx.scale(1 + pounce * .06 + leap * .09, 1 - pounce * .035 - leap * .06);
      ctx.drawImage(companionSprite, cellW * cell, 0, cellW, companionSprite.naturalHeight, -spriteW / 2, -spriteH, spriteW, spriteH);
    } else {
      ctx.fillStyle = '#bd784a'; ctx.beginPath(); ctx.ellipse(0, -15, 14, 9, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, -20); ctx.lineTo(15, -31); ctx.lineTo(13, -16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ead9b3'; ctx.beginPath(); ctx.ellipse(6, -15, 5, 4, 0, 0, TAU); ctx.fill();
    }
    ctx.shadowBlur = 0;
    if (pounce > 0 && state.pet !== 'tortoise') { ctx.strokeStyle = `rgba(248, 219, 144, ${pounce * .62})`; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.arc(spriteW * .18, -spriteH * .64, 5 + (1 - pounce) * 8, -.9, .9); ctx.stroke(); }
    ctx.restore();
  }
  function drawShots() {
    for (const s of state.shots) {
      const a = Math.min(1, s.life * 3.5), speed = Math.hypot(s.vx, s.vy) || 1;
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx)); ctx.globalAlpha = a;
      // Carry skill rank into the projectile so successive refinements remain visible for the full flight.
      const shotScale = 1 + Math.min(4, Math.max(0, (s.rank || 1) - 1)) * .09;
      ctx.scale(shotScale, shotScale);
      ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = s.side === 'hero' ? 9 : 6; ctx.shadowColor = s.color;
      const trail = s.style === 'palm' ? 43 : s.style === 'swordfall' || s.style === 'crescent' ? 37 : s.style === 'needle' ? 30 : 23;
      const tail = ctx.createLinearGradient(-trail, 0, s.r * 2, 0); tail.addColorStop(0, 'rgba(255,255,255,0)'); tail.addColorStop(.45, s.color + '66'); tail.addColorStop(1, '#fff8df');
      ctx.strokeStyle = tail; ctx.lineCap = 'round'; ctx.lineWidth = s.style === 'palm' ? 8 : s.style === 'needle' ? 2 : 4;
      ctx.beginPath(); ctx.moveTo(-trail, 0); ctx.lineTo(s.r * 1.2, 0); ctx.stroke();
      ctx.fillStyle = s.color;
      if (s.style === 'palm') {
        const r = s.r; ctx.globalCompositeOperation = 'lighter'; ctx.shadowBlur = 22; ctx.shadowColor = '#f7a841';
        const tail = r * 5.4, head = r * 4.6;
        ctx.strokeStyle = '#ed813b88'; ctx.lineWidth = r * 1.28; ctx.beginPath(); ctx.moveTo(-tail, 0); ctx.bezierCurveTo(-r * 2.6, -r * 2.8, r * .4, r * 2.4, head, 0); ctx.stroke();
        ctx.strokeStyle = '#ffd577'; ctx.lineWidth = Math.max(2.4, r * .44); ctx.beginPath(); ctx.moveTo(-tail + 4, 0); ctx.bezierCurveTo(-r * 2.6, -r * 2.2, r * .5, r * 1.8, head, 0); ctx.stroke();
        if (wyrmSprite.complete && wyrmSprite.naturalWidth) {
          ctx.globalCompositeOperation = 'source-over'; ctx.shadowColor = '#ef8136'; ctx.shadowBlur = 14; ctx.drawImage(wyrmSprite, -r * 4.7, -r * 2.35, r * 9.4, r * 4.7);
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#fff1bc'; ctx.shadowColor = '#fff0bc'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(r * 3.3, -r * .42, Math.max(2, r * .2), 0, TAU); ctx.fill();
        } else {
          ctx.strokeStyle = '#fff0bc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * 2, 0); ctx.quadraticCurveTo(r, -r * 2, r * 3, 0); ctx.stroke();
        }
      } else if (s.style === 'feather') {
        const r = s.r; ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = '#8fe5da'; ctx.shadowBlur = 13;
        ctx.fillStyle = '#c8f3e8'; ctx.beginPath(); ctx.moveTo(-r * 2.7, 0); ctx.quadraticCurveTo(-r * .4, -r * 1.3, r * 2.8, 0); ctx.quadraticCurveTo(-r * .4, r * .68, -r * 2.7, 0); ctx.fill();
        ctx.strokeStyle = '#fff7d9'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-r * 2.3, 0); ctx.quadraticCurveTo(0, -r * .1, r * 2.5, 0); ctx.stroke();
        for (let i = 0; i < 4; i++) { const x = -r * 1.2 + i * r * .82; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - r * .38, -r * .48); ctx.moveTo(x + r * .12, 0); ctx.lineTo(x - r * .25, r * .3); ctx.stroke(); }
      } else if (s.style === 'swordQi') {
        const r = s.r; ctx.shadowBlur = 9;
        ctx.strokeStyle = s.color; ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-r * 3.5, 0); ctx.quadraticCurveTo(0, -r * .5, r * 3.6, 0); ctx.stroke();
        ctx.strokeStyle = '#fbfff0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-r * 2.7, 0); ctx.lineTo(r * 3.1, 0); ctx.stroke();
        ctx.fillStyle = '#dbe8df'; ctx.beginPath(); ctx.moveTo(r * 4.3, 0); ctx.lineTo(r * 2.8, -r * .5); ctx.lineTo(r * 3.2, 0); ctx.lineTo(r * 2.8, r * .5); ctx.closePath(); ctx.fill();
      } else if (s.style === 'crescent') {
        const r = s.r * 1.8; ctx.shadowBlur = 10;
        ctx.strokeStyle = s.color; ctx.lineWidth = Math.max(4, s.r * .7); ctx.beginPath(); ctx.arc(0, 0, r, -.92, .92); ctx.stroke();
        ctx.strokeStyle = '#fff6d4'; ctx.lineWidth = Math.max(1.3, s.r * .15); ctx.beginPath(); ctx.arc(0, 0, r - 1, -.84, .84); ctx.stroke();
        ctx.strokeStyle = s.color + 'aa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r * .7, -r * .15); ctx.quadraticCurveTo(0, -r * .2, r * 1.5, 0); ctx.stroke();
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
      } else if (s.style === 'venomGlob') {
        const r = s.r; ctx.globalCompositeOperation = 'lighter'; ctx.shadowBlur = 18; ctx.shadowColor = '#bb82ee';
        const orb = ctx.createRadialGradient(-r * .28, -r * .25, 1, 0, 0, r * 1.35); orb.addColorStop(0, '#f1d7ff'); orb.addColorStop(.25, '#c89be8'); orb.addColorStop(.72, '#714ca9'); orb.addColorStop(1, '#56397900');
        ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(0, 0, r * 1.35, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#e8ceff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, r * 1.05, .3, 2.5); ctx.stroke();
        for (let i = 0; i < 3; i++) { const ang = i * TAU / 3 + s.life * 5; ctx.fillStyle = '#caa7ed'; ctx.beginPath(); ctx.arc(Math.cos(ang) * r * 1.7, Math.sin(ang) * r * .75, 1.8, 0, TAU); ctx.fill(); }
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
  function drawOrb(o) { const pulse = 1 + Math.sin(o.bob) * .15; ctx.save(); ctx.shadowColor = '#f4dd88'; ctx.shadowBlur = Math.min(22, 12 + o.r); ctx.fillStyle = '#f6db86'; ctx.beginPath(); ctx.moveTo(o.x, o.y - o.r * pulse); ctx.lineTo(o.x + o.r * .7, o.y); ctx.lineTo(o.x, o.y + o.r * pulse); ctx.lineTo(o.x - o.r * .7, o.y); ctx.closePath(); ctx.fill(); if (o.value >= 24) { ctx.strokeStyle = '#fff3ba'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(o.x, o.y - o.r * .55); ctx.lineTo(o.x, o.y + o.r * .55); ctx.stroke(); } ctx.restore(); }
  function drawDrop(d) { const y = d.y + Math.sin(d.bob || 0) * 4; ctx.save(); ctx.shadowBlur = 12; ctx.shadowColor = '#f5d980'; ctx.fillStyle = '#eac96e'; if (d.type === 'coin') { if ((d.count || 1) > 1) { ctx.beginPath(); ctx.arc(d.x - 3, y - 2, 6, 0, TAU); ctx.fill(); } ctx.beginPath(); ctx.arc(d.x, y, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#6d5328'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('◈', d.x, y + 3); if (d.count > 1) { ctx.fillStyle = '#fff1bd'; ctx.font = 'bold 8px sans-serif'; ctx.fillText(`×${Math.min(99, d.count)}`, d.x + 12, y - 7); } } else { ctx.fillStyle = '#f4e3a5'; ctx.fillRect(d.x - 7, y - 8, 14, 17); ctx.fillStyle = '#926c45'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('秘', d.x, y + 4); } ctx.restore(); }
  function drawTelegraphs() {
    for (const e of state.enemies) if (e.windup > 0) {
      const pulse = .52 + Math.sin(state.elapsed * 32) * .2, tellColor = e.role === 'summoner' ? '#c27be8' : e.role === 'serpent' ? '#b99be9' : e.role === 'guardian' ? '#8de0b2' : e.role === 'charger' ? '#f2a36e' : e.role === 'dragon' ? '#ff744a' : e.role === 'ranged' ? '#efc879' : '#ed8766';
      ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = tellColor; ctx.fillStyle = tellColor + '25'; ctx.lineWidth = e.boss ? 4 : 2;
      if (e.role === 'dragon') {
        // Dragon fireballs travel at 240 units/s for at most 1.8s.
        const angle = Math.atan2(e.aimY || 0, e.aimX || 1), len = 432;
        ctx.translate(e.x, e.y); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, -len * .26); ctx.arc(0, 0, len, -.26, .26); ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (e.role === 'charger') {
        ctx.translate(e.x, e.y); ctx.rotate(Math.atan2(e.aimY || 0, e.aimX || 1));
        ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(220, -34); ctx.lineTo(220, 34); ctx.lineTo(0, 18); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.setLineDash([8, 6]); ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(210, 0); ctx.stroke(); ctx.setLineDash([]);
      } else if (e.role === 'guardian') {
        const r = 96 + (1 - e.windup / .84) * 16; ctx.beginPath(); ctx.arc(e.slamX, e.slamY, r, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(e.slamX, e.slamY, r * .72, 0, TAU); ctx.stroke();
      } else if (e.role === 'serpent') {
        const aimX = e.poisonAimX ?? e.x, aimY = e.poisonAimY ?? e.y; ctx.setLineDash([5, 8]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(aimX, aimY); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(aimX, aimY, 28 + (1 - e.windup / .72) * 26, 0, TAU); ctx.fill(); ctx.stroke();
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
      } else if (e.kind === 'weapon' && e.style !== 'dragonCoil') drawWeaponEffect(e, a, t);
      else if (e.kind === 'impact') drawImpact(e, a, t);
      else if (e.kind === 'rankUp') {
        const rank = e.rank || 1, sigils = Math.min(10, 3 + rank * 2);
        ctx.translate(e.x, e.y); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 18 + rank * 2;
        ctx.lineWidth = 5 - t * 2; ctx.beginPath(); ctx.ellipse(0, 18, 22 + t * (50 + rank * 4), 11 + t * (18 + rank), 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#fff1c4'; ctx.lineWidth = 2.3; ctx.beginPath(); ctx.arc(0, -8, 14 + t * (27 + rank * 2), -2.5, 1.8); ctx.stroke();
        for (let i = 0; i < sigils; i++) {
          const angle = i * TAU / sigils + t * (2.1 + rank * .14), orbit = 18 + t * (24 + rank * 2);
          ctx.fillStyle = i % 2 ? '#fff0bd' : e.color; drawStarPath(Math.cos(angle) * orbit, -8 + Math.sin(angle) * orbit * .58, 3.6 + rank * .24, 1.5, 4); ctx.fill();
        }
        if (e.label) {
          ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha *= clamp(1 - t * .55, 0, 1);
          ctx.font = 'bold 13px Noto Sans SC'; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 4;
          ctx.strokeStyle = '#211b13'; ctx.strokeText(e.label, 0, -58 - t * 10);
          ctx.fillStyle = '#ffe3a0'; ctx.shadowColor = e.color; ctx.shadowBlur = 10; ctx.fillText(e.label, 0, -58 - t * 10);
        }
      }
      else if (e.kind === 'hazard') {
        ctx.translate(e.x, e.y); ctx.globalCompositeOperation = 'lighter'; const r = e.radius * (.93 + Math.sin(state.elapsed * 5 + e.x) * .05);
        const mist = ctx.createRadialGradient(0, 0, 2, 0, 0, r); mist.addColorStop(0, '#a56bd844'); mist.addColorStop(.55, '#9563bb38'); mist.addColorStop(1, '#74479b00'); ctx.fillStyle = mist; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#c29be5aa'; ctx.shadowColor = e.color; ctx.shadowBlur = 9; ctx.lineWidth = 2.4; ctx.setLineDash([7, 5]); ctx.beginPath(); ctx.arc(0, 0, r * .78, t * 4, TAU + t * 4); ctx.stroke(); ctx.setLineDash([]);
        for (let i = 0; i < 7; i++) { const ang = i * TAU / 7 + state.elapsed * .7, rr = r * (.34 + (i % 3) * .14), rise = (state.elapsed * 18 + i * 13) % 22; ctx.globalAlpha = a * .45; ctx.fillStyle = i % 2 ? '#bf8ce0' : '#b2b986'; ctx.beginPath(); ctx.arc(Math.cos(ang) * rr, Math.sin(ang) * rr - rise * .35, 2.2 + (i % 2), 0, TAU); ctx.fill(); }
      }
      else if (e.kind === 'chargeTrail') { ctx.translate(e.x, e.y); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#c98b5d'; ctx.shadowColor = '#f6a36a'; ctx.shadowBlur = 8; ctx.lineWidth = 4 * a; ctx.beginPath(); ctx.moveTo(-22, 5); ctx.quadraticCurveTo(0, -5, 24, 5); ctx.stroke(); }
      else if (e.kind === 'afterimage') { ctx.fillStyle = '#d9ead377'; ctx.strokeStyle = '#f0dca055'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(e.x, e.y - 18, 13, 23, 0, 0, TAU); ctx.fill(); ctx.stroke(); }
      else if (e.kind === 'wind') { ctx.strokeStyle = e.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y, 20 + t * 38, 0, TAU); ctx.stroke(); }
      else if (e.kind === 'heal' || e.kind === 'summon') { ctx.strokeStyle = e.kind === 'heal' ? '#9be7a3' : '#bd87db'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(e.x, e.y - 10, 16 + t * 30, 0, TAU); ctx.stroke(); }
      else if (e.kind === 'hit') { ctx.fillStyle = '#f1836c33'; ctx.beginPath(); ctx.arc(e.x, e.y, 36, 0, TAU); ctx.fill(); }
      else if (e.kind === 'critical') { ctx.translate(e.x, e.y - 25); ctx.rotate(t * 1.4); ctx.fillStyle = e.color; ctx.shadowColor = e.color; ctx.shadowBlur = 14; drawStarPath(0, 0, 11 + t * 13, 4.5, 8); ctx.fill(); }
      ctx.restore();
    }
  }
  function drawDragonCoils() {
    for (const e of state.effects) if (e.kind === 'weapon' && e.style === 'dragonCoil') {
      const a = clamp(e.life / e.max, 0, 1), t = 1 - a;
      // Keep the dragon readable through the orbit instead of fading it linearly
      // into the player and the ground art.
      const envelope = Math.pow(Math.max(0, Math.sin(Math.PI * t)), .32);
      const pulse = .88 + Math.sin(t * TAU * 2) * .12;
      ctx.save(); ctx.globalAlpha = envelope * pulse; drawWeaponEffect(e, a, t); ctx.restore();
    }
  }
  function drawStarPath(x, y, outer, inner, points) {
    ctx.beginPath(); for (let i = 0; i < points * 2; i++) { const r = i % 2 ? inner : outer, a = -Math.PI / 2 + i * Math.PI / points; const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath();
  }
  function drawWeaponEffect(e, a, t) {
    ctx.translate(e.x, e.y); if (e.style !== 'dragonCoil') ctx.rotate(e.angle || 0); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const color = e.color || '#eed59b';
    const rank = e.rank || 1;
    ctx.scale(1 + Math.min(4, rank - 1) * .085, 1 + Math.min(4, rank - 1) * .085);
    if (e.style === 'boarRush') {
      ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = color; ctx.shadowBlur = 13;
      for (let i = 0; i < 4; i++) { const x = -e.radius * (.8 - i * .12) - t * 24, width = 4 + i * 1.5; ctx.strokeStyle = i % 2 ? '#ffe0a0aa' : color + 'bb'; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x, -16 + i * 7); ctx.quadraticCurveTo(x + 20, 0, x + 2, 16 - i * 7); ctx.stroke(); }
      ctx.fillStyle = '#fff0c2'; drawStarPath(e.radius * .2, 0, 7 + t * 5, 2.4, 5); ctx.fill();
    } else if (e.style === 'boarImpact') {
      const r = e.radius * (.5 + t * .8); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.strokeStyle = '#fff0c2'; ctx.lineWidth = 4 * a; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      for (let i = 0; i < 8; i++) { const ang = i * TAU / 8 + t * .3; ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * r * .45, Math.sin(ang) * r * .45); ctx.lineTo(Math.cos(ang) * r * 1.25, Math.sin(ang) * r * 1.25); ctx.stroke(); }
    } else if (e.style === 'guardianSlam') {
      const r = e.radius * (.25 + t * .88); ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.strokeStyle = '#dbffec'; ctx.lineWidth = 4 * a; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = color + 'cc'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * .72, t * 2, TAU + t * 2); ctx.stroke();
      for (let i = 0; i < 8; i++) { const ang = i * TAU / 8 + .18, inner = r * .78, outer = r * (1.18 + Math.sin(i * 3.2) * .08); ctx.beginPath(); ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner); ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer); ctx.stroke(); }
    } else if (e.style === 'enemyVenomCast') {
      ctx.translate(18, -18); ctx.rotate(t * 2); ctx.shadowColor = color; ctx.shadowBlur = 14; ctx.strokeStyle = '#e7d4ff'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, 13 + t * 10, 0, TAU); ctx.stroke();
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * TAU / 3); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-4, -24 - t * 7); ctx.lineTo(4, -24 - t * 7); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#f0d9ff'; ctx.beginPath(); ctx.arc(0, 0, 4 + t * 3, 0, TAU); ctx.fill();
    } else if (e.style === 'dragonCoil') {
      const orbitAlpha = ctx.globalAlpha;
      ctx.translate(0, -37); ctx.shadowColor = '#ef9d43'; ctx.shadowBlur = 24;
      const orbitRx = 58 + e.rank * 2, orbitRy = 31 + e.rank;
      ctx.strokeStyle = '#f8c66b77'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.ellipse(0, 7, orbitRx, orbitRy, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#fff0bd99'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 7, orbitRx - 7, orbitRy - 5, 0, .25, 5.35); ctx.stroke();
      const orbit = t * TAU * 1.42 - Math.PI / 2, dx = Math.cos(orbit) * (orbitRx - 5), dy = Math.sin(orbit) * (orbitRy - 3);
      ctx.save(); ctx.translate(dx, 7 + dy); ctx.rotate(orbit + Math.PI / 2);
      ctx.globalAlpha *= .96 + Math.max(0, Math.sin(orbit)) * .04;
      if (wyrmSprite.complete && wyrmSprite.naturalWidth) {
        ctx.globalCompositeOperation = 'source-over'; ctx.shadowColor = '#f18b38'; ctx.shadowBlur = 23;
        const dragonW = 166 + Math.min(5, e.rank) * 7, dragonH = dragonW * .5;
        ctx.drawImage(wyrmSprite, -dragonW / 2, -dragonH / 2, dragonW, dragonH);
      }
      else { ctx.strokeStyle = '#e5a14e'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(0, 0, 30, -.8, 4.8); ctx.stroke(); ctx.fillStyle = '#ffe6a2'; ctx.beginPath(); ctx.ellipse(28, -14, 16, 11, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#fff1b8'; ctx.shadowBlur = 17; ctx.beginPath(); ctx.arc(0, 0, 4.2 + Math.sin(t * TAU * 4) * .8, 0, TAU); ctx.fill(); ctx.restore();
      const trailCount = 10;
      for (let i = 0; i < trailCount; i++) {
        const phase = orbit - i * .13, px = Math.cos(phase) * (orbitRx - 5), py = 7 + Math.sin(phase) * (orbitRy - 3), size = 4.2 - i * .27;
        ctx.globalAlpha = orbitAlpha * (1 - i / trailCount) * .9; ctx.fillStyle = i % 2 ? '#fff2bd' : color; ctx.shadowColor = color; ctx.shadowBlur = 12;
        ctx.save(); ctx.translate(px, py); ctx.rotate(phase); ctx.beginPath(); ctx.moveTo(0, -size); ctx.quadraticCurveTo(size * .8, 0, 0, size); ctx.quadraticCurveTo(-size * .8, 0, 0, -size); ctx.fill(); ctx.restore();
      }
    } else if (e.style === 'turtleWard') {
      ctx.translate(0, -12); ctx.globalAlpha *= .32 + a * .28; ctx.shadowColor = color; ctx.shadowBlur = 13;
      ctx.strokeStyle = '#9df1d1'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.ellipse(0, 0, 34 + Math.sin(t * 8) * 2, 21 + Math.sin(t * 8), 0, .12, Math.PI * 1.88); ctx.stroke();
      ctx.strokeStyle = '#d9fff0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, 0, 29, 17, 0, .2, Math.PI * 1.82); ctx.stroke();
      for (let i = 0; i < 6; i++) { const ang = i * TAU / 6 + t * .35; ctx.save(); ctx.rotate(ang); ctx.fillStyle = '#8ee1c377'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-5, -39); ctx.lineTo(0, -46); ctx.lineTo(5, -39); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#e5fff4'; ctx.globalAlpha *= .65; ctx.beginPath(); ctx.arc(0, -3, 3.5, 0, TAU); ctx.fill();
    } else if (e.style === 'tigerPounce') {
      ctx.translate(6, -15); ctx.globalAlpha *= a * .92; ctx.shadowColor = color; ctx.shadowBlur = 12;
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i - 1) * .22); ctx.strokeStyle = i === 1 ? '#fff0d1' : '#f2a45a'; ctx.lineWidth = 5 - i * .7; ctx.beginPath(); ctx.moveTo(4, -19 + i * 8); ctx.quadraticCurveTo(27 + t * 12, -10 + i * 6, 49 + t * 18, -25 + i * 13); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#fff0cf'; drawStarPath(52 + t * 11, -5, 5 + t * 5, 2, 5); ctx.fill();
    } else if (e.style === 'absorbVortex') {
      const progress = clamp(1 - (e.hitAt || 0) / .42, 0, 1), radius = e.radius * (.3 + progress * .7), pulse = .92 + Math.sin(t * 16) * .045;
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha *= e.struck ? .28 : .68;
      const core = ctx.createRadialGradient(0, 0, 5, 0, 0, radius * .82); core.addColorStop(0, '#241833c9'); core.addColorStop(.32, '#593c7785'); core.addColorStop(.7, '#9b6cc52b'); core.addColorStop(1, '#b58bea00');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, radius * .82, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= e.struck ? .5 : .82;
      for (let ring = 0; ring < 3; ring++) {
        ctx.save(); ctx.rotate(t * (ring % 2 ? -1 : 1) * (1.2 + ring * .38) + ring * .9);
        ctx.strokeStyle = ring === 1 ? '#f1d5ffb0' : '#bf92f2a0'; ctx.shadowColor = '#a46be8'; ctx.shadowBlur = 11 - ring * 2;
        ctx.lineWidth = ring === 0 ? 3.2 : 1.8; ctx.setLineDash(ring === 1 ? [5, 8] : [20 + ring * 4, 10]);
        ctx.beginPath(); ctx.arc(0, 0, radius * (ring === 0 ? .8 : ring === 1 ? .63 : .46) * pulse, .15 + ring * .7, TAU - .2 + ring * .7); ctx.stroke(); ctx.restore();
      }
      ctx.setLineDash([]);
      for (let i = 0; i < 7; i++) {
        const ang = i * TAU / 7 + t * 2.7, outer = radius * (.87 + Math.sin(i * 4.8 + t * 8) * .045), mid = outer * .59;
        const sx = Math.cos(ang) * outer, sy = Math.sin(ang) * outer, ex = Math.cos(ang + .72) * mid, ey = Math.sin(ang + .72) * mid;
        ctx.strokeStyle = i % 2 ? '#d9b4ffb8' : '#8fe7e1b0'; ctx.shadowColor = i % 2 ? '#b576ed' : '#63d6ce'; ctx.shadowBlur = 10; ctx.lineWidth = 3.4 - (i % 3) * .45;
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx * .38, sy * .38, ex * 1.7, ey * 1.7, ex, ey); ctx.stroke();
        ctx.fillStyle = '#fff1ff'; ctx.beginPath(); ctx.arc(ex, ey, 2.1 + (i % 2), 0, TAU); ctx.fill();
      }
      ctx.shadowBlur = 0; ctx.fillStyle = '#291b3c'; ctx.strokeStyle = '#e8d2ff'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(0, 0, 16 + rank * 1.5, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d8b8f5'; ctx.beginPath(); ctx.arc(-5, -4, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#342342'; ctx.beginPath(); ctx.arc(5, 4, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff1c9'; ctx.beginPath(); ctx.arc(-5, -4, 1.7, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(5, 4, 1.7, 0, TAU); ctx.fill(); ctx.restore();
    } else if (e.style === 'absorbBurst') {
      const radius = e.radius * (.1 + t * .54); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= a * .72;
      ctx.strokeStyle = '#e2c3ff'; ctx.shadowColor = e.color; ctx.shadowBlur = 15; ctx.lineWidth = 4 * a + 1; ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#fff0cf'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, radius * .82, .2 + t, TAU - .25 + t); ctx.stroke();
      for (let i = 0; i < 12; i++) { const ang = i * TAU / 12, inner = radius * .86, outer = radius * (1 + Math.sin(i * 4.1) * .08); ctx.beginPath(); ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner); ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer); ctx.stroke(); }
      ctx.restore();
    } else if (e.style === 'buddhaPalm') {
      const progress = clamp(1 - (e.hitAt || 0) / .48, 0, 1), impact = e.struck ? clamp((t - .45) / .61, 0, 1) : 0;
      const handAlpha = e.struck ? 1 - impact : .92, handScale = e.struck ? 1.04 - impact * .18 : .42 + progress * .58;
      ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha *= clamp(handAlpha, 0, 1); ctx.shadowColor = '#e8a82e'; ctx.shadowBlur = 13 + (1 - progress) * 7;
      if (buddhaPalmSprite.complete && buddhaPalmSprite.naturalWidth) {
        const handW = (286 + rank * 24) * handScale, handH = handW * buddhaPalmSprite.naturalHeight / buddhaPalmSprite.naturalWidth;
        ctx.drawImage(buddhaPalmSprite, -handW / 2, -handH / 2, handW, handH);
      }
      ctx.restore();
      const sealRadius = e.struck ? e.radius * (.2 + impact * 1.05) : 19 + progress * e.radius * .43;
      ctx.save(); ctx.translate(0, 7); ctx.globalAlpha *= e.struck ? .48 * (1 - impact * .72) : .28 + progress * .16;
      ctx.strokeStyle = '#ffe6a0'; ctx.shadowColor = '#ffc84e'; ctx.shadowBlur = 10; ctx.lineWidth = e.struck ? 3.2 - impact * 1.2 : 1.8;
      ctx.beginPath(); ctx.arc(0, 0, sealRadius, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#fff4ca'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, sealRadius * .76, .15 + t * .8, TAU - .2 + t * .8); ctx.stroke();
      for (let i = 0; i < 8; i++) { const ang = i * TAU / 8 + t * .55, r1 = sealRadius * .78, r2 = sealRadius * 1.08; ctx.beginPath(); ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1); ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2); ctx.stroke(); }
      if (e.struck) {
        ctx.globalAlpha *= .48; const wash = ctx.createRadialGradient(0, 0, sealRadius * .14, 0, 0, sealRadius); wash.addColorStop(0, '#fff3c788'); wash.addColorStop(.48, '#f5c85d3d'); wash.addColorStop(1, '#f5c85d00');
        ctx.fillStyle = wash; ctx.beginPath(); ctx.arc(0, 0, sealRadius, 0, TAU); ctx.fill();
      }
      ctx.restore();
    } else if (e.style === 'buddhaSeal') {
      const ring = 22 + t * (e.radius || 110) * .72; ctx.translate(0, 4); ctx.globalCompositeOperation = 'lighter'; ctx.rotate(t * .7);
      ctx.globalAlpha *= .55; ctx.strokeStyle = '#ffe3a0'; ctx.shadowColor = color; ctx.shadowBlur = 9; ctx.lineWidth = 1.7 * a; ctx.beginPath(); ctx.arc(0, 0, ring, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#fff3ca'; ctx.lineWidth = .9 * a; ctx.beginPath(); ctx.arc(0, 0, ring * .7, .3, 5.9); ctx.stroke();
      for (let i = 0; i < 8; i++) { ctx.save(); ctx.rotate(i * TAU / 8); ctx.beginPath(); ctx.ellipse(0, -ring * .82, 3 + t * 3, 8 + t * 4, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    } else if (e.style === 'palmShockwave') {
      const progress = t, radius = e.radius * (.2 + progress * 1.12); ctx.translate(0, 6); ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= .7; const wash = ctx.createRadialGradient(0, 0, radius * .18, 0, 0, radius); wash.addColorStop(0, '#fff5cf00'); wash.addColorStop(.72, '#f5c85d08'); wash.addColorStop(.94, '#ffe7a43d'); wash.addColorStop(1, '#ffe7a100');
      ctx.fillStyle = wash; ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.fill(); ctx.strokeStyle = '#ffe8a8'; ctx.shadowColor = color; ctx.shadowBlur = 12; ctx.lineWidth = 3.2 * a + .8; ctx.beginPath(); ctx.arc(0, 0, radius, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#fff4d1'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, radius * .78, .2 + progress * .3, TAU - .2 + progress * .3); ctx.stroke();
      for (let i = 0; i < 12; i++) { const ang = i * TAU / 12 + .1, inner = radius * .82, outer = radius * (1.05 + Math.sin(i * 7.4) * .07); ctx.beginPath(); ctx.moveTo(Math.cos(ang) * inner, Math.sin(ang) * inner); ctx.lineTo(Math.cos(ang) * outer, Math.sin(ang) * outer); ctx.stroke(); }
    } else if (e.style === 'lightnessArc') {
      ctx.translate(8, -17); ctx.shadowColor = color; ctx.shadowBlur = 14;
      for (let i = 0; i < 3; i++) { const rise = i * 9; ctx.strokeStyle = i === 1 ? '#f3fff0' : color + 'cc'; ctx.lineWidth = (5 - i) * (1 - t * .35); ctx.beginPath(); ctx.moveTo(-5 + t * 12, 15 + rise); ctx.quadraticCurveTo(32, -30 + rise, 74 + e.rank * 3, -7 + rise); ctx.stroke(); }
      for (let i = 0; i < 4; i++) { const x = 18 + i * 15 + t * 12; ctx.fillStyle = i % 2 ? '#e6f6c1' : '#bbdf96'; ctx.save(); ctx.translate(x, Math.sin(i * 2.2 + t * 5) * 9 - 9); ctx.rotate(-.65 + i * .32); ctx.beginPath(); ctx.ellipse(0, 0, 4, 2, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    } else if (e.style === 'lightnessEvade') {
      ctx.translate(0, -12); ctx.globalAlpha *= a * .8; ctx.shadowColor = color; ctx.shadowBlur = 12;
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(-.34 + i * .34 + t * .28); ctx.strokeStyle = i === 1 ? '#efffe9' : color + 'cc'; ctx.lineWidth = 5 - i; ctx.beginPath(); ctx.ellipse(-8 - t * 10, 0, 23 + i * 5 + t * 12, 13 + i * 3, 0, -.9, 1.5); ctx.stroke(); ctx.restore(); }
      for (let i = 0; i < 7; i++) { const ang = i * TAU / 7 + t * 1.8, r = 23 + t * 17; ctx.fillStyle = i % 2 ? '#f5f2c9' : '#a6edd2'; ctx.beginPath(); ctx.ellipse(Math.cos(ang) * r, Math.sin(ang) * r * .72, 4, 2, ang, 0, TAU); ctx.fill(); }
    } else if (e.style === 'woodStaff') {
      ctx.translate(18, -16); ctx.rotate(-.3 + (t - .5) * .48); ctx.lineCap = 'round'; ctx.shadowColor = color; ctx.shadowBlur = 9 + rank * 2;
      const reach = 53 + rank * 5, echoes = 1 + Math.floor((rank - 1) / 2);
      for (let i = echoes - 1; i >= 0; i--) {
        const offset = i * 6, alpha = 1 - i * .22;
        ctx.globalAlpha *= alpha; ctx.strokeStyle = i ? '#e5c17a88' : '#d9b77a99'; ctx.lineWidth = Math.max(2, 5 + rank * .45 - i * .7);
        ctx.beginPath(); ctx.arc(10, 0, 37 + rank * 3 + offset, -1.18 + t * .32, .62 + t * .32); ctx.stroke(); ctx.globalAlpha /= alpha;
      }
      ctx.strokeStyle = '#6b472c'; ctx.lineWidth = 8 + rank * 1.7; ctx.beginPath(); ctx.moveTo(1, 16); ctx.quadraticCurveTo(reach * .46, 2, reach, -16); ctx.stroke();
      ctx.strokeStyle = '#e1c083'; ctx.lineWidth = 3 + rank * .55; ctx.beginPath(); ctx.moveTo(1, 14); ctx.quadraticCurveTo(reach * .46, 0, reach - 1, -16); ctx.stroke();
      ctx.strokeStyle = '#fff0c3'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(reach - 9, -10); ctx.lineTo(reach, -16); ctx.lineTo(reach - 10, -14); ctx.stroke();
      if (rank >= 5) {
        ctx.strokeStyle = '#fff0bd'; ctx.lineWidth = 2.4; ctx.shadowBlur = 15;
        for (let i = 0; i < 4; i++) { const x = reach * (.38 + i * .12), y = Math.sin(i * 2.1 + t * 2) * 8; ctx.beginPath(); ctx.moveTo(x - 4, y - 4); ctx.lineTo(x + 4, y + 4); ctx.moveTo(x - 4, y + 4); ctx.lineTo(x + 4, y - 4); ctx.stroke(); }
      }
    } else if (e.style === 'fist') {
      ctx.translate(14, -14); ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 9; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(5 + t * 8, -13 + i * 8); ctx.lineTo(31 + t * 10, -13 + i * 8); ctx.stroke(); }
      ctx.strokeStyle = '#fff3d2'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(43, 0, 7 + t * 16, -.95, .95); ctx.stroke();
      ctx.fillStyle = '#fff1cf'; drawStarPath(48, 0, 5 + t * 6, 2, 4); ctx.fill();
    } else if (e.style === 'saberArc' || e.style === 'dragonBlade') {
      const r = e.radius || (e.style === 'dragonBlade' ? 126 : 96); ctx.translate(8, -16); ctx.shadowColor = color; ctx.shadowBlur = 12 + (e.rank || 1) * 2;
      const rr = r * (.9 + t * .14), end = e.style === 'dragonBlade' ? 1.18 : .94;
      const blade = ctx.createLinearGradient(0, -rr, rr, rr); blade.addColorStop(0, '#fff1bd'); blade.addColorStop(.22, color); blade.addColorStop(1, color + '22');
      // Layered curved strokes read as a blade edge, instead of a filled wedge that hides the fighters.
      ctx.strokeStyle = blade; ctx.lineWidth = (e.style === 'dragonBlade' ? 22 : 15) + (e.rank || 1) * 1.6; ctx.beginPath(); ctx.arc(0, 0, rr, -end, end); ctx.stroke();
      ctx.strokeStyle = '#fff7de'; ctx.lineWidth = e.style === 'dragonBlade' ? 4 : 3; ctx.beginPath(); ctx.arc(0, 0, rr - 2, -end * .96, end * .96); ctx.stroke();
      ctx.strokeStyle = color + 'bb'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, rr * .76, -end * .72, end * .72); ctx.stroke();
      if (e.style === 'dragonBlade') {
        ctx.strokeStyle = '#ffcf78'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, rr * 1.12, -1.02, 1.02); ctx.stroke();
        for (let i = 0; i < 7; i++) { const ang = -.92 + i * .30, x = Math.cos(ang) * rr * 1.06, y = Math.sin(ang) * rr * 1.06; ctx.fillStyle = '#ffe6a0'; drawStarPath(x, y, 3.5 + t, 1.3, 4); ctx.fill(); }
      }
    } else if (e.style === 'fingerBeam') {
      const len = Math.max(1, e.length ?? 500), width = 4 + rank * .8, qiColor = '#62cda8'; ctx.translate(17, -15); ctx.globalCompositeOperation = 'source-over';
      const wave = Math.min(4.5, 1.4 + rank * .38), bend = (u, side = 0) => Math.sin(u * Math.PI * 1.15 + t * 2.4) * wave * u + side;
      const trace = (side = 0) => { ctx.beginPath(); ctx.moveTo(0, side); ctx.bezierCurveTo(len * .28, bend(.28, side), len * .66, bend(.66, side) * .72, len, bend(1, side) * .35); };
      const ribbon = ctx.createLinearGradient(0, 0, len, 0); ribbon.addColorStop(0, qiColor + '78'); ribbon.addColorStop(.18, qiColor + '62'); ribbon.addColorStop(.7, qiColor + '35'); ribbon.addColorStop(1, qiColor + '00');
      ctx.shadowColor = qiColor; ctx.shadowBlur = 8 + rank; ctx.strokeStyle = ribbon; ctx.lineWidth = width * 1.9; trace(); ctx.stroke();
      ctx.shadowBlur = 3; ctx.strokeStyle = '#c6f4dfc8'; ctx.lineWidth = width * .58; trace(); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = '#e9f8d7'; ctx.lineWidth = 1.05 + rank * .1; trace(); ctx.stroke();
      for (const side of [-1, 1]) { ctx.globalAlpha *= .52; ctx.shadowBlur = 4; ctx.strokeStyle = qiColor + '99'; ctx.lineWidth = 1 + rank * .1; trace(side * (width * .82)); ctx.stroke(); ctx.globalAlpha /= .52; }
      // Small travelling qi motes give the straight-through hit a visible flow
      // without the repeated hard rings that made this read like a laser.
      for (let i = 0; i < 4; i++) {
        const u = ((i * .245 + t * 1.3) % .91) + .04, x = len * u, y = bend(u, 0), mote = 3.4 + rank * .32;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.atan2(bend(Math.min(1, u + .02)) - y, len * .02));
        ctx.globalAlpha *= .42 + (1 - u) * .3; ctx.fillStyle = i === 0 ? '#f3eac5' : '#c9f3de'; ctx.shadowColor = qiColor; ctx.shadowBlur = 5;
        ctx.strokeStyle = qiColor + '8a'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-mote * 3.5, 0); ctx.lineTo(-mote * 1.3, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-mote * 1.8, 0); ctx.quadraticCurveTo(-mote * .1, -mote * .62, mote * 1.7, 0); ctx.quadraticCurveTo(-mote * .1, mote * .62, -mote * 1.8, 0); ctx.fill(); ctx.restore();
      }
      const bloom = ctx.createRadialGradient(len, bend(1, 0), 1, len, bend(1, 0), 10 + rank);
      bloom.addColorStop(0, '#e9f6d9cc'); bloom.addColorStop(.28, qiColor + '88'); bloom.addColorStop(1, qiColor + '00'); ctx.fillStyle = bloom;
      ctx.beginPath(); ctx.arc(len, bend(1, 0), 10 + rank, 0, TAU); ctx.fill();
      ctx.shadowBlur = 4; ctx.strokeStyle = '#d8f3dfbb'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(0, 0, 5 + rank * .3, -.8, .8); ctx.stroke();
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
      ctx.translate(18, -15); const len = 94 * (1 - t * .12), lanes = e.count >= 5 ? 5 : 3;
      ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = '#f59f43'; ctx.shadowBlur = 22;
      for (let i = 0; i < lanes; i++) {
        const lane = i - (lanes - 1) / 2, bend = lane * 8, endY = lane * 10, center = i === Math.floor(lanes / 2);
        ctx.strokeStyle = center ? '#ffd16d' : '#dc763d99'; ctx.lineWidth = (center ? 11 : 6) * a;
        ctx.beginPath(); ctx.moveTo(-10, lane * 3); ctx.bezierCurveTo(len * .22, -31 + bend, len * .44, 28 - bend, len * .68, endY - 4); ctx.quadraticCurveTo(len * .84, endY + 12, len, endY); ctx.stroke();
        ctx.strokeStyle = center ? '#fff2bf' : '#ffd27a99'; ctx.lineWidth = (center ? 2.2 : 1.1) * a;
        ctx.beginPath(); ctx.moveTo(-8, lane * 3); ctx.bezierCurveTo(len * .22, -31 + bend, len * .44, 28 - bend, len * .68, endY - 4); ctx.quadraticCurveTo(len * .84, endY + 12, len, endY); ctx.stroke();
      }
      // Give the released qi a recognizable dragon head, whiskers, and a bright eye.
      ctx.save(); ctx.translate(len, 0); ctx.shadowColor = '#ffcf70'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#f3b34e'; ctx.beginPath(); ctx.moveTo(-8, -7); ctx.quadraticCurveTo(1, -13, 8, -6); ctx.lineTo(16, 0); ctx.lineTo(8, 7); ctx.quadraticCurveTo(0, 12, -8, 6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff2c5'; ctx.beginPath(); ctx.arc(5, -3, 1.8, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff0b3'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(3, -6); ctx.quadraticCurveTo(12, -16, 20, -14); ctx.moveTo(4, 5); ctx.quadraticCurveTo(13, 13, 21, 11); ctx.stroke();
      ctx.restore();
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
    if (e.style === 'venomHit') {
      ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = '#c59ae7'; ctx.shadowBlur = 14;
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = i === 1 ? '#f2d9ff' : '#a478d2'; ctx.lineWidth = 3 - i * .5; ctx.beginPath(); ctx.arc(0, 0, r * (.36 + i * .22 + t * .5), -.5 + i * .4 + t, 2.8 + i * .3 + t); ctx.stroke(); }
      for (let i = 0; i < 5; i++) { const ang = i * TAU / 5 + t * 2; ctx.fillStyle = '#d8b5f1'; ctx.beginPath(); ctx.arc(Math.cos(ang) * r * (.65 + t * .45), Math.sin(ang) * r * .55, 2.4, 0, TAU); ctx.fill(); }
    } else if (e.style === 'woodHit') {
      ctx.strokeStyle = '#d8b477'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-r * .7, -r * .36); ctx.lineTo(r * .72, r * .22); ctx.moveTo(-r * .45, r * .55); ctx.lineTo(r * .55, -r * .44); ctx.stroke();
      ctx.fillStyle = '#bd8b50'; for (let i = 0; i < 4; i++) { const ang = -.9 + i * .55; ctx.save(); ctx.rotate(ang); ctx.fillRect(r * (.55 + t * .35), -1.2, 7, 2.4); ctx.restore(); }
    } else if (e.style === 'lightnessHit') {
      ctx.strokeStyle = '#d7ffe5'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r * (.85 + t * .7), -.9, .9); ctx.stroke();
      ctx.strokeStyle = '#9ce4c1'; ctx.lineWidth = 3; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-r * .35, i * r * .2); ctx.quadraticCurveTo(r * .25, i * r * .1 - r * .25, r * (1 + t * .25), i * r * .22); ctx.stroke(); }
      for (let i = 0; i < 5; i++) { const ang = -.8 + i * .4, x = Math.cos(ang) * r * (1 + t), y = Math.sin(ang) * r * .65; ctx.fillStyle = i % 2 ? '#e7efb1' : '#9ce4c1'; ctx.beginPath(); ctx.ellipse(x, y, 4, 2, ang, 0, TAU); ctx.fill(); }
    } else if (e.style === 'beastSwipe') {
      for (let i = -1; i <= 1; i++) { ctx.strokeStyle = i === 0 ? '#fff0d2' : '#f3a45b'; ctx.lineWidth = i === 0 ? 3.4 : 2.4; ctx.beginPath(); ctx.moveTo(-r * .3, i * r * .28 - 3); ctx.quadraticCurveTo(r * .2, i * r * .34 - r * .42, r * (.95 + t * .28), i * r * .36); ctx.stroke(); }
      ctx.fillStyle = '#ffe2a3'; drawStarPath(r * .62, -r * .18, 4 + t * 4, 1.8, 5);
    } else if (e.style === 'featherHit') {
      ctx.strokeStyle = '#e4fff4'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-r * .4, 0); ctx.quadraticCurveTo(0, -r * .75, r, 0); ctx.quadraticCurveTo(0, r * .35, -r * .4, 0); ctx.stroke();
      for (let i = 0; i < 5; i++) { const ang = i * TAU / 5 + t; ctx.fillStyle = i % 2 ? '#b8f1e4' : '#f6efc8'; ctx.beginPath(); ctx.ellipse(Math.cos(ang) * r * (.75 + t * .2), Math.sin(ang) * r * .55, 3, 1.6, ang, 0, TAU); ctx.fill(); }
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
    c.clearRect(0, 0, mw, mh); c.fillStyle = '#1b3026'; c.fillRect(0, 0, mw, mh);
    // Keep the map centered on the player while showing enough surrounding
    // ground to read nearby regions and find the village across long trips.
    const cell = Math.min(mw, mh) / 2600, ox = mw / 2 - p.x * cell, oy = mh / 2 - p.y * cell;
    const point = (x, y) => ({ x: ox + x * cell, y: oy + y * cell });
    c.save(); c.beginPath(); c.rect(0, 0, mw, mh); c.clip();

    // A quiet coordinate grid gives the open map scale without competing with
    // enemy dots or the zone boundaries.
    const left = p.x - mw / (2 * cell), right = p.x + mw / (2 * cell);
    const top = p.y - mh / (2 * cell), bottom = p.y + mh / (2 * cell);
    c.strokeStyle = '#d9d1aa12'; c.lineWidth = 1; c.setLineDash([2, 8]);
    for (let x = Math.ceil(left / 500) * 500; x <= right; x += 500) { const sx = ox + x * cell; c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx, mh); c.stroke(); }
    for (let y = Math.ceil(top / 500) * 500; y <= bottom; y += 500) { const sy = oy + y * cell; c.beginPath(); c.moveTo(0, sy); c.lineTo(mw, sy); c.stroke(); }
    c.setLineDash([]);

    for (const region of LANDSCAPE_REGIONS) {
      const center = point(region.x, region.y), rx = region.rx * cell, ry = region.ry * cell;
      if (center.x + rx < 0 || center.x - rx > mw || center.y + ry < 0 || center.y - ry > mh) continue;
      const [red, green, blue] = region.tint.split(',').map(Number);
      c.save(); c.translate(center.x, center.y); c.scale(rx, ry);
      const wash = c.createRadialGradient(0, 0, .08, 0, 0, 1);
      wash.addColorStop(0, `rgba(${red},${green},${blue},.20)`); wash.addColorStop(.68, `rgba(${red},${green},${blue},.11)`); wash.addColorStop(1, `rgba(${red},${green},${blue},0)`);
      c.fillStyle = wash; c.beginPath(); c.arc(0, 0, 1, 0, TAU); c.fill(); c.restore();
      c.strokeStyle = `rgba(${red},${green},${blue},.48)`; c.lineWidth = 1.5; c.setLineDash([7, 6]);
      c.beginPath(); c.ellipse(center.x, center.y, rx, ry, 0, 0, TAU); c.stroke(); c.setLineDash([]);

      // Label the region at its center when visible, or near the visible edge
      // of its boundary when the player is approaching from farther away.
      const towardPlayerX = mw / 2 - center.x, towardPlayerY = mh / 2 - center.y;
      const edgeT = 1 / Math.sqrt((towardPlayerX / rx) ** 2 + (towardPlayerY / ry) ** 2 || 1);
      const labelX = center.x > 42 && center.x < mw - 42 ? center.x : center.x + towardPlayerX * edgeT * .78;
      const labelY = center.y > 22 && center.y < mh - 22 ? center.y - 17 : center.y + towardPlayerY * edgeT * .78;
      if (labelX > 48 && labelX < mw - 48 && labelY > 18 && labelY < mh - 18) {
        c.font = '600 11px Noto Sans SC'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const labelWidth = c.measureText(region.name).width + 12;
        c.fillStyle = '#14241edb'; c.strokeStyle = `rgba(${red},${green},${blue},.62)`; c.lineWidth = 1;
        c.beginPath();
        if (c.roundRect) c.roundRect(labelX - labelWidth / 2, labelY - 9, labelWidth, 18, 7);
        else c.rect(labelX - labelWidth / 2, labelY - 9, labelWidth, 18);
        c.fill(); c.stroke();
        c.fillStyle = '#e7e1c8'; c.fillText(region.name, labelX, labelY);
      }

      // Draw the same winding trails used in the world as fine map paths.
      c.beginPath();
      region.trail.forEach(([dx, dy], index) => { const trail = point(region.x + dx, region.y + dy); index ? c.lineTo(trail.x, trail.y) : c.moveTo(trail.x, trail.y); });
      c.strokeStyle = '#161c16aa'; c.lineWidth = 6; c.stroke();
      c.strokeStyle = '#d1b77a99'; c.lineWidth = 2; c.setLineDash([5, 5]); c.stroke(); c.setLineDash([]);
    }

    // Mark Anping Town when nearby; otherwise pin it to the map edge with its
    // direction and distance so returning to defend it never requires guessing.
    const town = point(VILLAGE.x + VILLAGE.w / 2, VILLAGE.y + VILLAGE.h / 2);
    const townDistance = Math.hypot(p.x - (VILLAGE.x + VILLAGE.w / 2), p.y - (VILLAGE.y + VILLAGE.h / 2));
    if (town.x > 22 && town.x < mw - 22 && town.y > 22 && town.y < mh - 22) {
      c.save(); c.setLineDash([4, 4]); c.strokeStyle = '#73d5ce70'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(mw / 2, mh / 2); c.lineTo(town.x, town.y); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#12332f'; c.strokeStyle = '#9af2df'; c.lineWidth = 2; c.beginPath(); c.arc(town.x, town.y, 8, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#c2fff0'; c.font = '700 10px Noto Sans SC'; c.textAlign = 'left'; c.fillText('安平镇', town.x + 12, town.y - 8); c.restore();
    } else {
      const dx = town.x - mw / 2, dy = town.y - mh / 2;
      const scaleToEdge = Math.min((mw / 2 - 24) / Math.max(1, Math.abs(dx)), (mh / 2 - 30) / Math.max(1, Math.abs(dy)));
      const ax = mw / 2 + dx * scaleToEdge, ay = mh / 2 + dy * scaleToEdge, angle = Math.atan2(dy, dx);
      c.save(); c.translate(ax, ay); c.rotate(angle); c.fillStyle = '#8be3d4'; c.strokeStyle = '#173b33'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(12, 0); c.lineTo(-8, -7); c.lineTo(-5, 0); c.lineTo(-8, 7); c.closePath(); c.fill(); c.stroke(); c.restore();
      c.font = '600 10px Noto Sans SC'; c.textAlign = ax < mw / 2 ? 'left' : 'right'; c.textBaseline = 'middle';
      c.fillStyle = '#d2f5e9'; c.shadowColor = '#102119'; c.shadowBlur = 4;
      c.fillText(`安平镇 · ${(townDistance / 1000).toFixed(1)} km`, ax + (ax < mw / 2 ? 13 : -13), ay + (ay < mh * .25 ? 13 : -13)); c.shadowBlur = 0;
    }

    for (const e of state.enemies) {
      const { x, y } = point(e.x, e.y); if (x < 0 || x > mw || y < 0 || y > mh) continue;
      c.fillStyle = e.boss ? '#ffd06e' : e.beast ? '#dfad70' : '#e67f63';
      c.beginPath(); c.arc(x, y, e.boss ? 5 : e.beast ? 3.5 : 2.6, 0, TAU); c.fill();
      if (e.boss) { c.strokeStyle = '#ffd06eaa'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 8, 0, TAU); c.stroke(); }
    }
    for (const v of state.villagers) if (v.alive) { const { x, y } = point(v.x, v.y); c.fillStyle = '#83d8ab'; c.beginPath(); c.arc(x, y, 3.2, 0, TAU); c.fill(); }

    // Player arrow points in the current facing direction; a halo keeps it
    // readable when several enemy markers overlap around the center.
    c.save(); c.translate(mw / 2, mh / 2); c.fillStyle = '#fff1a8'; c.strokeStyle = '#513f1d'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fill(); c.stroke();
    c.rotate(Math.atan2(p.facingY, p.facingX)); c.fillStyle = '#fff9d9'; c.beginPath(); c.moveTo(7, 0); c.lineTo(-4, -4); c.lineTo(-4, 4); c.closePath(); c.fill(); c.restore();
    c.restore();

    // North and a compact legend anchor the map visually.
    c.save(); c.textAlign = 'center'; c.font = '700 10px Noto Sans SC'; c.fillStyle = '#e7dfc5cc'; c.fillText('北', mw - 19, 17);
    c.strokeStyle = '#e7dfc599'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(mw - 19, 24); c.lineTo(mw - 19, 39); c.stroke();
    c.fillStyle = '#e7dfc5cc'; c.beginPath(); c.moveTo(mw - 19, 23); c.lineTo(mw - 23, 30); c.lineTo(mw - 15, 30); c.closePath(); c.fill();
    c.font = '600 9px Noto Sans SC'; c.textAlign = 'left'; c.fillStyle = '#fff1a8'; c.fillText('▲ 你', 12, mh - 12);
    c.fillStyle = '#e67f63'; c.beginPath(); c.arc(62, mh - 15, 3, 0, TAU); c.fill(); c.fillStyle = '#d4c8a8'; c.fillText('敌人', 70, mh - 12);
    c.fillStyle = '#83d8ab'; c.beginPath(); c.arc(112, mh - 15, 3, 0, TAU); c.fill(); c.fillStyle = '#d4c8a8'; c.fillText('村民', 120, mh - 12);
    c.restore();
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
    if (key === 'shift') dodge();
    keys[key] = true;
  });
  document.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  window.addEventListener('blur', () => { keys = Object.create(null); touchPoints.clear(); pinchStartDistance = 0; resetJoystick(); $('touchStick').style.opacity = '1'; });
  $('startButton').addEventListener('click', startGame); $('restartButton').addEventListener('click', () => { state = freshState(); startGame(); });
  $('zoomOut').addEventListener('click', () => setZoom(zoom - .1)); $('zoomIn').addEventListener('click', () => setZoom(zoom + .1)); syncZoomLabel();
  $('bagBtn').addEventListener('click', () => toggleBag()); $('mapBtn').addEventListener('click', () => { $('mapModal').hidden = false; drawMap(); });
  $('touchDodge').addEventListener('click', dodge);
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { $(b.dataset.close).hidden = true; if (b.dataset.close === 'bagModal') state.bagOpen = false; }));
  document.querySelectorAll('.modal-shade').forEach(overlay => overlay.addEventListener('pointerdown', e => { if (e.target === overlay && overlay.id !== 'levelModal') { overlay.hidden = true; state.bagOpen = false; } }));

  function villageEntities() { return state.villagers; }
  function drawMapMarker() { /* Reserved for future map labels; landmark positions are already plotted in drawMap. */ }
  function formatVersion() { return 2; }
  window.__WUXIA_GAME__ = { getState: () => state, dodge, spawnEnemy, spawnBoss, selectEnemy, getLandscapeRegion, checkLevel, moveSpecs, enemySpecs, terrainBlocked, moveBody, inspectCell: worldPropsForCell };

  resize();
  state = freshState();
  draw();
})();
