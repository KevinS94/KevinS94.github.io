/*
 * PROJECT BABY — CENTRAAL TEKSTBESTAND
 * -------------------------------------
 * Alle tekst die de speler kan zien staat in dit bestand.
 * Pas hier namen, datum, statistieken en dialogen aan.
 * game.js bevat uitsluitend spelgedrag en leest alles uit deze objecten.
 */

// ================================
// ALGEMENE CONFIGURATIE
// ================================

const GAME_CONFIG = {
  projectTitle: "PROJECT BABY",
  browserTitle: "Project Baby",
  babyArrival: "NOVEMBER 2026",
  downloadPercentage: 72,
  saveKey: "project-baby-save-v1",
  initialBossHP: 100
};

// ================================
// PERSONAGES
// ================================

const CHARACTERS = {
  robin: {
    name: "ROBIN",
    classLabel: "Klasse",
    className: "Legendarische Nonkel",
    portrait: "assets/character-robin.webp",
    theme: "blue",
    stats: [
      { label: "Kracht", value: "★★★★☆" },
      { label: "Humor", value: "★★★★★" },
      { label: "Geduld", value: "★★★☆☆" },
      { label: "Baby-skills", value: "???" },
      { label: "Betrouwbaarheid", value: "★★★★★" }
    ],
    abilityName: "NONKEL MODE",
    abilityDescription: "+50% plezier wanneer de ouders niet kijken."
  },
  dieter: {
    name: "DIETER",
    classLabel: "Klasse",
    className: "Legendarische Nonkel",
    portrait: "assets/character-dieter.webp",
    theme: "green",
    stats: [
      { label: "Kracht", value: "★★★★☆" },
      { label: "Humor", value: "★★★★★" },
      { label: "Geduld", value: "★★★☆☆" },
      { label: "Baby-skills", value: "???" },
      { label: "Betrouwbaarheid", value: "★★★★★" }
    ],
    abilityName: "NONKEL MODE",
    abilityDescription: "+50% plezier wanneer de ouders niet kijken."
  }
};

// ================================
// ALLE GAME-TEKSTEN
// ================================

