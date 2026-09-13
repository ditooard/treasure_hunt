(() => {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const ICONS = {
    home: '<svg viewBox="0 0 24 24"><path d="M12 3 2.5 11.5h2.8V21h5.2v-5.6h3V21h5.2v-9.5h2.8L12 3z"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M4 9v6h3.2l4.8 3.8V5.2L7.2 9H4z"/><path d="M15.6 8.4a5.2 5.2 0 0 1 0 7.2l1.5 1.5a7.3 7.3 0 0 0 0-10.2l-1.5 1.5z"/></svg>',
    music: '<svg viewBox="0 0 24 24"><path d="M20 3v11.3a3.3 3.3 0 1 1-2-3V6.6L10 8.4v8.9a3.3 3.3 0 1 1-2-3V6l12-3z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zm9.1 3.8c0-.5 0-1-.1-1.5l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.6-1.5L15.5 2h-4l-.5 2.6a7.6 7.6 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.6a8 8 0 0 0 0 3l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.6 1.5l.5 2.6h4l.5-2.6a7.6 7.6 0 0 0 2.6-1.5l2.4 1 2-3.4-2-1.6c.1-.5.1-1 .1-1.5z"/></svg>'
  };

  const OBJECTS = [
    { id: 'teddy', name: 'Teddy Bear', img: 'assets/teddy.webp', shadow: 'assets/teddy-shadow.webp', pos: { x: 12.5, y: 84, w: 5.6, rot: -8 } },
    { id: 'car', name: 'Toy Car', img: 'assets/car.webp', shadow: 'assets/car-shadow.webp', pos: { x: 46, y: 71, w: 8.4, rot: -4 } },
    { id: 'ball', name: 'Ball', img: 'assets/ball.webp', shadow: 'assets/ball-shadow.webp', pos: { x: 22, y: 79, w: 6, rot: 0 } },
    { id: 'dino', name: 'Dinosaur', img: 'assets/dino.webp', shadow: 'assets/dino-shadow.webp', pos: { x: 68, y: 81, w: 8.2, rot: 5 } }
  ];

  const COUNT_ANSWER = 3;

  const BLOCK_ZONES = [
    { x: [7, 18], y: [64, 82] },
    { x: [26, 42], y: [72, 92] },
    { x: [50, 66], y: [66, 86] },
    { x: [70, 84], y: [76, 94] }
  ];

  const DIFFS = [
    { id: 'pillow', x: 31, y: 37, r: 7.5 },
    { id: 'painting', x: 28.5, y: 13, r: 5.5 },
    { id: 'blanket', x: 83.5, y: 44, r: 8 },
    { id: 'ball', x: 29.2, y: 91.5, r: 7.4 },
    { id: 'cube', x: 31, y: 80, r: 5.5 }
  ];

  const Sound = (() => {
    let ctx = null;
    let master = null;
    let musicGain = null;
    let musicBuffer = null;
    let musicSource = null;
    let musicLoading = false;

    const prefs = {
      sound: localStorage.getItem('th_sound') !== '0',
      music: localStorage.getItem('th_music') !== '0'
    };

    function persist() {
      localStorage.setItem('th_sound', prefs.sound ? '1' : '0');
      localStorage.setItem('th_music', prefs.music ? '1' : '0');
    }

    function init() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.6;
        master.connect(ctx.destination);
        musicGain = ctx.createGain();
        musicGain.gain.value = prefs.music ? 0.16 : 0;
        musicGain.connect(master);
      }
      if (ctx.state === 'suspended') ctx.resume();
      if (prefs.music) startMusic();
    }

    function tone(freq, dur, type, vol, delay, target, slideTo) {
      if (!ctx) return;
      const t = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(target || master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }

    function click() {
      if (!prefs.sound) return;
      init();
      tone(660, 0.08, 'triangle', 0.15);
    }

    function correct() {
      if (!prefs.sound) return;
      init();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22, 'triangle', 0.22, i * 0.09));
    }

    function wrong() {
      if (!prefs.sound) return;
      init();
      tone(220, 0.18, 'square', 0.1);
      tone(174, 0.24, 'square', 0.1, 0.14);
    }

    function win() {
      if (!prefs.sound) return;
      init();
      [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.3, 'triangle', 0.22, i * 0.11));
    }

    function loadMusic() {
      if (musicBuffer || musicLoading || !ctx) return;
      musicLoading = true;
      fetch('assets/music/bg-loop.m4a')
        .then((r) => r.arrayBuffer())
        .then((buf) => ctx.decodeAudioData(buf))
        .then((decoded) => {
          musicBuffer = decoded;
          musicLoading = false;
          if (prefs.music) startMusic();
        })
        .catch(() => { musicLoading = false; });
    }

    function startMusic() {
      if (!ctx || !prefs.music || musicSource) return;
      if (!musicBuffer) {
        loadMusic();
        return;
      }
      musicSource = ctx.createBufferSource();
      musicSource.buffer = musicBuffer;
      musicSource.loop = true;
      musicSource.connect(musicGain);
      musicSource.start();
    }

    function stopMusic() {
      if (musicSource) {
        try { musicSource.stop(); } catch (e) { /* ignore */ }
        musicSource = null;
      }
    }

    function syncUI() {
      $$('[data-audio="sound"]').forEach((b) => b.classList.toggle('is-off', !prefs.sound));
      $$('[data-audio="music"]').forEach((b) => b.classList.toggle('is-off', !prefs.music));
    }

    function setSound(on) {
      prefs.sound = on;
      persist();
      syncUI();
      if (!on) Voice.stop();
    }

    function setMusic(on) {
      prefs.music = on;
      persist();
      if (ctx && musicGain) musicGain.gain.setTargetAtTime(on ? 0.16 : 0, ctx.currentTime, 0.05);
      if (on) startMusic();
      else stopMusic();
      syncUI();
    }

    function toggle(kind) {
      if (kind === 'sound') setSound(!prefs.sound);
      else setMusic(!prefs.music);
    }

    function isSoundOn() {
      return prefs.sound;
    }

    function duck(on) {
      if (!ctx || !master || !musicGain) return;
      master.gain.setTargetAtTime(on ? 0.28 : 0.6, ctx.currentTime, 0.08);
      const vol = prefs.music ? (on ? 0.035 : 0.16) : 0;
      musicGain.gain.setTargetAtTime(vol, ctx.currentTime, 0.08);
    }

    return { init, click, correct, wrong, win, toggle, syncUI, isSoundOn, duck };
  })();

  const Voice = (() => {
    const KEYS = ['home-welcome', 'l1-intro', 'l2-intro', 'l3-intro', 'l4-intro',
      'complete-1', 'complete-2', 'complete-3', 'nudge-l2', 'nudge-l3', 'nudge-l4',
      'ending-1', 'ending-2', 'praise-1', 'praise-2', 'praise-3', 'praise-4'];
    const PRAISE = ['praise-1', 'praise-2', 'praise-3', 'praise-4'];
    const pool = {};
    let current = null;
    let currentKind = '';
    let queue = [];
    let token = 0;
    let ready = false;
    let bag = [];

    function prepare() {
      if (ready || !window.Audio) return;
      ready = true;
      KEYS.forEach((k) => {
        const a = new Audio('assets/voice/' + k + '.wav');
        a.preload = 'auto';
        pool[k] = a;
      });
    }

    function stopCurrent() {
      if (!current) return;
      current.onended = null;
      current.onerror = null;
      current.pause();
      try { current.currentTime = 0; } catch (e) { /* ignore */ }
      current = null;
      currentKind = '';
    }

    function start(key, kind) {
      const a = pool[key];
      if (!a) return;
      stopCurrent();
      token += 1;
      const t = token;
      current = a;
      currentKind = kind;
      try { a.currentTime = 0; } catch (e) { /* ignore */ }
      const done = () => {
        if (t !== token) return;
        Sound.duck(false);
        current = null;
        currentKind = '';
        if (queue.length) start(queue.shift(), 'praise');
      };
      a.onended = done;
      a.onerror = done;
      Sound.duck(true);
      const p = a.play();
      if (p && p.catch) p.catch(done);
      return p;
    }

    function play(key, kind) {
      if (!Sound.isSoundOn()) return;
      prepare();
      if (kind === 'praise' && current && currentKind === 'praise' && !current.paused) {
        if (queue.length < 2) queue.push(key);
        return;
      }
      queue = [];
      return start(key, kind || 'line');
    }

    function shufflePraise() {
      if (!bag.length) bag = shuffle(PRAISE.slice());
      return bag.pop();
    }

    function praise() { play(shufflePraise(), 'praise'); }
    function nudge(level) { play('nudge-l' + level, 'nudge'); }
    function intro(level) { play('l' + level + '-intro', 'intro'); }
    function complete(level) { play('complete-' + level, 'complete'); }
    function line(key) { return play(key, 'line'); }

    function ending() {
      play('ending-1', 'ending');
      const first = current;
      const t = token;
      if (!first) return;
      first.addEventListener('ended', () => {
        if (t === token && Sound.isSoundOn()) start('ending-2', 'ending');
      }, { once: true });
    }

    function stop() {
      token += 1;
      queue = [];
      stopCurrent();
      Sound.duck(false);
    }

    return { prepare, play, praise, nudge, intro, complete, line, ending, stop };
  })();

  const state = { found: {}, matched: {}, diffs: {} };
  let selectedObject = null;
  let drag = null;
  let suppressClick = false;
  let l2Locked = false;
  let cubePositions = [];

  function initIcons() {
    $$('[data-icon]').forEach((el) => {
      el.innerHTML = ICONS[el.dataset.icon] || '';
    });
  }

  function fitStage() {
    const stage = $('#stage');
    stage.style.setProperty('--u', (stage.clientWidth / 100) + 'px');
    stage.style.setProperty('--v', (stage.clientHeight / 100) + 'px');
  }

  function show(id) {
    $$('.screen').forEach((s) => s.classList.toggle('is-active', s.id === id));
  }

  function goHome() {
    closeOverlay();
    show('screen-home');
    Voice.line('home-welcome');
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildLevel1() {
    state.found = {};
    const targets = $('#l1-targets');
    const scene = $('#l1-scene');
    targets.innerHTML = '';
    scene.innerHTML = '';
    $('#l1-progress').textContent = '0 / ' + OBJECTS.length;

    OBJECTS.forEach((obj) => {
      const card = document.createElement('div');
      card.className = 'target-card';
      card.dataset.id = obj.id;
      card.innerHTML = '<img src="' + obj.img + '" alt="' + obj.name + '" draggable="false"><span>' + obj.name + '</span>';
      targets.appendChild(card);

      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'scene-obj';
      el.dataset.id = obj.id;
      el.style.left = obj.pos.x + '%';
      el.style.top = obj.pos.y + '%';
      el.style.width = 'calc(var(--u) * ' + obj.pos.w + ')';
      el.style.setProperty('--rot', obj.pos.rot + 'deg');
      el.setAttribute('aria-label', obj.name);
      el.innerHTML = '<img src="' + obj.img + '" alt="" draggable="false">';
      el.addEventListener('click', () => findObject(obj.id, el));
      scene.appendChild(el);
    });
  }

  function findObject(id, el) {
    if (state.found[id]) return;
    state.found[id] = true;
    el.classList.add('is-found');
    const card = document.querySelector('.target-card[data-id="' + id + '"]');
    if (card) card.classList.add('is-found');
    Sound.correct();
    const count = Object.keys(state.found).length;
    $('#l1-progress').textContent = count + ' / ' + OBJECTS.length;
    if (count === OBJECTS.length) {
      setTimeout(() => completeLevel(1), 900);
    } else {
      Voice.praise();
    }
  }

  function buildLevel2() {
    l2Locked = false;
    $$('#screen-level2 .pulse-ring').forEach((r) => r.remove());
    const scene = $('#l2-scene');
    scene.innerHTML = '';
    cubePositions = shuffle(BLOCK_ZONES.slice()).slice(0, COUNT_ANSWER).map((zone) => {
      const x = zone.x[0] + Math.random() * (zone.x[1] - zone.x[0]);
      const y = zone.y[0] + Math.random() * (zone.y[1] - zone.y[0]);
      const rot = (Math.random() * 26 - 13).toFixed(1);
      const w = (4.2 + Math.random() * 1.4).toFixed(1);
      const block = document.createElement('img');
      block.className = 'scene-block';
      block.src = 'assets/blue-block.webp';
      block.alt = '';
      block.draggable = false;
      block.style.left = x + '%';
      block.style.top = y + '%';
      block.style.width = 'calc(var(--u) * ' + w + ')';
      block.style.setProperty('--rot', rot + 'deg');
      block.style.setProperty('--drift-dur', (3 + Math.random() * 1.8).toFixed(2) + 's');
      block.style.setProperty('--drift-delay', (-Math.random() * 2.5).toFixed(2) + 's');
      scene.appendChild(block);
      return { x, y };
    });
    const wrap = $('#l2-numbers');
    wrap.innerHTML = '';
    [2, 3, 4].forEach((n) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'num-btn';
      btn.dataset.value = String(n);
      btn.setAttribute('aria-label', 'Answer ' + n);
      btn.innerHTML = '<img src="assets/' + n + '.webp" alt="' + n + '" draggable="false">';
      btn.addEventListener('click', () => answerLevel2(btn, n));
      wrap.appendChild(btn);
    });
  }

  function spawnRings() {
    const host = $('#screen-level2');
    cubePositions.forEach((c, i) => {
      setTimeout(() => {
        const ring = document.createElement('span');
        ring.className = 'pulse-ring';
        ring.style.left = c.x + '%';
        ring.style.top = c.y + '%';
        host.appendChild(ring);
        setTimeout(() => ring.remove(), 2600);
      }, i * 260);
    });
  }

  function answerLevel2(btn, n) {
    if (l2Locked) return;
    if (n === COUNT_ANSWER) {
      l2Locked = true;
      $$('#l2-numbers .num-btn').forEach((b) => { b.disabled = true; });
      btn.classList.add('is-correct');
      Sound.correct();
      spawnRings();
      setTimeout(() => completeLevel(2), 1600);
    } else {
      btn.classList.add('is-wrong');
      btn.disabled = true;
      Sound.wrong();
      Voice.nudge(2);
      setTimeout(() => {
        btn.classList.remove('is-wrong');
        btn.disabled = false;
      }, 700);
    }
  }

  function buildLevel3() {
    state.matched = {};
    selectedObject = null;
    drag = null;
    const objectsWrap = $('#l3-objects');
    const shadowsWrap = $('#l3-shadows');
    objectsWrap.innerHTML = '';
    shadowsWrap.innerHTML = '';

    OBJECTS.forEach((obj) => {
      const card = document.createElement('div');
      card.className = 'object-card';
      card.dataset.id = obj.id;
      card.innerHTML = '<img class="obj" src="' + obj.img + '" alt="' + obj.name + '" draggable="false">';
      attachDrag(card, obj);
      objectsWrap.appendChild(card);
    });

    shuffle(OBJECTS.slice()).forEach((obj) => {
      const card = document.createElement('div');
      card.className = 'shadow-card';
      card.dataset.id = obj.id;
      card.innerHTML = '<img src="' + obj.shadow + '" alt="Shadow" draggable="false">';
      card.addEventListener('click', () => tapShadow(card));
      shadowsWrap.appendChild(card);
    });
  }

  function attachDrag(card, obj) {
    card.addEventListener('click', () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      if (card.classList.contains('is-locked')) return;
      toggleSelect(card);
    });

    card.addEventListener('pointerdown', (e) => {
      if (card.classList.contains('is-locked') || drag) return;
      e.preventDefault();
      const rect = card.getBoundingClientRect();
      const ghost = document.createElement('img');
      ghost.src = obj.img;
      ghost.className = 'drag-ghost';
      ghost.draggable = false;
      ghost.style.width = (rect.width * 0.85) + 'px';
      ghost.style.height = (rect.height * 0.85) + 'px';
      ghost.style.objectFit = 'contain';
      ghost.style.left = e.clientX + 'px';
      ghost.style.top = e.clientY + 'px';
      document.body.appendChild(ghost);
      card.classList.add('is-dragging');
      drag = { id: obj.id, card, ghost, moved: false, startX: e.clientX, startY: e.clientY };
      window.addEventListener('pointermove', onDragMove);
      window.addEventListener('pointerup', onDragUp);
    });
  }

  function onDragMove(e) {
    if (!drag) return;
    if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 6) drag.moved = true;
    drag.ghost.style.left = e.clientX + 'px';
    drag.ghost.style.top = e.clientY + 'px';
    const over = elementShadowAt(e.clientX, e.clientY);
    $$('.shadow-card.is-over').forEach((c) => { if (c !== over) c.classList.remove('is-over'); });
    if (over && !over.classList.contains('is-matched')) over.classList.add('is-over');
  }

  function onDragUp(e) {
    if (!drag) return;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', onDragUp);
    const current = drag;
    drag = null;
    const over = elementShadowAt(e.clientX, e.clientY);
    $$('.shadow-card.is-over').forEach((c) => c.classList.remove('is-over'));
    current.card.classList.remove('is-dragging');

    if (current.moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      if (over && over.dataset.id === current.id && !over.classList.contains('is-matched')) {
        ghostToCard(current.ghost, over, () => lockMatch(current.id, current.card, over));
      } else if (over) {
        ghostBack(current.ghost, current.card);
        wrongFeedback(over);
        shake(current.card);
        Sound.wrong();
        Voice.nudge(3);
      } else {
        ghostBack(current.ghost, current.card);
      }
    } else {
      current.ghost.remove();
    }
  }

  function elementShadowAt(x, y) {
    const el = document.elementFromPoint(x, y);
    return el && el.closest ? el.closest('.shadow-card') : null;
  }

  function ghostToCard(ghost, card, done) {
    const r = card.getBoundingClientRect();
    ghost.style.transition = 'all .25s ease';
    ghost.style.left = (r.right - r.width * 0.18) + 'px';
    ghost.style.top = (r.bottom - r.height * 0.16) + 'px';
    ghost.style.width = (r.width * 0.28) + 'px';
    ghost.style.height = (r.height * 0.28) + 'px';
    ghost.style.opacity = '0';
    setTimeout(() => {
      ghost.remove();
      done();
    }, 260);
  }

  function ghostBack(ghost, card) {
    const r = card.getBoundingClientRect();
    ghost.style.transition = 'all .25s ease';
    ghost.style.left = (r.left + r.width / 2) + 'px';
    ghost.style.top = (r.top + r.height / 2) + 'px';
    ghost.style.opacity = '0';
    setTimeout(() => ghost.remove(), 260);
  }

  function toggleSelect(card) {
    if (selectedObject === card) {
      card.classList.remove('is-selected');
      selectedObject = null;
      Sound.click();
      return;
    }
    if (selectedObject) selectedObject.classList.remove('is-selected');
    selectedObject = card;
    card.classList.add('is-selected');
    Sound.click();
  }

  function tapShadow(shadowCard) {
    if (shadowCard.classList.contains('is-matched')) return;
    if (!selectedObject) {
      Sound.click();
      return;
    }
    const id = selectedObject.dataset.id;
    if (shadowCard.dataset.id === id) {
      lockMatch(id, selectedObject, shadowCard);
    } else {
      wrongFeedback(shadowCard);
      shake(selectedObject);
      Sound.wrong();
      Voice.nudge(3);
      selectedObject.classList.remove('is-selected');
      selectedObject = null;
    }
  }

  function wrongFeedback(card) {
    card.classList.add('is-wrong');
    setTimeout(() => card.classList.remove('is-wrong'), 500);
  }

  function shake(el) {
    el.classList.add('is-wrong');
    setTimeout(() => el.classList.remove('is-wrong'), 500);
  }

  function lockMatch(id, objectCard, shadowCard) {
    objectCard.classList.remove('is-selected');
    objectCard.classList.add('is-locked');
    if (selectedObject === objectCard) selectedObject = null;
    shadowCard.classList.remove('is-over');
    shadowCard.classList.add('is-matched');
    const obj = OBJECTS.find((o) => o.id === id);
    const slot = document.createElement('img');
    slot.className = 'object-slot';
    slot.src = obj.img;
    slot.alt = '';
    shadowCard.appendChild(slot);
    Sound.correct();
    state.matched[id] = true;
    if (Object.keys(state.matched).length === OBJECTS.length) {
      setTimeout(() => completeLevel(3), 1000);
    } else {
      Voice.praise();
    }
  }

  function buildLevel4() {
    state.diffs = {};
    $$('#screen-level4 .diff-pic').forEach((pic) => {
      pic.querySelector('.diff-markers').innerHTML = '';
      pic.classList.remove('is-wrong');
    });
    const dots = $('#l4-dots');
    dots.innerHTML = '';
    DIFFS.forEach((d, i) => {
      const dot = document.createElement('span');
      dot.className = 'diff-dot';
      dot.dataset.idx = String(i);
      dots.appendChild(dot);
    });
  }

  function tapPicture(pic, e) {
    const img = pic.querySelector('img');
    const rect = img.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const ratio = rect.height / rect.width;
    const hit = DIFFS.find((d) => {
      const dx = px - d.x;
      const dy = (py - d.y) * ratio;
      return Math.hypot(dx, dy) <= d.r;
    });
    if (!hit) {
      pic.classList.add('is-wrong');
      setTimeout(() => pic.classList.remove('is-wrong'), 500);
      Sound.wrong();
      Voice.nudge(4);
      return;
    }
    if (state.diffs[hit.id]) {
      Sound.click();
      return;
    }
    state.diffs[hit.id] = true;
    markDifference(hit);
    const dot = document.querySelector('#l4-dots .diff-dot[data-idx="' + DIFFS.indexOf(hit) + '"]');
    if (dot) dot.classList.add('is-found');
    Sound.correct();
    if (Object.keys(state.diffs).length === DIFFS.length) {
      setTimeout(showEnding, 1100);
    } else {
      Voice.praise();
    }
  }

  function markDifference(d) {
    $$('#screen-level4 .diff-markers').forEach((wrap) => {
      const ring = document.createElement('span');
      ring.className = 'diff-ring';
      ring.style.left = d.x + '%';
      ring.style.top = d.y + '%';
      ring.style.width = (d.r * 2) + '%';
      wrap.appendChild(ring);
    });
  }

  function showEnding() {
    closeOverlay();
    show('screen-ending');
    Sound.win();
    spawnConfetti($('#ending-confetti'));
    Voice.ending();
  }

  function spawnConfetti(container) {
    container.innerHTML = '';
    const colors = ['#f6c34c', '#7ed957', '#5aa9f7', '#f26d6d', '#c58bf2', '#ff9f43'];
    for (let i = 0; i < 44; i++) {
      const c = document.createElement('i');
      c.style.left = (Math.random() * 100) + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = (2.2 + Math.random() * 1.8) + 's';
      c.style.animationDelay = (Math.random() * 0.9) + 's';
      c.style.transform = 'rotate(' + Math.round(Math.random() * 360) + 'deg)';
      container.appendChild(c);
    }
    setTimeout(() => { container.innerHTML = ''; }, 5200);
  }

  function openOverlay(opts) {
    $('#overlay-title').textContent = opts.title;
    $('#overlay-text').textContent = opts.text;
    const wrap = $('#overlay-buttons');
    wrap.innerHTML = '';
    opts.buttons.forEach((b) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = b.cls || 'btn-pill';
      btn.textContent = b.label;
      btn.addEventListener('click', () => {
        Sound.click();
        b.onClick();
      });
      wrap.appendChild(btn);
    });
    if (opts.confetti) spawnConfetti($('#confetti'));
    else $('#confetti').innerHTML = '';
    $('#overlay').classList.add('is-open');
    if (opts.voice) {
      const key = opts.voice;
      setTimeout(() => {
        if ($('#overlay').classList.contains('is-open')) Voice.play(key, 'complete');
      }, 320);
    }
  }

  function closeOverlay() {
    $('#overlay').classList.remove('is-open');
  }

  function completeLevel(level) {
    Sound.win();
    if (level === 1) {
      openOverlay({
        title: 'Level 1 Complete!',
        text: 'You found every object. The next clue awaits!',
        voice: 'complete-1',
        confetti: true,
        buttons: [{
          label: 'Next Level',
          cls: 'btn-pill btn-pill--green',
          onClick: () => { closeOverlay(); startLevel2(); }
        }]
      });
    } else if (level === 2) {
      openOverlay({
        title: 'Level 2 Complete!',
        text: 'Great counting! Two more challenges to go.',
        voice: 'complete-2',
        confetti: true,
        buttons: [{
          label: 'Next Level',
          cls: 'btn-pill btn-pill--green',
          onClick: () => { closeOverlay(); startLevel3(); }
        }]
      });
    } else if (level === 3) {
      openOverlay({
        title: 'Level 3 Complete!',
        text: 'Great matching! One last challenge awaits.',
        voice: 'complete-3',
        confetti: true,
        buttons: [{
          label: 'Next Level',
          cls: 'btn-pill btn-pill--green',
          onClick: () => { closeOverlay(); startLevel4(); }
        }]
      });
    }
  }

  function startLevel1() {
    buildLevel1();
    show('screen-level1');
    Voice.intro(1);
  }

  function startLevel2() {
    buildLevel2();
    show('screen-level2');
    Voice.intro(2);
  }

  function startLevel3() {
    buildLevel3();
    show('screen-level3');
    Voice.intro(3);
  }

  function startLevel4() {
    buildLevel4();
    show('screen-level4');
    Voice.intro(4);
  }

  function init() {
    initIcons();
    Sound.syncUI();
    fitStage();
    if (window.ResizeObserver) new ResizeObserver(fitStage).observe($('#stage'));
    window.addEventListener('resize', fitStage);

    const soundHint = $('#sound-hint');
    let welcomeHeard = false;

    function welcome() {
      if (welcomeHeard || !$('#screen-home').classList.contains('is-active')) return;
      Voice.prepare();
      const p = Voice.line('home-welcome');
      if (p && p.then) {
        p.then(() => {
          welcomeHeard = true;
          if (soundHint) soundHint.hidden = true;
        }).catch(() => {
          if (soundHint) soundHint.hidden = false;
        });
      } else if (p) {
        welcomeHeard = true;
      }
    }

    setTimeout(welcome, 400);

    document.addEventListener('pointerdown', (e) => {
      if (soundHint) soundHint.hidden = true;
      if (welcomeHeard) return;
      if (e.target.closest && e.target.closest('#btn-start')) return;
      welcome();
    }, { once: true });

    $$('[data-audio]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Voice.prepare();
        Sound.init();
        Sound.toggle(btn.dataset.audio);
        Sound.click();
      });
    });

    $$('[data-home]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.click();
        goHome();
      });
    });

    $$('#screen-level4 .diff-pic').forEach((pic) => {
      pic.addEventListener('click', (e) => tapPicture(pic, e));
    });

    $('#btn-play-again').addEventListener('click', () => {
      Sound.click();
      startLevel1();
    });

    $('#btn-next-activity').addEventListener('click', () => {
      Sound.click();
      goHome();
    });

    $('#btn-start').addEventListener('click', () => {
      Sound.init();
      Sound.click();
      startLevel1();
    });

    $('#btn-settings').addEventListener('click', () => {
      Sound.click();
      const panel = $('#settings-panel');
      panel.hidden = !panel.hidden;
    });

    $('#btn-settings-close').addEventListener('click', () => {
      Sound.click();
      $('#settings-panel').hidden = true;
    });

    $('#btn-reset').addEventListener('click', () => {
      Sound.click();
      localStorage.clear();
      location.reload();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
