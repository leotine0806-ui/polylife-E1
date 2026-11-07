/* Engineer · prototipo E1. Funzioni ricavate da src/engineer.html (dieci schede), src/domain.js (engineeringReward) e, per i confini, jarvis-index.js.
   Tutti i valori sono FITTIZI («dati di prova»), «oggi» fisso. Ogni risposta dell'assistente è un TESTO SEGNAPOSTO etichettato «Simulato · non confermato»:
   nessuna rete, nessun provider, nessuna persistenza, nessuna chiamata al prodotto. Al ricaricamento tutto torna allo stato iniziale. */
(() => {
  const TODAY = 'lun 2 nov 2026';
  const AREAS = ['Aerodinamica', 'Strutture e meccanica', 'Propulsione', 'Termodinamica applicata', 'Sistemi di controllo GNC', 'Materiali aerospaziali', 'Matematica applicata', 'Meccanica orbitale', 'Sistemi spaziali (CDL)'];
  const DIFFS = [['novice', 'Novice'], ['intermedio', 'Intermedio'], ['avanzato', 'Avanzato'], ['expert', 'Expert']];
  const KCATS = ['Aerodinamica', 'Strutture', 'Propulsione', 'Termodinamica', 'GNC', 'Materiali', 'Sistemi', 'Matematica applicata', 'Orbitale'];
  const DEPTHS = [['overview', 'Overview'], ['deep', 'Deep'], ['replica', 'Replica minimale']];
  /* Regole di ricompensa riprese da engineeringReward (src/domain.js 245–268). Sono ricompense dell'app, non misure di competenza. */
  const XP = { journal: 10, knowledgeData: 8, knowledgeBare: 0, formula: 5, reverse: 30, material: 0, milestone: 15 };
  const SIM_TXT = t => `Testo segnaposto del prototipo per «${t}»: nel prodotto qui compare la risposta dell'assistente.`;

  /* ---------- Fixture sintetiche ---------- */
  function fixture(s) {
    const base = {
      ai: true, partial: false, empty: false,
      studio: [{ id: 'st1', concept: 'Ciclo di Carnot', score: 78, xp: 25, d: 'ven 30 ott' }, { id: 'st2', concept: 'Numero di Mach', score: 55, xp: 15, d: 'mer 28 ott' }, { id: 'st3', concept: 'Momento flettente', score: 82, xp: 25, d: 'lun 26 ott' }],
      knowledge: [
        { id: 'k1', term: 'Numero di Mach', cat: 'Aerodinamica', data: { definizione: 'Rapporto tra la velocità del flusso e la velocità del suono locale.', formula: 'M = v / a' } },
        { id: 'k2', term: 'Ciclo di Brayton', cat: 'Termodinamica', data: { definizione: 'Ciclo ideale delle turbine a gas: compressione, riscaldamento a pressione costante, espansione.' } },
        { id: 'k3', term: 'Fattore di sicurezza', cat: 'Strutture', data: { definizione: 'Rapporto tra il carico che porta al cedimento e il carico di progetto.' } },
        { id: 'k4', term: 'Reaction wheel', cat: 'GNC', data: null }],
      formule: [{ id: 'f1', query: 'portanza', data: { nome: 'Portanza', simbolo: 'L = ½ ρ v² S C_L', note: 'Esempio di prova: verifica ipotesi e riferimenti.' } }, { id: 'f2', query: 'momento flettente', data: { nome: 'Tensione da flessione', simbolo: 'σ = M·y / I', note: 'Esempio di prova: verifica ipotesi e riferimenti.' } }],
      materiali: [{ id: 'm1', nome: 'Al 6061-T6', data: { nome_standard: 'Al 6061-T6', famiglia: 'Leghe di alluminio', note: 'Dato di prova: densità circa 2,7 g/cm³.' } }, { id: 'm2', nome: 'CFRP quasi-isotropo', data: { nome_standard: 'CFRP quasi-isotropo', famiglia: 'Compositi', note: 'Dato di prova: le proprietà dipendono dalla laminazione.' } }],
      reverse: [{ id: 'r1', sys: 'Reaction wheel di un CubeSat', depth: 'deep', data: { nome_completo: 'Reaction wheel di un CubeSat', descrizione: 'Scheda di prova: sottosistemi rotore, motore ed elettronica di controllo.' } }],
      projects: [
        { id: 'p1', name: 'Struttura CubeSat 1U', obj: 'Struttura primaria per un CubeSat 1U (progetto di prova).', constr: 'Ingombro e massa dichiarati dall\'utente.', reqs: ['Rispettare l\'ingombro 1U', 'Massa strutturale entro il budget'], ms: [{ id: 'ma', text: 'Definire i requisiti', done: true }, { id: 'mb', text: 'Primo modello CAD', done: false }, { id: 'mc', text: 'Verifica strutturale preliminare', done: false }, { id: 'md', text: 'Revisione dell\'impostazione', done: false }], analysis: false },
        { id: 'p2', name: 'Staffa a L', obj: 'Staffa di supporto (progetto di prova).', constr: '', reqs: ['Due fori di fissaggio'], ms: [{ id: 'me', text: 'Schizzo quotato', done: false }, { id: 'mf', text: 'Scelta del materiale', done: false }, { id: 'mg', text: 'Disegno finale', done: false }], analysis: false }],
      challenges: [{ id: 'c1', title: 'Esercizio di prova su una trave', area: 'Strutture e meccanica', diff: 'avanzato', score: 72, d: 'sab 31 ott' }, { id: 'c2', title: 'Esercizio di prova su un ugello', area: 'Propulsione', diff: 'intermedio', score: 45, d: 'gio 29 ott' }, { id: 'c3', title: 'Esercizio di prova su un\'orbita', area: 'Meccanica orbitale', diff: 'expert', score: 90, d: 'mar 27 ott' }],
      journal: [{ id: 'j1', d: 'dom 1 nov', title: 'Studio di una staffa', built: 'Schizzo quotato della staffa.', learned: 'Come leggere un diagramma dei momenti.', block: 'Dubbi sulla scelta dei fori.', next: 'Controllare il fattore di sicurezza della staffa.' }, { id: 'j2', d: 'ven 30 ott', title: 'Ripasso termodinamica', built: '', learned: 'Differenza tra Carnot e Brayton.', block: '', next: 'Rifare il confronto sul ciclo di Brayton.' }]
    };
    if (s === 'vuoto') return { ...base, empty: true, studio: [], knowledge: [], formule: [], materiali: [], reverse: [], projects: [], challenges: [], journal: [] };
    if (s === 'offline') return { ...base, ai: false };
    if (s === 'parziale') return { ...base, partial: true, projectsError: 'Formato non riconosciuto in eng_projects_v3. Originale conservato', projects: null, knowledge: base.knowledge, journal: base.journal.map((j, i) => i === 1 ? { ...j, bad: true } : j) };
    return base;
  }

  /* ---------- Stato in memoria ---------- */
  let scen = 'normale', tab = 'oggi', S = fixture(scen), msgText = '', msgTimer = null, nid = 100, lastK = null, askDel = null, ref = 'knowledge', xpSim = 0;
  const blankD = () => ({ concept: '', mia: '', note: '', cmp: null, cards: 0, kterm: '', kcat: 'Aerodinamica', kExp: null, kSel: null, fq: '', fExp: null, fSel: null, mat: '', mExp: null, mSel: null, cmpA: '', cmpB: '', cmpRes: null, reSys: '', reDepth: 'overview', reRes: null, reSel: null,
    pid: null, pname: '', pobj: '', pconstr: '', preq: '', reqs: [], ms: [], panalysis: null, peval: null, protoDesc: '', proto: null, viz: '3d',
    chArea: AREAS[0], chDiff: 'novice', ch: null, chSol: '', chRes: null, chHint: false, jt: '', jb: '', jl: '', jk: '', jn: '', jsyn: null, jsave: null });
  let D = blankD(), E = {};
  const root = document.getElementById('root'), dlg = document.getElementById('dlg');
  const K = k => ({ 'data-k': k });
  const T = (cls, t, title) => h('span', { class: 'en-tag ' + cls, ...(title ? { title } : {}) }, t);
  const REC = () => T('rec', 'Dai tuoi record'), RUL = () => T('rul', 'Regola dell\'app'), SIM = () => T('sim', 'Simulato · non confermato'), PRP = () => T('prop', 'Proposta di design'), OWN = () => T('prf', 'Appartiene ad altra sezione');
  const err = k => h('p', { class: 'en-err', role: 'alert' }, E[k] || '');
  const note = msg => { msgText = msg; const live = document.getElementById('live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 60); document.querySelectorAll('.en-status').forEach(el => { el.textContent = msg; }); clearTimeout(msgTimer); msgTimer = setTimeout(() => { msgText = ''; live.textContent = ''; document.querySelectorAll('.en-status').forEach(el => { el.textContent = ''; }); }, 5000); };
  const clearNote = () => { msgText = ''; clearTimeout(msgTimer); };
  const nav = to => note('Anteprima di navigazione verso ' + to + ' (nessuna azione).');
  const addXp = (n, what) => { xpSim += n; return `+${n} XP (simulato, non accreditato) — ${what}`; };
  const aiOff = k => { if (S.ai) return false; E[k] = 'Assistente non disponibile (simulato). Nel prodotto la richiesta non parte e il testo resta nel campo. Puoi continuare a scrivere e salvare a mano ciò che non richiede l\'assistente.'; render(); return true; };

  function render(focusK) {
    const fk = focusK === false ? null : focusK || document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    if (fk) [fk, 'tab-' + tab].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  const VIEWS = { oggi, studio, rif: riferimenti, progetti, esercizi, diario };
  const notice = () => S.partial ? 'Alcuni archivi non sono leggibili: gli originali sono conservati e non vengono sostituiti. Le sezioni interessate lo dicono e restano utilizzabili le altre.' : '';
  const build = () => [scenBar(), notice() ? h('p', { class: 'en-notice', role: 'status' }, notice()) : null, legend(), tabs(), h('p', { class: 'en-status', 'aria-hidden': 'true' }, msgText), ...VIEWS[tab]()].filter(Boolean);
  const go = t => { tab = t; askDel = null; E = {}; clearNote(); render(); };

  const SCEN = [['normale', 'Dati di prova'], ['vuoto', 'Nessun dato'], ['offline', 'Assistente non disponibile'], ['parziale', 'Dati da verificare']];
  const scenBar = () => h('details', { class: 'en-scen' }, h('summary', {}, h('span', {}, 'Scenari demo · solo prototipo'), h('b', {}, SCEN.find(x => x[0] === scen)[1])), h('div', { class: 'en-scen-o', role: 'group', 'aria-label': 'Scegli lo scenario dimostrativo' }, SCEN.map(([k, l]) => h('button', { type: 'button', class: 'en-btn', ...K('sc-' + k), 'aria-pressed': String(scen === k), onclick: () => setScen(k) }, l))));
  function setScen(k) { clearNote(); scen = k; S = fixture(k); tab = 'oggi'; D = blankD(); E = {}; askDel = null; ref = 'knowledge'; xpSim = 0; render(); }
  const legend = () => h('details', { class: 'en-leg' }, h('summary', {}, 'Come leggere le etichette: da dove viene ogni informazione'), h('div', { class: 'en-legend' }, h('span', {}, REC(), 'scritto o salvato da te'), h('span', {}, RUL(), 'calcolo fisso dell\'app'), h('span', {}, SIM(), 'testo segnaposto al posto dell\'assistente, da verificare'), h('span', {}, OWN(), 'funzione di un\'altra sezione: qui solo un collegamento')));
  const tabs = () => h('nav', { class: 'en-tabs', 'aria-label': 'Sezioni di Engineer' }, [['oggi', 'Oggi'], ['studio', 'Spiega'], ['rif', 'Riferimenti'], ['progetti', 'Progetti'], ['esercizi', 'Esercizi'], ['diario', 'Diario']].map(([k, l]) => h('button', { type: 'button', ...K('tab-' + k), ...(tab === k ? { 'aria-current': 'page' } : {}), onclick: () => go(k) }, l)));
  const ask = (what, yes) => h('div', { class: 'en-ask', role: 'alertdialog', 'aria-label': 'Conferma eliminazione' }, h('span', {}, `Eliminare ${what}?`), h('button', { class: 'en-btn dng', type: 'button', ...K('dy'), onclick: () => { yes(); askDel = null; render(); note('Eliminazione confermata (simulata, non salvata).'); } }, 'Elimina'), h('button', { class: 'en-btn', type: 'button', ...K('dn'), onclick: () => { askDel = null; render(); } }, 'Annulla'));
  const card = (id, title, tag, ...body) => h('section', { class: 'card en-card en-sec', 'aria-labelledby': id }, h('div', { class: 'en-hd' }, h('h2', { id }, title), tag || null), ...body);
  const inputF = (id, label, key, o = {}) => h('div', { class: 'en-f' }, h('label', { for: id }, label), o.area ? h('textarea', { id, placeholder: o.ph || '', oninput: e => { D[key] = e.target.value; } }, D[key]) : h('input', { id, type: 'text', placeholder: o.ph || '', value: D[key], oninput: e => { D[key] = e.target.value; } }));
  const selF = (id, label, key, opts) => h('div', { class: 'en-f' }, h('label', { for: id }, label), h('select', { id, onchange: e => { D[key] = e.target.value; } }, opts.map(o => { const [v, l] = Array.isArray(o) ? o : [o, o]; return h('option', { value: v, ...(D[key] === v ? { selected: '' } : {}) }, l); })));
  const simBox = (id, title, rows, extra) => h('div', { class: 'en-ai', role: 'region', 'aria-labelledby': id }, h('div', { class: 'en-hd' }, h('h3', { id }, title), SIM()), rows.map(([l, t]) => h('div', {}, h('b', {}, l), h('p', { class: 'en-by' }, t))), extra || null, h('p', { class: 'en-fine' }, 'Nel prodotto il contenuto è «da verificare con le fonti di studio». Qui è solo un segnaposto per mostrare dove comparirebbe.'));
  const aiData = (...fields) => h('p', { class: 'en-data-disclosure' }, h('b', {}, 'Nel prodotto, questa richiesta invierebbe: '), fields.join(' · '), h('span', {}, ' Qui è simulata: nessun invio.'));
  const empty = (msg, btn) => h('div', { class: 'en-empty' }, h('b', {}, msg), btn || null);
  const sum = (a, f) => a.reduce((x, y) => x + f(y), 0);
  const nextMs = () => { for (const p of S.projects || []) { const m = p.ms.find(x => !x.done); if (m) return { p, m }; } return null; };

  /* ---------- Oggi ---------- */
  function oggi() {
    const nm = nextMs(), jn = (S.journal || []).find(j => j.next && !j.bad), last = S.studio[0];
    const hero = h('section', { class: 'card en-card en-hero', 'aria-labelledby': 'en-h' },
      h('div', { class: 'en-hh' }, h('span', { class: 'eyebrow' }, 'Oggi · ' + TODAY), h('span', { class: 'en-pill ' + (S.ai ? 'ok' : 'wn') }, S.ai ? 'Assistente: disponibile (simulato)' : 'Assistente: non disponibile (simulato)')),
      h('h2', { class: 'en-big', id: 'en-h' }, S.empty ? 'Inizia da un concetto' : 'Riprendi da dove eri'),
      S.empty ? h('p', { class: 'en-by' }, 'Non hai ancora registrato nulla. Il primo passo più semplice è spiegare un concetto con parole tue.') : h('div', { class: 'en-list' },
        jn ? h('div', { class: 'en-row' }, h('div', { class: 'en-rl' }, h('span', { class: 'en-s' }, 'La tua prossima azione, dal Diario'), REC()), h('div', { class: 'en-t' }, jn.next)) : null,
        nm ? h('div', { class: 'en-row' }, h('div', { class: 'en-rl' }, h('span', { class: 'en-s' }, 'Prossima milestone · ' + nm.p.name), REC()), h('div', { class: 'en-t' }, nm.m.text)) : null,
        last ? h('div', { class: 'en-row' }, h('div', { class: 'en-rl' }, h('span', { class: 'en-s' }, 'Ultima sessione di studio'), REC()), h('div', { class: 'en-t' }, last.concept + (Number.isFinite(last.score) ? ' · ' + last.score + '%' : ' · non valutata'))) : null,
        !jn && !nm && !last ? h('p', { class: 'en-by' }, 'Nessun elemento da riprendere nei dati leggibili.') : null),
      h('div', { class: 'en-acts' }, h('button', { class: 'en-btn pri big', type: 'button', ...K('hero-main'), onclick: () => go('studio') }, 'Studia un concetto'), h('button', { class: 'en-btn big', type: 'button', ...K('hero-proj'), onclick: () => go('progetti') }, 'Apri i progetti'), h('button', { class: 'en-btn big', type: 'button', ...K('hero-ex'), onclick: () => go('esercizi') }, 'Fai un esercizio')),
      h('p', { class: 'en-fine' }, 'Engineer non suggerisce cosa studiare: mostra solo ciò che hai scritto tu. Nessuna valutazione di competenza.'));
    const nums = card('en-n', 'In numeri', REC(), h('div', { class: 'en-nums four' }, [[S.studio.length, 'Sessioni di studio'], [S.challenges.length, 'Esercizi svolti'], [S.knowledge.length, 'Concetti salvati'], [S.projects ? S.projects.length : 'N/D', 'Progetti salvati']].map(([n, l]) => h('div', { class: 'en-num' }, h('b', {}, n), h('small', {}, l)))),
      h('p', { class: 'en-fine' }, 'Nel prodotto la voce «Progetti» è chiamata «attivi» ma conta tutti i progetti salvati. La barra delle abilità e la mappa di attività del prodotto non sono riprodotte: vedi la consegna.'));
    const xp = h('details', { class: 'card en-card' }, h('summary', { class: 'en-sum', ...K('xp-rules') }, h('span', {}, 'Come si guadagnano gli XP'), RUL()), h('div', { class: 'en-list' }, [
      ['Sessione di studio', '25 XP da 70% in su · 15 XP da 40% · altrimenti 5 XP'], ['Esercizio', '20 XP da 70% (40 se Expert) · altrimenti punteggio ÷ 5, arrotondato'], ['Concetto', '8 XP se ha i dettagli · 0 XP senza'], ['Formula', '5 XP'], ['Report di reverse engineering', '30 XP'], ['Materiale', '0 XP'], ['Voce di diario', '10 XP'], ['Milestone di progetto', '15 XP; se la riapri la ricompensa viene stornata']].map(([a, b]) => h('div', { class: 'en-own' }, h('b', {}, a), h('span', {}, b))), h('p', { class: 'en-fine' }, 'Gli XP sono ricompense di gioco, non misure di competenza. Nel prodotto sessioni ed esercizi dipendono da una valutazione dell\'assistente; questa demo non inventa punteggi né accredita XP per output simulati.')));
    const own = h('details', { class: 'card en-card en-own-details' }, h('summary', { class: 'en-sum', ...K('data-ownership') }, h('span', {}, 'Dove finiscono i dati e a chi appartengono'), REC()), h('div', { class: 'en-own-content' }, h('div', {}, [
      ['Sessioni, concetti, formule, materiali, report, progetti, esercizi, diario', 'Archivi di Engineer'],
      ['Flashcard create da un concetto', 'Mazzo Flashcard («Engineer — concetto», «contenuto AI da verificare»): il ripasso e le scadenze sono di Flashcard'],
      ['XP e livelli', 'Profilo di gioco (Life RPG): Engineer applica solo le regole sopra'],
      ['Materie di scuola, compiti, verifiche, voti', 'Studio'], ['Piano di studio e calendario', 'Planner e Calendario'], ['Libri e letture', 'Biblioteca'],
      ['Punteggio di Engineer in Jarvis', 'Jarvis legge solo i conteggi: 3 punti per i progetti registrati, 2 per i confronti di studio']].map(([a, b]) => h('div', { class: 'en-own' }, h('b', {}, a), h('span', {}, b)))),
      h('div', { class: 'en-acts' }, h('button', { class: 'en-btn', type: 'button', ...K('go-fc'), onclick: () => nav('Flashcard') }, 'Apri Flashcard'), h('button', { class: 'en-btn', type: 'button', ...K('go-st'), onclick: () => nav('Studio') }, 'Apri Studio'), h('button', { class: 'en-btn', type: 'button', ...K('go-pl'), onclick: () => nav('Planner') }, 'Apri Planner')),
      h('p', { class: 'en-fine' }, 'Cosa viene inviato all\'assistente e a quale provider è una decisione aperta: oggi i testi dei campi partono verso l\'assistente.')));
    return [h('div', { class: 'en-cols' }, h('div', { class: 'en-sec' }, hero, nums), h('div', { class: 'en-sec' }, own, xp))];
  }

  /* ---------- Studio: spiega, confronta, salva ---------- */
  function studio() {
    const c = D.cmp, stale = c && (c.concept !== D.concept.trim() || c.mia !== D.mia.trim() || c.note !== D.note);
    const form = h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); confronta(); } },
      inputF('st-c', 'Concetto da studiare', 'concept', { ph: 'Per esempio: Ciclo di Carnot' }),
      inputF('st-m', 'La tua spiegazione', 'mia', { area: 1, ph: 'Spiega il concetto come se dovessi insegnarlo, prima di vedere la risposta.' }),
      inputF('st-n', 'Note e connessioni (facoltative)', 'note', { area: 1, ph: 'Appunti, domande aperte, collegamenti.' }),
      err('cmp'), h('div', { class: 'en-fa' }, h('button', { class: 'en-btn pri', type: 'submit', ...K('st-cmp') }, 'Confronta (simulato)'), h('button', { class: 'en-btn', type: 'button', ...K('st-save'), onclick: salvaStudio }, 'Salva la sessione'), h('button', { class: 'en-btn', type: 'button', ...K('st-fc'), onclick: flashcards }, 'Prepara 3 flashcard')),
      aiData('Confronto: concetto, spiegazione e note facoltative.', 'Flashcard: concetto e spiegazione di riferimento del confronto.'),
      h('p', { class: 'en-fine' }, 'Si salva solo dopo il confronto, e se non cambi i testi dopo averlo fatto. Le flashcard si preparano dal concetto confrontato.'));
    const res = !c ? null : h('div', { class: 'en-sec' }, simBox('st-r', 'Confronto con la spiegazione di riferimento', [['La tua spiegazione', c.mia], ['Riferimento', SIM_TXT(c.concept)], ['Esito', 'Confronto dimostrativo, non è una valutazione. Il prototipo non calcola un punteggio.']], h('p', { class: 'en-by' }, 'XP: non calcolati in questa simulazione. La regola di ricompensa del prodotto resta separata e usa una valutazione effettiva.', RUL())), stale ? h('p', { class: 'en-notice', role: 'status' }, 'I testi sono cambiati dopo il confronto: ripetilo prima di salvare.') : null);
    const hist = card('st-h', 'Sessioni registrate', REC(), S.studio.length ? h('div', { class: 'en-list' }, S.studio.map(s => h('div', { class: 'en-row' }, h('div', { class: 'en-t' }, s.concept), h('div', { class: 'en-rl' }, Number.isFinite(s.score) ? h('span', { class: 'en-pill ' + (s.score >= 70 ? 'ok' : s.score >= 40 ? 'wn' : '') }, s.score + '%') : h('span', { class: 'en-pill' }, 'Non valutata'), Number.isFinite(s.xp) ? h('span', { class: 'en-pill' }, '+' + s.xp + ' XP') : null, h('span', { class: 'en-s' }, s.d))))) : empty('Nessuna sessione registrata.'));
    const fc = card('st-fc', 'Flashcard', OWN(), h('p', { class: 'en-by' }, 'Engineer prepara tre carte dal concetto; salvarle, ripassarle e programmarne le scadenze spetta a Flashcard.'), D.cards ? h('p', { class: 'en-status', style: 'display:block' }, `Flashcard preparate in questa visita (simulate): ${D.cards}.`) : null);
    return [h('div', { class: 'en-cols' }, h('div', { class: 'en-sec' }, card('st-f', 'Spiega un concetto', REC(), form), res), h('div', { class: 'en-sec' }, hist, fc))];
  }
  function confronta() {
    E = {}; const concept = D.concept.trim(), mia = D.mia.trim();
    if (!concept || !mia) { E.cmp = 'Inserisci il concetto e la tua spiegazione.'; render(); return; }
    if (concept.length > 300 || mia.length > 12000 || D.note.length > 12000) { E.cmp = 'Testo oltre i limiti del confronto (concetto 300, spiegazione e nota 12000 caratteri).'; render(); return; }
    if (aiOff('cmp')) return;
    D.cmp = { id: 'sess' + (++nid), concept, mia, note: D.note, score: null, xp: null, saved: false }; render(); note('Confronto simulato: nessuna richiesta all\'assistente; punteggio e XP non calcolati.');
  }
  function salvaStudio() {
    E = {}; const c = D.cmp;
    if (!c) { E.cmp = 'Prima confronta con l\'assistente.'; render(); return; }
    if (c.concept !== D.concept.trim() || c.mia !== D.mia.trim() || c.note !== D.note) { E.cmp = 'I testi sono cambiati dopo il confronto: ripetilo sulla bozza attuale.'; render(); return; }
    if (c.saved) { render(); note('Sessione già registrata, nessun nuovo accredito.'); return; }
    c.saved = true; S.studio.unshift({ id: c.id, concept: c.concept, score: null, xp: null, d: 'lun 2 nov' }); render(); note('Sessione registrata nella demo; nessun punteggio o XP simulato.');
  }
  function flashcards() {
    E = {}; const c = D.cmp;
    if (!c || c.concept !== D.concept.trim() || c.mia !== D.mia.trim()) { E.cmp = 'Confronta prima il concetto attuale: la spiegazione visibile deve riferirsi alla stessa sessione.'; render(); return; }
    if (aiOff('cmp')) return;
    D.cards += 3; render(); note('Tre flashcard simulate preparate: nel prodotto verrebbero salvate in Flashcard con la nota «contenuto AI da verificare».');
  }

  /* ---------- Riferimenti: concetti, formule, materiali, reverse ---------- */
  const REFS = [['knowledge', 'Concetti'], ['formule', 'Formule'], ['materiali', 'Materiali'], ['reverse', 'Reverse lab']];
  function riferimenti() {
    const seg = h('div', { class: 'en-sel four', role: 'group', 'aria-label': 'Tipo di riferimento' }, REFS.map(([k, l]) => h('button', { type: 'button', ...K('ref-' + k), 'aria-pressed': String(ref === k), onclick: () => { ref = k; E = {}; render(); } }, l)));
    const body = { knowledge: kn, formule: fo, materiali: ma, reverse: re }[ref]();
    return [seg, ...body];
  }
  function listRef(id, title, items, titleOf, subOf, open, sel, selKey) {
    return card(id, title, REC(), items.length ? h('div', { class: 'en-list' }, items.map(x => h('div', { class: 'en-row' }, h('div', { class: 'en-t' }, titleOf(x)), h('div', { class: 'en-s' }, subOf(x)), h('div', { class: 'en-ra' }, h('button', { class: 'en-btn', type: 'button', ...K('open-' + x.id), onclick: () => { D[selKey] = x.id; render(); } }, 'Dettagli'), h('button', { class: 'en-btn ghost', type: 'button', ...K('del-' + x.id), 'aria-label': 'Elimina ' + titleOf(x), onclick: () => { askDel = x.id; render(); } }, '✕ Elimina')), askDel === x.id ? ask('«' + titleOf(x) + '»', () => { const arr = S[open]; arr.splice(arr.indexOf(x), 1); if (D[selKey] === x.id) D[selKey] = null; }) : null))) : empty('Nessun elemento salvato.'));
  }
  function detailBox(id, x, rows) { return x ? h('div', { class: 'en-ai own', role: 'region', 'aria-labelledby': id }, h('div', { class: 'en-hd' }, h('h3', { id }, 'Dettaglio salvato'), REC()), rows.filter(r => r[1]).map(([l, t]) => h('div', {}, h('b', {}, l), h('p', { class: 'en-by' }, t))), h('p', { class: 'en-fine' }, 'Testo salvato da te: nel prodotto resta «da verificare con le fonti di studio».')) : null; }
  function kn() {
    const x = D.kExp, sel = S.knowledge.find(k => k.id === D.kSel);
    const form = h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); expand('kterm', 'knowledge'); } }, inputF('kn-t', 'Nome del concetto', 'kterm', { ph: 'Per esempio: Numero di Mach' }), selF('kn-c', 'Categoria', 'kcat', KCATS), err('kn'),
      h('div', { class: 'en-fa' }, h('button', { class: 'en-btn pri', type: 'submit', ...K('kn-exp') }, 'Espandi (simulato)'), h('button', { class: 'en-btn', type: 'button', ...K('kn-save'), onclick: saveK }, 'Salva'), h('button', { class: 'en-btn', type: 'button', ...K('kn-fc'), onclick: () => { E = {}; if (!D.kExp) { E.kn = 'Prima espandi un concetto.'; render(); return; } D.cards += 3; render(); note('Tre flashcard simulate preparate: nel prodotto verrebbero salvate in Flashcard.'); } }, 'Prepara 3 flashcard')),
      aiData('Espansione: nome e categoria del concetto.', 'Flashcard: concetto e materiale espanso mostrato qui.'),
      h('p', { class: 'en-fine' }, 'Si può salvare anche senza espansione (0 XP, «nessun dettaglio»); con l\'espansione si ottengono 8 XP.'));
    return [h('div', { class: 'en-cols even' }, h('div', { class: 'en-sec' }, card('kn-f', 'Aggiungi un concetto', REC(), form), x ? simBox('kn-x', 'Espansione di «' + x.term + '»', [['Definizione', SIM_TXT(x.term)], ['Applicazioni aerospaziali', 'Segnaposto'], ['Prerequisiti', 'Segnaposto'], ['Errore comune', 'Segnaposto']]) : null),
      h('div', { class: 'en-sec' }, listRef('kn-l', 'Concetti salvati (' + S.knowledge.length + ')', S.knowledge, k => k.term, k => k.cat + (k.data ? '' : ' · nessun dettaglio'), 'knowledge', sel, 'kSel'), detailBox('kn-d', sel && sel.data ? sel : null, sel && sel.data ? [['Definizione', sel.data.definizione], ['Formula', sel.data.formula]] : [])))];
  }
  function expand(key, kind) {
    E = {}; const t = D[key].trim();
    if (!t) { E[kind === 'knowledge' ? 'kn' : 'x'] = 'Inserisci un nome.'; render(); return; }
    if (aiOff(kind === 'knowledge' ? 'kn' : 'x')) return;
    D.kExp = { term: t, cat: D.kcat }; render(); note('Espansione simulata: nessuna richiesta all\'assistente.');
  }
  function saveK() {
    E = {}; const t = D.kterm.trim(); if (!t) { E.kn = 'Inserisci il nome del concetto.'; render(); return; }
    if (S.knowledge.some(k => k.term.toLowerCase() === t.toLowerCase())) { E.kn = 'Concetto già salvato.'; render(); return; }
    const has = D.kExp && D.kExp.term === t; S.knowledge.unshift({ id: 'k' + (++nid), term: t, cat: D.kcat, data: has ? { definizione: SIM_TXT(t) } : null }); const n = has ? XP.knowledgeData : XP.knowledgeBare; D.kterm = ''; D.kExp = null; render(); note(n ? addXp(n, 'concetto salvato con dettagli') : 'Concetto salvato senza dettagli (simulato): 0 XP.');
  }
  function fo() {
    const sel = S.formule.find(k => k.id === D.fSel);
    const form = h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); E = {}; const q = D.fq.trim(); if (!q) { E.fo = 'Inserisci una formula o un concetto.'; render(); return; } if (aiOff('fo')) return; D.fExp = { query: q }; render(); note('Formula simulata: nessuna richiesta all\'assistente.'); } },
      inputF('fo-q', 'Cerca una formula', 'fq', { ph: 'Per esempio: portanza' }), err('fo'), h('div', { class: 'en-fa' }, h('button', { class: 'en-btn pri', type: 'submit', ...K('fo-exp') }, 'Espandi (simulato)'), h('button', { class: 'en-btn', type: 'button', ...K('fo-save'), onclick: () => { E = {}; if (!D.fExp) { E.fo = 'Prima espandi una formula.'; render(); return; } if (S.formule.some(f => f.query === D.fExp.query)) { E.fo = 'Formula già salvata.'; render(); return; } S.formule.unshift({ id: 'f' + (++nid), query: D.fExp.query, data: { nome: D.fExp.query, simbolo: 'Segnaposto', note: SIM_TXT(D.fExp.query) } }); D.fExp = null; D.fq = ''; render(); note(addXp(XP.formula, 'formula salvata')); } }, 'Salva')),
      aiData('Espansione: testo cercato (formula o concetto).'),
      h('p', { class: 'en-fine' }, 'Si salva solo dopo l\'espansione (5 XP). La verifica dimensionale di un\'espressione è una richiesta separata all\'assistente: qui è omessa.'));
    return [h('div', { class: 'en-cols even' }, h('div', { class: 'en-sec' }, card('fo-f', 'Cerca una formula', REC(), form), D.fExp ? simBox('fo-x', 'Formula per «' + D.fExp.query + '»', [['Formula', 'Segnaposto'], ['Variabili', 'Segnaposto'], ['Uso e limiti', SIM_TXT(D.fExp.query)], ['Origine', 'Segnaposto']]) : null),
      h('div', { class: 'en-sec' }, listRef('fo-l', 'Formule salvate (' + S.formule.length + ')', S.formule, f => f.data.nome, f => f.data.simbolo, 'formule', sel, 'fSel'), detailBox('fo-d', sel, sel ? [['Formula', sel.data.simbolo], ['Note', sel.data.note]] : [])))];
  }
  function ma() {
    const sel = S.materiali.find(k => k.id === D.mSel);
    const form = h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); E = {}; const q = D.mat.trim(); if (!q) { E.ma = 'Inserisci un materiale.'; render(); return; } if (aiOff('ma')) return; D.mExp = { nome: q }; render(); note('Materiale simulato: nessuna richiesta all\'assistente.'); } },
      inputF('ma-q', 'Cerca un materiale', 'mat', { ph: 'Per esempio: Al 7075-T6' }), err('ma'), h('div', { class: 'en-fa' }, h('button', { class: 'en-btn pri', type: 'submit', ...K('ma-exp') }, 'Analizza (simulato)'), h('button', { class: 'en-btn', type: 'button', ...K('ma-save'), onclick: () => { E = {}; if (!D.mExp) { E.ma = 'Prima analizza un materiale.'; render(); return; } S.materiali.unshift({ id: 'm' + (++nid), nome: D.mExp.nome, data: { nome_standard: D.mExp.nome, famiglia: 'Segnaposto', note: SIM_TXT(D.mExp.nome) } }); D.mExp = null; D.mat = ''; render(); note('Materiale salvato (simulato, non salvato): 0 XP.'); } }, 'Salva')),
      aiData('Analisi: testo di ricerca.'),
      h('p', { class: 'en-fine' }, 'I materiali non danno XP.'));
    const opts = [['', '— scegli —'], ...S.materiali.map((m, i) => [String(i), m.nome])];
    const cmp = card('ma-c', 'Confronta due materiali salvati', REC(), h('div', { class: 'en-form' }, selF('ma-a', 'Materiale A', 'cmpA', opts), selF('ma-b', 'Materiale B', 'cmpB', opts), err('mc'), h('button', { class: 'en-btn', type: 'button', ...K('ma-cmp'), onclick: () => { E = {}; if (D.cmpA === '' || D.cmpB === '' || D.cmpA === D.cmpB) { E.mc = 'Seleziona due materiali diversi.'; render(); return; } if (aiOff('mc')) return; D.cmpRes = [S.materiali[+D.cmpA].nome, S.materiali[+D.cmpB].nome]; render(); note('Confronto simulato: nessuna richiesta all\'assistente.'); } }, 'Confronta (simulato)'), aiData('Confronto: nomi, categorie e proprietà registrate dei due materiali selezionati.')), D.cmpRes ? simBox('ma-r', D.cmpRes[0] + ' contro ' + D.cmpRes[1], [['Struttura primaria', 'Segnaposto'], ['Efficienza sul peso', 'Segnaposto'], ['Sintesi', SIM_TXT(D.cmpRes.join(' / '))]]) : null);
    return [h('div', { class: 'en-cols even' }, h('div', { class: 'en-sec' }, card('ma-f', 'Cerca un materiale', REC(), form), D.mExp ? simBox('ma-x', 'Materiale «' + D.mExp.nome + '»', [['Proprietà', 'Segnaposto'], ['Vantaggi', 'Segnaposto'], ['Svantaggi', 'Segnaposto'], ['Note', SIM_TXT(D.mExp.nome)]]) : null, cmp),
      h('div', { class: 'en-sec' }, listRef('ma-l', 'Materiali salvati (' + S.materiali.length + ')', S.materiali, m => m.nome, m => m.data.famiglia, 'materiali', sel, 'mSel'), detailBox('ma-d', sel, sel ? [['Famiglia', sel.data.famiglia], ['Note', sel.data.note]] : [])))];
  }
  function re() {
    const sel = S.reverse.find(k => k.id === D.reSel);
    const form = h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); E = {}; const q = D.reSys.trim(); if (!q) { E.re = 'Inserisci un sistema da analizzare.'; render(); return; } if (aiOff('re')) return; D.reRes = { sys: q, depth: D.reDepth }; render(); note('Analisi simulata: nessuna richiesta all\'assistente.'); } },
      inputF('re-q', 'Sistema da decostruire', 'reSys', { ph: 'Per esempio: Reaction wheel di un CubeSat' }), selF('re-d', 'Profondità', 'reDepth', DEPTHS), err('re'), h('div', { class: 'en-fa' }, h('button', { class: 'en-btn pri', type: 'submit', ...K('re-run') }, 'Analizza (simulato)'), h('button', { class: 'en-btn', type: 'button', ...K('re-save'), onclick: () => { E = {}; if (!D.reRes) { E.re = 'Prima esegui un\'analisi.'; render(); return; } S.reverse.unshift({ id: 'r' + (++nid), sys: D.reRes.sys, depth: D.reRes.depth, data: { nome_completo: D.reRes.sys, descrizione: SIM_TXT(D.reRes.sys) } }); D.reRes = null; D.reSys = ''; render(); note(addXp(XP.reverse, 'report salvato')); } }, 'Salva il report')),
      aiData('Analisi: nome del sistema e profondità selezionata.'),
      h('p', { class: 'en-fine' }, 'Si salva solo dopo l\'analisi (30 XP).'));
    return [h('div', { class: 'en-cols even' }, h('div', { class: 'en-sec' }, card('re-f', 'Reverse lab', REC(), form), D.reRes ? simBox('re-x', 'Analisi di «' + D.reRes.sys + '»', [['Descrizione', SIM_TXT(D.reRes.sys)], ['Sottosistemi', 'Segnaposto'], ['Parametri chiave', 'Segnaposto'], ['Modi di guasto', 'Segnaposto'], ['Scelte progettuali', 'Segnaposto']]) : null),
      h('div', { class: 'en-sec' }, listRef('re-l', 'Report salvati (' + S.reverse.length + ')', S.reverse, r => r.sys, r => 'Profondità: ' + r.depth, 'reverse', sel, 'reSel'), detailBox('re-d', sel, sel ? [['Descrizione', sel.data.descrizione]] : [])))];
  }

  /* ---------- Progetti + prototipo ---------- */
  const proj = () => (S.projects || []).find(p => p.id === D.pid);
  function loadP(p) { D.pid = p.id; D.pname = p.name; D.pobj = p.obj; D.pconstr = p.constr; D.reqs = [...p.reqs]; D.ms = p.ms.map(m => ({ ...m })); D.panalysis = p.analysis ? true : null; D.peval = null; E = {}; render(); document.getElementById('pj-n')?.scrollIntoView({ block: 'center' }); }
  function newP() { D.pid = null; D.pname = D.pobj = D.pconstr = D.preq = ''; D.reqs = []; D.ms = []; D.panalysis = null; D.peval = null; E = {}; render(); note('Nuova bozza di progetto.'); }
  function saveP(ai) {
    E = {}; const name = D.pname.trim(); if (!name) { E.pj = 'Inserisci il nome del progetto.'; render(); return false; }
    if (S.projects === null) { E.pj = 'Archivio progetti non leggibile: nessun salvataggio per non sostituire l\'originale.'; render(); return false; }
    const rec = { id: D.pid || 'p' + (++nid), name, obj: D.pobj, constr: D.pconstr, reqs: [...D.reqs], ms: D.ms.map(m => ({ ...m })), analysis: !!(ai || D.panalysis) }, i = S.projects.findIndex(p => p.id === rec.id);
    if (i >= 0) S.projects[i] = rec; else S.projects.unshift(rec); D.pid = rec.id; render(); note('Progetto salvato (simulato, non salvato).'); return true;
  }
  function toggleMs(i) {
    E = {}; if (!D.pid) { E.pj = 'Salva il progetto prima di completare le milestone.'; render(); return; }
    const m = D.ms[i]; m.done = !m.done; const p = proj(); if (p) p.ms = D.ms.map(x => ({ ...x })); render(); note(m.done ? addXp(XP.milestone, 'milestone completata') : 'Milestone riaperta: la ricompensa di 15 XP viene stornata (simulato).'); if (!m.done) xpSim -= XP.milestone;
  }
  function progetti() {
    const done = D.ms.filter(m => m.done).length, tot = D.ms.length, pct = tot ? Math.round(done / tot * 100) : 0;
    const form = h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); gen(); } },
      inputF('pj-n', 'Nome del progetto', 'pname', { ph: 'Per esempio: Struttura CubeSat 1U' }), inputF('pj-o', 'Obiettivo', 'pobj', { area: 1, ph: 'Cosa deve fare questo sistema?' }), inputF('pj-v', 'Vincoli', 'pconstr', { area: 1, ph: 'Massa massima, ingombro, normative, tempo.' }), err('pj'),
      h('div', { class: 'en-fa' }, h('button', { class: 'en-btn pri', type: 'submit', ...K('pj-gen') }, 'Genera analisi (simulato)'), h('button', { class: 'en-btn', type: 'button', ...K('pj-save'), onclick: () => saveP() }, 'Salva a mano'), h('button', { class: 'en-btn ghost', type: 'button', ...K('pj-new'), onclick: newP }, 'Nuovo progetto')),
      aiData('Analisi iniziale: nome, obiettivo, vincoli, requisiti e milestone correnti.'),
      h('p', { class: 'en-fine' }, 'Un progetto salvato si aggiorna, non si duplica. Le milestone si completano solo dopo il salvataggio.'));
    const reqs = card('pj-r', 'Requisiti', REC(), h('div', { class: 'en-f' }, h('label', { for: 'pj-q' }, 'Nuovo requisito'), h('input', { id: 'pj-q', type: 'text', value: D.preq, placeholder: 'Per esempio: massa massima', oninput: e => { D.preq = e.target.value; }, onkeydown: e => { if (e.key === 'Enter') { e.preventDefault(); addReq(); } } })), h('button', { class: 'en-btn', type: 'button', ...K('pj-add'), onclick: addReq }, 'Aggiungi requisito'), err('rq'),
      D.reqs.length ? h('div', { class: 'en-list' }, D.reqs.map((r, i) => h('div', { class: 'en-row' }, h('div', { class: 'en-t' }, r), h('div', { class: 'en-ra' }, h('button', { class: 'en-btn ghost', type: 'button', ...K('rq-' + i), 'aria-label': 'Rimuovi il requisito ' + r, onclick: () => { D.reqs.splice(i, 1); render(); } }, '✕ Rimuovi'))))) : h('p', { class: 'en-by' }, 'Nessun requisito.'));
    const ms = card('pj-m', 'Milestone', REC(), h('div', { class: 'en-prog', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': 'Avanzamento del progetto' }, h('i', { style: `width:${pct}%` })), h('p', { class: 'en-fine' }, `${done} / ${tot} completate — ${pct}%`),
      tot ? h('div', { class: 'en-list' }, D.ms.map((m, i) => h('button', { class: 'en-chk', type: 'button', ...K('ms-' + i), 'aria-pressed': String(!!m.done), onclick: () => toggleMs(i) }, h('i', { 'aria-hidden': 'true' }, m.done ? '✓' : ''), h('span', { class: 'nm' }, m.text), h('span', { class: 'q' }, m.done ? '15 XP' : '')))) : h('p', { class: 'en-by' }, 'Nessuna milestone: nel prodotto arrivano solo dall\'analisi dell\'assistente, non si scrivono a mano.'),
      D.pid && D.ms.length ? h('button', { class: 'en-btn', type: 'button', ...K('pj-eval'), onclick: () => { E = {}; if (aiOff('pj')) return; D.peval = true; render(); note('Valutazione simulata: nessuna richiesta all\'assistente.'); } }, 'Valuta l\'avanzamento (simulato)') : null,
      D.pid && D.ms.length ? aiData('Valutazione dell\'avanzamento: nome, requisiti e stato delle milestone.') : null,
      D.peval ? simBox('pj-ev', 'Valutazione dell\'avanzamento dichiarato', [['Commento', SIM_TXT(D.pname || 'progetto')]]) : null,
    );
    const ana = D.panalysis ? simBox('pj-an', 'Analisi tecnica proposta', [['Analisi', SIM_TXT(D.pname)], ['Rischi', 'Segnaposto'], ['Requisiti suggeriti', 'Aggiunti qui sotto come bozza da verificare']]) : null;
    const list = card('pj-l', 'Progetti salvati' + (S.projects ? ' (' + S.projects.length + ')' : ''), REC(), S.projects === null ? h('div', { class: 'en-empty' }, h('b', {}, 'Archivio non disponibile'), h('p', { class: 'en-err', role: 'alert', style: 'display:block' }, S.projectsError + '. Nessun originale è stato sostituito.')) : S.projects.length ? h('div', { class: 'en-list' }, S.projects.map(p => { const d = p.ms.filter(m => m.done).length, t = p.ms.length; return h('div', { class: 'en-row' }, h('div', { class: 'en-t' }, p.name), h('div', { class: 'en-rl' }, h('span', { class: 'en-pill cy' }, `${d}/${t} milestone`), h('span', { class: 'en-pill' }, p.reqs.length + ' requisiti')), h('div', { class: 'en-ra' }, h('button', { class: 'en-btn', type: 'button', ...K('ld-' + p.id), onclick: () => loadP(p) }, 'Apri'), h('button', { class: 'en-btn ghost', type: 'button', ...K('dp-' + p.id), 'aria-label': 'Elimina il progetto ' + p.name, onclick: () => { askDel = 'p' + p.id; render(); } }, '✕ Elimina')), askDel === 'p' + p.id ? ask('il progetto «' + p.name + '»', () => { S.projects.splice(S.projects.indexOf(p), 1); if (D.pid === p.id) { D.pid = null; } }) : null); })) : empty('Nessun progetto salvato.'));
    return [h('div', { class: 'en-cols' }, h('div', { class: 'en-sec' }, card('pj-f', D.pid ? 'Progetto aperto' : 'Nuovo progetto', REC(), form), ana, reqs, ms), h('div', { class: 'en-sec' }, list, prototipo()))];
  }
  function addReq() { const v = D.preq.trim(); E = {}; if (!v) { E.rq = 'Scrivi un requisito.'; render(); return; } D.reqs.push(v); D.preq = ''; render(); document.getElementById('pj-q')?.focus(); }
  function gen() {
    E = {}; if (!D.pname.trim()) { E.pj = 'Inserisci il nome del progetto.'; render(); return; } if (aiOff('pj')) return;
    D.panalysis = true; ['Segnaposto: requisito suggerito da verificare'].forEach(r => { if (!D.reqs.includes(r)) D.reqs.push(r); }); ['Segnaposto: primo passo', 'Segnaposto: secondo passo'].forEach(t => { if (!D.ms.some(m => m.text === t)) D.ms.push({ id: 'ms' + (++nid), text: t, done: false }); });
    if (S.projects !== null && saveP(true)) return; render(); note('Analisi simulata: nessuna richiesta all\'assistente.');
  }
  function prototipo() {
    const m = D.proto, f = h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); E = {}; const q = D.protoDesc.trim(); if (!q) { E.pr = 'Descrivi il componente.'; render(); return; } if (q.length > 4000) { E.pr = 'Descrizione oltre i 4000 caratteri.'; render(); return; } if (aiOff('pr')) return; D.proto = { desc: q }; render(); note('Modello simulato: lo schema è sempre lo stesso, non deriva dalla descrizione.'); } },
      inputF('pr-d', 'Descrivi il componente', 'protoDesc', { area: 1, ph: 'Per esempio: staffa a L con due fori.' }), err('pr'), h('div', { class: 'en-fa' }, h('button', { class: 'en-btn pri', type: 'submit', ...K('pr-gen') }, 'Genera (simulato)'), h('button', { class: 'en-btn ghost', type: 'button', ...K('pr-reset'), onclick: () => { D.proto = null; D.protoDesc = ''; E = {}; render(); } }, 'Azzera')), aiData('Generazione del prototipo: descrizione del componente.'));
    const svg3 = '<svg viewBox="0 0 220 130" role="img" aria-label="Schema d\'esempio di una staffa a L in vista isometrica"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M40 100 L110 120 L180 100 L110 80 Z"/><path d="M40 100 L40 90 L110 110 L110 120"/><path d="M180 100 L180 90 L110 110"/><path d="M40 90 L40 30 L70 22 L70 82"/><path d="M40 30 L110 50 L110 80"/><path d="M70 22 L140 42 L140 72"/><circle cx="125" cy="60" r="4"/></g></svg>';
    const svg2 = '<svg viewBox="0 0 220 130" role="img" aria-label="Schema d\'esempio di una staffa a L in vista frontale quotata"><g fill="none" stroke="currentColor" stroke-width="2"><path d="M40 20 H70 V90 H180 V110 H40 Z"/><circle cx="55" cy="45" r="5"/><circle cx="55" cy="75" r="5"/><circle cx="130" cy="100" r="4"/></g><g stroke="currentColor" stroke-width="1" opacity=".7"><path d="M25 20 V110 M22 20 H28 M22 110 H28"/><path d="M40 122 H180 M40 119 V125 M180 119 V125"/></g><text x="8" y="68" font-size="9" fill="currentColor">h</text><text x="104" y="128" font-size="9" fill="currentColor">L</text></svg>';
    return card('pr-c', 'Prototipo del componente', SIM(), f, m ? h('div', { class: 'en-sec' }, h('div', { class: 'en-sel', role: 'group', 'aria-label': 'Vista' }, [['3d', '3D'], ['2d', 'Schema 2D']].map(([k, l]) => h('button', { type: 'button', ...K('viz-' + k), 'aria-pressed': String(D.viz === k), onclick: () => { D.viz = k; render(); } }, l))), h('div', { class: 'en-svg', role: 'group', 'aria-label': 'Anteprima segnaposto' }, (() => { const d = document.createElement('div'); d.innerHTML = D.viz === '3d' ? svg3 : svg2; return d.firstChild; })()),
      h('p', { class: 'en-by' }, SIM_TXT('componente')), h('div', {}, [['Parametri', 'Segnaposto'], ['Concetto principale', 'Segnaposto']].map(([a, b]) => h('div', { class: 'en-own' }, h('b', {}, a), h('span', {}, b)))),
      h('button', { class: 'en-btn', type: 'button', ...K('pr-add'), onclick: () => { E = {}; if (!D.pid) { E.pr = 'Apri o salva un progetto prima di aggiungerci il componente.'; render(); return; } note('Componente collegato al progetto (simulato): nessun dato scritto.'); } }, 'Aggiungi al progetto'), h('p', { class: 'en-fine' }, 'Nel prodotto il 3D usa un motore grafico e ripiega sul 2D se non è disponibile. Qui entrambe le viste sono disegni fissi.')) : h('p', { class: 'en-by' }, 'Descrivi un componente per vedere un\'anteprima segnaposto.'));
  }

  /* ---------- Esercizi ---------- */
  function esercizi() {
    const ch = D.ch;
    const form = h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); E = {}; if (aiOff('ex')) return; D.ch = { id: 'ex' + (++nid), area: D.chArea, diff: D.chDiff, saved: false }; D.chSol = ''; D.chRes = null; D.chHint = false; render(); note('Esercizio simulato: nessuna richiesta all\'assistente.'); } },
      selF('ex-a', 'Area', 'chArea', AREAS), selF('ex-d', 'Difficoltà', 'chDiff', DIFFS), err('ex'), h('button', { class: 'en-btn pri', type: 'submit', ...K('ex-gen') }, 'Genera (simulato)'), aiData('Generazione: area e difficoltà selezionate.'));
    const task = !ch ? card('ex-t', 'Esercizio', null, h('p', { class: 'en-by' }, 'Scegli area e difficoltà, poi genera un esercizio.')) : card('ex-t', 'Esercizio · ' + ch.area, SIM(), h('div', { class: 'en-chips' }, h('span', { class: 'en-chip' }, ch.diff)), h('p', { class: 'en-by' }, 'Testo segnaposto del prototipo: nel prodotto qui compare il problema generato dall\'assistente, con il collegamento a un caso reale.'),
      h('button', { class: 'en-btn', type: 'button', ...K('ex-hint'), 'aria-expanded': String(D.chHint), onclick: () => { D.chHint = true; render(); } }, 'Mostra un suggerimento'), D.chHint ? h('p', { class: 'en-by' }, 'Suggerimento segnaposto.') : null,
      h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); verifica(); } }, inputF('ex-s', 'La tua soluzione', 'chSol', { area: 1, ph: 'Ipotesi, formule, calcoli, risultato con unità.' }), err('exv'), h('button', { class: 'en-btn pri', type: 'submit', ...K('ex-ver') }, 'Verifica (simulato)'), aiData('Verifica: testo dell\'esercizio, soluzione di riferimento e la tua soluzione.')),
      D.chRes ? simBox('ex-r', 'Riscontro didattico', [['Esito', 'Riscontro dimostrativo, non è una valutazione. Il prototipo non calcola un punteggio.'], ['Commento', SIM_TXT('esercizio')], ['Risposta del modello', 'Segnaposto: nel prodotto «da verificare».']], h('p', { class: 'en-by' }, 'XP: non calcolati in questa simulazione. La regola del prodotto usa una valutazione effettiva.', RUL())) : null);
    const scored = S.challenges.filter(c => Number.isFinite(c.score)), n = S.challenges.length, avg = scored.length ? Math.round(sum(scored, c => c.score) / scored.length) : null, top = scored.filter(c => c.score >= 70).length;
    const stats = card('ex-st', 'Statistiche', REC(), n ? [h('div', { class: 'en-nums' }, [[n, 'Totali'], [avg == null ? '—' : avg + '%', 'Media su ' + scored.length + ' valutati'], [scored.length ? Math.round(top / scored.length * 100) + '%' : '—', '≥ 70% dei valutati']].map(([a, l]) => h('div', { class: 'en-num' }, h('b', {}, a), h('small', {}, l)))), h('div', { class: 'en-list' }, S.challenges.map(c => h('div', { class: 'en-row' }, h('div', { class: 'en-t' }, c.title), h('div', { class: 'en-rl' }, Number.isFinite(c.score) ? h('span', { class: 'en-pill ' + (c.score >= 70 ? 'ok' : c.score >= 40 ? 'wn' : '') }, c.score + '%') : h('span', { class: 'en-pill' }, 'Non valutato'), h('span', { class: 'en-pill' }, c.diff), h('span', { class: 'en-s' }, c.area + ' · ' + c.d)))))] : empty('Nessun esercizio registrato.'), h('p', { class: 'en-fine' }, 'La mappa delle aree da esercitare del prodotto non è riprodotta: confronta nomi di area diversi tra esercizi e concetti (vedi consegna).'));
    return [h('div', { class: 'en-cols' }, h('div', { class: 'en-sec' }, card('ex-f', 'Nuovo esercizio', REC(), form), task), h('div', { class: 'en-sec' }, stats))];
  }
  function verifica() {
    E = {}; const ch = D.ch, sol = D.chSol.trim();
    if (ch.saved) { E.exv = 'Esercizio già registrato: genera una nuova prova.'; render(); return; }
    if (!sol) { E.exv = 'Scrivi la tua soluzione.'; render(); return; } if (sol.length > 12000) { E.exv = 'Soluzione oltre i 12000 caratteri.'; render(); return; }
    if (aiOff('exv')) return;
    ch.saved = true; D.chRes = { score: null, xp: null }; S.challenges.unshift({ id: ch.id, title: 'Esercizio di prova', area: ch.area, diff: ch.diff, score: null, d: 'lun 2 nov' }); render(); note('Esercizio registrato nella demo; nessun punteggio o XP simulato.');
  }

  /* ---------- Diario ---------- */
  function diario() {
    const form = h('form', { class: 'en-form', novalidate: '', onsubmit: e => { e.preventDefault(); salvaJ(); } },
      inputF('jr-t', 'Titolo della sessione', 'jt', { ph: 'Per esempio: Studio di una staffa' }), inputF('jr-b', 'Costruito o studiato', 'jb', { area: 1 }), inputF('jr-i', 'Cosa ho imparato', 'jl', { area: 1 }), inputF('jr-k', 'Blocchi e problemi', 'jk', { area: 1 }), inputF('jr-n', 'Prossima azione concreta', 'jn', { area: 1 }), err('jr'),
      h('div', { class: 'en-fa' }, h('button', { class: 'en-btn pri', type: 'submit', ...K('jr-save') }, 'Salva la voce'), h('button', { class: 'en-btn', type: 'button', ...K('jr-syn'), onclick: () => { E = {}; if (!D.jb.trim() && !D.jl.trim()) { E.jr = 'Compila almeno «costruito» o «imparato».'; render(); return; } if (aiOff('jr')) return; D.jsyn = true; render(); note('Sintesi simulata: nessuna richiesta all\'assistente.'); } }, 'Sintetizza (simulato)')),
      aiData('Sintesi: titolo, cosa hai costruito o studiato, cosa hai imparato, blocchi e prossima azione.'),
      h('p', { class: 'en-fine' }, 'Il titolo è obbligatorio (10 XP). La sintesi non viene salvata: serve solo a rileggere il testo.'));
    const list = card('jr-l', 'Voci del diario', REC(), (S.journal || []).length ? h('div', { class: 'en-list' }, S.journal.map(j => j.bad ? h('div', { class: 'en-row' }, h('div', { class: 'en-t' }, 'Voce non leggibile'), h('p', { class: 'en-err', role: 'alert', style: 'display:block' }, 'Valore non riconosciuto, originale conservato.')) : h('div', { class: 'en-row' }, h('div', { class: 'en-s' }, j.d), h('div', { class: 'en-t' }, j.title), j.built ? h('div', { class: 'en-by' }, h('b', {}, 'Costruito: '), j.built) : null, j.learned ? h('div', { class: 'en-by' }, h('b', {}, 'Imparato: '), j.learned) : null, j.next ? h('div', { class: 'en-by' }, h('b', {}, 'Prossima azione: '), j.next) : null,
      h('div', { class: 'en-ra' }, h('button', { class: 'en-btn ghost', type: 'button', ...K('jd-' + j.id), 'aria-label': 'Elimina la voce ' + j.title, onclick: () => { askDel = j.id; render(); } }, '✕ Elimina')), askDel === j.id ? ask('la voce «' + j.title + '»', () => { S.journal.splice(S.journal.indexOf(j), 1); }) : null))) : empty('Nessuna voce. Documenta ogni sessione di studio.'));
    return [h('div', { class: 'en-cols' }, h('div', { class: 'en-sec' }, card('jr-f', 'Nuova voce', REC(), form), D.jsyn ? simBox('jr-s', 'Sintesi del testo', [['Sintesi', SIM_TXT(D.jt || 'voce')]]) : null), h('div', { class: 'en-sec' }, list))];
  }
  function salvaJ() {
    E = {}; const t = D.jt.trim(); if (!t) { E.jr = 'Inserisci un titolo.'; render(); return; }
    if (S.journal === null) { E.jr = 'Diario non leggibile.'; render(); return; }
    S.journal.unshift({ id: 'j' + (++nid), d: 'lun 2 nov', title: t, built: D.jb, learned: D.jl, block: D.jk, next: D.jn }); D.jt = D.jb = D.jl = D.jk = D.jn = ''; D.jsyn = null; render(); note(addXp(XP.journal, 'voce registrata (simulato, non salvata)'));
  }

  /* ---------- Finestre globali ---------- */
  function moduleDialog(id, title, body) { const d = h('dialog', { id, 'aria-labelledby': id + '-title' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-title' }, title), h('button', { class: 'chip', type: 'button', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); d.addEventListener('close', () => { setTimeout(() => document.getElementById(id === 'en-apps' ? 'appsBtn' : 'setBtn')?.focus({ preventScroll: true }), 0); }); document.body.append(d); return d; }
  const APP_GROUPS = [
    ['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]],
    ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library'], ['🃏', 'Flashcard'], ['⚙', 'Engineer', 'questa pagina']]],
    ['Corpo e creatività', [['🏋', 'Leo Protocol'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora'], ['🎌', 'Agora Anime']]],
    ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]],
    ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]],
    ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]
  ];
  const appSearch = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), appList = h('div', {});
  const drawApps = () => { const qy = appSearch.value.trim().toLocaleLowerCase('it'); appList.replaceChildren(); let n = 0;
    for (const [g, items] of APP_GROUPS) { const ms = items.filter(([, l]) => l.toLocaleLowerCase('it').includes(qy)); if (!ms.length) continue; n += ms.length;
      appList.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'items' }, ms.map(([ic, l, nt]) => h('button', { class: 'item', type: 'button', onclick: () => { dApps.close(); if (l === 'Engineer') go('oggi'); else note('Collegamento simulato: ' + l + '.'); } }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, nt ? h('small', {}, nt) : null)))))); }
    if (!n) appList.append(h('p', { class: 'empty' }, 'Nessuna sezione trovata.')); };
  appSearch.addEventListener('input', drawApps); drawApps();
  const dApps = moduleDialog('en-apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati · nessuna funzione esterna viene aperta'), appSearch, appList));
  const dSet = moduleDialog('en-settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Anteprima della struttura · le voci d\'esempio non modificano l\'app'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['Backup e ripristino', 'Esistente in Impostazioni'], ['Chiave API', 'Esistente nell\'Hub']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · anteprima simulata') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge real' }, 'Esistente'))))),
    h('div', { class: 'grp' }, h('h3', {}, 'Engineer'), h('div', { class: 'set' }, [['Cosa inviare all\'assistente', 'Esempio · oggi non è una scelta'], ['Mostra sempre «da verificare» sui testi dell\'assistente', 'Esempio · oggi è fisso']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · voce d\'esempio') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge ex' }, 'Esempio')))))));
  document.getElementById('appsBtn').addEventListener('click', () => dApps.showModal());
  document.getElementById('setBtn').addEventListener('click', () => dSet.showModal());

  window.__en = { setScen, go, get state() { return { scen, tab, ref, xp: xpSim, studio: S.studio.length, challenges: S.challenges.length, knowledge: S.knowledge.length, formule: S.formule.length, materiali: S.materiali.length, reverse: S.reverse.length, projects: S.projects ? S.projects.length : null, journal: S.journal.length, cards: D.cards }; } };
  render();
})();
