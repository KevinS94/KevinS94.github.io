# Project Baby

Een volledig lokale pixel-art browsergame in HTML, CSS en vanilla JavaScript.

## Starten

Open `index.html` in een recente browser. Er is geen installatie, server of internetverbinding nodig.

De game staat in een responsieve retro-handheld. Gebruik het D-pad om te
selecteren, `A` om te bevestigen en `B` om terug te gaan. Rechtstreeks tikken
op het spelscherm is uitgeschakeld: je speelt uitsluitend met de knoppen.

## Teksten aanpassen

Alle zichtbare speltekst staat in `dialogue.js`:

- `GAME_CONFIG` bevat de projecttitel, verwachte maand en downloadpercentage.
- `CHARACTERS` bevat namen, stats, kleuren en special abilities.
- `GAME_TEXT` bevat alle menu's, dialogen, quests, reacties en finaleteksten.

Wijzig alleen de tekst tussen aanhalingstekens. Laat objectnamen zoals `quest1`, `line1` en `finalReveal` staan.

## Bestanden

- `index.html` bevat de handheld-behuizing en fysieke besturing.
- `game-screen.html` bevat uitsluitend de containers van het spelscherm.
- `handheld.js` verbindt D-pad, A, B en toetsenbord met de game.
- `style.css` bevat de pixel-art vormgeving en animaties.
- `dialogue.js` bevat alle zichtbare tekst en personagegegevens.
- `game.js` bevat de scene manager, mini-games, audio en opslag.
- `assets/` bevat alle achtergronden en losse sprites.
- `sounds/` bevat originele eenvoudige retro-effecten en menumuziek.

De voortgang wordt lokaal in de browser opgeslagen. Via **INSTELLINGEN → OPSLAG WISSEN** kan die opslag verwijderd worden.
