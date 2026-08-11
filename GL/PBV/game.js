(function () {
  "use strict";

  const T = window.GAME_TEXT;
  const CONFIG = window.GAME_CONFIG;
  const HEROES = window.CHARACTERS;
  const root = document.getElementById("game-root");
  const transitionLayer = document.getElementById("transition-layer");
  const particleLayer = document.getElementById("particle-layer");

  document.title = CONFIG.browserTitle;

  // ================================
  // GAME STATE
  // ================================

  const gameState = {
    selectedCharacter: null,
    currentScene: "menu",
    quest1Complete: false,
    quest2Complete: false,
    quest3Complete: false,
    bossHP: CONFIG.initialBossHP,
    audioEnabled: true,
    quest1CorrectChest: 0,
    quest1Opened: [],
    slimesRemaining: 3,
    noAttempts: 0,
    storyComplete: false
  };

  const runtime = {
    timers: [],
    sceneLocked: false,
    modal: null,
    bossActionLocked: false,
    audioStarted: false,
    controllerTarget: null,
    controllerRefresh: 0
  };

  // ================================
  // HANDHELD-BESTURING
  // ================================

  function isControlAvailable(element) {
    if (!element || !element.isConnected || element.disabled || element.hidden) return false;
    if (element.classList.contains("is-hit") || element.classList.contains("is-open")) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }

  function controllerControls() {
    let scope = root.querySelector(".modal-backdrop");
    if (!scope) scope = root.querySelector(".reward-overlay");
    if (!scope) scope = root.querySelector(".scene");
    if (!scope) return [];

    return Array.from(scope.querySelectorAll("button"))
      .filter(isControlAvailable)
      .filter(function (button) { return !button.closest(".top-controls"); });
  }

  function controllerDefault() {
    const controls = controllerControls();
    if (!controls.length) return null;

    if (runtime.modal) return controls[0];
    if (root.querySelector(".reward-overlay")) return controls[0];
    if (gameState.currentScene === "worldMap") {
      return controls.find(function (button) {
        return button.classList.contains("map-node") && !button.classList.contains("is-complete");
      }) || controls.find(function (button) { return button.classList.contains("map-node"); }) || controls[0];
    }

    const preferredSelectors = {
      menu: '[data-menu="new"]',
      characterSelect: ".character-card.is-selected, .character-card",
      intro: '[data-action="intro-continue"]',
      worldMap: ".map-node:not(:disabled)",
      quest1: ".chest-button:not(.is-open)",
      quest2: ".slime-button:not(.is-hit)",
      boss: '[data-boss-action], [data-action="boss-done"]',
      tutorialComplete: '[data-action="last-quest"]',
      finalQuest: '[data-action="reveal"]',
      finalReveal: '[data-answer="yes"]',
      finale: '[data-action="restart"]'
    };
    const preferred = root.querySelector(preferredSelectors[gameState.currentScene] || "");
    return isControlAvailable(preferred) ? preferred : controls[0];
  }

  function controllerFocus(element) {
    if (!isControlAvailable(element)) return;
    root.querySelectorAll(".controller-focus").forEach(function (item) {
      item.classList.remove("controller-focus");
    });
    runtime.controllerTarget = element;
    element.classList.add("controller-focus");
  }

  function controllerEnsureFocus(force) {
    const controls = controllerControls();
    if (!force && isControlAvailable(runtime.controllerTarget) && controls.includes(runtime.controllerTarget)) return;
    controllerFocus(controllerDefault());
  }

  function scheduleControllerFocus(force) {
    window.cancelAnimationFrame(runtime.controllerRefresh);
    runtime.controllerRefresh = window.requestAnimationFrame(function () {
      controllerEnsureFocus(Boolean(force));
    });
  }

  function controllerMove(direction) {
    const controls = controllerControls();
    if (!controls.length) return;
    controllerEnsureFocus(false);
    const current = runtime.controllerTarget;
    if (!current || !controls.includes(current)) {
      controllerFocus(controls[0]);
      return;
    }

    const currentRect = current.getBoundingClientRect();
    const origin = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };
    const vertical = direction === "up" || direction === "down";
    const positive = direction === "down" || direction === "right";
    let best = null;
    let bestScore = Infinity;

    controls.forEach(function (candidate) {
      if (candidate === current) return;
      const rect = candidate.getBoundingClientRect();
      const point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const primaryDelta = vertical ? point.y - origin.y : point.x - origin.x;
      const crossDelta = vertical ? point.x - origin.x : point.y - origin.y;
      if ((positive && primaryDelta <= 2) || (!positive && primaryDelta >= -2)) return;
      const score = Math.abs(primaryDelta) + Math.abs(crossDelta) * 2.15;
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    });

    if (!best) {
      const wrapped = controls.filter(function (candidate) { return candidate !== current; }).sort(function (a, b) {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        const aPrimary = vertical ? aRect.top + aRect.height / 2 : aRect.left + aRect.width / 2;
        const bPrimary = vertical ? bRect.top + bRect.height / 2 : bRect.left + bRect.width / 2;
        return positive ? aPrimary - bPrimary : bPrimary - aPrimary;
      });
      best = wrapped[0] || current;
    }

    controllerFocus(best);
    playSound("select");
  }

  function controllerConfirm() {
    startMusic();
    if (gameState.currentScene === "finalQuest" && !gameState.storyComplete) {
      completeStoryImmediately({ target: root });
      scheduleControllerFocus(true);
      return;
    }

    controllerEnsureFocus(false);
    if (!isControlAvailable(runtime.controllerTarget)) return;
    runtime.controllerTarget.click();
    window.setTimeout(function () { scheduleControllerFocus(false); }, 30);
  }

  function controllerBack() {
    startMusic();
    if (runtime.modal) {
      playSound("click");
      closeModal();
      scheduleControllerFocus(true);
      return;
    }
    if (root.querySelector(".reward-overlay")) return;

    const previousScenes = {
      characterSelect: "menu",
      intro: "characterSelect",
      worldMap: "menu",
      quest1: "worldMap",
      quest2: "worldMap",
      boss: "worldMap",
      tutorialComplete: "worldMap",
      finalQuest: "tutorialComplete",
      finalReveal: "finalQuest",
      finale: "menu"
    };
    const target = previousScenes[gameState.currentScene];
    if (target) transitionTo(target);
  }

  function receiveHandheldInput(input) {
    if (runtime.sceneLocked) return;
    if (input === "up" || input === "down" || input === "left" || input === "right") {
      controllerMove(input);
    } else if (input === "a") {
      controllerConfirm();
    } else if (input === "b") {
      controllerBack();
    }
  }

  // ================================
  // AUDIO
  // ================================

  const sounds = {
    music: makeAudio("sounds/menu.mp3", true, 0.22),
    click: makeAudio("sounds/click.wav", false, 0.45),
    complete: makeAudio("sounds/quest-complete.wav", false, 0.6),
    hit: makeAudio("sounds/boss-hit.wav", false, 0.62),
    victory: makeAudio("sounds/victory.wav", false, 0.7),
    select: makeAudio("sounds/select.wav", false, 0.5),
    slime: makeAudio("sounds/slime.wav", false, 0.55)
  };

  function makeAudio(path, loop, volume) {
    const audio = new Audio(path);
    audio.preload = "auto";
    audio.loop = loop;
    audio.volume = volume;
    return audio;
  }

  function playSound(name) {
    if (!gameState.audioEnabled || !sounds[name]) return;
    try {
      if (name !== "music") sounds[name].currentTime = 0;
      const promise = sounds[name].play();
      if (promise && typeof promise.catch === "function") promise.catch(function () {});
    } catch (_error) {
      // Audio is optional: gameplay continues when a browser blocks playback.
    }
  }

  function startMusic() {
    if (runtime.audioStarted || !gameState.audioEnabled) return;
    runtime.audioStarted = true;
    playSound("music");
  }

  function setAudio(enabled) {
    gameState.audioEnabled = enabled;
    if (enabled) {
      runtime.audioStarted = false;
      startMusic();
    } else {
      Object.keys(sounds).forEach(function (key) { sounds[key].pause(); });
    }
    saveProgress();
    renderScene();
  }

  // ================================
  // GENERIEKE HELPERS
  // ================================

  function escapeHTML(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function format(template, values) {
    return String(template).replace(/\{(\w+)\}/g, function (_match, key) {
      return Object.prototype.hasOwnProperty.call(values, key) ? values[key] : _match;
    });
  }

  function hero() {
    return HEROES[gameState.selectedCharacter] || HEROES.robin;
  }

  function sceneShell(sceneClass, content, includeControls) {
    const controls = includeControls === false ? "" : topControls();
    return '<div class="game-shell" id="game-shell">' +
      '<section class="scene ' + sceneClass + '">' + controls + content + '</section>' +
      '</div>';
  }

  function topControls() {
    const soundText = gameState.audioEnabled ? T.common.soundGlyphOn : T.common.soundGlyphOff;
    const soundTitle = gameState.audioEnabled ? T.common.soundOff : T.common.soundOn;
    return '<nav class="top-controls">' +
      '<button class="icon-button" data-action="toggle-audio" aria-label="' + escapeHTML(T.accessibility.mute) + '" title="' + escapeHTML(soundTitle) + '">' + escapeHTML(soundText) + '</button>' +
      '<button class="icon-button" data-action="fullscreen" aria-label="' + escapeHTML(T.accessibility.fullscreen) + '" title="' + escapeHTML(T.common.fullscreen) + '">' + escapeHTML(T.common.fullscreenGlyph) + '</button>' +
      '</nav>';
  }

  function clearTimers() {
    runtime.timers.forEach(function (timer) { window.clearTimeout(timer); });
    runtime.timers = [];
  }

  function later(callback, delay) {
    const timer = window.setTimeout(callback, delay);
    runtime.timers.push(timer);
    return timer;
  }

  function bindGlobalControls() {
    const audioButton = root.querySelector('[data-action="toggle-audio"]');
    if (audioButton) audioButton.addEventListener("click", function () { playSound("click"); setAudio(!gameState.audioEnabled); });

    const fullscreenButton = root.querySelector('[data-action="fullscreen"]');
    if (fullscreenButton) fullscreenButton.addEventListener("click", toggleFullscreen);
  }

  function toggleFullscreen() {
    playSound("click");
    const element = document.documentElement;
    if (!document.fullscreenElement && element.requestFullscreen) {
      element.requestFullscreen().catch(function () {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  function transitionTo(sceneName) {
    if (runtime.sceneLocked) return;
    runtime.sceneLocked = true;
    playSound("click");
    transitionLayer.classList.remove("is-wiping");
    void transitionLayer.offsetWidth;
    transitionLayer.classList.add("is-wiping");
    window.setTimeout(function () {
      gameState.currentScene = sceneName;
      saveProgress();
      renderScene();
    }, 275);
    window.setTimeout(function () {
      transitionLayer.classList.remove("is-wiping");
      runtime.sceneLocked = false;
    }, 620);
  }

  function shakeScreen() {
    const shell = document.getElementById("game-shell");
    if (!shell) return;
    shell.classList.remove("screen-shake");
    void shell.offsetWidth;
    shell.classList.add("screen-shake");
  }

  function hitFlash() {
    const shell = document.getElementById("game-shell");
    if (!shell) return;
    shell.classList.add("hit-flash");
    later(function () { shell.classList.remove("hit-flash"); }, 300);
  }

  function spawnParticles(count, mode) {
    const colors = ["", "red", "blue", "green", "cream"];
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement("i");
      particle.className = "particle " + colors[index % colors.length];
      particle.style.left = (Math.random() * 100) + "vw";
      particle.style.top = mode === "burst" ? (38 + Math.random() * 25) + "vh" : (-5 - Math.random() * 20) + "vh";
      particle.style.setProperty("--duration", (900 + Math.random() * 1600) + "ms");
      particle.style.setProperty("--drift", ((Math.random() - 0.5) * 190) + "px");
      particleLayer.appendChild(particle);
      later(function () { particle.remove(); }, 2700);
    }
  }

  function saveProgress() {
    try {
      const data = {
        selectedCharacter: gameState.selectedCharacter,
        currentScene: gameState.currentScene,
        quest1Complete: gameState.quest1Complete,
        quest2Complete: gameState.quest2Complete,
        quest3Complete: gameState.quest3Complete,
        bossHP: gameState.bossHP,
        audioEnabled: gameState.audioEnabled
      };
      localStorage.setItem(CONFIG.saveKey, JSON.stringify(data));
    } catch (_error) {}
  }

  function readSave() {
    try {
      const raw = localStorage.getItem(CONFIG.saveKey);
      return raw ? JSON.parse(raw) : null;
    } catch (_error) {
      return null;
    }
  }

  function restoreSave(data) {
    if (!data) return;
    gameState.selectedCharacter = data.selectedCharacter || null;
    gameState.currentScene = data.currentScene || "menu";
    gameState.quest1Complete = Boolean(data.quest1Complete);
    gameState.quest2Complete = Boolean(data.quest2Complete);
    gameState.quest3Complete = Boolean(data.quest3Complete);
    gameState.bossHP = Number.isFinite(data.bossHP) ? data.bossHP : CONFIG.initialBossHP;
    gameState.audioEnabled = data.audioEnabled !== false;
    if (!gameState.selectedCharacter && gameState.currentScene !== "menu" && gameState.currentScene !== "characterSelect") {
      gameState.currentScene = "characterSelect";
    }
  }

  function resetGame(clearSave) {
    clearTimers();
    const audioEnabled = gameState.audioEnabled;
    Object.assign(gameState, {
      selectedCharacter: null,
      currentScene: "menu",
      quest1Complete: false,
      quest2Complete: false,
      quest3Complete: false,
      bossHP: CONFIG.initialBossHP,
      audioEnabled: audioEnabled,
      quest1CorrectChest: 0,
      quest1Opened: [],
      slimesRemaining: 3,
      noAttempts: 0,
      storyComplete: false
    });
    if (clearSave) {
      try { localStorage.removeItem(CONFIG.saveKey); } catch (_error) {}
    }
    renderScene();
  }

  // ================================
  // SCENE MANAGER
  // ================================

  function renderScene() {
    clearTimers();
    runtime.modal = null;
    runtime.bossActionLocked = false;

    switch (gameState.currentScene) {
      case "characterSelect": renderCharacterSelect(); break;
      case "intro": renderIntro(); break;
      case "worldMap": renderWorldMap(); break;
      case "quest1": renderQuest1(); break;
      case "quest2": renderQuest2(); break;
      case "boss": renderBoss(); break;
      case "tutorialComplete": renderTutorialComplete(); break;
      case "finalQuest": renderFinalQuest(); break;
      case "finalReveal": renderFinalReveal(); break;
      case "finale": renderFinale(); break;
      case "menu":
      default: renderMenu(); break;
    }

    bindGlobalControls();
    runtime.controllerTarget = null;
    scheduleControllerFocus(true);
  }

  // ================================
  // HOOFDMENU EN MODALS
  // ================================

  function renderMenu() {
    const menu = '<div class="menu-logo wood-panel">' +
      '<p class="menu-eyebrow">' + escapeHTML(T.menu.eyebrow) + '</p>' +
      '<h1 class="menu-title">' + escapeHTML(T.menu.title) + '</h1>' +
      '</div>' +
      '<div class="menu-box wood-panel">' +
      '<button class="pixel-button is-selected" data-menu="new">' + escapeHTML(T.menu.newGame) + '</button>' +
      '<button class="pixel-button" data-menu="load">' + escapeHTML(T.menu.loadGame) + '</button>' +
      '<button class="pixel-button" data-menu="settings">' + escapeHTML(T.menu.settings) + '</button>' +
      '<button class="pixel-button" data-menu="exit">' + escapeHTML(T.menu.exitGame) + '</button>' +
      '</div>' +
      '<p class="menu-footer">' + escapeHTML(T.menu.footer) + '</p>' +
      '<span class="menu-version">' + escapeHTML(T.menu.version) + '</span>';

    root.innerHTML = sceneShell("scene-menu", menu, true);

    root.querySelector('[data-menu="new"]').addEventListener("click", function () {
      const sound = gameState.audioEnabled;
      resetGame(false);
      gameState.audioEnabled = sound;
      transitionTo("characterSelect");
    });
    root.querySelector('[data-menu="load"]').addEventListener("click", showLoadModal);
    root.querySelector('[data-menu="settings"]').addEventListener("click", showSettingsModal);
    root.querySelector('[data-menu="exit"]').addEventListener("click", showExitModal);
  }

  function openModal(content) {
    closeModal();
    const overlay = document.createElement("div");
    overlay.className = "modal-backdrop";
    overlay.innerHTML = content;
    document.getElementById("game-shell").appendChild(overlay);
    runtime.modal = overlay;
    const closeButtons = overlay.querySelectorAll('[data-modal="close"]');
    closeButtons.forEach(function (button) { button.addEventListener("click", closeModal); });
  }

  function closeModal() {
    if (runtime.modal) runtime.modal.remove();
    runtime.modal = null;
  }

  function showLoadModal() {
    playSound("click");
    const save = readSave();
    const lines = save && save.selectedCharacter
      ? '<p class="modal-line">' + escapeHTML(T.loadGame.saveFound) + '</p>'
      : '<p class="modal-line">' + escapeHTML(T.loadGame.noSaveLine1) + '</p><p class="modal-line">' + escapeHTML(T.loadGame.noSaveLine2) + '</p>';
    const action = save && save.selectedCharacter
      ? '<button class="pixel-button green small-button" data-load="resume">' + escapeHTML(T.loadGame.resume) + '</button>' +
        '<button class="pixel-button secondary small-button" data-load="discard">' + escapeHTML(T.loadGame.discard) + '</button>'
      : '';

    openModal('<section class="modal parchment-panel" role="dialog" aria-modal="true">' +
      '<h2 class="modal-title">' + escapeHTML(T.loadGame.title) + '</h2>' + lines + action +
      '<button class="pixel-button small-button" data-modal="close">' + escapeHTML(T.loadGame.back) + '</button>' +
      '</section>');

    const resume = runtime.modal.querySelector('[data-load="resume"]');
    if (resume) resume.addEventListener("click", function () { restoreSave(save); closeModal(); renderScene(); });
    const discard = runtime.modal.querySelector('[data-load="discard"]');
    if (discard) discard.addEventListener("click", function () { closeModal(); resetGame(true); transitionTo("characterSelect"); });
  }

  function showSettingsModal() {
    playSound("click");
    const stateLabel = gameState.audioEnabled ? T.settings.audioOn : T.settings.audioOff;
    openModal('<section class="modal parchment-panel" role="dialog" aria-modal="true">' +
      '<h2 class="modal-title">' + escapeHTML(T.settings.title) + '</h2>' +
      '<div class="setting-row"><span>' + escapeHTML(T.settings.audio) + '</span><button class="pixel-button small-button" data-settings="audio">' + escapeHTML(stateLabel) + '</button></div>' +
      '<div class="setting-row"><span>' + escapeHTML(T.settings.fullscreen) + '</span><button class="pixel-button small-button" data-settings="fullscreen">' + escapeHTML(T.common.fullscreen) + '</button></div>' +
      '<p class="modal-line">' + escapeHTML(T.settings.fullscreenHint) + '</p>' +
      '<button class="pixel-button red small-button" data-settings="reset">' + escapeHTML(T.settings.reset) + '</button>' +
      '<p class="modal-line" data-reset-message></p>' +
      '<button class="pixel-button small-button" data-modal="close">' + escapeHTML(T.settings.back) + '</button>' +
      '</section>');

    runtime.modal.querySelector('[data-settings="audio"]').addEventListener("click", function () {
      gameState.audioEnabled = !gameState.audioEnabled;
      if (gameState.audioEnabled) { runtime.audioStarted = false; startMusic(); }
      else Object.keys(sounds).forEach(function (key) { sounds[key].pause(); });
      this.textContent = gameState.audioEnabled ? T.settings.audioOn : T.settings.audioOff;
      saveProgress();
    });
    runtime.modal.querySelector('[data-settings="fullscreen"]').addEventListener("click", toggleFullscreen);
    runtime.modal.querySelector('[data-settings="reset"]').addEventListener("click", function () {
      try { localStorage.removeItem(CONFIG.saveKey); } catch (_error) {}
      runtime.modal.querySelector('[data-reset-message]').textContent = T.settings.resetConfirm;
      playSound("complete");
    });
  }

  function showExitModal() {
    playSound("click");
    openModal('<section class="modal parchment-panel" role="dialog" aria-modal="true">' +
      '<h2 class="modal-title">' + escapeHTML(T.exit.title) + '</h2>' +
      '<p class="modal-line">' + escapeHTML(T.exit.line1) + '</p>' +
      '<p class="modal-line">' + escapeHTML(T.exit.line2) + '</p>' +
      '<button class="pixel-button green" data-modal="close">' + escapeHTML(T.exit.back) + '</button>' +
      '</section>');
  }

  // ================================
  // CHARACTER SELECT
  // ================================

  function characterCard(key) {
    const character = HEROES[key];
    const stats = character.stats.map(function (stat) {
      return '<li class="stat-row"><span>' + escapeHTML(stat.label) + '</span><span class="stat-value">' + escapeHTML(stat.value) + '</span></li>';
    }).join("");
    return '<button class="character-card ' + escapeHTML(character.theme) + '" data-character="' + escapeHTML(key) + '">' +
      '<h2 class="character-name">' + escapeHTML(character.name) + '</h2>' +
      '<div class="character-portrait-wrap"><img class="character-portrait" src="' + escapeHTML(character.portrait) + '" alt="' + escapeHTML(character.name) + '"></div>' +
      '<p class="class-row">' + escapeHTML(character.classLabel) + ': ' + escapeHTML(character.className) + '</p>' +
      '<ul class="stat-list">' + stats + '</ul>' +
      '<div class="ability-box"><span class="ability-name">' + escapeHTML(T.characterSelect.abilityLabel) + ': ' + escapeHTML(character.abilityName) + '</span><br>' + escapeHTML(character.abilityDescription) + '</div>' +
      '</button>';
  }

  function renderCharacterSelect() {
    const content = '<header class="character-header">' +
      '<h1 class="ribbon">' + escapeHTML(T.characterSelect.title) + '</h1>' +
      '<p class="eyebrow">' + escapeHTML(T.characterSelect.subtitle) + '</p>' +
      '</header>' +
      '<div class="character-grid">' + characterCard("robin") + characterCard("dieter") + '</div>' +
      '<div class="character-actions">' +
      '<button class="pixel-button secondary small-button" data-action="back-menu">' + escapeHTML(T.characterSelect.back) + '</button>' +
      '<button class="pixel-button green" data-action="confirm-character" hidden></button>' +
      '</div>';

    root.innerHTML = sceneShell("quest-scene", content, true);
    const cards = root.querySelectorAll(".character-card");
    const confirm = root.querySelector('[data-action="confirm-character"]');

    cards.forEach(function (card) {
      card.addEventListener("click", function () {
        gameState.selectedCharacter = card.dataset.character;
        cards.forEach(function (item) { item.classList.toggle("is-selected", item === card); });
        confirm.hidden = false;
        confirm.textContent = T.characterSelect.confirmPrefix + " " + hero().name;
        playSound("select");
      });
    });

    confirm.addEventListener("click", function () { saveProgress(); transitionTo("intro"); });
    root.querySelector('[data-action="back-menu"]').addEventListener("click", function () { transitionTo("menu"); });
  }

  // ================================
  // INTRO
  // ================================

  function renderIntro() {
    const name = hero().name;
    const content = '<p class="eyebrow">' + escapeHTML(T.intro.sceneTitle) + '</p>' +
      '<div class="intro-layout">' +
      '<div class="intro-art"><img class="wizard-sprite" src="assets/wizard.webp" alt=""><span class="cradle-mark">' + escapeHTML(T.intro.cradleMark) + '</span></div>' +
      '<div class="dialogue-stack">' +
      '<article class="dialogue-box parchment-panel"><h2>' + escapeHTML(format(T.intro.welcome, { name: name })) + '</h2><p>' + escapeHTML(T.intro.line1) + '</p><p>' + escapeHTML(T.intro.line2) + '</p></article>' +
      '<article class="download-box parchment-panel"><div class="download-labels"><span>' + escapeHTML(T.intro.downloadLabel) + '</span><span>' + CONFIG.downloadPercentage + escapeHTML(T.common.percent) + '</span></div><div class="progress-track"><div class="progress-fill" style="width:' + CONFIG.downloadPercentage + '%"></div></div></article>' +
      '<article class="dialogue-box parchment-panel"><p>' + escapeHTML(T.intro.line3) + '</p><button class="pixel-button green" data-action="intro-continue">' + escapeHTML(T.intro.continue) + '</button></article>' +
      '</div></div>';

    root.innerHTML = sceneShell("scene-intro", content, true);
    root.querySelector('[data-action="intro-continue"]').addEventListener("click", function () { transitionTo("worldMap"); });
  }

  // ================================
  // WERELDKAART
  // ================================

  function currentMapPosition() {
    if (gameState.quest3Complete) return 3;
    if (gameState.quest2Complete) return 2;
    if (gameState.quest1Complete) return 1;
    return 0;
  }

  function mapNode(number, title, description, target, complete, locked) {
    const status = complete ? T.worldMap.completed : locked ? T.worldMap.locked : T.worldMap.start;
    const stateClass = complete ? " is-complete" : locked ? " is-locked" : "";
    return '<button class="map-node' + stateClass + '" data-target="' + target + '"' + (locked ? ' disabled' : '') + '>' +
      '<span><span class="map-number">' + escapeHTML(number) + '</span><span class="map-title">' + escapeHTML(title) + '</span><span class="map-desc">' + escapeHTML(description) + '</span><span class="map-status">' + escapeHTML(status) + '</span></span>' +
      '</button>';
  }

  function renderWorldMap() {
    const content = '<header class="map-heading"><h1 class="ribbon">' + escapeHTML(T.worldMap.title) + '</h1><p class="body-copy">' + escapeHTML(T.worldMap.subtitle) + '</p></header>' +
      mapNode(T.worldMap.quest1Number, T.worldMap.quest1Title, T.worldMap.quest1Short, "quest1", gameState.quest1Complete, false) +
      mapNode(T.worldMap.quest2Number, T.worldMap.quest2Title, T.worldMap.quest2Short, "quest2", gameState.quest2Complete, !gameState.quest1Complete) +
      mapNode(T.worldMap.quest3Number, T.worldMap.quest3Title, T.worldMap.quest3Short, "boss", gameState.quest3Complete, !gameState.quest2Complete) +
      '<img class="map-hero position-' + currentMapPosition() + '" src="' + escapeHTML(hero().portrait) + '" alt="' + escapeHTML(hero().name) + '">';

    root.innerHTML = sceneShell("scene-map", content, true);
    root.querySelectorAll(".map-node:not(:disabled)").forEach(function (node) {
      node.addEventListener("click", function () {
        const target = node.dataset.target;
        if (target === "quest1" && gameState.quest1Complete) return showCompletedQuest(1);
        if (target === "quest2" && gameState.quest2Complete) return showCompletedQuest(2);
        if (target === "boss" && gameState.quest3Complete) return transitionTo("tutorialComplete");
        transitionTo(target);
      });
    });
  }

  function showCompletedQuest(number) {
    playSound("select");
    const data = number === 1 ? T.quest1 : T.quest2;
    openModal('<section class="modal parchment-panel" role="dialog" aria-modal="true">' +
      '<h2 class="modal-title">' + escapeHTML(data.complete) + '</h2>' +
      '<p class="modal-line">' + escapeHTML(data.title) + '</p>' +
      '<button class="pixel-button small-button" data-modal="close">' + escapeHTML(T.common.close) + '</button>' +
      '</section>');
  }

  // ================================
  // QUEST 01
  // ================================

  function renderQuest1() {
    gameState.quest1CorrectChest = Math.floor(Math.random() * 3);
    gameState.quest1Opened = [];
    const chests = [0, 1, 2].map(function (index) {
      return '<button class="chest-button" data-chest="' + index + '" aria-label="' + escapeHTML(T.quest1.chestLabel + " " + (index + 1)) + '">' +
        '<img src="assets/chest.webp" alt=""><span class="chest-label">' + escapeHTML(T.quest1.chestLabel) + ' ' + (index + 1) + '</span></button>';
    }).join("");
    const content = '<header class="quest-header"><p class="quest-number">' + escapeHTML(T.quest1.number) + '</p><h1 class="ribbon">' + escapeHTML(T.quest1.title) + '</h1></header>' +
      '<div class="quest-instruction"><p class="body-copy">' + escapeHTML(T.quest1.intro) + '</p><p class="body-copy">' + escapeHTML(T.quest1.instruction) + '</p></div>' +
      '<div class="chest-grid">' + chests + '</div>';
    root.innerHTML = sceneShell("quest-scene", content, true);
    root.querySelectorAll(".chest-button").forEach(function (button) {
      button.addEventListener("click", function () { openChest(Number(button.dataset.chest), button); });
    });
  }

  function openChest(index, button) {
    if (gameState.quest1Opened.includes(index)) return;
    gameState.quest1Opened.push(index);
    button.classList.add("is-open");
    playSound("select");

    if (index === gameState.quest1CorrectChest) {
      later(showQuest1Reward, 420);
      return;
    }

    const wrong = T.quest1.wrongItems[(index + gameState.quest1CorrectChest) % T.quest1.wrongItems.length];
    const oldToast = root.querySelector(".quest-toast");
    if (oldToast) oldToast.remove();
    const toast = document.createElement("article");
    toast.className = "quest-toast parchment-panel";
    toast.innerHTML = '<h3>' + escapeHTML(wrong.name) + '</h3><p>' + escapeHTML(wrong.response) + '</p><p>' + escapeHTML(T.quest1.tryAgain) + '</p>';
    root.querySelector(".scene").appendChild(toast);
  }

  function showQuest1Reward() {
    gameState.quest1Complete = true;
    saveProgress();
    playSound("complete");
    spawnParticles(38, "burst");
    const overlay = document.createElement("div");
    overlay.className = "reward-overlay";
    overlay.innerHTML = '<article class="reward-card parchment-panel">' +
      '<h2>' + escapeHTML(T.quest1.successHeadline) + '</h2>' +
      '<img class="reward-icon" src="assets/bottle.webp" alt="">' +
      '<div class="reward-name">' + escapeHTML(T.quest1.itemName) + '</div>' +
      '<div class="reward-stats"><span>' + escapeHTML(T.quest1.stat1) + '</span><span>' + escapeHTML(T.quest1.stat2) + '</span></div>' +
      '<p class="eyebrow">' + escapeHTML(T.quest1.complete) + '</p>' +
      '<button class="pixel-button green" data-action="quest1-done">' + escapeHTML(T.quest1.continue) + '</button>' +
      '</article>';
    root.querySelector(".scene").appendChild(overlay);
    overlay.querySelector('[data-action="quest1-done"]').addEventListener("click", function () { transitionTo("worldMap"); });
  }

  // ================================
  // QUEST 02
  // ================================

  function renderQuest2() {
    gameState.slimesRemaining = 3;
    const slimes = [1, 2, 3].map(function (position) {
      return '<button class="slime-button pos-' + position + '" data-slime="' + position + '" aria-label="' + escapeHTML(T.quest2.title) + '"><img src="assets/slime.webp" alt=""></button>';
    }).join("");
    const content = '<header class="quest-header"><p class="quest-number">' + escapeHTML(T.quest2.number) + '</p><h1 class="ribbon">' + escapeHTML(T.quest2.title) + '</h1></header>' +
      '<div class="quest-instruction"><p class="body-copy">' + escapeHTML(T.quest2.intro) + '</p><p class="body-copy">' + escapeHTML(T.quest2.instruction) + '</p></div>' +
      '<div class="teddy-arena"><img class="teddy-sprite" src="assets/teddy.webp" alt=""><div class="slime-counter"><span>' + escapeHTML(T.quest2.counterLabel) + '</span>: <strong data-slime-count>3</strong></div>' + slimes + '</div>';

    root.innerHTML = sceneShell("quest-scene", content, true);
    root.querySelectorAll(".slime-button").forEach(function (button) {
      button.addEventListener("click", function () { hitSlime(button); });
    });
  }

  function hitSlime(button) {
    if (button.classList.contains("is-hit")) return;
    button.classList.add("is-hit");
    gameState.slimesRemaining -= 1;
    root.querySelector('[data-slime-count]').textContent = gameState.slimesRemaining;
    playSound("slime");
    shakeScreen();
    if (gameState.slimesRemaining === 0) later(showQuest2Reward, 430);
  }

  function showQuest2Reward() {
    gameState.quest2Complete = true;
    saveProgress();
    playSound("complete");
    spawnParticles(46, "burst");
    const overlay = document.createElement("div");
    overlay.className = "reward-overlay";
    overlay.innerHTML = '<article class="reward-card parchment-panel">' +
      '<h2>' + escapeHTML(T.quest2.successHeadline) + '</h2>' +
      '<img class="reward-icon" src="assets/teddy.webp" alt="">' +
      '<div class="reward-stats"><span>' + escapeHTML(T.quest2.stat1) + '</span><span>' + escapeHTML(T.quest2.stat2) + '</span></div>' +
      '<p class="eyebrow">' + escapeHTML(T.quest2.complete) + '</p>' +
      '<button class="pixel-button green" data-action="quest2-done">' + escapeHTML(T.quest2.continue) + '</button>' +
      '</article>';
    root.querySelector(".scene").appendChild(overlay);
    overlay.querySelector('[data-action="quest2-done"]').addEventListener("click", function () { transitionTo("worldMap"); });
  }

  // ================================
  // BOSS FIGHT
  // ================================

  function renderBoss() {
    if (gameState.quest3Complete) gameState.bossHP = 0;
    if (gameState.bossHP <= 0 && !gameState.quest3Complete) gameState.bossHP = CONFIG.initialBossHP;
    const content = '<div class="boss-layout">' +
      '<header class="boss-heading"><h1 class="ribbon">' + escapeHTML(T.boss.banner) + '</h1><h2 class="boss-name">' + escapeHTML(T.boss.name) + '</h2><span class="boss-level">' + escapeHTML(T.boss.level) + '</span></header>' +
      '<div class="boss-arena"><img class="boss-sprite" src="assets/boss-baby.webp" alt=""></div>' +
      '<div class="boss-hud"><span class="hp-label">' + escapeHTML(T.boss.hpLabel) + '</span><div class="hp-track"><div class="hp-fill" style="width:' + gameState.bossHP + '%"></div></div></div>' +
      '<div class="boss-feedback" aria-live="polite"><span data-boss-feedback>' + escapeHTML(gameState.quest3Complete ? T.boss.victory : T.boss.chooseAction) + '</span></div>' +
      '<div class="boss-actions">' +
      '<button class="pixel-button" data-boss-action="feed">' + escapeHTML(T.boss.actions.feed) + '</button>' +
      '<button class="pixel-button green" data-boss-action="rock">' + escapeHTML(T.boss.actions.rock) + '</button>' +
      '<button class="pixel-button red" data-boss-action="joke">' + escapeHTML(T.boss.actions.joke) + '</button>' +
      '</div></div>';

    root.innerHTML = sceneShell("scene-boss", content, true);
    if (gameState.quest3Complete) {
      showBossVictoryButton();
    } else {
      root.querySelectorAll('[data-boss-action]').forEach(function (button) {
        button.addEventListener("click", function () { bossAction(button.dataset.bossAction); });
      });
    }
  }

  function bossAction(action) {
    if (runtime.bossActionLocked || gameState.bossHP <= 0) return;
    runtime.bossActionLocked = true;
    const feedback = root.querySelector('[data-boss-feedback]');
    const sprite = root.querySelector(".boss-sprite");
    let damage = 0;
    let headline = "";
    let detail = "";

    if (action === "feed") {
      damage = 35;
      headline = T.boss.feedResponse;
      detail = T.boss.feedDetail;
    } else if (action === "rock") {
      damage = 40;
      headline = T.boss.rockResponse;
      detail = T.boss.rockDetail;
    } else {
      damage = 100;
      headline = T.boss.jokeResponse1;
      detail = T.boss.jokeResponse2;
    }

    gameState.bossHP = Math.max(0, gameState.bossHP - damage);
    root.querySelector(".hp-fill").style.width = gameState.bossHP + "%";
    feedback.innerHTML = escapeHTML(headline) + '<small>' + escapeHTML(detail) + '</small>';
    sprite.classList.remove("is-hit");
    void sprite.offsetWidth;
    sprite.classList.add("is-hit");
    playSound("hit");
    shakeScreen();
    hitFlash();

    later(function () {
      sprite.classList.remove("is-hit");
      runtime.bossActionLocked = false;
      if (gameState.bossHP <= 0) finishBoss();
    }, action === "joke" ? 950 : 650);
  }

  function finishBoss() {
    gameState.quest3Complete = true;
    saveProgress();
    const feedback = root.querySelector('[data-boss-feedback]');
    feedback.innerHTML = escapeHTML(T.boss.victory) + '<small>' + escapeHTML(T.boss.victoryLine) + '</small>';
    root.querySelector(".boss-sprite").classList.add("is-defeated");
    playSound("victory");
    spawnParticles(60, "burst");
    showBossVictoryButton();
  }

  function showBossVictoryButton() {
    const actions = root.querySelector(".boss-actions");
    actions.innerHTML = '<button class="pixel-button green" data-action="boss-done">' + escapeHTML(T.boss.continue) + '</button>';
    actions.style.gridTemplateColumns = "1fr";
    actions.querySelector("button").addEventListener("click", function () { transitionTo("tutorialComplete"); });
  }

  // ================================
  // TUTORIAL VOLTOOID
  // ================================

  function renderTutorialComplete() {
    const checks = T.tutorialComplete.checks.map(function (line) {
      return '<li><span class="check-icon" aria-hidden="true"></span><span>' + escapeHTML(line) + '</span></li>';
    }).join("");
    const content = '<div class="tutorial-layout">' +
      '<article class="tutorial-card parchment-panel"><h1 class="ribbon">' + escapeHTML(T.tutorialComplete.title) + '</h1><ul class="check-list">' + checks + '</ul>' +
      '<div class="tutorial-lines"><p>' + escapeHTML(format(T.tutorialComplete.line1, { name: hero().name })) + '</p><p>' + escapeHTML(T.tutorialComplete.line2) + '</p></div>' +
      '<button class="pixel-button green" data-action="last-quest">' + escapeHTML(T.tutorialComplete.button) + '</button></article>' +
      '<img class="tutorial-wizard" src="assets/wizard.webp" alt=""></div>';
    root.innerHTML = sceneShell("scene-intro", content, true);
    root.querySelector('[data-action="last-quest"]').addEventListener("click", function () { transitionTo("finalQuest"); });
  }

  // ================================
  // LAATSTE QUEST
  // ================================

  function renderFinalQuest() {
    gameState.storyComplete = false;
    const lines = T.finalQuest.lines.map(function (line, index) {
      return '<p class="story-line" data-story-line="' + index + '">' + escapeHTML(line) + '</p>';
    }).join("");
    const content = '<div class="silhouette-stage"><img class="hero-silhouette" src="' + escapeHTML(hero().portrait) + '" alt=""><img class="child-silhouette" src="assets/character-baby.webp" alt=""></div>' +
      '<article class="final-quest-panel parchment-panel" data-story-panel>' +
      '<p class="eyebrow">' + escapeHTML(T.finalQuest.eyebrow) + '</p><h1 class="screen-title" style="color:var(--wood-dark);text-shadow:3px 3px var(--parchment-dark)">' + escapeHTML(T.finalQuest.title) + '</h1>' +
      '<div class="story-lines">' + lines + '</div><p class="story-pause" data-story-pause>' + escapeHTML(T.finalQuest.pauseLine) + '</p>' +
      '<button class="pixel-button green" data-action="reveal" hidden>' + escapeHTML(T.finalQuest.continue) + '</button></article>';

    root.innerHTML = sceneShell("scene-final-quest", content, true);
    const panel = root.querySelector('[data-story-panel]');
    panel.addEventListener("click", completeStoryImmediately);

    T.finalQuest.lines.forEach(function (_line, index) {
      later(function () {
        const element = root.querySelector('[data-story-line="' + index + '"]');
        if (element) element.classList.add("is-visible");
      }, 500 + index * 940);
    });

    later(function () {
      const pause = root.querySelector('[data-story-pause]');
      if (pause) pause.classList.add("is-visible");
    }, 800 + T.finalQuest.lines.length * 940);
    later(finishStory, 1850 + T.finalQuest.lines.length * 940);
  }

  function completeStoryImmediately(event) {
    if (event.target.closest("button")) return;
    root.querySelectorAll(".story-line").forEach(function (line) { line.classList.add("is-visible"); });
    const pause = root.querySelector('[data-story-pause]');
    if (pause) pause.classList.add("is-visible");
    finishStory();
  }

  function finishStory() {
    if (gameState.storyComplete) return;
    gameState.storyComplete = true;
    const button = root.querySelector('[data-action="reveal"]');
    if (button) {
      button.hidden = false;
      button.addEventListener("click", function () { transitionTo("finalReveal"); }, { once: true });
    }
  }

  // ================================
  // REVEAL
  // ================================

  function renderFinalReveal() {
    gameState.noAttempts = 0;
    const content = '<article class="reveal-card parchment-panel">' +
      '<p class="eyebrow" style="color:var(--red-dark);text-shadow:none">' + escapeHTML(T.finalReveal.pretitle) + '</p>' +
      '<h1 class="reveal-question">' + escapeHTML(T.finalReveal.question) + '</h1>' +
      '<div class="reveal-actions" data-reveal-actions>' +
      '<button class="pixel-button green" data-answer="yes">' + escapeHTML(T.finalReveal.yes) + '</button>' +
      '<button class="pixel-button secondary no-button" data-answer="no">' + escapeHTML(T.finalReveal.no) + '</button>' +
      '</div>' +
      '<p class="reveal-feedback" data-reveal-feedback></p>' +
      '<p class="reveal-hint">' + escapeHTML(T.finalReveal.hint) + '</p></article>';
    root.innerHTML = sceneShell("scene-reveal", content, true);
    root.querySelector('[data-answer="yes"]').addEventListener("click", acceptFinalQuest);
    bindNoButton();
  }

  function bindNoButton() {
    const button = root.querySelector('[data-answer="no"]');
    if (!button) return;
    button.addEventListener("mouseenter", dodgeNoButton);
    button.addEventListener("click", dodgeNoButton);
    button.addEventListener("focus", dodgeNoButton);
  }

  function dodgeNoButton(event) {
    event.preventDefault();
    const button = root.querySelector('[data-answer="no"]');
    if (!button || gameState.noAttempts >= T.finalReveal.noAttempts.length) return;
    const positions = [
      { left: "5%", top: "5%" },
      { left: "64%", top: "55%" },
      { left: "10%", top: "58%" },
      { left: "58%", top: "6%" }
    ];
    const position = positions[gameState.noAttempts % positions.length];
    root.querySelector('[data-reveal-feedback]').textContent = T.finalReveal.noAttempts[gameState.noAttempts];
    button.style.right = "auto";
    button.style.left = position.left;
    button.style.top = position.top;
    gameState.noAttempts += 1;
    playSound("select");
    shakeScreen();

    if (gameState.noAttempts >= T.finalReveal.noAttempts.length) {
      later(function () {
        button.textContent = T.finalReveal.forcedYes;
        button.classList.remove("secondary", "no-button");
        button.classList.add("green");
        button.removeAttribute("style");
        button.replaceWith(button.cloneNode(true));
        root.querySelector('[data-answer="no"]').addEventListener("click", acceptFinalQuest);
      }, 330);
    }
  }

  function acceptFinalQuest() {
    playSound("victory");
    spawnParticles(120, "confetti");
    transitionTo("finale");
  }

  // ================================
  // FINALE
  // ================================

  function renderFinale() {
    const content = '<h1 class="ribbon accept-banner">' + escapeHTML(T.finale.accepted) + '</h1>' +
      '<div class="finale-layout">' +
      '<article class="achievement-card wood-panel"><span class="achievement-label">' + escapeHTML(T.finale.achievement) + '</span><img src="assets/shield.webp" alt=""><h2 class="achievement-role">' + escapeHTML(T.finale.role) + '</h2><p class="achievement-desc">' + escapeHTML(T.finale.roleDescription) + '</p><p class="achievement-duration">' + escapeHTML(T.finale.durationLabel) + ': ' + escapeHTML(T.finale.duration) + '</p></article>' +
      '<article class="party-card parchment-panel"><div class="party-sprites"><img class="party-hero" src="' + escapeHTML(hero().portrait) + '" alt="' + escapeHTML(hero().name) + '"><img class="party-baby" src="assets/character-baby.webp" alt=""></div><h2 class="party-title">' + escapeHTML(T.finale.partyTitle) + '</h2><p class="party-line">' + escapeHTML(T.finale.partyLine) + '</p><p class="arrival-line">' + escapeHTML(CONFIG.babyArrival || T.finale.arrival) + '</p><p class="main-quest-line">' + escapeHTML(T.finale.newMainQuest) + '</p></article>' +
      '</div><div class="finale-actions"><button class="pixel-button green small-button" data-action="restart">' + escapeHTML(T.finale.restart) + '</button><button class="pixel-button small-button" data-action="menu">' + escapeHTML(T.finale.menu) + '</button></div>';
    root.innerHTML = sceneShell("scene-finale", content, true);
    spawnParticles(95, "confetti");
    root.querySelector('[data-action="restart"]').addEventListener("click", function () { resetGame(true); transitionTo("characterSelect"); });
    root.querySelector('[data-action="menu"]').addEventListener("click", function () { resetGame(false); });
  }

  // ================================
  // STARTUP
  // ================================

  document.addEventListener("pointerdown", startMusic, { once: true });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && runtime.modal) closeModal();
  });

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent || !event.data || event.data.type !== "project-baby-input") return;
    receiveHandheldInput(event.data.input);
  });

  new MutationObserver(function () {
    scheduleControllerFocus(false);
  }).observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "disabled"] });

  renderScene();
})();