const GAME_TEXT = {
  // ================================
  // HANDHELD-BESTURING
  // ================================
  handheld: {
    a: "A",
    b: "B",
    up: "Omhoog",
    down: "Omlaag",
    left: "Links",
    right: "Rechts",
    aAction: "A — bevestigen",
    bAction: "B — terug",
    hint: "D-PAD: KIEZEN  ·  A: BEVESTIGEN  ·  B: TERUG"
  },

  accessibility: {
    skipAnimation: "Animatie overslaan",
    mute: "Geluid aan- of uitzetten",
    fullscreen: "Volledig scherm aan- of uitzetten",
    close: "Venster sluiten",
    selected: "Geselecteerd",
    completed: "Voltooid",
    locked: "Vergrendeld"
  },

  common: {
    continue: "DOORGAAN",
    back: "TERUG",
    close: "SLUITEN",
    retry: "OPNIEUW",
    questComplete: "QUEST VOLTOOID",
    newQuest: "NEW QUEST",
    bossFight: "BOSS FIGHT!",
    achievementUnlocked: "ACHIEVEMENT UNLOCKED",
    gameOver: "GAME OVER",
    levelUp: "LEVEL UP",
    soundOn: "GELUID AAN",
    soundOff: "GELUID UIT",
    soundGlyphOn: "SFX",
    soundGlyphOff: "MUTE",
    fullscreenGlyph: "FULL",
    fullscreen: "VOLLEDIG SCHERM",
    exitFullscreen: "SCHERM VERLATEN",
    menu: "HOOFDMENU",
    restart: "SPEEL OPNIEUW",
    currentHero: "Held",
    progress: "Voortgang",
    percent: "%"
  },

  // ================================
  // HOOFDMENU
  // ================================
  menu: {
    title: "PROJECT BABY",
    eyebrow: "EEN NIEUW AVONTUUR WACHT",
    newGame: "NIEUW SPEL",
    loadGame: "SPEL LADEN",
    settings: "INSTELLINGEN",
    exitGame: "SPEL AFSLUITEN",
    footer: "Een kleine quest. Een groot avontuur.",
    version: "EDITIE 2026"
  },

  loadGame: {
    title: "SPEL LADEN",
    noSaveLine1: "Geen opgeslagen avontuur gevonden.",
    noSaveLine2: "Deze quest is nog niet begonnen.",
    saveFound: "Opgeslagen avontuur gevonden.",
    resume: "AVONTUUR HERVATTEN",
    discard: "NIEUW BEGINNEN",
    back: "TERUG"
  },

  settings: {
    title: "INSTELLINGEN",
    audio: "Retrogeluid",
    audioOn: "AAN",
    audioOff: "UIT",
    fullscreen: "Volledig scherm",
    fullscreenHint: "Werkt het best in volledig scherm.",
    reset: "OPSLAG WISSEN",
    resetConfirm: "Opgeslagen avontuur gewist.",
    back: "TERUG"
  },

  exit: {
    title: "TOT DE VOLGENDE QUEST",
    line1: "Een browser laat zich niet zomaar verslaan.",
    line2: "Je mag dit tabblad veilig sluiten.",
    back: "TOCH VERDER SPELEN"
  },

  // ================================
  // HELD KIEZEN
  // ================================
  characterSelect: {
    title: "KIES JE HELD",
    subtitle: "Wie begint aan Project Baby?",
    choosePrefix: "KIES",
    abilityLabel: "SPECIAL ABILITY",
    confirmPrefix: "START MET",
    back: "TERUG NAAR MENU"
  },

  // ================================
  // INTRODUCTIE
  // ================================
  intro: {
    sceneTitle: "HET BEGIN VAN DE QUEST",
    welcome: "Welkom, {name}!",
    line1: "Er komt binnenkort een nieuwe speler bij onze party...",
    line2: "Deze speler is nog aan het downloaden.",
    downloadLabel: "DOWNLOADEN",
    cradleMark: "?",
    line3: "Elke nieuwe speler heeft ervaren avonturiers nodig om hem door deze vreemde wereld te begeleiden.",
    continue: "BEKIJK DE QUESTS"
  },

  // ================================
  // WERELDKAART
  // ================================
  worldMap: {
    title: "TUTORIAL QUESTS",
    subtitle: "Voltooi de drie proeven.",
    quest1Number: "QUEST 01",
    quest1Title: "DE LEGENDARISCHE FLES",
    quest1Short: "Vind het juiste item.",
    quest2Number: "QUEST 02",
    quest2Title: "DE HEILIGE TEDDY",
    quest2Short: "Bescherm de knuffel.",
    quest3Number: "QUEST 03",
    quest3Title: "THE CRYING ONE",
    quest3Short: "Overleef de huilende baas.",
    locked: "EERST VORIGE QUEST VOLTOOIEN",
    completed: "VOLTOOID",
    start: "START QUEST",
    continue: "NAAR DE VOLGENDE PROEF"
  },

  // ================================
  // QUEST 01 — DE FLES
  // ================================
  quest1: {
    number: "QUEST 01",
    title: "DE LEGENDARISCHE FLES",
    intro: "De juiste uitrusting ligt verborgen in één van deze kisten.",
    instruction: "Kies verstandig. De baby wacht niet graag.",
    chestLabel: "KIST",
    wrongItems: [
      { name: "EEN PIEPENDE RUBBEREN EEND", response: "Nuttig in bad. Nu iets minder." },
      { name: "EEN VERDACHTE SOK", response: "Niemand weet van wie deze is." },
      { name: "DRIE KOUDE FRIETJES", response: "Een schat, maar niet de juiste." },
      { name: "EEN MINI-ZWAARD", response: "Veel te vroeg voor deze skill tree." }
    ],
    tryAgain: "Probeer een andere kist!",
    successHeadline: "LEGENDARISCH ITEM GEVONDEN!",
    itemName: "DE LEGENDARISCHE FLES",
    stat1: "+25 Troost",
    stat2: "+10 Melk",
    complete: "QUEST VOLTOOID",
    continue: "TERUG NAAR DE KAART"
  },

  // ================================
  // QUEST 02 — DE TEDDY
  // ================================
  quest2: {
    number: "QUEST 02",
    title: "BESCHERM DE HEILIGE TEDDY",
    intro: "Drie snotgroene slimes hebben het op de heilige teddy gemunt.",
    instruction: "Selecteer ze met het D-pad en schakel ze uit met A!",
    counterLabel: "SLIMES OVER",
    slimeHit: "PLOP!",
    successHeadline: "DE HEILIGE TEDDY IS GERED!",
    stat1: "+50 Comfort",
    stat2: "+100 Knuffels",
    complete: "QUEST VOLTOOID",
    continue: "TERUG NAAR DE KAART"
  },

  // ================================
  // QUEST 03 — BOSS FIGHT
  // ================================
  boss: {
    banner: "BOSS FIGHT!",
    name: "THE CRYING ONE",
    level: "LVL. ???",
    hpLabel: "HP",
    intro: "Een oorverdovende huilbui blokkeert de weg!",
    chooseAction: "Kies je actie.",
    actions: {
      feed: "VOEDEN",
      rock: "WIEGEN",
      joke: "PAPA-GRAP"
    },
    feedResponse: "SUPER EFFECTIEF!",
    feedDetail: "De honger neemt af.",
    rockResponse: "CRITICAL HIT!",
    rockDetail: "De oogjes worden zwaar.",
    jokeResponse1: "...",
    jokeResponse2: "Het was zo slecht dat de boss stopte met huilen.",
    victory: "BOSS VERSLAGEN!",
    victoryLine: "De baby stopt met huilen.",
    continue: "RESULTATEN BEKIJKEN"
  },

  // ================================
  // TUTORIAL VOLTOOID
  // ================================
  tutorialComplete: {
    title: "TUTORIAL VOLTOOID!",
    checks: [
      "Kracht getest.",
      "Moed getest.",
      "Geduld getest.",
      "Humor... twijfelachtig."
    ],
    line1: "Goed gedaan, {name}.",
    line2: "Je hebt bewezen dat je klaar bent voor de volgende stap.",
    button: "LAATSTE QUEST"
  },

  // ================================
  // LAATSTE QUEST — NOG GEEN REVEAL
  // ================================
  finalQuest: {
    eyebrow: "NEW QUEST",
    title: "NIEUWE HOOFDQUEST",
    lines: [
      "Er komt binnenkort een nieuwe avonturier onze party versterken.",
      "Een kleine avonturier die nog heel veel zal moeten leren.",
      "Hij zal vallen.",
      "Hij zal opnieuw opstaan.",
      "Hij zal heel wat avonturen beleven.",
      "En voor sommige daarvan zal hij iemand nodig hebben...",
      "...die altijd voor hem klaarstaat."
    ],
    pauseLine: "Daarom heb ik nog één belangrijke vraag.",
    continue: "DOORGAAN"
  },

  // ================================
  // FINALE REVEAL
  // ================================
  finalReveal: {
    pretitle: "LAATSTE BESLISSING",
    question: "WIL JIJ MIJN PETER ZIJN?",
    yes: "JA!",
    no: "NEE...",
    noAttempts: [
      "Zeker?",
      "Serieus?",
      "Je maakt het jezelf moeilijk.",
      "Dat antwoord bestaat eigenlijk niet."
    ],
    forcedYes: "JA, NATUURLIJK",
    hint: "Er is maar één juist antwoord."
  },

  // ================================
  // FINALE
  // ================================
  finale: {
    accepted: "QUEST GEACCEPTEERD!",
    achievement: "ACHIEVEMENT UNLOCKED",
    role: "PETER",
    roleDescription: "Legendarische rol ontgrendeld.",
    durationLabel: "Looptijd",
    duration: "LEVENSLANG",
    partyTitle: "NEW PARTY MEMBER",
    partyLine: "PLAYER 2 JOINT BINNENKORT DE PARTY",
    arrival: "NOVEMBER 2026",
    newMainQuest: "NIEUWE HOOFDQUEST GESTART",
    restart: "SPEEL OPNIEUW",
    menu: "TERUG NAAR HOOFDMENU"
  }
};

// Expliciet beschikbaar maken voor lokaal gebruik zonder modules of server.
window.GAME_CONFIG = GAME_CONFIG;
window.CHARACTERS = CHARACTERS;
window.GAME_TEXT = GAME_TEXT;
