# PolyLife E1

Nuovo progetto applicativo basato sui design E1 approvati. Questo repository parte dall'interfaccia E1 e dal suo contenitore Electron; il vecchio repository PolyLife resta separato e verrà consultato per migrare, una funzione alla volta, solo i componenti necessari.

## Stato iniziale

- 1 Hub E1 e 18 sezioni approvate, identiche ai sorgenti elencati in `design/APPROVED-E1-MANIFEST.json`.
- Navigazione locale tramite un server con rotte ammesse, senza importare le vecchie pagine HTML.
- Le interazioni dei prototipi sono dimostrative: al momento non indicano che dati, AI, XP, salvataggi o archivi siano collegati.
- Impostazioni, Onboarding e Dungeon non fanno parte di questa app iniziale.
- Nessun archivio o dato personale PolyLife è incluso.

## Avvio di sviluppo

```powershell
npm install
npm run check:design
npm run dev:web
```

Per aprire la finestra Electron, dopo aver installato le dipendenze, esegui `npm start`.

## Confini del progetto

Il vecchio repository PolyLife è la fonte storica per le funzioni da recuperare; non va copiato in blocco qui. Ogni migrazione dovrà specificare il proprietario dei dati, la fonte, i comandi consentiti e la verifica di regressione. Questo repository non è ancora una versione funzionale completa né un rilascio.
