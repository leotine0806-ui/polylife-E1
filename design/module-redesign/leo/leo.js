/* LEO Protocol · prototipo E1. Funzioni ricavate da src/leo_protocol_v8.html, src/domain.js (trainingRewards, trainingForDay) e src/application-tools.js (app_training_log).
   Tutti i valori sono FITTIZI («dati di prova»), «oggi» fisso. Registrazioni, check-in, obiettivi, note, record, timer e spesa sono SIMULATI in memoria:
   nessuna rete, nessuna persistenza, nessuna chiamata al prodotto. Al ricaricamento tutto torna allo stato iniziale. */
(() => {
  const TODAY = '2026-11-02';                       // lunedì
  const DOW = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'], TODAY_IDX = 0;
  const pad = n => String(n).padStart(2, '0');
  const mmss = s => pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  /* XP per sessione: somma delle ricompense di `trainingRewards` in src/domain.js (gym 80+30+10+10, beach 60+25+15+10). Sono ricompense dell'app, non misure fisiche. */
  const XP = { gym: 130, bv: 110 }, SESS_LABEL = { gym: 'Palestra', bv: 'Beach' };
  const NOTE_TYPES = { gym: 'Palestra', bv: 'Beach volley', other: 'Generale' };
  const PR_DEFAULT = [['Panca piana', 'kg'], ['Squat', 'kg'], ['Deadlift', 'kg'], ['Military press', 'kg'], ['Trazioni (max)', 'rep'], ['Salto verticale', 'cm']];
  const SHOP = [['Proteine', [['Uova', '12 pz'], ['Yogurt greco', '500 g']]], ['Carboidrati', [['Riso', '1 kg'], ['Avena in fiocchi', '500 g']]], ['Verdure e frutta', [['Spinaci', '300 g'], ['Banane', '6 pz']]]];
  const MEAL_SLOTS = ['Colazione', 'Spuntino', 'Pranzo', 'Spuntino', 'Cena', 'Spuntino serale'];

  /* ---------- Fixture sintetiche ---------- */
  function fixture(s) {
    const base = {
      paused: false, blocks: [{ name: 'Palestra', days: [1, 3], start: '18:00', end: '19:00' }, { name: 'Beach volley', days: [6], start: '10:00', end: '11:30' }], sessions: [], partial: false,
      weeks: [{ label: 'Sett-4', g: 260, b: 110, t: 370 }, { label: 'Sett-3', g: 130, b: 110, t: 240 }, { label: 'Sett-2', g: 260, b: 0, t: 260 }, { label: 'Scorsa', g: 130, b: 220, t: 350 }, { label: 'Questa', g: 0, b: 0, t: 0 }],
      checkins: [{ id: 'c1', dateStr: 'lun 26 ott 2026', weight: 71.5, sleep: 7, energy: 6, motivation: 8, soreness: 3 }, { id: 'c2', dateStr: 'lun 19 ott 2026', weight: 71.2, sleep: 6, energy: 7, motivation: 7, soreness: 4 }, { id: 'c3', dateStr: 'lun 12 ott 2026', weight: 71, sleep: 8, energy: 8, motivation: 7, soreness: 2 }],
      milestones: [{ id: 'm1', name: 'Dieci trazioni di fila', xp: 100, done: false }, { id: 'm2', name: 'Correre venti minuti senza fermarsi', xp: 200, done: true }, { id: 'm3', name: 'Tre allenamenti in una settimana', xp: 50, done: false }],
      notes: [{ id: 'n1', dateStr: 'sab 31 ott 2026', type: 'bv', text: 'Prova di nota: servizio più preciso rispetto alla settimana scorsa.' }, { id: 'n2', dateStr: 'mer 28 ott 2026', type: 'gym', text: 'Prova di nota: carico invariato, ultima serie lenta.' }],
      pr: PR_DEFAULT.map(([name, unit], i) => ({ id: 'p' + i, name, unit, value: i === 0 ? 60 : i === 4 ? 8 : null })), shop: {}, rotation: 'A', archiveError: ''
    };
    if (s === 'vuoto') return { ...base, blocks: [], weeks: base.weeks.map(w => ({ ...w, g: 0, b: 0, t: 0 })), checkins: [], milestones: [], notes: [], pr: PR_DEFAULT.map(([name, unit], i) => ({ id: 'p' + i, name, unit, value: null })), empty: true };
    if (s === 'sospesa') return { ...base, paused: true };
    if (s === 'parziale') return { ...base, partial: true, weeks: base.weeks.map(w => w.label === 'Sett-2' ? { ...w, t: null, partial: true } : w), checkins: [{ id: 'c1', dateStr: 'lun 26 ott 2026', weight: 71.5, sleep: null, energy: 6, motivation: 8, soreness: 3 }, ...base.checkins.slice(1)], milestones: null, archiveError: 'Formato non riconosciuto in leo_milestones. Originale conservato', pr: base.pr.map((p, i) => i === 1 ? { ...p, value: NaN, bad: true } : p) };
    return base;
  }

  /* ---------- Stato in memoria ---------- */
  let scen = 'normale', tab = 'oggi', S = fixture(scen), msgText = '', msgTimer = null, nid = 100, lastK = null, dismissedCi = false, summary = 'sim', summaryText = null, ciEdit = null, ciForm = null, ciErr = '', milErr = '', noteEdit = null, noteDraft = { type: 'gym', text: '' }, noteErr = '', prErr = {}, prDraft = {}, askDel = null, tm = { mode: 'ex', left: 0, total: 0, running: false, label: '', end: 0 }, tmErr = '', tmId = null, tmCustom = '60';
  const root = document.getElementById('root'), dlg = document.getElementById('dlg');
  const K = k => ({ 'data-k': k });
  const gymBlocksHidden = b => S.paused && /palestra|gym/i.test(b.name);
  const blocksOn = idx => S.blocks.filter(b => b.days.includes((idx + 1) % 7) && !gymBlocksHidden(b)).sort((a, b) => a.start.localeCompare(b.start));
  const gymN = () => S.sessions.filter(x => x.type === 'gym').length, bvN = () => S.sessions.filter(x => x.type === 'bv').length, xpTot = () => S.sessions.reduce((s, x) => s + x.xp, 0);
  const notice = () => S.partial ? 'Dati storici senza dettaglio verificabile conservati: conteggi e XP mostrano soltanto le registrazioni utilizzabili. I valori con * sono parziali.' : '';
  const T = (cls, t, title) => h('span', { class: 'lo-tag ' + cls, ...(title ? { title } : {}) }, t);
  const REC = () => T('rec', 'Dai tuoi record'), PRF = () => T('prf', 'Dal profilo operativo'), RUL = () => T('rul', 'Regola dell\'app'), SIM = () => T('sim', 'Simulato · non confermato'), PRP = () => T('prop', 'Proposta di design');

  const note = msg => { msgText = msg; const live = document.getElementById('live'); live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 60); document.querySelectorAll('.lo-status').forEach(el => { el.textContent = msg; }); clearTimeout(msgTimer); msgTimer = setTimeout(() => { msgText = ''; live.textContent = ''; document.querySelectorAll('.lo-status').forEach(el => { el.textContent = ''; }); }, 5000); };
  const clearNote = () => { msgText = ''; clearTimeout(msgTimer); };
  const nav = to => note('Anteprima di navigazione verso ' + to + ' (nessuna azione).');
  function render(focusK) {
    const fk = focusK === false ? null : focusK || document.activeElement?.dataset?.k, top = window.scrollY;
    root.replaceChildren(...build());
    if (fk) [fk, 'hero-main', 'tab-' + tab].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  const VIEWS = { oggi, settimana, checkin, obiettivi, timer, archivio };
  const build = () => [scenBar(), notice() ? h('p', { class: 'lo-notice', role: 'status' }, notice()) : null, legend(), tabs(), h('p', { class: 'lo-status', 'aria-hidden': 'true' }, msgText), ...VIEWS[tab]()].filter(Boolean);
  const go = t => { tab = t; askDel = null; clearNote(); render(); };

  const SCEN = [['normale', 'Dati di prova'], ['vuoto', 'Nessun dato'], ['sospesa', 'Palestra sospesa'], ['parziale', 'Dati parziali']];
  const scenBar = () => h('details', { class: 'lo-scen' }, h('summary', {}, h('span', {}, 'Scenari demo · solo prototipo'), h('b', {}, SCEN.find(x => x[0] === scen)[1])), h('div', { class: 'lo-scen-o', role: 'group', 'aria-label': 'Scegli lo scenario dimostrativo' }, SCEN.map(([k, l]) => h('button', { type: 'button', class: 'lo-btn', ...K('sc-' + k), 'aria-pressed': String(scen === k), onclick: () => setScen(k) }, l))));
  function setScen(k) { clearNote(); stopTimer(); ciSaved = false; scen = k; S = fixture(k); tab = 'oggi'; dismissedCi = false; summary = 'sim'; summaryText = null; ciEdit = null; ciForm = null; ciErr = ''; milErr = ''; noteEdit = null; noteDraft = { type: 'gym', text: '' }; noteErr = ''; prErr = {}; prDraft = {}; askDel = null; tm = { mode: 'ex', left: 0, total: 0, running: false, label: '', end: 0 }; tmErr = ''; render(); }
  const legend = () => h('details', { class: 'lo-leg' }, h('summary', {}, 'Come leggere le etichette: da dove viene ogni informazione'), h('div', { class: 'lo-legend' }, h('span', {}, REC(), 'registrato da te'), h('span', {}, PRF(), 'orari condivisi con il profilo'), h('span', {}, RUL(), 'calcolo fisso dell\'app'), h('span', {}, SIM(), 'preparato da un assistente, da confermare')));
  const tabs = () => h('nav', { class: 'lo-tabs', 'aria-label': 'Sezioni di LEO Protocol' }, [['oggi', 'Oggi'], ['settimana', 'Settimana'], ['checkin', 'Check-in'], ['obiettivi', 'Obiettivi'], ['timer', 'Timer'], ['archivio', 'Dati e strumenti']].map(([k, l]) => h('button', { type: 'button', ...K('tab-' + k), ...(tab === k ? { 'aria-current': 'page' } : {}), onclick: () => go(k) }, l)));

  /* ---------- Oggi ---------- */
  let ciSaved = false;                     // nei dati di prova il check-in di questa settimana non c'è ancora: lo aggiunge l'utente
  function logSession(type) {
    if (S.partial) { note('Sessione non salvata: registro allenamenti non riconosciuto, originale conservato.'); return; }
    S.sessions.push({ id: 's' + (++nid), type, xp: XP[type], dateStr: 'lun 2 nov' }); render(); note(`Sessione registrata (simulato, non salvata): ${SESS_LABEL[type]}, +${XP[type]} XP. Gli XP sono ricompense dell'app.`);
  }
  function oggi() {
    const today = blocksOn(TODAY_IDX), nextDay = (() => { for (let i = 1; i <= 7; i++) { const idx = (TODAY_IDX + i) % 7, b = blocksOn(idx); if (b.length) return { d: DOW[idx], b }; } return null; })();
    const hero = h('section', { class: 'card lo-hero', 'aria-labelledby': 'lo-ht' }, h('div', { class: 'lo-hh' }, h('span', { class: 'eyebrow' }, 'Oggi'), PRF()),
      h('div', {}, h('h2', { class: 'lo-big', id: 'lo-ht' }, today.length ? 'Allenamento ' + today.map(b => `${b.start}–${b.end}`).join(' · ') : 'Nessun allenamento fissato oggi'), h('p', { class: 'lo-by' }, (S.paused ? 'Palestra sospesa. ' : '') + (nextDay ? `Prossimo: ${nextDay.d} ${nextDay.b.map(b => `${b.start}–${b.end}`).join(' · ')}.` : 'Nessun altro allenamento in programma.'))),
      h('p', { class: 'lo-fine' }, 'Gli orari si modificano nel Profilo operativo: LEO li mostra soltanto.'),
      h('div', {}, h('div', { class: 'lo-rl', style: 'margin-bottom:8px' }, h('b', {}, 'Hai svolto una sessione?'), REC(), RUL()), h('div', { class: 'lo-acts' }, h('button', { class: 'lo-btn pri big', type: 'button', ...K('hero-main'), onclick: () => logSession('gym') }, `Palestra fatta · +${XP.gym} XP`), h('button', { class: 'lo-btn big', type: 'button', ...K('log-bv'), onclick: () => logSession('bv') }, `Beach fatto · +${XP.bv} XP`)),
        h('p', { class: 'lo-fine', style: 'margin-top:8px' }, 'Si registra solo ciò che hai già svolto: un allenamento in programma non diventa una sessione da solo. Questa settimana: ' + (S.partial ? 'conteggio parziale*' : `${gymN()} palestra, ${bvN()} beach`) + '.')),
      h('p', { class: 'lo-fine' }, 'Gli XP sono ricompense del gioco: non misurano forza, resistenza o salute.'));
    const miss = scen === 'vuoto' || dismissedCi || ciSaved ? null : h('section', { class: 'lo-miss', 'aria-labelledby': 'lo-mt' }, h('div', { class: 'lo-rl' }, h('b', { id: 'lo-mt' }, 'Manca il check-in di questa settimana'), REC()),
      h('p', { class: 'lo-by' }, 'L\'ultimo check-in è del 26 ottobre. Puoi compilarlo adesso, anche solo in parte, oppure ignorare l\'avviso.'), h('div', { class: 'lo-acts' }, h('button', { class: 'lo-btn pri', type: 'button', ...K('miss-go'), onclick: () => go('checkin') }, 'Compila il check-in'), h('button', { class: 'lo-btn', type: 'button', ...K('miss-skip'), onclick: () => { dismissedCi = true; render(); note('Avviso ignorato per ora (simulato). Nessun dato è stato inventato né registrato.'); } }, 'Ignora per ora')),
      h('p', { class: 'lo-fine' }, PRP(), ' L\'avviso e «Ignora» sono una proposta: nel prodotto non esistono.'));
    const own = h('section', { class: 'card lo-card', 'aria-labelledby': 'lo-ow' }, h('h2', { id: 'lo-ow' }, 'Dove finiscono i dati'), [
      ['Sessioni svolte', 'Registro settimanale di LEO'], ['Check-in, obiettivi, note, record, spesa', 'Archivi di LEO'], ['Orari degli allenamenti', 'Profilo operativo: si cambiano lì'], ['XP e abilità del gioco', 'Profilo di gioco (Life RPG)'], ['Backup completo', 'Impostazioni: da LEO si esportano solo i dati LEO']
    ].map(([a, b]) => h('div', { class: 'lo-own' }, h('b', {}, a), h('span', {}, b))),
      h('div', { class: 'lo-acts', style: 'margin-top:8px' }, h('button', { class: 'lo-btn', type: 'button', ...K('lk-prof'), onclick: () => nav('/operating-profile.html') }, 'Modifica gli orari nel profilo'), h('button', { class: 'lo-btn', type: 'button', ...K('lk-set'), onclick: () => nav('/settings.html') }, 'Backup completo')),
      h('p', { class: 'lo-fine', style: 'margin-top:8px' }, 'Nel prodotto alcuni riepiloghi dell\'assistente leggono i check-in (sonno ed energia). Cosa può uscire verso un provider è una decisione aperta.'));
    return [h('div', { class: 'lo-cols' }, h('div', { class: 'lo-sec' }, hero, miss), h('div', { class: 'lo-sec' }, own))].filter(Boolean);
  }

  /* ---------- Settimana ---------- */
  function settimana() {
    const grid = h('div', { class: 'lo-week', role: 'list', 'aria-label': 'Piano della settimana' }, DOW.map((d, i) => { const b = blocksOn(i); return h('div', { class: 'lo-wd' + (b.length ? ' on' : '') + (i === TODAY_IDX ? ' td' : ''), role: 'listitem', 'aria-label': `${d}${i === TODAY_IDX ? ', oggi' : ''}: ${b.length ? b.map(x => `${x.name}, ${x.start}–${x.end}`).join(' e ') : 'nessun allenamento fissato'}` }, h('b', {}, d), b.length ? h('span', { class: 'lo-wd-detail' }, b.map(x => `${x.name} · ${x.start}–${x.end}`).join(' · ')) : h('span', { class: 'lo-wd-detail empty' }, 'Nessun allenamento')); }));
    const timesTxt = DOW.map((d, i) => ({ d, b: blocksOn(i) })).filter(x => x.b.length).map(x => `${x.d} ${x.b.map(y => `${y.start}–${y.end}`).join(' e ')}`).join(' · ');
    const cnt = [['Palestra', S.partial ? gymN() + '*' : gymN()], ['Beach', S.partial ? bvN() + '*' : bvN()], ['XP', S.partial ? 'N/D*' : xpTot()]];
    const chart = S.weeks.every(w => !w.t && !w.partial) ? h('p', { class: 'lo-by' }, 'Nessuna sessione datata registrata nelle settimane mostrate.') : [h('p', { class: 'lo-fine' }, S.weeks.map(w => `${w.label}: palestra ${w.g} XP, beach ${w.b} XP, totale ${w.t === null ? 'N/D' : w.t} XP${w.partial ? ' (parziale)' : ''}`).join('; ')),
      h('div', { class: 'lo-bars', role: 'img', 'aria-label': 'XP registrati nelle ultime cinque settimane, riepilogo testuale sopra il grafico' }, S.weeks.map(w => { const mx = 300; return h('div', { class: 'lo-wk' }, (w.t !== 0 || w.partial) ? h('span', { class: 'lo-wt' }, (w.t === null ? 'N/D' : w.t) + (w.partial ? '*' : '')) : null, h('div', { class: 'lo-wb' }, h('i', { class: 'g', style: `height:${Math.round(w.g / mx * 84)}px` }), h('i', { class: 'b', style: `height:${Math.round(w.b / mx * 84)}px` })), h('span', { class: 'lo-wl' }, w.label)); })),
      h('div', { class: 'lo-chips' }, h('span', { class: 'lo-chip' }, '■ Palestra'), h('span', { class: 'lo-chip' }, '■ Beach'), h('span', { class: 'lo-chip' }, 'Valore sopra: totale'))];
    const summ = h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-sm' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-sm' }, 'Riepilogo della settimana'), summary === 'conf' ? T('rec', 'Confermato da te (simulato)') : summary === 'ign' ? T('prop', 'Ignorato') : SIM()),
      summary === 'ign' ? h('p', { class: 'lo-by' }, 'Riepilogo ignorato. Non è stato salvato nulla.') : h('p', { class: 'lo-by', id: 'lo-sm-t' }, summaryText ?? `Questa settimana ${S.partial ? 'risultano' : gymN() + bvN() === 1 ? 'risulta' : 'risultano'} ${S.partial ? 'registrazioni parziali' : `${gymN() + bvN()} ${gymN() + bvN() === 1 ? 'sessione' : 'sessioni'} (${gymN()} palestra, ${bvN()} beach)`}. Ultimo check-in registrato: 26 ottobre (valori di prova). È solo un elenco di ciò che hai registrato: non contiene valutazioni.`),
      summary === 'edit' ? h('form', { class: 'lo-form', onsubmit: e => { e.preventDefault(); const v = document.getElementById('sm-in').value.trim(); if (!v) return; summaryText = v; summary = 'conf'; render(); note('Riepilogo corretto e confermato da te (simulato).'); } }, h('label', { class: 'lo-f', for: 'sm-in' }, h('span', {}, 'Correggi il testo'), h('textarea', { id: 'sm-in' }, summaryText ?? document.getElementById('lo-sm-t')?.textContent ?? '')), h('div', { class: 'lo-fa' }, h('button', { class: 'lo-btn pri', type: 'submit', ...K('sm-save') }, 'Salva e conferma'), h('button', { class: 'lo-btn', type: 'button', onclick: () => { summary = 'sim'; render(); } }, 'Annulla')))
        : summary === 'sim' ? h('div', { class: 'lo-fa' }, h('button', { class: 'lo-btn pri', type: 'button', ...K('sm-ok'), onclick: () => { summary = 'conf'; render(); note('Riepilogo confermato da te (simulato, non salvato).'); } }, 'Conferma'), h('button', { class: 'lo-btn', type: 'button', ...K('sm-ed'), onclick: () => { summary = 'edit'; summaryText = document.getElementById('lo-sm-t')?.textContent ?? null; render(); } }, 'Correggi'), h('button', { class: 'lo-btn ghost', type: 'button', ...K('sm-no'), onclick: () => { summary = 'ign'; render(); note('Riepilogo ignorato (simulato).'); } }, 'Ignora')) : null,
      h('p', { class: 'lo-fine' }, PRP(), ' Nel prodotto LEO non genera riepiloghi: qui mostra come marcare e confermare un testo preparato da un assistente, senza interpretare i dati.'));
    return [h('div', { class: 'lo-cols' }, h('div', { class: 'lo-sec' },
      h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-pw' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-pw' }, 'Piano della settimana'), PRF()), grid, timesTxt ? h('p', { class: 'lo-fine lo-times' }, 'Orari: ' + timesTxt + '.') : null, h('p', { class: 'lo-fine' }, (S.paused ? 'Palestra sospesa. ' : '') + 'Gli orari si modificano nel Profilo operativo.')),
      h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-sc' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-sc' }, 'Sessioni di questa settimana'), REC()), h('div', { class: 'lo-nums' }, cnt.map(([l, v]) => h('div', { class: 'lo-num' }, h('b', {}, String(v)), h('small', {}, l)))),
        S.sessions.length ? h('div', { class: 'lo-list' }, S.sessions.slice().reverse().map(x => h('div', { class: 'lo-row' }, h('div', { class: 'lo-t' }, `${x.dateStr} — ${SESS_LABEL[x.type]}`), h('div', { class: 'lo-s' }, `+${x.xp} XP`)))) : h('p', { class: 'lo-by' }, 'Nessuna sessione loggata questa settimana.'),
        h('p', { class: 'lo-fine' }, 'Gli XP registrati sono ricompense del gioco (palestra 130, beach 110 per sessione): non misurano forza, salto, capacità aerobica o recupero fisico.')), summ),
      h('div', { class: 'lo-sec' }, h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-xc' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-xc' }, 'XP registrati, ultime 5 settimane'), REC()), chart),
        h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-sk' }, h('h2', { id: 'lo-sk', style: 'margin:0' }, 'Abilità del gioco'), h('p', { class: 'lo-by' }, 'Non disponibile in questa demo: i livelli delle abilità (forza, resistenza, mobilità) vengono dal profilo di gioco globale, non da LEO.'), h('p', { class: 'lo-fine' }, 'Nel prodotto compare anche una barra «Recupero» che nessuna registrazione di LEO alimenta: per questo qui non è mostrata.'))))];
  }

  /* ---------- Check-in ---------- */
  const FIELDS = [['sleep', 'Qualità del sonno', 1, 10], ['energy', 'Energia percepita', 1, 10], ['motivation', 'Motivazione', 1, 10], ['soreness', 'Indolenzimento', 0, 10]];
  const num = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? String(v) : '—';
  /* I valori facoltativi partono esclusi: per registrare una scala si toglie la spunta e si parte esplicitamente da 5/10. */
  function startCi(e) { ciEdit = e ? e.id : null; ciForm = e ? { weight: e.weight == null ? '' : String(e.weight), sleep: e.sleep ?? null, energy: e.energy ?? null, motivation: e.motivation ?? null, soreness: e.soreness ?? null, skip: { weight: e.weight == null, sleep: e.sleep == null, energy: e.energy == null, motivation: e.motivation == null, soreness: e.soreness == null } } : { weight: '', sleep: null, energy: null, motivation: null, soreness: null, skip: { weight: true, sleep: true, energy: true, motivation: true, soreness: true } }; }
  function saveCi() {
    const f = ciForm, skip = f.skip, out = {};
    if (!skip.weight) { const w = Number(f.weight); if (f.weight.trim() === '' || !Number.isFinite(w) || w < 30 || w > 200) { ciErr = 'Peso: inserisci un valore da 30 a 200 kg, oppure scegli «Non registrare».'; render(false); document.getElementById('ci-weight')?.focus(); return; } out.weight = w; } else out.weight = null;
    for (const [id] of FIELDS) out[id] = skip[id] || f[id] === null ? null : Number(f[id]);
    if (Object.values(out).every(v => v === null)) { ciErr = 'Registra almeno un valore.'; render(false); return; }
    if (ciEdit) Object.assign(S.checkins.find(c => c.id === ciEdit), out); else { S.checkins.unshift({ id: 'c' + (++nid), dateStr: 'lun 2 nov 2026', ...out }); ciSaved = true; }
    const wasEdit = !!ciEdit; ciEdit = null; ciForm = null; ciErr = ''; render(false); note((wasEdit ? 'Check-in corretto' : 'Check-in salvato') + ' (simulato, non salvato). Valori di prova.' + (Object.values(out).some(v => v === null) ? ' I valori non registrati restano «—».' : ''));
  }
  function checkin() {
    const f = ciForm || (startCi(null), ciForm), sk = f.skip;
    const slider = ([id, label, lo, hi]) => h('div', { class: 'lo-f' }, h('div', { class: 'lo-fv' }, h('label', { for: 'ci-' + id }, label), h('b', {}, sk[id] ? '— (non registrato)' : f[id] === null ? '— (non impostato)' : f[id] + '/10')), h('input', { id: 'ci-' + id, type: 'range', min: String(lo), max: String(hi), value: String(f[id] ?? Math.floor((lo + hi) / 2)), disabled: !!sk[id], 'aria-describedby': 'ci-help', oninput: e => { f[id] = Number(e.target.value); e.target.parentElement.querySelector('b').textContent = f[id] + '/10'; } }),
      h('label', { class: 'lo-skip' }, h('input', { type: 'checkbox', ...(sk[id] ? { checked: '' } : {}), ...K('skip-' + id), onchange: e => { sk[id] = e.target.checked; if (!sk[id] && f[id] === null) f[id] = Math.floor((lo + hi) / 2); render(); } }), 'Non registrare questo valore'));
    const form = h('form', { class: 'lo-form', novalidate: '', onsubmit: e => { e.preventDefault(); saveCi(); } },
      h('p', { id: 'ci-help', class: 'lo-fine' }, 'I valori non registrati restano esclusi. Togli la spunta per includerli: le scale si attivano a 5/10, modificabile prima di salvare.'),
      h('div', { class: 'lo-f' }, h('label', { for: 'ci-weight' }, 'Peso corporeo (kg)'), h('input', { id: 'ci-weight', type: 'number', step: '0.1', min: '30', max: '200', inputmode: 'decimal', placeholder: 'Non registrato', value: f.weight, disabled: !!sk.weight, oninput: e => { f.weight = e.target.value; } }),
        h('label', { class: 'lo-skip' }, h('input', { type: 'checkbox', ...(sk.weight ? { checked: '' } : {}), ...K('skip-weight'), onchange: e => { sk.weight = e.target.checked; render(); } }), 'Non registrare il peso')),
      FIELDS.map(slider), h('p', { class: 'lo-err', role: 'alert' }, ciErr),
      h('div', { class: 'lo-fa' }, h('button', { class: 'lo-btn pri', type: 'submit', ...K('ci-save') }, ciEdit ? 'Salva la correzione' : 'Salva il check-in'), ciEdit ? h('button', { class: 'lo-btn', type: 'button', onclick: () => { ciEdit = null; ciForm = null; ciErr = ''; render(); } }, 'Annulla') : null),
      h('p', { class: 'lo-fine' }, 'Sono autovalutazioni, non misure né diagnosi. Valori di prova.'));
    return [h('div', { class: 'lo-cols' }, h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-ci' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-ci' }, ciEdit ? 'Correggi il check-in' : 'Check-in settimanale'), REC()), form,
      h('p', { class: 'lo-fine' }, PRP(), ' «Non registrare» e «Correggi» sono una proposta: nel prodotto il peso è obbligatorio, si salva un check-in solo completo e non si può né correggere né eliminare.')),
    h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-ch' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-ch' }, 'Storico dei check-in'), REC()),
      S.checkins.length ? h('div', { class: 'lo-list' }, S.checkins.map(c => h('div', { class: 'lo-row' }, h('div', { class: 'lo-t' }, c.dateStr), h('div', { class: 'lo-chips' }, [['Peso', num(c.weight, 30, 200) + (c.weight == null ? '' : ' kg')], ['Sonno', num(c.sleep, 1, 10) + (c.sleep == null ? '' : '/10')], ['Energia', num(c.energy, 1, 10) + (c.energy == null ? '' : '/10')], ['Motivazione', num(c.motivation, 1, 10) + (c.motivation == null ? '' : '/10')], ['Indolenzimento', num(c.soreness, 0, 10) + (c.soreness == null ? '' : '/10')]].map(([l, v]) => h('span', { class: 'lo-chip' }, `${l}: ${v}`))),
        h('div', { class: 'lo-ra' }, h('button', { class: 'lo-btn', type: 'button', ...K('ce-' + c.id), onclick: () => { startCi(c); ciErr = ''; render(); document.getElementById('ci-weight')?.scrollIntoView({ block: 'center' }); } }, 'Correggi'), h('button', { class: 'lo-btn ghost', type: 'button', ...K('cd-' + c.id), 'aria-label': 'Elimina il check-in del ' + c.dateStr, onclick: () => { askDel = 'c' + c.id; render(); } }, '✕ Elimina')),
        askDel === 'c' + c.id ? ask('il check-in', () => { S.checkins = S.checkins.filter(x => x !== c); }) : null))) : h('p', { class: 'lo-by' }, 'Nessun check-in registrato.'), h('p', { class: 'lo-fine' }, 'Un «—» indica un valore non registrato o non leggibile: resta così, senza stime.')))];
  }
  const ask = (what, yes) => h('div', { class: 'lo-ask', role: 'alertdialog', 'aria-label': 'Conferma eliminazione' }, h('span', {}, `Eliminare ${what}?`), h('button', { class: 'lo-btn dng', type: 'button', ...K('dy'), onclick: () => { yes(); askDel = null; render(); note('Eliminazione confermata (simulata, non salvata).'); } }, 'Elimina'), h('button', { class: 'lo-btn', type: 'button', ...K('dn'), onclick: () => { askDel = null; render(); } }, 'Annulla'));

  /* ---------- Obiettivi: obiettivi, note, record ---------- */
  function obiettivi() {
    const ms = S.milestones, done = ms ? ms.filter(m => m.done).length : 0;
    const milList = S.archiveError ? h('p', { class: 'lo-err', role: 'alert', style: 'display:block' }, `Archivio non disponibile: ${S.archiveError}. Nessun originale è stato sostituito.`) : !ms.length ? h('p', { class: 'lo-by' }, 'Nessun obiettivo personale registrato. Aggiungine uno.') : h('div', { class: 'lo-list' }, ms.map(m => h('div', { class: 'lo-row' + (m.done ? ' dn' : '') }, h('div', { class: 'lo-t' }, m.name), h('div', { class: 'lo-rl' }, h('span', { class: 'lo-pill' + (m.done ? ' ok' : '') }, m.done ? '✓ Completato' : 'Da fare'), h('span', { class: 'lo-s' }, `XP al completamento: ${m.xp}`), RUL()),
      h('div', { class: 'lo-ra' }, h('button', { class: 'lo-btn', type: 'button', ...K('mt-' + m.id), 'aria-pressed': String(m.done), onclick: () => { m.done = !m.done; render(); note(m.done ? `Obiettivo registrato (simulato): +${m.xp} XP.` : 'Completamento e premio annullati (simulato).'); } }, m.done ? 'Annulla il completamento' : 'Segna completato'), h('button', { class: 'lo-btn ghost', type: 'button', ...K('md-' + m.id), 'aria-label': 'Elimina obiettivo: ' + m.name, onclick: () => { askDel = 'm' + m.id; render(); } }, '✕ Elimina')),
      askDel === 'm' + m.id ? ask('l\'obiettivo', () => { S.milestones = S.milestones.filter(x => x !== m); }) : null)));
    const milForm = h('form', { class: 'lo-form', novalidate: '', onsubmit: e => { e.preventDefault(); const name = document.getElementById('mi-name').value.trim(), xp = Number(document.getElementById('mi-xp').value); if (S.archiveError) { milErr = 'Obiettivo non salvato: archivio non disponibile.'; render(false); return; } if (!name || name.length > 60) { milErr = 'Scrivi il nome dell\'obiettivo (fino a 60 caratteri).'; render(false); document.getElementById('mi-name')?.focus(); return; } S.milestones.push({ id: 'm' + (++nid), name, xp, done: false }); milErr = ''; render(false); note('Obiettivo aggiunto (simulato). Gli XP arrivano solo al completamento.'); } },
      h('div', { class: 'lo-f' }, h('label', { for: 'mi-name' }, 'Nuovo obiettivo personale'), h('input', { id: 'mi-name', type: 'text', maxlength: '60', placeholder: 'es. dieci trazioni di fila' })), h('div', { class: 'lo-f' }, h('label', { for: 'mi-xp' }, 'XP al completamento'), h('select', { id: 'mi-xp' }, [50, 100, 200, 500].map(x => h('option', { value: x, ...(x === 100 ? { selected: '' } : {}) }, '+' + x + ' XP')))), h('p', { class: 'lo-err', role: 'alert' }, milErr), h('div', { class: 'lo-fa' }, h('button', { class: 'lo-btn pri', type: 'submit', ...K('mi-add') }, '+ Aggiungi obiettivo')));
    const noteForm = h('form', { class: 'lo-form', novalidate: '', onsubmit: e => { e.preventDefault(); const text = document.getElementById('nt-text').value.trim(), type = document.getElementById('nt-type').value; if (!text) { noteErr = 'Scrivi una nota.'; render(false); document.getElementById('nt-text')?.focus(); return; } if (noteEdit) Object.assign(S.notes.find(n => n.id === noteEdit), { text, type }); else S.notes.unshift({ id: 'n' + (++nid), dateStr: 'lun 2 nov 2026', type, text }); const was = !!noteEdit; noteEdit = null; noteDraft = { type: 'gym', text: '' }; noteErr = ''; render(false); note((was ? 'Nota aggiornata' : 'Nota salvata') + ' (simulato, non salvata).'); } },
      h('div', { class: 'lo-f' }, h('label', { for: 'nt-type' }, 'Categoria'), h('select', { id: 'nt-type' }, Object.entries(NOTE_TYPES).map(([k, l]) => h('option', { value: k, ...(noteDraft.type === k ? { selected: '' } : {}) }, l)))), h('div', { class: 'lo-f' }, h('label', { for: 'nt-text' }, 'Testo'), h('textarea', { id: 'nt-text' }, noteDraft.text)), h('p', { class: 'lo-err', role: 'alert' }, noteErr),
      h('div', { class: 'lo-fa' }, h('button', { class: 'lo-btn pri', type: 'submit', ...K('nt-save') }, noteEdit ? 'Aggiorna la nota' : 'Salva la nota'), noteEdit ? h('button', { class: 'lo-btn', type: 'button', onclick: () => { noteEdit = null; noteDraft = { type: 'gym', text: '' }; render(); } }, 'Annulla') : null));
    const prList = h('div', { class: 'lo-list' }, S.pr.map((p, i) => { const id = 'pr-' + p.id, v = prDraft[p.id] ?? (p.bad ? '' : p.value ?? ''); return h('div', { class: 'lo-row' }, h('div', { class: 'lo-rl' }, h('b', {}, p.name), h('span', { class: 'lo-s' }, p.unit)),
      h('div', { class: 'lo-f' }, h('label', { class: 'sr', for: id }, `Record personale: ${p.name} (${p.unit})`), h('input', { id, type: 'number', step: 'any', min: '0', max: '9999', placeholder: 'Non registrato', value: String(v), oninput: e => { prDraft[p.id] = e.target.value; } })),
      h('div', { class: 'lo-ra' }, h('button', { class: 'lo-btn', type: 'button', ...K('prs-' + p.id), onclick: () => { const raw = (document.getElementById(id).value ?? '').trim(), val = raw === '' ? null : Number(raw); if (val !== null && (!Number.isFinite(val) || val < 0 || val > 9999)) { prErr[p.id] = 'Inserisci un numero da 0 a 9999, oppure lascia vuoto per cancellare il valore.'; render(false); return; } p.value = val; p.bad = false; delete prDraft[p.id]; prErr[p.id] = 'Record salvato (simulato).'; render(); } }, 'Salva record')),
      h('p', { class: 'lo-s', role: 'status' }, prErr[p.id] || (p.bad ? 'Valore storico non riconosciuto, originale conservato.' : ''))); }));
    return [h('div', { class: 'lo-cols even' }, h('div', { class: 'lo-sec' },
      h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-ob' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-ob' }, 'Obiettivi'), h('span', { class: 'lo-pill' }, ms ? `${done} / ${ms.length}` : '— / —')), milList, milForm),
      h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-nt' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-nt' }, 'Note sulle sessioni'), REC()),
        S.notes.length ? h('div', { class: 'lo-list' }, S.notes.map(n => h('div', { class: 'lo-row' }, h('div', { class: 'lo-rl' }, h('span', { class: 'lo-pill' }, NOTE_TYPES[n.type] || n.type), h('span', { class: 'lo-s' }, n.dateStr)), h('p', { style: 'overflow-wrap:anywhere;font-size:14px' }, n.text),
          h('div', { class: 'lo-ra' }, h('button', { class: 'lo-btn', type: 'button', ...K('ne-' + n.id), 'aria-label': 'Modifica nota', onclick: () => { noteEdit = n.id; noteDraft = { type: n.type, text: n.text }; render(); document.getElementById('nt-text')?.focus(); } }, '✎ Modifica'), h('button', { class: 'lo-btn ghost', type: 'button', ...K('nd-' + n.id), 'aria-label': 'Elimina nota', onclick: () => { askDel = 'n' + n.id; render(); } }, '✕ Elimina')),
          askDel === 'n' + n.id ? ask('la nota', () => { S.notes = S.notes.filter(x => x !== n); }) : null))) : h('p', { class: 'lo-by' }, 'Nessuna nota ancora.'), noteForm)),
      h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-pr' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-pr' }, 'Record personali'), REC()), h('p', { class: 'lo-fine' }, 'Valori fittizi. Lascia vuoto un campo e salva per cancellare il valore.'), prList))];
  }

  /* ---------- Timer (simulato, solo in memoria) ---------- */
  function stopTimer() { clearInterval(tmId); tmId = null; tm.running = false; }
  function setPreset(sec, label) { stopTimer(); tm.left = sec; tm.total = sec; tm.label = label; tmErr = ''; render(); }
  function startTimer() { if (tm.running || tm.left <= 0) return; tm.running = true; tm.end = Date.now() + tm.left * 1000; tmId = setInterval(() => tick(), 250); render(); }
  function tick(ms) { if (!tm.running) return; if (ms) tm.end -= ms; tm.left = Math.max(0, Math.ceil((tm.end - Date.now()) / 1000)); paint(); if (tm.left === 0) { stopTimer(); render(); note('Timer completato (simulato: nessun suono e nessuna notifica).'); } }
  function paint() { const d = document.getElementById('tm-d'), b = document.getElementById('tm-b'); if (d) { d.textContent = mmss(tm.left); d.classList.toggle('warn', tm.left > 0 && tm.left <= 5); } if (b) b.style.width = (tm.total ? Math.round(tm.left / tm.total * 100) : 100) + '%'; }
  function timer() {
    const pre = (list, label, pf) => h('div', { class: 'lo-f' }, h('span', {}, label), h('div', { class: 'lo-pre' }, list.map(([s, l]) => h('button', { type: 'button', class: 'lo-btn', ...K('pre-' + pf + s), onclick: () => setPreset(s, (pf === 'e' ? 'Esercizio · ' : 'Riposo · ') + l) }, l))));
    return [h('section', { class: 'card lo-card lo-sec', style: 'max-width:760px;margin:0 auto;width:100%', 'aria-labelledby': 'lo-tm' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-tm' }, 'Timer esercizi e riposo'), T('prop', 'Simulato: senza suono')),
      h('div', { class: 'lo-sel', style: 'grid-template-columns:repeat(2,minmax(0,1fr))', role: 'group', 'aria-label': 'Modalità del timer' }, [['ex', 'Esercizio'], ['rest', 'Riposo']].map(([k, l]) => h('button', { type: 'button', ...K('tmm-' + k), 'aria-pressed': String(tm.mode === k), onclick: () => { tm.mode = k; render(); } }, l))),
      h('p', { class: 'lo-tl' }, tm.label || 'Scegli un preset o imposta i secondi'), h('div', { class: 'lo-timer' + (tm.left > 0 && tm.left <= 5 ? ' warn' : ''), id: 'tm-d', role: 'timer', 'aria-label': 'Tempo rimasto' }, mmss(tm.left)), h('div', { class: 'seg', role: 'img', 'aria-label': 'Tempo rimasto' }, h('i', { id: 'tm-b', style: `width:${tm.total ? Math.round(tm.left / tm.total * 100) : 100}%` })),
      pre([[30, '30 s sprint'], [45, '45 s plank'], [60, '60 s'], [90, '90 s']], 'Preset esercizio', 'e'), pre([[30, '30 s'], [45, '45 s'], [60, '60 s'], [90, '90 s'], [120, '2 min'], [180, '3 min']], 'Preset riposo', 'r'),
      h('form', { class: 'lo-form', novalidate: '', onsubmit: e => { e.preventDefault(); const v = Number(document.getElementById('tm-sec').value); tmCustom = document.getElementById('tm-sec').value; if (!Number.isInteger(v) || v < 5 || v > 3600) { tmErr = 'Inserisci secondi interi tra 5 e 3600.'; render(false); document.getElementById('tm-sec')?.focus(); return; } setPreset(v, v + ' s — personalizzato'); } },
        h('div', { class: 'lo-f' }, h('label', { for: 'tm-sec' }, 'Secondi personalizzati (5–3600)'), h('input', { id: 'tm-sec', type: 'number', inputmode: 'numeric', min: '5', max: '3600', value: tmCustom })), h('p', { class: 'lo-err', role: 'alert' }, tmErr), h('div', { class: 'lo-fa' }, h('button', { class: 'lo-btn', type: 'submit', ...K('tm-set') }, 'Imposta'))),
      h('div', { class: 'lo-acts' }, h('button', { class: 'lo-btn pri big', type: 'button', ...K('tm-start'), disabled: tm.running || tm.left <= 0, onclick: startTimer }, '▶ Avvia'), h('button', { class: 'lo-btn big', type: 'button', ...K('tm-pause'), disabled: !tm.running, onclick: () => { tick(); stopTimer(); render(); } }, '❚❚ Pausa'), h('button', { class: 'lo-btn big', type: 'button', ...K('tm-reset'), onclick: () => { stopTimer(); tm.left = tm.total; render(); } }, '↺ Azzera')),
      h('p', { class: 'lo-fine' }, 'Nel prodotto il timer suona al termine e può mostrare una notifica del sistema; qui nessuna delle due cose.'))];
  }

  /* ---------- Dati e strumenti: dieta storica, spesa, backup ---------- */
  function archivio() {
    const rot = ['A', 'B', 'C'];
    const diet = h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-di' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-di' }, 'Schema alimentare storico'), T('prop', 'Solo consultazione')),
      h('p', { class: 'lo-notice' }, 'Questa sezione conserva lo schema alimentare originario, basato sul vecchio profilo e sulla palestra ora sospesa. Quantità, orari e integrazione non sono aggiornati al programma attuale. La rotazione organizza soltanto la consultazione.'),
      h('div', { class: 'lo-sel', role: 'group', 'aria-label': 'Rotazione del giorno' }, rot.map(r => h('button', { type: 'button', ...K('rot-' + r), 'aria-pressed': String(S.rotation === r), onclick: () => { S.rotation = r; render(); note(`Rotazione ${r} selezionata (simulato, non salvato).`); } }, 'Giorno ' + r))),
      h('div', { class: 'lo-list' }, MEAL_SLOTS.map(s => h('div', { class: 'lo-row' }, h('div', { class: 'lo-t' }, s + ' · esempio'), h('div', { class: 'lo-s' }, 'Contenuto d\'esempio: i pasti, le quantità e gli integratori reali non sono riprodotti nella demo.')))),
      h('p', { class: 'lo-fine' }, 'Nel sorgente lo schema contiene quantità, calorie, integratori e dosi come indicazioni fisse: vedi il rapporto per i rischi e la decisione proposta.'));
    const shopSec = h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-sp' }, h('div', { class: 'lo-hd' }, h('h2', { id: 'lo-sp' }, 'Lista della spesa'), REC()), h('p', { class: 'lo-fine' }, 'Voci d\'esempio. La stima dei costi del prodotto è un testo fisso, non un calcolo, e qui non è riprodotta.'),
      SHOP.map(([cat, items]) => h('div', { class: 'lo-sec' }, h('b', {}, cat), items.map(([n, q], i) => { const k = cat + i, on = !!S.shop[k]; return h('button', { type: 'button', class: 'lo-chk', ...K('shop-' + k), 'aria-pressed': String(on), onclick: () => { S.shop[k] = !on; render(); } }, h('i', { 'aria-hidden': 'true' }, on ? '✓' : ''), h('span', { class: 'nm' }, n), h('span', { class: 'q' }, q)); }))),
      h('div', { class: 'lo-fa' }, h('button', { class: 'lo-btn', type: 'button', ...K('shop-reset'), onclick: () => { S.shop = {}; render(); note('Lista azzerata (simulato, non salvato).'); } }, 'Azzera la lista')));
    const backup = h('section', { class: 'card lo-card lo-sec', 'aria-labelledby': 'lo-bk' }, h('h2', { id: 'lo-bk', style: 'margin:0' }, 'Backup e notifiche'), h('p', { class: 'lo-by' }, 'L\'esportazione contiene solo i dati di LEO: sessioni, note, check-in, obiettivi, record, spesa e rotazione. Per un backup completo usa le Impostazioni.'),
      h('div', { class: 'lo-acts' }, h('button', { class: 'lo-btn', type: 'button', ...K('bk-ex'), onclick: () => note('Esportazione simulata: nessun file è stato creato.') }, 'Esporta i dati LEO'), h('button', { class: 'lo-btn', type: 'button', ...K('bk-im'), onclick: () => note('Importazione simulata: nel prodotto apre Impostazioni → Importazioni. Nessun file è stato letto.') }, 'Importa un backup'), h('button', { class: 'lo-btn', type: 'button', ...K('bk-nt'), onclick: () => note('Notifiche: richiesta di permesso simulata, nessuna attivata.') }, 'Attiva le notifiche')));
    return [h('div', { class: 'lo-cols even' }, diet, h('div', { class: 'lo-sec' }, shopSec, backup))];
  }

  /* ---------- Finestre globali ---------- */
  function dialog(title, body) { lastK = document.activeElement?.dataset?.k || null; document.getElementById('dlg-t').textContent = title; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'lo-sim' }, 'Simulazione · nessun salvataggio'), body); if (!dlg.open) dlg.showModal(); }
  function closeDlg() { if (dlg.open) dlg.close(); }
  document.getElementById('dlg-x').onclick = closeDlg;
  dlg.addEventListener('close', () => { const t = (lastK && document.querySelector(`[data-k="${lastK}"]`)) || document.querySelector('[data-k="hero-main"]') || document.querySelector(`[data-k="tab-${tab}"]`); t?.focus({ preventScroll: true }); });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDlg(); });
  function moduleDialog(id, title, body) { const d = h('dialog', { id, 'aria-labelledby': id + '-title' }); d.append(h('div', { class: 'dh' }, h('h2', { id: id + '-title' }, title), h('button', { class: 'chip', type: 'button', 'aria-label': 'Chiudi', onclick: () => d.close() }, '✕')), h('div', { class: 'db' }, body)); d.addEventListener('click', e => { if (e.target === d) d.close(); }); document.body.append(d); return d; }
  const APP_GROUPS = [
    ['Quotidiano', [['☰', 'Diario della giornata'], ['⚔', 'Missioni'], ['▦', 'Calendario'], ['✦', 'Planner AI'], ['◷', 'Weekly Review'], ['⚖', 'Decisioni']]],
    ['Apprendimento', [['🎓', 'Studio'], ['📚', 'Library'], ['🃏', 'Flashcard'], ['⚙', 'Engineer']]],
    ['Corpo e creatività', [['🏋', 'Leo Protocol', 'questa pagina'], ['⚡', 'Recovery'], ['🎨', 'Arte & Musica'], ['🏛', 'Agora'], ['🎌', 'Agora Anime']]],
    ['Gioco', [['⚔', 'Life RPG'], ['🌌', 'Dungeon']]],
    ['Intelligenza', [['◎', 'Jarvis'], ['✦', 'Second Brain'], ['✧', 'Idea Hub', 'sezione autonoma · da progettare'], ['🤖', 'AI Coach'], ['⚙', 'Profilo operativo']]],
    ['Sistema', [['⚙', 'Impostazioni'], ['⛁', 'Backup e ripristino'], ['🔑', 'Chiave API'], ['⚡', 'PolyFeed']]]
  ];
  const appSearch = h('input', { class: 'field', type: 'search', placeholder: 'Cerca una sezione…', 'aria-label': 'Cerca una sezione', style: 'width:100%' }), appList = h('div', {});
  const drawApps = () => { const qy = appSearch.value.trim().toLocaleLowerCase('it'); appList.replaceChildren(); let n = 0;
    for (const [g, items] of APP_GROUPS) { const ms = items.filter(([, l]) => l.toLocaleLowerCase('it').includes(qy)); if (!ms.length) continue; n += ms.length;
      appList.append(h('div', { class: 'grp' }, h('h3', {}, g), h('div', { class: 'items' }, ms.map(([ic, l, nt]) => h('button', { class: 'item', type: 'button', onclick: () => { dApps.close(); if (l === 'Leo Protocol') go('oggi'); else note('Collegamento simulato: ' + l + '.'); } }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', { class: 'l' }, l, nt ? h('small', {}, nt) : null)))))); }
    if (!n) appList.append(h('p', { class: 'empty' }, 'Nessuna sezione trovata.')); };
  appSearch.addEventListener('input', drawApps); drawApps();
  const dApps = moduleDialog('lo-apps', 'Tutte le app', h('div', {}, h('div', { class: 'sim' }, 'Collegamenti simulati · nessuna funzione esterna viene aperta'), appSearch, appList));
  const dSet = moduleDialog('lo-settings', 'Impostazioni', h('div', {}, h('div', { class: 'sim' }, 'Anteprima della struttura · le voci d\'esempio non modificano l\'app'), h('div', { class: 'legend' }, h('span', {}, h('span', { class: 'badge real' }, 'Esistente'), ' già presente nell\'app'), h('span', {}, h('span', { class: 'badge ex' }, 'Esempio'), ' solo del prototipo')),
    h('div', { class: 'grp' }, h('h3', {}, 'Dati e sicurezza'), h('div', { class: 'set' }, [['Backup e ripristino', 'Esistente in Impostazioni'], ['Chiave API', 'Esistente nell\'Hub']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · anteprima simulata') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge real' }, 'Esistente'))))),
    h('div', { class: 'grp' }, h('h3', {}, 'LEO Protocol'), h('div', { class: 'set' }, [['Dati dei check-in condivisi con l\'assistente', 'Esempio · oggi non è una scelta'], ['Promemoria del check-in', 'Esempio · oggi non esiste']].map(([l, d]) => h('button', { class: 'sw', type: 'button', onclick: () => note(l + ' · voce d\'esempio') }, h('span', { class: 'l' }, l, h('small', {}, d)), h('span', { class: 'badge ex' }, 'Esempio')))))));
  document.getElementById('appsBtn').addEventListener('click', () => dApps.showModal());
  document.getElementById('setBtn').addEventListener('click', () => dSet.showModal());

  window.__leo = { setScen, go, tick, get state() { return { scen, tab, sessions: S.sessions.length, xp: xpTot(), checkins: S.checkins.length, milestones: S.milestones ? S.milestones.length : null, notes: S.notes.length, timer: { ...tm }, summary }; } };
  render();
})();
