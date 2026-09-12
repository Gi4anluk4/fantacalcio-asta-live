# FANTACALCIO ASTA LIVE — PROJECT MANIFEST

## Release
- Versione: **V5.7.1 · 8 TEAM**
- Derivata da: **V5.7.0 UI/UX Responsive**
- Scopo di questa release: creare una variante per **8 partecipanti**, mantenendo invariato tutto il resto dell'applicazione.

## Regole della lega di questa build
- Partecipanti: **8**
- Crediti iniziali per squadra: **500**
- Modificatore difesa: **NO**
- Bonus clean sheet portiere: **+1**
- Slot applicativi: **P 2 / D 8 / C 8 / A 6**
- Modalità attuale: asta random per ruolo.

## Principio di questa release
Questa versione NON ricalibra il database tecnico/economico per una lega a 8. Mantiene integralmente i dati giocatore della V5.7.0/V5.6.8 e cambia esclusivamente il numero dei partecipanti da 10 a 8 nelle strutture applicative e cloud necessarie.

Il motore LIVE già usa `state.managers.length` in diversi calcoli di liquidità, domanda e scarsità; pertanto reagisce naturalmente al numero di partecipanti effettivi. I valori BASE `AFFARE / IDEALE / MAX` restano invece quelli della baseline precedente, perché questa release è stata richiesta come variante 8-team senza altre modifiche.

## Database giocatori
- Il file `data.js` deve essere considerato baseline protetta.
- Non ricostruire automaticamente il listone.
- Non modificare ID, nomi, squadre, ruoli, `out` o `locked` senza audit esplicito.
- Stati distinti:
  - normale acquistabile;
  - `out:true` = FUORI SERIE A, presente nel listone storico ma non più acquistabile;
  - `locked:true` = NON ASTA, in Serie A ma arrivato dopo la chiusura del listone.

## Valore tecnico vs valore economico
Tenere sempre separati:
1. valore tecnico/fantacalcistico (`F1–F5`, valutazione /100, gerarchia, bonus, posizione, rischio, analisi);
2. valore economico (`AFFARE`, `IDEALE`, `MAX`);
3. prezzo LIVE, che reagisce allo stato reale dell'asta.

## LIVE engine
Il motore LIVE è una parte protetta del progetto. Considera, tra le altre cose:
- prezzi già pagati;
- rapporto reale/base per ruolo e fascia;
- liquidità residua della lega;
- slot ancora da riempire;
- scarsità dell'offerta di qualità;
- fabbisogno personale;
- clamp e confidence per evitare di inseguire prezzi anomali.

Non modificarlo senza audit specifico.

## Schieramenti
Gli schieramenti rappresentano la **formazione tipo stagionale**, non la probabile formazione della prossima giornata. Un titolare strutturale può restare nella formazione tipo durante un infortunio; l'indisponibilità va mostrata separatamente.

## Cloud / Firebase
- Stato condiviso: assegnazioni, nomi squadre, fantapresidenti, note.
- Questa build usa array da **8** manager/presidenti.
- Mantenere la compatibilità cloud quando possibile.
- Non cambiare schema Firebase o autenticazione senza audit.

## UI/UX
La V5.7.0 ha introdotto il layout responsive desktop/tablet/mobile. Questa release non deve alterarne il comportamento, salvo il necessario adattamento logico a 8 partecipanti.

## Direzione futura
Architettura obiettivo:

`PLAYER TECHNICAL VALUE + LEAGUE CONFIGURATION + MARKET MODEL + LIVE AUCTION STATE = DYNAMIC AUCTION PRICE`

Il progetto dovrà evolvere verso leghe configurabili (6/8/10/12, budget, modificatore, bonus, slot, ecc.) tramite configurazione centralizzata, evitando algoritmi separati copiati per ogni tipo di lega.

### AI Copilot V1 pianificato
Assistente automatico read-only, senza chat e senza pulsanti rapidi durante l'asta. Dopo le assegnazioni analizza:
- rosa dell'utente;
- tutte le rose avversarie;
- crediti residui;
- slot mancanti;
- fasce e giocatori ancora disponibili;
- prezzi LIVE e stato del mercato.

Mostra al massimo **3 righe operative** con priorità/alert/target e indicazione economica. Non deve modificare direttamente asta, database o motore LIVE.

## Regole di modifica
Prima di ogni release futura:
- partire da una copia;
- preservare la versione precedente;
- fare diff dei file modificati;
- se il database non deve cambiare, verificare hash/diff di `data.js`;
- eseguire controlli sintattici JS;
- verificare assegnazione, annullamento, crediti, slot, cloud, ricerca, filtri, schieramenti e responsive;
- aggiornare versione e cache coerentemente.

## File principali
- `index.html` — struttura UI
- `style.css` — responsive/UI
- `app.js` — stato locale, asta, LIVE engine, rendering
- `cloud.js` — Firebase/cloud e gestione leghe
- `data.js` — database giocatori protetto
- `lineups.js` — formazioni tipo
- `sw.js` — cache/service worker
- `manifest.webmanifest` — PWA

## Nota per una futura AI che riceve questo ZIP
Prima di modificare qualsiasi cosa, ricostruire lo stato reale dai file. Questo manifest descrive intenti e vincoli, ma il codice contenuto nello ZIP è la fonte primaria dello stato tecnico della release.
