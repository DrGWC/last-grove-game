(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const canvas = $('world');
  const ctx = canvas.getContext('2d', { alpha: false });
  const WORLD_W = 1536;
  const WORLD_H = 1024;
  const SAVE_KEY = 'wuxiaWorldSaveV1';
  const sceneNames = { village: '安平镇', outskirts: '青岚山道' };
  const sceneSubtitles = { village: '炊烟袅袅，江湖初行', outskirts: '山风过林，贼影渐深' };
  const images = {
    village: loadImage('assets/art/wuxia-village.jpg'),
    outskirts: loadImage('assets/art/wuxia-outskirts.jpg')
  };

  function loadImage(src) {
    const image = new Image();
    image.src = src;
    return image;
  }

  const catalog = {
    items: {
      hemp: { name: '粗布短衫', slot: '衣装', icon: '👘', desc: '寻常布衣，穿着轻便。', hp: 0, defense: 1, color: '#77845d' },
      ironSword: { name: '精钢长剑', slot: '兵刃', icon: '🗡️', desc: '山寨头目私藏的长剑，出手更远。', damage: 22, range: 38, rate: 0.02, weapon: 'sword' },
      mountainSaber: { name: '断岳刀', slot: '兵刃', icon: '⚔️', desc: '刀身厚重，横斩可及数人。', damage: 34, range: 50, rate: -0.08, weapon: 'saber' },
      cloudSpear: { name: '青云枪', slot: '兵刃', icon: '🔱', desc: '长枪灵巧，攻击距离大幅提升。', damage: 29, range: 92, rate: -0.04, weapon: 'spear' },
      scales: { name: '蛟鳞护衣', slot: '衣装', icon: '🥋', desc: '青鳞织甲，能挡住烈焰余劲。', hp: 32, defense: 5, color: '#49746a' },
      travelBoots: { name: '踏云布靴', slot: '鞋履', icon: '🥾', desc: '轻软不滞，行走更快。', speed: 42 },
      tigerManual: { name: '《伏虎拳谱》', slot: '秘籍', icon: '📜', desc: '习得虎啸连拳。', manual: 'tigerFist' },
      cloudManual: { name: '《踏云步诀》', slot: '秘籍', icon: '📜', desc: '习得踏云步。', manual: 'cloudStep' },
      dragonManual: { name: '《烛龙吐纳篇》', slot: '秘籍', icon: '📜', desc: '习得御气指。', manual: 'qiBolt' },
      tonic: { name: '金创药', slot: '消耗品', icon: '🧪', desc: '恢复 45 点气血。' }
    },
    skills: {
      tigerFist: { name: '虎啸连拳', icon: '✊', kind: '掌', desc: '消耗 18 内力，近身连击周围敌人。', cooldown: 8, cost: 18 },
      cloudStep: { name: '踏云步', icon: '〰️', kind: '轻功', desc: '消耗 12 内力，向前疾掠并避开伤害。', cooldown: 6, cost: 12 },
      qiBolt: { name: '御气指', icon: '☯', kind: '指法', desc: '消耗 20 内力，隔空贯穿敌人。', cooldown: 7, cost: 20 }
    },
    enemies: {
      bandit: { name: '拦路匪', hp: 54, damage: 8, speed: 68, reward: 12, xp: 24, color: '#8d5940', radius: 22 },
      outrider: { name: '疾行贼', hp: 40, damage: 7, speed: 98, reward: 14, xp: 24, color: '#a16c48', radius: 19 },
      brute: { name: '山寨刀客', hp: 100, damage: 13, speed: 52, reward: 24, xp: 42, color: '#52674d', radius: 25 },
      chief: { name: '寨主·厉魁', hp: 390, damage: 19, speed: 48, reward: 110, xp: 130, color: '#49383f', radius: 31, boss: true },
      dragon: { name: '火鳞山蛟', hp: 720, damage: 25, speed: 36, reward: 240, xp: 260, color: '#457c65', radius: 62, boss: true, dragon: true }
    }
  };

  const villagersInitial = [
    { id: 'tea', x: 449, y: 422, name: '茶摊掌柜', hp: 100, maxHp: 100, alive: true },
    { id: 'ferryman', x: 1240, y: 735, name: '摆渡人', hp: 100, maxHp: 100, alive: true },
    { id: 'herbalist', x: 1100, y: 397, name: '采药姑娘', hp: 100, maxHp: 100, alive: true }
  ];

  const storage = {
    get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (_) { return null; } },
    set(value) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(value)); } catch (_) { /* Storage can be disabled in private browsing. */ } }
  };

  let state = null;
  let raf = 0;
  let lastFrame = 0;
  let width = 0;
  let height = 0;
  let dpr = Math.min(2, window.devicePixelRatio || 1);
  let scale = 1;
  let cameraX = WORLD_W / 2;
  let cameraY = WORLD_H / 2;
  let viewW = 0;
  let viewH = 0;
  let toastTimer = 0;
  let eventTimer = 0;
  let keys = Object.create(null);
  let moveTarget = null;
  let pointerAim = null;
  let stickPointer = null;
  let stickOrigin = null;
  let joystick = { x: 0, y: 0 };
  let openModal = '';
  let hitFlash = 0;
  let ambienceTimer = 0;
  const ambience = Array.from({ length: 30 }, (_, i) => ({ seed: i * 37.3 + 14, phase: i * 0.77 }));

  function freshState(saved = null) {
    const validSaved = saved && saved.version === 1;
    const owned = validSaved && Array.isArray(saved.owned) ? saved.owned.filter(id => catalog.items[id]) : [];
    const learned = validSaved && Array.isArray(saved.learned) ? saved.learned.filter(id => catalog.skills[id]) : [];
    const equipped = validSaved && saved.equipped ? saved.equipped : {};
    return {
      started: false,
      scene: 'village',
      day: validSaved ? Math.max(1, saved.day || 1) : 1,
      elapsed: validSaved ? Math.max(0, saved.elapsed || 0) : 0,
      gold: validSaved ? saved.gold || 0 : 25,
      owned,
      equipped: {
        weapon: equipped.weapon && catalog.items[equipped.weapon]?.slot === '兵刃' ? equipped.weapon : null,
        cloth: equipped.cloth && catalog.items[equipped.cloth]?.slot === '衣装' ? equipped.cloth : 'hemp',
        shoes: equipped.shoes && catalog.items[equipped.shoes]?.slot === '鞋履' ? equipped.shoes : null
      },
      learned,
      selectedSkill: validSaved && learned.includes(saved.selectedSkill) ? saved.selectedSkill : learned[0] || null,
      pet: validSaved ? saved.pet || null : null,
      tonics: validSaved ? Math.min(5, saved.tonics || 0) : 1,
      kills: validSaved ? saved.kills || 0 : 0,
      savedVillagers: validSaved ? saved.savedVillagers || 0 : 0,
      dragonDefeated: Boolean(validSaved && saved.dragonDefeated),
      chiefDefeated: Boolean(validSaved && saved.chiefDefeated),
      xp: validSaved ? saved.xp || 0 : 0,
      level: validSaved ? saved.level || 1 : 1,
      hero: { x: 769, y: 520, hp: 100, maxHp: 100, qi: 40, maxQi: 40, damage: 18, range: 55, speed: 220, crit: 0.05, defense: 0, attackCd: 0, skillCd: 0, dodgeCd: 0, invuln: 0, facingX: 1, facingY: 0, attackAnim: 0, walkTime: 0, walking: false, dashTime: 0 },
      maps: {
        village: { enemies: [], loot: [], raidTimer: 46, raidActive: false, villagers: structuredClone(villagersInitial), nextRaidId: 1 },
        outskirts: { enemies: [], loot: [], respawnTimer: 0 }
      },
      petData: { x: validSaved && saved.dragonDefeated ? 1297 : 510, y: validSaved && saved.dragonDefeated ? 188 : 613, recruited: Boolean(validSaved && saved.pet), attackCd: 0, walkTime: 0 },
      projectiles: [], effects: [], floats: [],
      interaction: null,
      event: '',
      eventUntil: 0,
      ended: false,
      respawnAt: 0,
      shopCooldown: 0,
      spawnSequence: 0
    };
  }

  function mapData(scene = state.scene) { return state.maps[scene]; }
  function hero() { return state.hero; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function rand(min, max) { return min + Math.random() * (max - min); }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    if (!width || !height) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    scale = width < 720 ? Math.min(width / 980, height / 520) : Math.min(width / WORLD_W, 1.15);
    if (scale <= 0) scale = 1;
    viewW = width / scale;
    viewH = height / scale;
    draw();
  }

  function setScene(scene, x, y) {
    state.scene = scene;
    hero().x = x;
    hero().y = y;
    moveTarget = null;
    state.interaction = null;
    state.event = '';
    $('regionName').innerHTML = `<i></i>${sceneNames[scene]}`;
    $('sceneTitle').textContent = sceneNames[scene];
    $('sceneSubtitle').textContent = sceneSubtitles[scene];
    $('mapScene').textContent = sceneNames[scene];
    showToast(scene === 'village' ? '回到安平镇：村民仍在等你归来。' : '进入青岚山道：附近的山贼已经发现你。');
    if (scene === 'outskirts' && !mapData(scene).enemies.length) seedOutskirts();
    refreshHUD();
    saveProgress();
  }

  function seedOutskirts() {
    const field = mapData('outskirts');
    if (field.seeded) return;
    field.seeded = true;
    const positions = [
      ['bandit', 628, 634], ['outrider', 887, 564], ['bandit', 548, 455],
      ['brute', 949, 395], ['bandit', 683, 324], ['outrider', 1005, 292],
      ['chief', 760, 238], ['dragon', 1221, 140]
    ];
    for (const [type, x, y] of positions) {
      if (type === 'chief' && state.chiefDefeated) continue;
      if (type === 'dragon' && state.dragonDefeated) continue;
      field.enemies.push(createEnemy(type, x, y, type === 'chief' || type === 'dragon'));
    }
  }

  function createEnemy(type, x, y, dormant = false, targetVillager = null) {
    const spec = catalog.enemies[type];
    return {
      id: `${type}-${++state.spawnSequence}`,
      type, name: spec.name, x, y, hp: spec.hp, maxHp: spec.hp,
      damage: spec.damage, speed: spec.speed, reward: spec.reward, xp: spec.xp,
      radius: spec.radius, color: spec.color, boss: Boolean(spec.boss), dragon: Boolean(spec.dragon),
      attackCd: rand(0.5, 1.8), windup: 0, hurt: 0, facing: 1, anim: rand(0, 4),
      targetVillager, dormant, breathCd: rand(2.6, 4.8), breathTell: 0, wander: rand(0, Math.PI * 2),
      lootGiven: false, burn: 0, breathFired: false, attackResolved: false
    };
  }

  function startGame() {
    const old = storage.get();
    state = freshState(old);
    state.started = true;
    state.maps.village.villagers = old?.version === 1 && Array.isArray(old.villagers) ? old.villagers : structuredClone(villagersInitial);
    applyEquipmentStats();
    $('startScreen').hidden = true;
    $('endScreen').hidden = true;
    canvas.focus({ preventScroll: true });
    cameraX = hero().x;
    cameraY = hero().y;
    refreshHUD();
    refreshInventory();
    refreshSkills();
    showToast(old?.version === 1 ? '继续你的江湖路：已恢复本机存档。' : '拳脚无眼，先在镇中熟悉身手。');
    if (!raf) { lastFrame = performance.now(); raf = requestAnimationFrame(frame); }
  }

  function saveProgress() {
    if (!state) return;
    storage.set({
      version: 1, day: state.day, elapsed: state.elapsed, gold: state.gold,
      owned: state.owned, equipped: state.equipped, learned: state.learned,
      selectedSkill: state.selectedSkill, pet: state.pet, tonics: state.tonics,
      kills: state.kills, savedVillagers: state.savedVillagers, xp: state.xp,
      level: state.level, villagers: state.maps.village.villagers,
      dragonDefeated: state.dragonDefeated, chiefDefeated: state.chiefDefeated
    });
  }

  function frame(now) {
    raf = 0;
    if (!state?.started) return;
    const dt = Math.min(0.045, Math.max(0, (now - lastFrame) / 1000));
    lastFrame = now;
    update(dt);
    draw();
    refreshHUD();
    if (now % 500 < dt * 1000) saveProgress();
    raf = requestAnimationFrame(frame);
  }

  function update(dt) {
    if (state.ended) return;
    state.elapsed += dt;
    ambienceTimer += dt;
    hero().attackCd = Math.max(0, hero().attackCd - dt);
    hero().skillCd = Math.max(0, hero().skillCd - dt);
    hero().dodgeCd = Math.max(0, hero().dodgeCd - dt);
    hero().invuln = Math.max(0, hero().invuln - dt);
    hero().attackAnim = Math.max(0, hero().attackAnim - dt);
    hero().dashTime = Math.max(0, hero().dashTime - dt);
    hitFlash = Math.max(0, hitFlash - dt);
    state.shopCooldown = Math.max(0, state.shopCooldown - dt);
    eventTimer = Math.max(0, eventTimer - dt);

    updateMovement(dt);
    hero().hp = Math.min(hero().maxHp, hero().hp + dt * 0.28);
    hero().qi = Math.min(hero().maxQi, hero().qi + dt * 1.1);

    if (state.scene === 'village') updateVillage(dt);
    updateEnemies(dt);
    updateProjectiles(dt);
    updateLoot(dt);
    updatePet(dt);
    updateEffects(dt);
    updateInteractions();
    $('worldToast').classList.toggle('visible', toastTimer > 0);
    if (toastTimer > 0) toastTimer -= dt;
    if (state.eventUntil < state.elapsed) state.event = '';
    $('eventRibbon').hidden = !state.event;
    $('eventText').textContent = state.event;
    const boss = mapData().enemies.find(e => e.boss && e.hp > 0 && dist(e, hero()) < 560);
    $('bossBar').hidden = !boss;
    if (boss) {
      $('bossName').textContent = boss.name;
      $('bossHpText').textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`;
      $('bossHpBar').style.width = `${clamp(boss.hp / boss.maxHp * 100, 0, 100)}%`;
    }
    if (hero().hp <= 0 && !state.ended) playerDowned();
  }

  function updateMovement(dt) {
    const h = hero();
    if (h.dashTime > 0) {
      h.x += h.dashX * 670 * dt;
      h.y += h.dashY * 670 * dt;
      state.effects.push({ kind: 'afterimage', x: h.x, y: h.y, life: 0.23, max: 0.23, facingX: h.facingX, facingY: h.facingY });
    }
    let mx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0) + joystick.x;
    let my = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0) + joystick.y;
    if (Math.abs(mx) < 0.08 && Math.abs(my) < 0.08 && moveTarget) {
      const dx = moveTarget.x - h.x;
      const dy = moveTarget.y - h.y;
      const length = Math.hypot(dx, dy);
      if (length < 10) moveTarget = null;
      else { mx = dx / length; my = dy / length; }
    }
    const length = Math.hypot(mx, my);
    h.walking = length > 0.08;
    if (!h.walking) return;
    mx /= Math.max(1, length);
    my /= Math.max(1, length);
    if (h.dashTime <= 0) {
      h.x += mx * h.speed * dt;
      h.y += my * h.speed * dt;
    }
    h.facingX = mx; h.facingY = my;
    h.walkTime += dt * (h.speed > 200 ? 11 : 8);
    h.x = clamp(h.x, 28, WORLD_W - 28);
    h.y = clamp(h.y, 28, WORLD_H - 28);
  }

  function updateVillage(dt) {
    const village = mapData('village');
    village.raidTimer -= dt;
    if (village.raidTimer <= 0 && !village.raidActive) startRaid();
    else if (village.raidTimer <= 10 && !village.raidActive) {
      state.event = `镇南门有动静，约 ${Math.ceil(village.raidTimer)} 秒后可能有强盗来袭`;
      state.eventUntil = state.elapsed + 0.2;
    }
    const raidEnemies = village.enemies.filter(e => e.raidId === village.currentRaidId);
    if (village.raidActive && !raidEnemies.some(e => e.hp > 0)) {
      village.raidActive = false;
      village.raidTimer = rand(50, 70);
      if (village.villagers.some(v => v.alive)) {
        state.savedVillagers++;
        state.gold += 25;
        state.xp += 40;
        showToast('这次袭击被击退了。村民送来一些盘缠。');
        grantXp(40);
      } else showToast('镇中已无人居住，袭击暂时结束。');
    }
  }

  function startRaid() {
    const village = mapData('village');
    const alive = village.villagers.filter(v => v.alive);
    if (!alive.length) { village.raidTimer = 45; return; }
    village.raidActive = true;
    village.currentRaidId = village.nextRaidId++;
    village.raidTimer = rand(58, 76);
    const count = state.day > 2 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const target = alive[i % alive.length];
      const raider = createEnemy(i === 2 ? 'brute' : (Math.random() < 0.4 ? 'outrider' : 'bandit'), 756 + rand(-155, 155), 930 + i * 24, false, target.id);
      raider.raidId = village.currentRaidId;
      village.enemies.push(raider);
    }
    state.event = '镇南门传来呼救声！强盗闯进了安平镇';
    state.eventUntil = state.elapsed + 7;
    showToast('村民遇袭！赶去击退强盗。');
  }

  function updateEnemies(dt) {
    const current = mapData();
    for (const enemy of [...current.enemies]) {
      if (enemy.hp <= 0) continue;
      enemy.anim += dt * (enemy.type === 'outrider' ? 9 : 5);
      enemy.hurt = Math.max(0, enemy.hurt - dt);
      enemy.attackCd -= dt;
      const priorWindup = enemy.windup;
      enemy.windup = Math.max(0, enemy.windup - dt);
      enemy.breathCd -= dt;
      const priorBreathTell = enemy.breathTell;
      enemy.breathTell = Math.max(0, enemy.breathTell - dt);
      if (enemy.dormant) {
        if (dist(enemy, hero()) < (enemy.dragon ? 410 : 360)) enemy.dormant = false;
        else continue;
      }

      let target = hero();
      let targetIsVillager = false;
      if (enemy.targetVillager && state.scene === 'village') {
        const villager = current.villagers.find(v => v.id === enemy.targetVillager && v.alive);
        if (villager && dist(enemy, hero()) > 135) { target = villager; targetIsVillager = true; }
        else enemy.targetVillager = null;
      }
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const distance = Math.hypot(dx, dy) || 1;
      enemy.facing = dx >= 0 ? 1 : -1;
      const reach = targetIsVillager ? 34 : (enemy.dragon ? 110 : 38);

      if (enemy.dragon) {
        if (priorBreathTell > 0) {
          // The flame charge is telegraphed; the player can step out of the line.
          if (enemy.breathTell === 0 && !enemy.breathFired) {
            dragonBreath(enemy, dx / distance, dy / distance);
            enemy.breathFired = true;
          }
        } else if (enemy.breathCd <= 0 && distance < 430) {
          enemy.breathTell = 0.9;
          enemy.breathFired = false;
          enemy.breathCd = rand(3.5, 4.8);
        }
      }

      if (enemy.windup <= 0 && enemy.attackCd <= 0 && distance < reach + enemy.radius * 0.45) {
        enemy.windup = enemy.dragon ? 0.52 : 0.42;
        enemy.attackResolved = false;
        enemy.attackCd = enemy.dragon ? 1.55 : 1.25;
        enemy.attackDirX = dx / distance;
        enemy.attackDirY = dy / distance;
      }
      if (priorWindup > 0 && enemy.windup === 0 && !enemy.attackResolved) {
        enemy.attackResolved = true;
        if (targetIsVillager && dist(enemy, target) < reach + 9) {
          target.hp = Math.max(0, target.hp - enemy.damage * 1.3);
          if (target.hp <= 0 && target.alive) {
            target.alive = false;
            showToast(`${target.name}被强盗掳走了！`);
          }
        } else if (dist(enemy, hero()) < reach + enemy.radius * 0.45 && hero().invuln <= 0) {
          damageHero(enemy.damage);
        }
      }

      const chasing = targetIsVillager || distance < (enemy.dragon ? 520 : 430);
      if (distance > reach && chasing) {
        const speed = enemy.speed * (enemy.type === 'outrider' ? 1.05 : 1);
        enemy.x += dx / distance * speed * dt;
        enemy.y += dy / distance * speed * dt;
      } else if (!chasing) {
        enemy.wander += dt * 0.5;
        enemy.x += Math.cos(enemy.wander) * enemy.speed * 0.12 * dt;
        enemy.y += Math.sin(enemy.wander) * enemy.speed * 0.12 * dt;
      }
      enemy.x = clamp(enemy.x, 30, WORLD_W - 30);
      enemy.y = clamp(enemy.y, 30, WORLD_H - 30);
    }
  }

  function dragonBreath(enemy, dx, dy) {
    const startX = enemy.x - dx * 31;
    const startY = enemy.y - dy * 20;
    state.projectiles.push({ kind: 'flame', x: startX, y: startY, vx: -dx * 275, vy: -dy * 275, life: 1.45, radius: 19, damage: enemy.damage, color: '#ff9852' });
    for (let i = 0; i < 12; i++) state.effects.push({ kind: 'spark', x: startX, y: startY, vx: rand(-110, 110) - dx * 80, vy: rand(-110, 110) - dy * 80, life: rand(0.25, 0.5), max: 0.5, color: i % 2 ? '#ffb354' : '#f3e6a2', size: rand(3, 7) });
    showToast('火鳞山蛟蓄势喷焰，快闪开！');
  }

  function updateProjectiles(dt) {
    for (const shot of state.projectiles) {
      shot.life -= dt;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      if (shot.kind === 'flame' && dist(shot, hero()) < shot.radius + 14 && hero().invuln <= 0) {
        damageHero(shot.damage);
        shot.life = 0;
      }
      if (shot.kind === 'qi' || shot.kind === 'slash-wave') {
        for (const enemy of mapData().enemies) {
          if (enemy.hp <= 0 || shot.hitIds.has(enemy.id)) continue;
          if (Math.hypot(enemy.x - shot.x, enemy.y - shot.y) < enemy.radius + shot.radius) {
            shot.hitIds.add(enemy.id);
            damageEnemy(enemy, shot.damage, shot.crit);
            for (let j = 0; j < 6; j++) makeSpark(enemy.x, enemy.y - 12, shot.color || '#8dd8d0');
            if (shot.kind === 'qi') break;
          }
        }
      }
    }
    state.projectiles = state.projectiles.filter(s => s.life > 0 && s.x > -80 && s.x < WORLD_W + 80 && s.y > -80 && s.y < WORLD_H + 80);
  }

  function updateLoot(dt) {
    const current = mapData();
    for (const item of [...current.loot]) {
      item.age += dt;
      item.bob += dt * 3;
      if (dist(item, hero()) < 45) collectLoot(item);
    }
  }

  function updatePet(dt) {
    const pet = state.petData;
    if (!state.pet) return;
    pet.attackCd -= dt;
    const h = hero();
    const d = dist(pet, h);
    if (d > 76) {
      const dx = h.x - pet.x, dy = h.y - pet.y;
      const length = Math.hypot(dx, dy) || 1;
      pet.x += dx / length * 260 * dt;
      pet.y += dy / length * 260 * dt;
      pet.walkTime += dt * 12;
    }
    const target = mapData().enemies.filter(e => e.hp > 0 && dist(e, h) < 260).sort((a, b) => dist(a, h) - dist(b, h))[0];
    if (target && pet.attackCd <= 0 && dist(target, pet) < 125) {
      pet.attackCd = 2.1;
      damageEnemy(target, 9 + state.level * 2, false, 'pet');
      state.effects.push({ kind: 'paw', x: target.x, y: target.y - 13, life: 0.28, max: 0.28 });
    }
  }

  function updateEffects(dt) {
    for (const effect of state.effects) {
      effect.life -= dt;
      if (effect.vx) effect.x += effect.vx * dt;
      if (effect.vy) effect.y += effect.vy * dt;
    }
    state.effects = state.effects.filter(e => e.life > 0);
    for (const f of state.floats) { f.y -= 28 * dt; f.life -= dt; }
    state.floats = state.floats.filter(f => f.life > 0);
  }

  function playerAttack() {
    if (!state?.started || state.ended || hero().attackCd > 0) return;
    const h = hero();
    const weapon = state.equipped.weapon ? catalog.items[state.equipped.weapon] : null;
    const range = h.range + (weapon?.range || 0);
    let target = mapData().enemies.filter(e => e.hp > 0 && dist(e, h) < range + e.radius + 16)
      .sort((a, b) => dist(a, h) - dist(b, h))[0];
    if (!target && pointerAim) {
      const aim = screenToWorld(pointerAim.x, pointerAim.y);
      h.facingX = aim.x - h.x; h.facingY = aim.y - h.y;
      const len = Math.hypot(h.facingX, h.facingY) || 1;
      h.facingX /= len; h.facingY /= len;
    } else if (target) {
      h.facingX = target.x - h.x; h.facingY = target.y - h.y;
      const len = Math.hypot(h.facingX, h.facingY) || 1;
      h.facingX /= len; h.facingY /= len;
    }
    h.attackCd = Math.max(0.26, 0.55 + (weapon?.rate || 0));
    h.attackAnim = 0.24;
    if (!target) {
      state.effects.push({ kind: 'slash', x: h.x + h.facingX * 30, y: h.y + h.facingY * 15, life: 0.2, max: 0.2, dirX: h.facingX, dirY: h.facingY, style: weapon?.weapon || 'fist', hitIds: [] });
      return;
    }
    const crit = Math.random() < h.crit;
    const bonus = state.level > 1 ? state.level - 1 : 0;
    const damage = Math.round((h.damage + (weapon?.damage || 0) + bonus * 2) * (crit ? 1.8 : 1));
    const forwardX = h.facingX, forwardY = h.facingY;
    const wide = weapon?.weapon === 'saber' ? 1.9 : weapon?.weapon === 'spear' ? 1.15 : 1.4;
    for (const enemy of mapData().enemies) {
      if (enemy.hp <= 0 || dist(enemy, h) > range * wide + enemy.radius) continue;
      const dx = enemy.x - h.x, dy = enemy.y - h.y;
      const length = Math.hypot(dx, dy) || 1;
      if (dx / length * forwardX + dy / length * forwardY > (weapon?.weapon === 'spear' ? 0.36 : 0.05)) damageEnemy(enemy, damage, crit);
    }
    state.effects.push({ kind: 'slash', x: h.x + forwardX * (range * 0.45), y: h.y + forwardY * (range * 0.28), life: 0.24, max: 0.24, dirX: forwardX, dirY: forwardY, style: weapon?.weapon || 'fist', hitIds: [] });
    const color = weapon?.weapon === 'saber' ? '#f29e5d' : weapon?.weapon === 'spear' ? '#9ad7bd' : '#efe0a2';
    for (let i = 0; i < (crit ? 10 : 5); i++) makeSpark(target.x, target.y - 10, color);
    if (crit) floatText(target.x, target.y - target.radius, '会心 ' + damage, '#ffe08d');
  }

  function activateSkill() {
    if (!state?.started || state.ended) return;
    const skillId = state.selectedSkill;
    const skill = catalog.skills[skillId];
    if (!skill) { showToast('尚未习得武学，继续探索寻访秘籍。'); return; }
    if (hero().skillCd > 0) return;
    if (hero().qi < skill.cost) { showToast('内力不足，稍候片刻再出招。'); return; }
    hero().qi -= skill.cost;
    hero().skillCd = skill.cooldown;
    if (skillId === 'tigerFist') {
      const h = hero();
      const targets = mapData().enemies.filter(e => e.hp > 0 && dist(e, h) < 143 + e.radius);
      state.effects.push({ kind: 'tiger', x: h.x, y: h.y, life: 0.52, max: 0.52, dirX: h.facingX, dirY: h.facingY });
      for (const enemy of targets) damageEnemy(enemy, Math.round((hero().damage + (state.level - 1) * 2) * 2.2), false);
      if (!targets.length) showToast('虎啸连拳打出一阵劲风。');
    } else if (skillId === 'cloudStep') {
      const h = hero();
      const target = nearestEnemy(370);
      if (target) { const len = Math.hypot(target.x - h.x, target.y - h.y) || 1; h.facingX = (target.x - h.x) / len; h.facingY = (target.y - h.y) / len; }
      h.dashX = h.facingX; h.dashY = h.facingY; h.dashTime = 0.28; h.invuln = 0.38;
      for (let i = 0; i < 7; i++) state.effects.push({ kind: 'afterimage', x: h.x - h.facingX * i * 12, y: h.y - h.facingY * i * 8, life: 0.28, max: 0.28, facingX: h.facingX, facingY: h.facingY });
    } else if (skillId === 'qiBolt') {
      const h = hero();
      const target = nearestEnemy(480);
      if (target) { const len = Math.hypot(target.x - h.x, target.y - h.y) || 1; h.facingX = (target.x - h.x) / len; h.facingY = (target.y - h.y) / len; }
      state.projectiles.push({ kind: 'qi', x: h.x + h.facingX * 26, y: h.y + h.facingY * 18, vx: h.facingX * 610, vy: h.facingY * 610, life: 0.9, radius: 18, damage: 48 + state.level * 5, color: '#8ad9cc', hitIds: new Set(), crit: false });
      for (let i = 0; i < 6; i++) makeSpark(h.x + h.facingX * 25, h.y - 15, '#9de9d6');
    }
    refreshHUD();
  }

  function dodge() {
    if (!state?.started || state.ended || hero().dodgeCd > 0) return;
    const h = hero();
    let dx = (keys.arrowright || keys.d ? 1 : 0) - (keys.arrowleft || keys.a ? 1 : 0) + joystick.x;
    let dy = (keys.arrowdown || keys.s ? 1 : 0) - (keys.arrowup || keys.w ? 1 : 0) + joystick.y;
    if (Math.hypot(dx, dy) < 0.1) { dx = h.facingX; dy = h.facingY; }
    const len = Math.hypot(dx, dy) || 1;
    h.dashX = dx / len; h.dashY = dy / len; h.dashTime = 0.24; h.invuln = 0.35; h.dodgeCd = 1.25;
    h.facingX = h.dashX; h.facingY = h.dashY;
    for (let i = 0; i < 4; i++) state.effects.push({ kind: 'afterimage', x: h.x - h.dashX * i * 12, y: h.y - h.dashY * i * 8, life: 0.25, max: 0.25, facingX: h.facingX, facingY: h.facingY });
  }

  function nearestEnemy(maxDistance = 9999) {
    return mapData().enemies.filter(e => e.hp > 0).sort((a, b) => dist(a, hero()) - dist(b, hero())).find(e => dist(e, hero()) <= maxDistance) || null;
  }

  function damageEnemy(enemy, amount, crit = false, source = 'hero') {
    if (enemy.hp <= 0) return;
    enemy.hp -= amount;
    enemy.hurt = 0.15;
    if (source !== 'pet') floatText(enemy.x, enemy.y - enemy.radius, String(amount), crit ? '#ffe08d' : '#fff0d1');
    if (enemy.hp <= 0) defeatEnemy(enemy);
  }

  function defeatEnemy(enemy) {
    if (enemy.lootGiven) return;
    enemy.lootGiven = true;
    enemy.hp = 0;
    state.kills++;
    state.gold += enemy.reward;
    state.xp += enemy.xp;
    grantXp(0);
    for (let i = 0; i < 14; i++) makeSpark(enemy.x, enemy.y - 10, enemy.dragon ? '#f2a85d' : '#d6bd7a');
    if (enemy.type === 'chief') {
      state.chiefDefeated = true;
      addLoot('ironSword', enemy.x + 15, enemy.y + 5, 'guaranteed');
      if (!state.learned.includes('tigerFist')) addLoot('tigerManual', enemy.x - 22, enemy.y + 13, 'guaranteed');
      addLoot('travelBoots', enemy.x + 1, enemy.y - 10, 'roll');
      showToast('寨主倒下了！精钢长剑与拳谱落在地上。');
      state.event = '山寨头目已败，青岚山道安静了片刻';
      state.eventUntil = state.elapsed + 5;
    } else if (enemy.dragon) {
      addLoot('scales', enemy.x - 28, enemy.y + 25, 'guaranteed');
      addLoot('dragonManual', enemy.x + 28, enemy.y + 20, 'guaranteed');
      state.petData.x = enemy.x + 76; state.petData.y = enemy.y + 48; state.petData.recruited = false;
      state.dragonDefeated = true;
      showToast('火鳞山蛟被击退，蛟鳞与吐纳篇现世！');
      state.event = '火鳞山蛟已退回洞窟深处'; state.eventUntil = state.elapsed + 6;
    } else {
      if (Math.random() < 0.13 && !state.learned.includes('cloudStep')) addLoot('cloudManual', enemy.x + 10, enemy.y, 'guaranteed');
      if (Math.random() < 0.12 && !state.owned.includes('mountainSaber')) addLoot('mountainSaber', enemy.x - 16, enemy.y + 10, 'guaranteed');
      if (Math.random() < 0.1 && !state.owned.includes('tonic')) addLoot('tonic', enemy.x, enemy.y - 12, 'guaranteed');
    }
    saveProgress();
  }

  function addLoot(itemId, x, y, mode = 'roll') {
    if (mode === 'roll' && Math.random() > 0.6) return;
    mapData().loot.push({ itemId, x, y, age: 0, bob: rand(0, 5) });
  }

  function collectLoot(drop) {
    const current = mapData();
    if (!current.loot.includes(drop)) return;
    current.loot = current.loot.filter(item => item !== drop);
    const item = catalog.items[drop.itemId];
    if (!item) return;
    if (item.manual) {
      if (state.learned.includes(item.manual)) {
        state.gold += 25;
        showToast(`重复秘籍已化为 25 两银钱。`);
      } else {
        state.learned.push(item.manual);
        state.selectedSkill = item.manual;
        showToast(`习得 ${item.name}：${catalog.skills[item.manual].name} 已可施展。`);
        refreshSkills();
      }
    } else if (drop.itemId === 'tonic') {
      state.tonics = Math.min(5, state.tonics + 1);
      showToast('拾得一瓶金创药。');
    } else if (drop.itemId === 'foxPet') {
      recruitPet();
    } else if (state.owned.includes(drop.itemId)) {
      state.gold += 18;
      showToast('重复装备折换成 18 两银钱。');
    } else {
      state.owned.push(drop.itemId);
      if (item.slot === '兵刃') state.equipped.weapon = drop.itemId;
      else if (item.slot === '衣装') state.equipped.cloth = drop.itemId;
      else if (item.slot === '鞋履') state.equipped.shoes = drop.itemId;
      showToast(`拾得${item.name}，已为你装备。`);
      applyEquipmentStats();
    }
    refreshInventory(); refreshSkills(); refreshHUD(); saveProgress();
  }

  function grantXp(amount) {
    while (state.xp >= state.level * 100) {
      state.xp -= state.level * 100;
      state.level++;
      hero().maxHp += 8; hero().hp = Math.min(hero().maxHp, hero().hp + 35);
      hero().maxQi += 4; hero().qi = hero().maxQi;
      hero().damage += 2;
      showToast(`江湖阅历渐长，升至第 ${state.level} 重。气血与拳劲提升。`);
    }
    if (!amount) refreshHUD();
  }

  function applyEquipmentStats() {
    let damage = 18 + (state.level - 1) * 2;
    let maxHp = 100 + (state.level - 1) * 8;
    let speed = 220;
    let defense = 0;
    const cloth = catalog.items[state.equipped.cloth];
    const shoes = catalog.items[state.equipped.shoes];
    if (cloth) { maxHp += cloth.hp || 0; defense += cloth.defense || 0; }
    if (shoes) speed += shoes.speed || 0;
    const weapon = catalog.items[state.equipped.weapon];
    if (weapon) damage += weapon.damage || 0;
    hero().maxHp = maxHp; hero().hp = Math.min(hero().hp, maxHp); hero().speed = speed; hero().damage = damage; hero().defense = defense;
    hero().range = 55 + (weapon?.range || 0);
  }

  function recruitPet(kind = 'fox') {
    state.pet = kind;
    state.petData.recruited = true;
    state.petData.x = hero().x - 38; state.petData.y = hero().y + 12;
    showToast(state.pet === 'youngDragon' ? '小青蛟认你为主，今后会并肩出战。' : '小狐狸跟上了你的脚步，会替你扑击近处的敌人。');
    refreshHUD(); saveProgress();
  }

  function damageHero(amount) {
    if (hero().invuln > 0 || state.ended) return;
    const finalDamage = Math.max(1, Math.ceil(amount - hero().defense));
    hero().hp -= finalDamage;
    hero().invuln = 0.63;
    hitFlash = 0.25;
    floatText(hero().x, hero().y - 38, `-${finalDamage}`, '#f18876');
    for (let i = 0; i < 4; i++) makeSpark(hero().x, hero().y - 12, '#ec8273');
  }

  function playerDowned() {
    state.ended = true;
    $('endTitle').textContent = '暂歇片刻';
    $('endMessage').textContent = '你在安平镇醒来，丢了些盘缠，但行囊与武学仍在。江湖路还长。';
    $('endScreen').hidden = false;
    saveProgress();
  }

  function returnToVillage() {
    state.ended = false;
    hero().hp = Math.max(60, Math.ceil(hero().maxHp * 0.62));
    hero().qi = hero().maxQi;
    hero().x = 770; hero().y = 520; hero().invuln = 1.5;
    state.gold = Math.max(0, state.gold - Math.min(15, state.gold));
    state.scene = 'village';
    $('endScreen').hidden = true;
    setScene('village', 770, 520);
    state.ended = false;
  }

  function updateInteractions() {
    const h = hero();
    let nearest = null;
    const candidates = [];
    if (state.scene === 'village') {
      candidates.push({ type: 'shop', x: 1005, y: 746, radius: 90, label: '铁匠铺 · 整备与疗伤' });
      if (!state.pet) candidates.push({ type: 'pet', x: state.petData.x, y: state.petData.y, radius: 62, label: '收留小狐狸' });
      candidates.push({ type: 'gate', x: 770, y: 922, radius: 120, label: '前往青岚山道' });
    } else {
      if (state.dragonDefeated && state.pet !== 'youngDragon') candidates.push({ type: 'dragonPet', x: state.petData.x, y: state.petData.y, radius: 75, label: '收留小青蛟' });
      candidates.push({ type: 'gate', x: 770, y: 920, radius: 120, label: '返回安平镇' });
    }
    for (const candidate of candidates) {
      const d = dist(candidate, h);
      if (d < candidate.radius && (!nearest || d < nearest.d)) nearest = { ...candidate, d };
    }
    state.interaction = nearest;
    $('interactionHint').hidden = !nearest;
    $('interactionText').textContent = nearest?.label || '';
  }

  function interact() {
    const near = state?.interaction;
    if (!near) {
      const nearbyDrop = mapData().loot.find(item => dist(item, hero()) < 75);
      if (nearbyDrop) collectLoot(nearbyDrop);
      else showToast('附近没有可互动的事物。');
      return;
    }
    if (near.type === 'gate') {
      if (state.scene === 'village') { state.day++; setScene('outskirts', 770, 815); }
      else setScene('village', 770, 825);
    } else if (near.type === 'pet') recruitPet('fox');
    else if (near.type === 'dragonPet') recruitPet('youngDragon');
    else if (near.type === 'shop') {
      if (state.shopCooldown > 0) return;
      state.shopCooldown = 1;
      if (state.tonics < 3 && state.gold >= 20) {
        state.gold -= 20; state.tonics++; hero().hp = Math.min(hero().maxHp, hero().hp + 35);
        showToast('铁匠替你备好金创药，并简单包扎了伤口（20 两）。');
      } else if (hero().hp < hero().maxHp - 4) {
        hero().hp = Math.min(hero().maxHp, hero().hp + 25);
        showToast('铁匠替你包扎伤口，恢复 25 点气血。');
      } else showToast(state.gold < 20 && state.tonics < 3 ? '盘缠不足，金创药需要 20 两。' : '铁匠铺：兵刃已擦拭，路上小心。');
      refreshHUD(); saveProgress();
    }
  }

  function useTonic() {
    if (state.tonics <= 0) { showToast('行囊里没有金创药。'); return; }
    if (hero().hp >= hero().maxHp) { showToast('气血充盈，不必服药。'); return; }
    state.tonics--;
    hero().hp = Math.min(hero().maxHp, hero().hp + 45);
    state.effects.push({ kind: 'heal', x: hero().x, y: hero().y, life: 0.55, max: 0.55 });
    showToast('服下金创药，气血恢复。'); refreshHUD(); saveProgress();
  }

  function cycleSkill() {
    if (!state.learned.length) { showToast('还没有习得武学，秘籍藏在山道与山寨中。'); return; }
    const index = state.learned.indexOf(state.selectedSkill);
    state.selectedSkill = state.learned[(index + 1) % state.learned.length];
    refreshHUD(); refreshSkills(); showToast(`当前招式：${catalog.skills[state.selectedSkill].name}`);
  }

  function openPanel(panel) {
    openModal = panel;
    const el = panel === 'inventory' ? $('inventoryModal') : $('skillsModal');
    el.classList.add('open'); el.setAttribute('aria-hidden', 'false');
    if (panel === 'inventory') refreshInventory(); else refreshSkills();
  }

  function closePanel(panel = openModal) {
    if (!panel) return;
    const el = panel === 'inventory' ? $('inventoryModal') : $('skillsModal');
    el.classList.remove('open'); el.setAttribute('aria-hidden', 'true');
    openModal = '';
  }

  function refreshInventory() {
    if (!state) return;
    const slot = (key, title, icon, itemId) => {
      const item = itemId ? catalog.items[itemId] : null;
      const value = key === 'weapon' && !item ? '赤手空拳' : item?.name || '未装备';
      const desc = item?.desc || (key === 'weapon' ? '短距离、单体攻击。拳脚是踏入江湖的第一门功夫。' : '靠近铁匠铺寻找合适装备。');
      return `<div class="equipment-slot"><span class="slot-icon">${item?.icon || icon}</span><div><strong>${title}</strong><small>${value} · ${desc}</small></div><em>${item ? '已装备' : '空位'}</em></div>`;
    };
    $('equipmentList').innerHTML = slot('weapon', '兵刃', '✊', state.equipped.weapon) + slot('cloth', '衣装', '👘', state.equipped.cloth) + slot('shoes', '鞋履', '×', state.equipped.shoes);
    const rows = state.owned.filter(id => !['hemp'].includes(id)).map(id => {
      const item = catalog.items[id];
      const equipped = Object.values(state.equipped).includes(id);
      const action = item.slot === '消耗品' ? '' : `<button data-equip="${id}">${equipped ? '已装备' : '穿戴'}</button>`;
      return `<div class="item-row"><span>${item.icon}</span><div><strong>${item.name}</strong><small>${item.desc}</small></div>${action}</div>`;
    }).join('') + (state.tonics > 0 ? `<div class="item-row"><span>🧪</span><div><strong>金创药 ×${state.tonics}</strong><small>恢复 45 点气血。</small></div><button data-use-tonic>服用</button></div>` : '');
    $('itemList').innerHTML = rows || '<div class="item-empty">行囊尚空。击败山贼、探索洞窟，可能找到兵刃与秘籍。</div>';
    $('inventoryCount').textContent = `${state.owned.filter(id => id !== 'hemp').length + state.tonics} 件`;
    $('statsDetails').innerHTML = `<span>气血 <b>${Math.ceil(hero().maxHp)}</b></span><span>拳劲 <b>${hero().damage}</b></span><span>身法 <b>${hero().speed}</b></span><span>护体 <b>${hero().defense}</b></span><span>会心 <b>${Math.round(hero().crit * 100)}%</b></span><span>内力 <b>${hero().maxQi}</b></span>`;
    $('itemList').querySelectorAll('[data-equip]').forEach(button => button.addEventListener('click', () => equipItem(button.dataset.equip)));
    $('itemList').querySelector('[data-use-tonic]')?.addEventListener('click', useTonic);
  }

  function equipItem(id) {
    const item = catalog.items[id];
    if (!item || !state.owned.includes(id)) return;
    if (item.slot === '兵刃') state.equipped.weapon = id;
    if (item.slot === '衣装') state.equipped.cloth = id;
    if (item.slot === '鞋履') state.equipped.shoes = id;
    applyEquipmentStats(); refreshInventory(); refreshHUD(); saveProgress();
    showToast(`已装备${item.name}，招式与身法随之改变。`);
  }

  function refreshSkills() {
    if (!state) return;
    const learned = state.learned.map(id => {
      const skill = catalog.skills[id];
      return `<div class="learned-skill"><span>${skill.icon}</span><div><strong>${skill.name} · ${skill.kind}</strong><small>${skill.desc}</small></div></div>`;
    }).join('');
    $('learnedSkills').innerHTML = learned || '<div class="learned-empty">目前只会最基础的拳脚。<br>山寨头目藏着拳谱，洞窟异兽守着吐纳篇；击败他们，秘籍自然归你。</div>';
  }

  function refreshHUD() {
    if (!state) return;
    const h = hero();
    const weapon = hWeapon();
    const cloth = catalog.items[state.equipped.cloth];
    const shoes = catalog.items[state.equipped.shoes];
    $('goldText').textContent = state.gold;
    $('timeText').textContent = state.elapsed % 150 < 75 ? '晨时' : '夜时';
    $('heroStyle').textContent = `${cloth?.name || '布衣'} · ${weapon ? weapon.name : '赤手空拳'}${shoes ? ' · ' + shoes.name : ' · 赤足'}`;
    $('weaponBadge').textContent = weapon?.name || '空手';
    $('hpText').textContent = `${Math.ceil(h.hp)} / ${Math.ceil(h.maxHp)}`;
    $('hpBar').style.width = `${clamp(h.hp / h.maxHp * 100, 0, 100)}%`;
    $('qiText').textContent = `${Math.ceil(h.qi)} / ${h.maxQi}`;
    $('qiBar').style.width = `${clamp(h.qi / h.maxQi * 100, 0, 100)}%`;
    $('damageText').textContent = h.damage;
    $('speedText').textContent = h.speed;
    $('critText').textContent = Math.round(h.crit * 100);
    const villagers = mapData('village').villagers;
    $('villagerText').textContent = `${villagers.filter(v => v.alive).length}/${villagers.length}`;
    $('killText').textContent = state.kills;
    $('saveText').textContent = state.savedVillagers;
    $('tonicCount').textContent = state.tonics;
    $('dayCount').textContent = `第 ${state.day} 日`;
    const xpNeed = state.level * 100;
    $('xpText').textContent = `${state.xp} / ${xpNeed} · ${state.level} 重`;
    $('xpBar').style.width = `${clamp(state.xp / xpNeed * 100, 0, 100)}%`;
    const skillId = state.selectedSkill;
    const skill = skillId ? catalog.skills[skillId] : null;
    $('activeSkill').disabled = !skill;
    $('activeIcon').textContent = skill?.icon || '？';
    $('activeName').textContent = skill?.name || '未习得';
    $('activeDesc').textContent = skill ? `内力 ${skill.cost} · ${Math.ceil(h.skillCd) > 0 ? Math.ceil(h.skillCd) + '秒' : '可施展'}` : '击败强敌寻得秘籍';
    $('skillCooldown').style.height = skill && h.skillCd > 0 ? `${clamp(h.skillCd / skill.cooldown * 100, 0, 100)}%` : '0';
    $('basicName').textContent = weapon?.weapon === 'saber' ? '横斩' : weapon?.weapon === 'spear' ? '探云枪' : weapon?.weapon === 'sword' ? '斩击' : '朴实拳';
    $('combatHint').textContent = skill ? `Q 施展 · C 切换招式 · 敌人会朝你逼近` : '靠近敌人后出招，攻击会朝向目标';
  }

  function hWeapon() { return state.equipped.weapon ? catalog.items[state.equipped.weapon] : null; }

  function showToast(message) {
    if (!state) return;
    $('worldToast').textContent = message;
    $('worldToast').classList.add('visible');
    toastTimer = 2.5;
  }

  function floatText(x, y, text, color) { state.floats.push({ x, y, text, color, life: 0.78, max: 0.78 }); }
  function makeSpark(x, y, color) { state.effects.push({ kind: 'spark', x, y, vx: rand(-110, 110), vy: rand(-115, 70), life: rand(0.19, 0.42), max: 0.42, color, size: rand(2, 5) }); }

  function screenToWorld(x, y) {
    return { x: clamp((x - width / 2) / scale + cameraX, 0, WORLD_W), y: clamp((y - height / 2) / scale + cameraY, 0, WORLD_H) };
  }

  function draw() {
    if (!width || !height) return;
    if (!state) state = freshState();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#15231b'; ctx.fillRect(0, 0, width, height);
    const h = hero();
    cameraX += (h.x - cameraX) * 0.12;
    cameraY += (h.y - cameraY) * 0.12;
    cameraX = clamp(cameraX, Math.min(viewW / 2, WORLD_W / 2), Math.max(WORLD_W - viewW / 2, WORLD_W / 2));
    cameraY = clamp(cameraY, Math.min(viewH / 2, WORLD_H / 2), Math.max(WORLD_H - viewH / 2, WORLD_H / 2));
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (width / 2 - cameraX * scale), dpr * (height / 2 - cameraY * scale));
    const background = images[state.scene];
    if (background.complete && background.naturalWidth) ctx.drawImage(background, 0, 0, WORLD_W, WORLD_H);
    else { ctx.fillStyle = state.scene === 'village' ? '#8e794e' : '#304632'; ctx.fillRect(0, 0, WORLD_W, WORLD_H); }
    drawAmbient();
    drawGateMarker();
    if (state.scene === 'village') drawVillagers();
    if (state.scene === 'village' && !state.pet) drawFox(state.petData.x, state.petData.y, ambienceTimer);
    if (state.scene === 'outskirts' && state.dragonDefeated && state.pet !== 'youngDragon') drawYoungDragon(state.petData.x, state.petData.y, ambienceTimer);
    drawLoot();
    const actors = [...mapData().enemies.map(e => ({ y: e.y, type: 'enemy', ref: e }))];
    if (state.pet) actors.push({ y: state.petData.y, type: 'pet', ref: state.petData });
    actors.push({ y: h.y, type: 'hero', ref: h });
    actors.sort((a, b) => a.y - b.y);
    for (const actor of actors) {
      if (actor.type === 'hero') drawHero(actor.ref);
      else if (actor.type === 'pet') drawPet(actor.ref);
      else if (actor.ref.hp > 0 && !actor.ref.dormant) drawEnemy(actor.ref);
    }
    drawProjectiles();
    drawEffects();
    drawDamageFloats();
    if (hitFlash > 0) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(210,60,48,${hitFlash * 0.15})`; ctx.fillRect(0, 0, width, height); }
  }

  function drawAmbient() {
    const t = ambienceTimer;
    if (state.scene === 'village') {
      // Lantern light breathes gently over the artwork; tiny river glints keep the water alive.
      for (const point of [[153, 187], [996, 206], [1067, 577], [657, 904], [1238, 788]]) {
        const glow = 8 + Math.sin(t * 2.6 + point[0]) * 2;
        const g = ctx.createRadialGradient(point[0], point[1], 1, point[0], point[1], 42 + glow);
        g.addColorStop(0, `rgba(255,190,95,${0.16 + Math.sin(t * 2 + point[0]) * 0.04})`); g.addColorStop(1, 'rgba(255,180,80,0)');
        ctx.fillStyle = g; ctx.fillRect(point[0] - 48, point[1] - 48, 96, 96);
      }
      for (let i = 0; i < 11; i++) {
        const x = 1208 + ((i * 37 + t * 30) % 288);
        const y = 210 + ((i * 71 + Math.sin(t * 1.8 + i) * 16) % 800);
        ctx.globalAlpha = 0.24 + (Math.sin(t * 3 + i) + 1) * 0.14;
        ctx.strokeStyle = '#b4eee0'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 8, y + Math.sin(t + i) * 2); ctx.stroke();
      }
    } else {
      for (let i = 0; i < 8; i++) {
        const x = 430 + ((i * 51 + t * 17) % 420);
        const y = 280 + ((i * 91 + t * 25) % 680);
        ctx.globalAlpha = 0.17 + (Math.sin(t * 2 + i) + 1) * 0.12;
        ctx.fillStyle = i % 3 ? '#d7dfa0' : '#b4dcde'; ctx.fillRect(x, y, 3, 3);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawGateMarker() {
    const x = 770, y = state.scene === 'village' ? 918 : 918;
    const pulse = 0.5 + Math.sin(ambienceTimer * 3) * 0.16;
    ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = '#efce79'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, 47 + Math.sin(ambienceTimer * 2) * 3, 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f0d892'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(state.scene === 'village' ? '出镇' : '回镇', x, y - 24); ctx.restore();
  }

  function drawVillagers() {
    for (const villager of mapData('village').villagers) {
      if (!villager.alive) { drawAbandonedBundle(villager.x, villager.y); continue; }
      drawVillager(villager, ambienceTimer);
      if (mapData('village').raidActive && villager.hp < villager.maxHp) {
        ctx.fillStyle = '#1c170f'; ctx.fillRect(villager.x - 21, villager.y - 39, 42, 4);
        ctx.fillStyle = '#dd8069'; ctx.fillRect(villager.x - 20, villager.y - 38, 40 * villager.hp / villager.maxHp, 2);
        ctx.fillStyle = '#e9b677'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('求助', villager.x, villager.y - 46);
      }
    }
  }

  function drawVillager(npc, time) {
    const bob = Math.sin(time * 2 + npc.x) * 1.1;
    ctx.save(); ctx.translate(Math.round(npc.x), Math.round(npc.y + bob));
    ctx.fillStyle = '#151a13'; ctx.globalAlpha = 0.32; ctx.beginPath(); ctx.ellipse(0, 2, 13, 5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    pixelRect(-10, -27, 20, 19, npc.id === 'tea' ? '#9c5442' : npc.id === 'ferryman' ? '#59705a' : '#916c47');
    pixelRect(-12, -24, 4, 13, '#c28b60'); pixelRect(8, -24, 4, 13, '#c28b60');
    pixelRect(-7, -40, 14, 14, '#d5a778'); pixelRect(-9, -42, 18, 6, npc.id === 'herbalist' ? '#45392e' : '#4d3b32');
    pixelRect(-5, -32, 2, 2, '#282721'); pixelRect(4, -32, 2, 2, '#282721');
    pixelRect(-8, -8, 6, 9, '#44372e'); pixelRect(2, -8, 6, 9, '#44372e');
    ctx.restore();
  }

  function drawAbandonedBundle(x, y) {
    ctx.fillStyle = '#47382b'; ctx.beginPath(); ctx.ellipse(x, y, 14, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#86734c'; ctx.fillRect(x - 7, y - 8, 14, 7); ctx.fillRect(x - 2, y - 10, 4, 10);
  }

  function drawFox(x, y, t) {
    const bob = Math.sin(t * 4) * 1.6;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y + bob));
    ctx.fillStyle = '#151a13'; ctx.globalAlpha = .33; ctx.beginPath(); ctx.ellipse(0, 2, 17, 6, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#bd794a'; ctx.beginPath(); ctx.ellipse(0, -11, 13, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -15); ctx.lineTo(22, -21); ctx.lineTo(15, -11); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9824e'; ctx.fillRect(-12, -24, 5, 12); ctx.fillRect(5, -25, 5, 12);
    ctx.fillStyle = '#ead1a4'; ctx.fillRect(-4, -14, 12, 6); ctx.fillRect(-2, -28, 5, 3);
    ctx.fillStyle = '#241d19'; ctx.fillRect(4, -21, 2, 2);
    ctx.fillStyle = '#553c2d'; ctx.fillRect(-9, -5, 4, 5); ctx.fillRect(4, -5, 4, 5);
    ctx.restore();
  }

  function drawPet(pet) {
    if (state.pet === 'youngDragon') { drawYoungDragon(pet.x, pet.y, pet.walkTime); return; }
    drawFox(pet.x, pet.y, pet.walkTime);
  }

  function drawYoungDragon(x, y, t) {
    const bob = Math.sin(t * 4) * 2;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y + bob));
    ctx.fillStyle = '#142019'; ctx.globalAlpha = .3; ctx.beginPath(); ctx.ellipse(0, 2, 19, 6, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#8bc99c'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-10, -9); ctx.quadraticCurveTo(-20, -23, -8, -28); ctx.quadraticCurveTo(3, -33, 9, -21); ctx.stroke();
    ctx.fillStyle = '#6fa882'; ctx.beginPath(); ctx.ellipse(0, -14, 12, 8, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(5, -27, 7, 9); ctx.fillStyle = '#e7c878'; ctx.fillRect(8, -24, 2, 2);
    ctx.fillStyle = '#cfac65'; ctx.fillRect(3, -32, 2, 7); ctx.fillRect(10, -32, 2, 7);
    ctx.fillStyle = '#567f69'; ctx.fillRect(-7, -8, 4, 6); ctx.fillRect(5, -8, 4, 6);
    ctx.restore();
  }

  function drawHero(h) {
    const bob = h.walking ? Math.abs(Math.sin(h.walkTime)) * 3 : Math.sin(state.elapsed * 2.2) * 0.8;
    const flash = h.invuln > 0 && Math.floor(state.elapsed * 18) % 2 === 0;
    ctx.save(); ctx.translate(Math.round(h.x), Math.round(h.y + bob));
    ctx.fillStyle = '#171a12'; ctx.globalAlpha = .37; ctx.beginPath(); ctx.ellipse(0, 4, 19, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.save();
    if (h.facingX < -0.18) ctx.scale(-1, 1);
    if (flash) ctx.globalAlpha = .47;
    const cloth = catalog.items[state.equipped.cloth];
    const clothColor = cloth?.color || '#82775e';
    const legSwing = h.walking ? Math.sin(h.walkTime) * 4 : 0;
    // Hair and face, then a plain traveler's tunic. Each block keeps a hand-pixelled silhouette.
    pixelRect(-7, -46, 14, 5, '#22231e'); pixelRect(-11, -42, 22, 18, '#d8ad82');
    pixelRect(-13, -45, 26, 6, '#24251f'); pixelRect(-10, -48, 7, 5, '#25261f'); pixelRect(4, -48, 7, 5, '#25261f');
    pixelRect(-5, -34, 2.5, 2, '#2b2822'); pixelRect(4, -34, 2.5, 2, '#2b2822'); pixelRect(-2, -27, 5, 2, '#8f5949');
    pixelRect(-11, -25, 22, 18, clothColor); pixelRect(-14, -23, 5, 14, clothColor); pixelRect(9, -23, 5, 14, clothColor);
    pixelRect(-3, -24, 6, 16, '#c9b187'); pixelRect(-11, -9, 22, 4, '#594a35');
    pixelRect(-9 + legSwing, -6, 7, 12, '#594638'); pixelRect(3 - legSwing, -6, 7, 12, '#594638');
    if (state.equipped.shoes) {
      pixelRect(-10 + legSwing, 4, 9, 4, '#443a2c'); pixelRect(2 - legSwing, 4, 9, 4, '#443a2c');
    } else {
      pixelRect(-9 + legSwing, 5, 7, 3, '#d4aa80'); pixelRect(3 - legSwing, 5, 7, 3, '#d4aa80');
    }
    const weapon = hWeapon();
    if (weapon) drawWeapon(weapon.weapon, h.attackAnim);
    else {
      const fist = h.attackAnim > 0 ? 9 : 0;
      pixelRect(11 + fist, -19, 6, 6, '#d8ad82');
      pixelRect(-16 - fist * .25, -18, 5, 6, '#d8ad82');
    }
    ctx.restore();
    if (h.attackAnim > 0 && hWeapon()) drawWeaponArc(h, hWeapon());
    if (state.pet) { /* the companion is drawn separately according to ground depth */ }
    ctx.restore();
  }

  function drawWeapon(kind, attack) {
    const lift = attack > 0 ? 5 : 0;
    ctx.save(); ctx.translate(13, -18 - lift);
    if (kind === 'sword') {
      ctx.rotate(-0.68);
      pixelRect(-2, -4, 5, 9, '#806342'); pixelRect(-1, -19, 3, 17, '#d9d8cb'); pixelRect(-2, -21, 5, 3, '#f5e7bd'); pixelRect(-6, -6, 13, 3, '#c3a35f');
    } else if (kind === 'saber') {
      ctx.rotate(-0.72);
      pixelRect(-2, -3, 5, 9, '#614a35'); pixelRect(-1, -24, 4, 21, '#e9bc69'); pixelRect(1, -28, 5, 8, '#fff0bb'); pixelRect(-5, -6, 11, 3, '#a57c42');
    } else if (kind === 'spear') {
      ctx.rotate(-0.62);
      pixelRect(-2, -5, 4, 34, '#705038'); pixelRect(-4, -12, 8, 8, '#b9d4bd'); pixelRect(-1, -17, 3, 7, '#e7e6d4');
    }
    ctx.restore();
  }

  function drawWeaponArc(h, weapon) {
    const progress = 1 - h.attackAnim / .24;
    const len = weapon.weapon === 'spear' ? 42 : 31;
    const x = h.x + h.facingX * len;
    const y = h.y - 18 + h.facingY * len * .45;
    ctx.save(); ctx.globalAlpha = (1 - progress) * .75;
    ctx.translate(x, y); ctx.rotate(Math.atan2(h.facingY, h.facingX));
    ctx.strokeStyle = weapon.weapon === 'saber' ? '#ffbf73' : weapon.weapon === 'spear' ? '#a8ebd0' : '#fff0c2';
    ctx.lineWidth = weapon.weapon === 'saber' ? 7 : 4;
    ctx.beginPath(); ctx.arc(0, 0, len, -.75 + progress * .25, .85 + progress * .25); ctx.stroke(); ctx.restore();
  }

  function drawEnemy(enemy) {
    if (enemy.dragon) { drawDragon(enemy); return; }
    const bob = Math.sin(enemy.anim * 1.6) * (enemy.type === 'chief' ? 1.3 : 2);
    ctx.save(); ctx.translate(Math.round(enemy.x), Math.round(enemy.y + bob));
    ctx.fillStyle = '#111710'; ctx.globalAlpha = .4; ctx.beginPath(); ctx.ellipse(0, 3, enemy.radius * .8, 6, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    if (enemy.facing < 0) ctx.scale(-1, 1);
    if (enemy.hurt > 0) ctx.filter = 'brightness(1.8)';
    if (enemy.type === 'chief') {
      pixelRect(-17, -48, 34, 26, '#4b373c'); pixelRect(-21, -45, 7, 16, '#865346'); pixelRect(14, -45, 7, 16, '#865346');
      pixelRect(-15, -63, 30, 20, '#c1936e'); pixelRect(-18, -67, 36, 7, '#422a31'); pixelRect(-13, -70, 26, 5, '#5d303b');
      pixelRect(-9, -55, 3, 3, '#dfbd6c'); pixelRect(6, -55, 3, 3, '#dfbd6c'); pixelRect(-13, -25, 11, 21, '#312a2d'); pixelRect(3, -25, 11, 21, '#312a2d');
      pixelRect(18, -42, 5, 38, '#73513b'); pixelRect(15, -47, 10, 10, '#b39462');
    } else {
      const size = enemy.type === 'brute' ? 1.2 : 1;
      ctx.scale(size, size);
      pixelRect(-12, -32, 24, 20, enemy.color); pixelRect(-16, -29, 6, 15, enemy.color); pixelRect(10, -29, 6, 15, enemy.color);
      pixelRect(-9, -47, 18, 17, '#d1a17a'); pixelRect(-11, -50, 22, 7, enemy.type === 'outrider' ? '#643d39' : '#36352e');
      pixelRect(-7, -40, 3, 2, '#292822'); pixelRect(4, -40, 3, 2, '#292822'); pixelRect(-11, -14, 8, 13, '#39332b'); pixelRect(3, -14, 8, 13, '#39332b');
      pixelRect(14, -31, 4, 22, '#73543a'); pixelRect(12, -36, 8, 7, '#c4a261');
      if (enemy.type === 'brute') { pixelRect(-14, -52, 28, 5, '#728168'); pixelRect(-17, -31, 4, 11, '#c3a263'); }
    }
    ctx.filter = 'none';
    ctx.restore();
    drawEnemyHealth(enemy);
    if (enemy.windup > 0 && !enemy.dragon) {
      ctx.save(); ctx.globalAlpha = .45 + Math.sin(state.elapsed * 35) * .2; ctx.strokeStyle = '#ee9a74'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(enemy.x, enemy.y - enemy.radius - 10, 13 + (0.42 - enemy.windup) * 24, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }

  function drawEnemyHealth(enemy) {
    if (enemy.hp >= enemy.maxHp && dist(enemy, hero()) > 210) return;
    const width = enemy.boss ? 76 : 35;
    const y = enemy.y - enemy.radius - 13;
    ctx.fillStyle = '#191914'; ctx.fillRect(enemy.x - width / 2, y, width, 4);
    ctx.fillStyle = enemy.boss ? '#d88b62' : '#c46455'; ctx.fillRect(enemy.x - width / 2 + 1, y + 1, (width - 2) * clamp(enemy.hp / enemy.maxHp, 0, 1), 2);
  }

  function drawDragon(enemy) {
    const bob = Math.sin(enemy.anim * 0.7) * 3;
    ctx.save(); ctx.translate(enemy.x, enemy.y + bob);
    ctx.fillStyle = '#111710'; ctx.globalAlpha = .35; ctx.beginPath(); ctx.ellipse(0, 12, 83, 23, -.08, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    const facing = enemy.facing;
    ctx.save(); if (facing < 0) ctx.scale(-1, 1);
    // A long, coiling mountain wyrm silhouette with plated jade scales and a horned head.
    ctx.lineCap = 'round'; ctx.strokeStyle = '#2f624e'; ctx.lineWidth = 22;
    ctx.beginPath(); ctx.moveTo(-8, -13 + bob); ctx.bezierCurveTo(-58, -48, -102, 2, -67, 30); ctx.bezierCurveTo(-28, 58, 28, 40, 24, 3); ctx.stroke();
    ctx.strokeStyle = '#6ea77b'; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(-8, -16 + bob); ctx.bezierCurveTo(-57, -47, -98, 1, -66, 27); ctx.bezierCurveTo(-32, 52, 22, 36, 20, 1); ctx.stroke();
    for (const point of [[-47,-24],[-73,-7],[-61,22],[-24,37],[7,23]]) {
      ctx.fillStyle = '#b3cd88'; ctx.beginPath(); ctx.moveTo(point[0]-5,point[1]); ctx.lineTo(point[0],point[1]-12); ctx.lineTo(point[0]+5,point[1]); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = enemy.hurt > 0 ? '#fff0c1' : '#78ac7c'; ctx.beginPath(); ctx.ellipse(31, -20 + bob, 31, 21, -.18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#487354'; ctx.fillRect(14, -32 + bob, 30, 8); ctx.fillRect(39, -14 + bob, 18, 10);
    ctx.fillStyle = '#d8bd72'; ctx.beginPath(); ctx.moveTo(20, -34 + bob); ctx.lineTo(14, -52 + bob); ctx.lineTo(29, -35 + bob); ctx.fill();
    ctx.beginPath(); ctx.moveTo(38, -34 + bob); ctx.lineTo(43, -51 + bob); ctx.lineTo(48, -31 + bob); ctx.fill();
    ctx.fillStyle = '#f1ce73'; ctx.fillRect(37, -25 + bob, 5, 4); ctx.fillStyle = '#332421'; ctx.fillRect(39, -24 + bob, 2, 3);
    ctx.fillStyle = '#e5bd65'; ctx.fillRect(49, -9 + bob, 12, 4); ctx.fillRect(56, -5 + bob, 4, 3);
    ctx.fillStyle = '#597f5e'; ctx.beginPath(); ctx.moveTo(8, -5 + bob); ctx.lineTo(0, -28 + bob); ctx.lineTo(21, -12 + bob); ctx.fill();
    ctx.fillStyle = '#447150'; ctx.fillRect(-25, 16 + bob, 9, 24); ctx.fillRect(4, 13 + bob, 9, 25); ctx.fillRect(-67, 17 + bob, 9, 18);
    ctx.fillStyle = '#c7aa67'; ctx.fillRect(-27, 37 + bob, 13, 4); ctx.fillRect(2, 36 + bob, 13, 4); ctx.fillRect(-70, 33 + bob, 12, 4);
    ctx.restore(); ctx.restore();
    drawEnemyHealth(enemy);
    if (enemy.breathTell > 0) drawDragonTelegraph(enemy);
  }

  function drawDragonTelegraph(enemy) {
    const dx = hero().x - enemy.x, dy = hero().y - enemy.y;
    const len = Math.hypot(dx, dy) || 1;
    ctx.save(); ctx.globalAlpha = .24 + Math.sin(state.elapsed * 25) * .09; ctx.fillStyle = '#ff8d54';
    ctx.beginPath(); ctx.moveTo(enemy.x + dx / len * 38, enemy.y + dy / len * 25); ctx.lineTo(enemy.x + dx / len * 340 - dy / len * 65, enemy.y + dy / len * 300 + dx / len * 65); ctx.lineTo(enemy.x + dx / len * 340 + dy / len * 65, enemy.y + dy / len * 300 - dx / len * 65); ctx.closePath(); ctx.fill(); ctx.restore();
  }


  function drawLoot() {
    for (const drop of mapData().loot) {
      const item = catalog.items[drop.itemId];
      if (!item) continue;
      const bob = Math.sin(drop.bob) * 4;
      const glow = ctx.createRadialGradient(drop.x, drop.y - 13 + bob, 2, drop.x, drop.y - 13 + bob, 34);
      glow.addColorStop(0, item.manual ? '#d7bb7180' : '#9cc89d5b'); glow.addColorStop(1, '#86b78900');
      ctx.fillStyle = glow; ctx.fillRect(drop.x - 36, drop.y - 50 + bob, 72, 72);
      ctx.fillStyle = '#21251d'; ctx.globalAlpha = .35; ctx.beginPath(); ctx.ellipse(drop.x, drop.y + 3, 14, 5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = '#25271e'; ctx.fillRect(drop.x - 13, drop.y - 30 + bob, 26, 23);
      ctx.strokeStyle = item.manual ? '#e0c277' : '#c8b076'; ctx.lineWidth = 1; ctx.strokeRect(drop.x - 12.5, drop.y - 29.5 + bob, 25, 22);
      ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(item.icon, drop.x, drop.y - 13 + bob);
      if (dist(drop, hero()) < 85) { ctx.font = 'bold 9px sans-serif'; ctx.fillStyle = '#f0dfb2'; ctx.fillText(item.name, drop.x, drop.y - 39 + bob); }
    }
  }

  function drawProjectiles() {
    for (const shot of state.projectiles) {
      ctx.save();
      if (shot.kind === 'flame') {
        const g = ctx.createRadialGradient(shot.x, shot.y, 2, shot.x, shot.y, shot.radius * 1.5);
        g.addColorStop(0, '#fff2ad'); g.addColorStop(.35, '#ffb153'); g.addColorStop(1, '#e95f3b00');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe6a0'; ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius * .42, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.shadowBlur = 18; ctx.shadowColor = shot.color; ctx.fillStyle = shot.color; ctx.beginPath(); ctx.arc(shot.x, shot.y, shot.radius * .55, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#d8fff1'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(shot.x - shot.vx * .04, shot.y - shot.vy * .04); ctx.lineTo(shot.x, shot.y); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawEffects() {
    for (const effect of state.effects) {
      const alpha = clamp(effect.life / effect.max, 0, 1);
      ctx.save(); ctx.globalAlpha = alpha;
      if (effect.kind === 'spark') {
        ctx.fillStyle = effect.color; ctx.fillRect(effect.x, effect.y, effect.size, effect.size);
      } else if (effect.kind === 'slash') {
        ctx.translate(effect.x, effect.y); ctx.rotate(Math.atan2(effect.dirY, effect.dirX));
        ctx.strokeStyle = effect.style === 'saber' ? '#ffd28c' : effect.style === 'spear' ? '#b7ead4' : '#f7edc4';
        ctx.lineWidth = effect.style === 'saber' ? 9 : 5; ctx.beginPath(); ctx.arc(0, 0, 40, -.8, .8); ctx.stroke();
      } else if (effect.kind === 'tiger') {
        const r = 130 * (1 - alpha * .35); ctx.strokeStyle = '#e6bd75'; ctx.lineWidth = 9 * alpha;
        ctx.beginPath(); ctx.arc(effect.x, effect.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#f1e2b0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(effect.x, effect.y, r - 13, .2, Math.PI * 1.45); ctx.stroke();
      } else if (effect.kind === 'afterimage') {
        ctx.translate(effect.x, effect.y); if (effect.facingX < 0) ctx.scale(-1, 1);
        ctx.fillStyle = '#9fe1c3'; ctx.globalAlpha *= .2; ctx.fillRect(-10, -33, 20, 38);
      } else if (effect.kind === 'heal') {
        ctx.strokeStyle = '#75e1a8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(effect.x, effect.y - 10, 21 + (1 - alpha) * 45, 0, Math.PI * 2); ctx.stroke();
      } else if (effect.kind === 'paw') {
        ctx.fillStyle = '#efd38d'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('✦', effect.x, effect.y);
      }
      ctx.restore();
    }
  }

  function drawDamageFloats() {
    for (const item of state.floats) {
      ctx.save(); ctx.globalAlpha = clamp(item.life / item.max, 0, 1); ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 3; ctx.strokeStyle = '#171812'; ctx.strokeText(item.text, item.x, item.y); ctx.fillStyle = item.color; ctx.fillText(item.text, item.x, item.y); ctx.restore();
    }
  }


  function pixelRect(x, y, w, h, color) {
    ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function keyDown(event) {
    const key = event.key.toLowerCase();
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) event.preventDefault();
    if (key === 'escape') { if (openModal) closePanel(); return; }
    if (key === 'b') { openModal === 'inventory' ? closePanel('inventory') : openPanel('inventory'); return; }
    if (key === 'k') { openModal === 'skills' ? closePanel('skills') : openPanel('skills'); return; }
    if (openModal || !$('startScreen').hidden) return;
    keys[key] = true;
    if (key === ' ' || key === 'j') { if (!event.repeat) playerAttack(); }
    if (key === 'q') { if (!event.repeat) activateSkill(); }
    if (key === 'c') { if (!event.repeat) cycleSkill(); }
    if (key === 'e') { if (!event.repeat) interact(); }
    if (key === 'shift') { if (!event.repeat) dodge(); }
    if (key === '1' && state.learned[0]) { state.selectedSkill = state.learned[0]; refreshHUD(); activateSkill(); }
    if (key === '2' && state.learned[1]) { state.selectedSkill = state.learned[1]; refreshHUD(); activateSkill(); }
  }

  function keyUp(event) { keys[event.key.toLowerCase()] = false; }

  canvas.addEventListener('pointerdown', event => {
    if (!state?.started || state.ended || event.button === 2) return;
    canvas.setPointerCapture?.(event.pointerId);
    pointerAim = { x: event.clientX - canvas.getBoundingClientRect().left, y: event.clientY - canvas.getBoundingClientRect().top };
    const destination = screenToWorld(pointerAim.x, pointerAim.y);
    const target = mapData().enemies.find(e => e.hp > 0 && dist(e, destination) < e.radius + 27);
    if (target && dist(target, hero()) < hero().range + target.radius + 30) playerAttack();
    else moveTarget = destination;
  });
  canvas.addEventListener('contextmenu', event => event.preventDefault());
  window.addEventListener('keydown', keyDown, { passive: false });
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', () => { keys = Object.create(null); joystick = { x: 0, y: 0 }; });
  window.addEventListener('resize', resize);

  $('startButton').addEventListener('click', startGame);
  $('basicAttack').addEventListener('click', playerAttack);
  $('activeSkill').addEventListener('click', activateSkill);
  $('libraryBtn').addEventListener('click', () => openPanel('inventory'));
  $('bagQuick').addEventListener('click', () => openPanel('inventory'));
  $('skillsBtn').addEventListener('click', () => openPanel('skills'));
  $('manualQuick').addEventListener('click', () => openPanel('skills'));
  $('useTonic').addEventListener('click', useTonic);
  $('touchAttack').addEventListener('click', playerAttack);
  $('touchSkill').addEventListener('click', activateSkill);
  $('touchInteract').addEventListener('click', interact);
  $('openStats').addEventListener('click', () => openPanel('inventory'));
  $('returnButton').addEventListener('click', returnToVillage);
  document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => closePanel(button.dataset.close)));
  $('inventoryModal').addEventListener('click', e => { if (e.target.classList.contains('modal-backdrop')) closePanel('inventory'); });
  $('skillsModal').addEventListener('click', e => { if (e.target.classList.contains('modal-backdrop')) closePanel('skills'); });

  const stick = $('touchStick');
  const knob = $('stickKnob');
  stick.addEventListener('pointerdown', event => {
    event.preventDefault(); event.stopPropagation(); stickPointer = event.pointerId; stick.setPointerCapture(event.pointerId);
    const rect = stick.getBoundingClientRect(); stickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; updateStick(event);
  });
  stick.addEventListener('pointermove', event => { if (event.pointerId === stickPointer) updateStick(event); });
  function updateStick(event) {
    const dx = event.clientX - stickOrigin.x, dy = event.clientY - stickOrigin.y;
    const len = Math.hypot(dx, dy), limit = 28, factor = len > limit ? limit / len : 1;
    const x = dx * factor, y = dy * factor;
    knob.style.transform = `translate(${x}px, ${y}px)`;
    joystick = { x: x / limit, y: y / limit };
    moveTarget = null;
  }
  function releaseStick(event) {
    if (event.pointerId !== stickPointer) return;
    stickPointer = null; stickOrigin = null; joystick = { x: 0, y: 0 }; knob.style.transform = '';
  }
  stick.addEventListener('pointerup', releaseStick); stick.addEventListener('pointercancel', releaseStick);

  $('mapChip').addEventListener('click', () => showToast('地图：安平镇南门可前往青岚山道。'));
  window.addEventListener('contextmenu', event => event.preventDefault());

  // Compute initial scene layout before the title screen is dismissed.
  state = freshState(storage.get());
  if (storage.get()?.pet) { state.petData.x = 770; state.petData.y = 530; }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
})();
