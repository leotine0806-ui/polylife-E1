/* Life RPG · prototipo E1. Fixture sintetiche, stato solo in memoria: al ricaricamento tutto torna come prima.
   Livelli, skill, Boss e abilità speciali sono dimostrativi: non descrivono l'utente. Nessuna rete, provider o persistenza. */
(() => {
  const root = document.getElementById('root'), dlg = document.getElementById('dlg'), live = document.getElementById('live');
  const K = k => ({ 'data-k': k });
  const note = msg => { live.textContent = ''; setTimeout(() => { live.textContent = msg; }, 40); };
  const btn = (label, k, fn, cls = '', extra = {}) => h('button', { type: 'button', class: 'rp-btn ' + cls, ...K(k), onclick: fn, ...extra }, label);
  const link = (href, label, sub, k) => h('a', { class: 'rp-link', href, ...K(k) }, h('span', {}, label, sub ? h('small', {}, ' · ' + sub) : null));
  const tag = (cls, t) => h('span', { class: 'rp-tag ' + cls }, t);
  const card = (id, title, extra, ...body) => h('section', { class: 'card rp-card', 'aria-labelledby': id }, h('div', { class: 'rp-hd' }, h('h2', { id }, title), extra || null), ...body);

  /* ---------- Stato della demo ---------- */
  const S = {
    view: 'oggi', xp: 1240, streak: 12, points: 2, done: new Set(['daily-1']), selected: 'concentrazione', log: ['Fixture dimostrativa · 2 novembre 2026'],
    quests: [{ id: 'daily-1', title: 'Ripasso capitolo 4', area: 'Studio', skill: 'Concentrazione', xp: 70 }, { id: 'daily-2', title: 'Allenamento gambe', area: 'Allenamento', skill: 'Movimento', xp: 90 }, { id: 'daily-3', title: 'Riordinare gli appunti', area: 'Studio', skill: 'Costanza', xp: 40 }]
  };
  /* Albero: posizioni in percentuale del riquadro. Livelli e prerequisiti sono fixture. */
  const N = {
    costanza: { name: 'Costanza', branch: 'Radice', kind: 'base', lvl: 2, max: 5, x: 50, y: 12, req: [], desc: 'Tornare sulle cose ogni giorno, anche per poco.' },
    concentrazione: { name: 'Concentrazione', branch: 'Mente', kind: 'base', lvl: 1, max: 5, x: 17, y: 36, req: [['costanza', 1]], desc: 'Restare su un compito senza saltare da una cosa all’altra.' },
    movimento: { name: 'Movimento', branch: 'Corpo', kind: 'base', lvl: 1, max: 5, x: 50, y: 36, req: [['costanza', 1]], desc: 'Far entrare attività fisica nella settimana.' },
    curiosita: { name: 'Curiosità', branch: 'Creazione', kind: 'base', lvl: 1, max: 5, x: 83, y: 36, req: [['costanza', 1]], desc: 'Esplorare argomenti e idee nuove.' },
    studio: { name: 'Studio profondo', branch: 'Mente', kind: 'skill', lvl: 0, max: 5, x: 17, y: 59, req: [['concentrazione', 2]], desc: 'Sessioni lunghe e strutturate su un solo argomento.' },
    resistenza: { name: 'Resistenza', branch: 'Corpo', kind: 'skill', lvl: 0, max: 5, x: 50, y: 59, req: [['movimento', 2]], desc: 'Sostenere un impegno fisico più a lungo.' },
    prototipi: { name: 'Prototipazione', branch: 'Creazione', kind: 'skill', lvl: 0, max: 5, x: 83, y: 59, req: [['curiosita', 2]], desc: 'Trasformare un’idea in una prima prova concreta.' },
    flusso: { name: 'Flusso', branch: 'Mente', kind: 'special', lvl: 0, max: 1, x: 17, y: 86, req: [['studio', 1], ['concentrazione', 3]], desc: 'Abilità speciale dall’albero: le missioni di studio dentro un blocco Focus valgono +10% XP (effetto dimostrativo).' },
    scudo: { name: 'Scudo del ritmo', branch: 'Boss', kind: 'boss', lvl: 0, max: 1, x: 50, y: 86, req: [], boss: 'ritmo', desc: 'Abilità speciale da Boss: una volta a settimana un giorno senza missioni non interrompe la serie (effetto dimostrativo).' },
    visione: { name: 'Visione d’insieme', branch: 'Boss', kind: 'boss', lvl: 0, max: 1, x: 83, y: 86, req: [], boss: 'torre', desc: 'Abilità speciale da Boss: mostra in anticipo i traguardi successivi di un progetto (effetto dimostrativo).' }
  };
  const EDGES = [['costanza', 'concentrazione'], ['costanza', 'movimento'], ['costanza', 'curiosita'], ['concentrazione', 'studio'], ['movimento', 'resistenza'], ['curiosita', 'prototipi'], ['studio', 'flusso']];
  const BOSS = {
    ritmo: { name: 'Il Custode del Ritmo', icon: '⛨', desc: 'Un guardiano che premia la costanza: lo si batte accumulando giorni con almeno una missione completata.', cond: '5 giorni con almeno una missione completata', prog: 3, goal: 5, unit: 'giorni', act: 'Simula un giorno con una missione', reward: 'scudo' },
    torre: { name: 'La Torre del Progetto', icon: '⌂', desc: 'Una torre a più piani: ogni traguardo di un progetto personale è un piano conquistato. I progetti veri restano in Engineer.', cond: '3 traguardi di un progetto personale segnati', prog: 1, goal: 3, unit: 'traguardi', act: 'Segna un traguardo', reward: 'visione' }
  };
  const PROFILE = [['Sonno e risveglio', '23:00 → 07:00'], ['Studio / lavoro', 'Lun–ven · 08:30–15:30'], ['Allenamento', 'Mar / gio / sab'], ['Pasti e pause', 'Pranzo · 13:00'], ['Trasporti fissi', 'Casa ↔ scuola'], ['Indisponibilità', 'Mercoledì · 17:00–19:00'], ['Preferenze Focus', 'Blocchi da 25–45 min'], ['Minimi non negoziabili', 'Sonno e pausa pranzo']];

  const todayXp = () => S.quests.filter(q => S.done.has(q.id)).reduce((n, q) => n + q.xp, 0);
  const level = () => 7 + Math.floor(S.xp / 1500), into = () => S.xp % 1500;
  const reqOk = ([id, l]) => N[id].lvl >= l;
  const status = id => { const n = N[id]; if (n.lvl > 0) return 'unl'; if (n.kind === 'boss') return 'lock'; return n.req.every(reqOk) ? 'avail' : 'lock'; };
  const available = () => Object.keys(N).filter(id => status(id) === 'avail');
  const pts = n => n + (n === 1 ? ' punto' : ' punti');
  const KIND = { base: 'Skill di base', skill: 'Skill', special: 'Abilità speciale · dall’albero', boss: 'Abilità speciale · da Boss' };

  function render(focusK) {
    const fk = focusK === false ? null : focusK || document.activeElement?.dataset?.k, top = window.scrollY;
    const views = { oggi, missioni, albero, boss: bossView, profilo };
    root.replaceChildren(tabs(), ...views[S.view]());
    if (fk) [fk, 'tab-' + S.view].map(k => document.querySelector(`[data-k="${k}"]`)).find(Boolean)?.focus({ preventScroll: true });
    window.scrollTo(0, top);
  }
  const go = v => { S.view = v; render(); };
  const tabs = () => h('nav', { class: 'rp-tabs', 'aria-label': 'Sezioni di Life RPG' }, [['oggi', 'Oggi'], ['missioni', 'Missioni'], ['albero', 'Skill tree'], ['boss', 'Boss'], ['profilo', 'Profilo operativo']].map(([k, l]) => h('button', { type: 'button', ...K('tab-' + k), ...(S.view === k ? { 'aria-current': 'page' } : {}), onclick: () => go(k) }, l)));

  function hero() {
    const pct = Math.round(into() / 1500 * 100);
    return h('section', { class: 'card rp-hero', 'aria-labelledby': 'hero-t' },
      h('div', { class: 'rp-stack' }, h('span', { class: 'eyebrow' }, 'Progressione · simulata'), h('h2', { class: 'rp-big', id: 'hero-t' }, 'Costruisci il tuo percorso'), h('p', { class: 'rp-intro' }, 'Il livello descrive il gioco, non il tuo valore. XP, punti e skill qui sono dati di prova.'),
        h('div', { class: 'rp-stats' }, [['XP di oggi', todayXp() + ' XP'], ['Missioni', `${S.done.size}/${S.quests.length}`], ['Punti abilità', String(S.points)], ['Serie', S.streak + ' giorni']].map(([l, v]) => h('div', { class: 'rp-stat' }, h('b', {}, v), h('span', {}, l))))),
      h('div', { class: 'rp-level' }, h('div', { class: 'num', 'aria-label': 'Livello ' + level() }, String(level()).padStart(2, '0')), h('strong', {}, 'Esploratore'), h('small', {}, `${into()} / 1.500 XP · livello dimostrativo`),
        h('div', { class: 'rp-xp' }, h('div', { class: 'rp-bar', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '1500', 'aria-valuenow': String(into()), 'aria-label': 'XP verso il prossimo livello' }, h('i', { style: `width:${pct}%` })), h('small', {}, `${1500 - into()} XP al prossimo livello`))));
  }

  /* ---------- Missioni ---------- */
  function toggle(id) {
    const q = S.quests.find(x => x.id === id);
    if (S.done.has(id)) {
      if (S.points < 1) { note('Il punto abilità di questa missione è già stato speso nell’albero: il completamento resta (demo).'); return; }
      S.done.delete(id); S.xp = Math.max(0, S.xp - q.xp); S.points -= 1; S.log.unshift(`Annullato: ${q.title} · −${q.xp} XP, −1 punto (demo)`); render(); note(`Completamento annullato nella demo: ${q.title}`);
    } else { S.done.add(id); S.xp += q.xp; S.points += 1; S.log.unshift(`Completato: ${q.title} · +${q.xp} XP, +1 punto abilità (demo)`); render(); note(`Completata nella demo: ${q.title}, più ${q.xp} XP e un punto abilità`); }
  }
  function missionRows() {
    return S.quests.length ? S.quests.map(q => { const d = S.done.has(q.id); return h('div', { class: 'rp-mission' + (d ? ' done' : '') }, h('button', { type: 'button', class: 'rp-check', ...K('q-' + q.id), 'aria-pressed': String(d), 'aria-label': (d ? 'Annulla completamento: ' : 'Completa: ') + q.title, onclick: () => toggle(q.id) }, d ? '✓' : ''), h('div', {}, h('b', {}, q.title), h('small', {}, `${q.area} · allena ${q.skill}`)), h('span', { class: 'rp-xpv' }, `+${q.xp} XP · +1 punto`)); }) : [h('p', { class: 'rp-intro' }, 'Nessuna missione nella demo.')];
  }
  const missionCard = full => card('m-t', full ? 'Elenco missioni' : 'Missioni di oggi', tag('sim', 'Demo'), h('p', { class: 'rp-intro' }, 'Premi la casella per simulare il completamento: aggiunge XP e un punto abilità. Le missioni si condividono con la sezione Missioni.'), h('div', {}, ...missionRows()),
    h('div', { class: 'rp-acts' }, btn('Aggiungi missione demo', 'q-add', addQuest, full ? 'primary' : ''), btn('Azzera la giornata demo', 'q-reset', resetDay, 'ghost')));
  function oggi() {
    const next = S.quests.find(q => !S.done.has(q.id)), av = available();
    const tree = card('o-tr', 'Skill tree', tag('cy', pts(S.points)), h('p', { class: 'rp-intro' }, av.length ? `Puoi sbloccare: ${av.map(id => N[id].name).join(', ')}.` : 'Nessuna skill sbloccabile adesso: allena le skill di base per aprire i rami.'), btn('Apri lo skill tree', 'o-tree', () => go('albero'), 'ghost'));
    const boss = card('o-bo', 'Boss', null, ...Object.entries(BOSS).map(([k, b]) => h('div', { class: 'rp-stack' }, h('div', { class: 'rp-hd' }, h('b', {}, b.name), h('span', { class: 'rp-xpv' }, `${b.prog}/${b.goal} ${b.unit}`)), segs(b))), btn('Vai ai Boss', 'o-boss', () => go('boss'), 'ghost'));
    const nx = card('o-nx', 'Prossimo passo', tag('sim', 'Proposta'), h('p', { class: 'rp-intro' }, next ? `Suggerimento d’interfaccia: «${next.title}». Non è una decisione automatica.` : 'Hai completato tutte le missioni sintetiche di oggi.'));
    const log = card('o-lg', 'Attività recente', tag('sim', 'Demo'), h('div', { class: 'rp-log' }, S.log.slice(0, 5).map(x => h('p', {}, x))));
    return [hero(), h('div', { class: 'rp-grid' }, h('div', { class: 'rp-stack' }, missionCard(false), nx), h('aside', { class: 'rp-stack' }, tree, boss, log))];
  }
  function missioni() {
    const rules = card('m-r', 'Regole della demo', null, h('div', {}, [['Missione completata', '+XP indicati e +1 punto abilità'], ['Annullamento', 'toglie XP e punto, se il punto non è già stato speso'], ['Reset della giornata', 'toglie solo le spunte di oggi'], ['Restano dopo il reset', 'XP totale, punti, skill, Boss e storico']].map(([a, b]) => h('div', { class: 'rp-own' }, h('b', {}, a), h('span', {}, b)))), h('p', { class: 'rp-fine' }, 'Nel prodotto XP e completamenti li conferma il server; qui cambiano solo nella pagina.'));
    return [hero(), h('div', { class: 'rp-grid' }, missionCard(true), h('aside', { class: 'rp-stack' }, rules, card('m-l', 'Sezioni collegate', null, h('div', { class: 'rp-links' }, link('../missions/index.html', 'Missioni', 'piano del giorno', 'ln-missions'), link('../calendar/index.html', 'Calendario', 'impegni e orari', 'ln-calendar')))))];
  }
  function addQuest() {
    const err = h('p', { class: 'rp-err', role: 'alert' });
    const form = h('form', { class: 'rp-form', novalidate: '', onsubmit: e => { e.preventDefault(); const f = e.currentTarget, title = f.elements.title.value.trim(), xp = Number(f.elements.xp.value); if (!title) { err.textContent = 'Scrivi il nome della missione.'; f.elements.title.focus(); return; } if (!Number.isInteger(xp) || xp < 0 || xp > 500) { err.textContent = 'La ricompensa deve essere un numero intero da 0 a 500.'; f.elements.xp.focus(); return; } S.quests.push({ id: 'demo-' + (S.quests.length + 1), title, area: 'Personale', skill: 'Costanza', xp }); S.log.unshift(`Aggiunta missione: ${title} (demo)`); dlg.close(); render(); note('Missione aggiunta soltanto alla demo'); } },
      h('label', {}, 'Nome della missione', h('input', { name: 'title', maxlength: '80', placeholder: 'Per esempio: preparare il materiale' })), h('label', {}, 'Ricompensa in XP (0–500)', h('input', { name: 'xp', type: 'number', min: '0', max: '500', step: '10', value: '50' })), err, h('button', { class: 'rp-btn primary', type: 'submit', ...K('q-add-ok') }, 'Aggiungi alla demo'));
    openDialog('Nuova missione sintetica', form); form.elements.title.focus();
  }
  function resetDay() {
    openDialog('Azzerare la giornata demo?', h('div', { class: 'rp-stack' }, h('p', { class: 'rp-intro' }, 'Toglie le spunte di oggi e azzera gli XP di oggi. XP totale, punti abilità, skill, Boss e storico restano come sono.'), h('div', { class: 'rp-acts' }, btn('Azzera la giornata', 'reset-ok', () => { S.done.clear(); S.log.unshift('Giornata demo azzerata · progressione, skill e Boss conservati'); dlg.close(); render(); note('Giornata demo azzerata'); }, 'primary'), btn('Annulla', 'reset-no', () => dlg.close(), 'ghost'))));
  }

  /* ---------- Skill tree ---------- */
  function tree() {
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'rp-lines'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
    EDGES.forEach(([a, b]) => { const l = document.createElementNS(NS, 'line'), st = N[b].lvl > 0 ? 'on' : status(b) === 'avail' ? 'avail' : 'off'; [['x1', N[a].x], ['y1', N[a].y], ['x2', N[b].x], ['y2', N[b].y]].forEach(([k, v]) => l.setAttribute(k, v)); l.setAttribute('class', st); svg.append(l); });
    const sep = document.createElementNS(NS, 'line'); [['x1', 2], ['y1', 74], ['x2', 98], ['y2', 74]].forEach(([k, v]) => sep.setAttribute(k, v)); sep.setAttribute('class', 'off'); svg.append(sep);
    const nodes = Object.entries(N).map(([id, n]) => { const st = status(id), sym = n.lvl > 0 ? (n.max > 1 ? 'L' + n.lvl : '✦') : n.kind === 'boss' ? '⚔' : st === 'avail' ? '+' : '—';
      return h('button', { type: 'button', class: `rp-node ${n.kind} ${st}`, style: `left:${n.x}%;top:${n.y}%`, ...K('node-' + id), 'aria-pressed': String(S.selected === id), 'aria-label': `${n.name}, ${KIND[n.kind]}, ${st === 'unl' ? (n.max > 1 ? 'livello ' + n.lvl + ' su ' + n.max : 'sbloccata') : st === 'avail' ? 'sbloccabile' : 'bloccata'}`, onclick: () => { S.selected = id; render(); } },
        h('span', { class: 'shape', 'aria-hidden': 'true' }, h('span', {}, sym)), h('span', { class: 'lbl', 'aria-hidden': 'true' }, n.name)); });
    return h('div', { class: 'rp-tree', role: 'group', 'aria-label': 'Albero delle skill: nodi collegati dai prerequisiti' }, svg, h('span', { class: 'rp-branch', style: 'left:50%;top:69%' }, 'Abilità speciali'), ...nodes);
  }
  function detail() {
    const id = S.selected, n = N[id], st = status(id);
    const reqs = n.kind === 'boss' ? [h('div', {}, h('i', { class: n.lvl ? 'ok' : '' }), `Battere il Boss «${BOSS[n.boss].name}»`)] : n.req.length ? n.req.map(([r, l]) => h('div', {}, h('i', { class: reqOk([r, l]) ? 'ok' : '' }), `${N[r].name} al livello ${l} (ora ${N[r].lvl})`)) : [h('div', {}, h('i', { class: 'ok' }), 'Nessuno: è la radice dell’albero')];
    const how = n.kind === 'boss' ? `Non si sblocca con i punti: arriva solo battendo «${BOSS[n.boss].name}».` : st === 'unl' ? (n.lvl < n.max ? `Sbloccata. Ogni livello in più costa 1 punto abilità (ne hai ${S.points}).` : 'Sbloccata al livello massimo della demo.') : st === 'avail' ? `Prerequisiti soddisfatti: si sblocca con 1 punto abilità (ne hai ${S.points}).` : 'Bloccata: prima completa i prerequisiti indicati sopra.';
    let action = null;
    if (n.kind === 'boss') action = btn('Vai al Boss', 'd-boss', () => go('boss'), 'gold');
    else if (st === 'avail') action = btn('Sblocca · 1 punto', 'd-unlock', () => spend(id, 'Sbloccata'), 'primary', S.points < 1 ? { disabled: '' } : {});
    else if (st === 'unl' && n.lvl < n.max) action = btn('Allena · +1 livello (1 punto)', 'd-train', () => spend(id, 'Livello aumentato'), 'primary', S.points < 1 ? { disabled: '' } : {});
    return card('sk-d', 'Skill selezionata', tag(n.kind === 'boss' ? 'gold' : n.kind === 'special' ? 'sim' : 'cy', KIND[n.kind]), h('div', { class: 'rp-detail' }, h('h3', {}, n.name), h('p', { class: 'rp-fine' }, 'Ramo: ' + n.branch), h('p', { class: 'rp-intro' }, n.desc),
      n.max > 1 ? h('div', { class: 'rp-stack' }, h('span', { class: 'rp-fine' }, `Livello ${n.lvl} su ${n.max} · valore dimostrativo`), h('div', { class: 'rp-lv', 'aria-hidden': 'true' }, Array.from({ length: n.max }, (_, i) => h('i', { class: i < n.lvl ? 'on' : '' })))) : h('span', { class: 'rp-fine' }, n.lvl ? 'Sbloccata nella demo' : 'Non ancora sbloccata'),
      h('div', { class: 'rp-req' }, h('b', { class: 'rp-fine' }, 'Prerequisiti'), ...reqs), h('p', { class: 'rp-how' }, how), action, S.points < 1 && (st === 'avail' || (st === 'unl' && n.lvl < n.max)) && n.kind !== 'boss' ? h('p', { class: 'rp-fine' }, 'Nessun punto disponibile: completa una missione per guadagnarne uno.') : null));
  }
  function spend(id, what) { if (S.points < 1) return; S.points -= 1; N[id].lvl += 1; S.log.unshift(`${what}: ${N[id].name} · −1 punto (demo)`); render(); note(`${what} nella demo: ${N[id].name}`); }
  function albero() {
    const legend = h('div', { class: 'rp-legend' }, h('span', {}, h('i', {}), 'sbloccata'), h('span', {}, h('i', { class: 'd' }), 'sbloccabile'), h('span', {}, h('i', { class: 'l' }), 'bloccata'), h('span', {}, h('i', { class: 's' }), 'speciale dall’albero'), h('span', {}, h('i', { class: 'b' }), 'speciale da Boss'));
    const ways = card('sk-w', 'Due modi di ottenere un’abilità speciale', null, h('div', { class: 'rp-ways' }, h('div', { class: 'rp-way tree' }, h('b', {}, 'Dall’albero'), h('span', { class: 'rp-intro' }, '«Flusso»: si raggiunge seguendo il ramo Mente e spendendo punti abilità.')), h('div', { class: 'rp-way boss' }, h('b', {}, 'Dai Boss'), h('span', { class: 'rp-intro' }, '«Scudo del ritmo» e «Visione d’insieme»: non si comprano con i punti, si ottengono battendo un Boss.'))));
    const assess = card('sk-a', 'Valutazione iniziale', tag('sim', 'In arrivo'), h('p', { class: 'rp-intro' }, 'Servirà a verificare le quattro skill di base e proporre un livello di partenza, che confermerai tu. Oggi non è attiva: i livelli dell’albero sono fixture.'), btn('Vedi come funzionerà', 'sk-assess', assessDialog, 'ghost'));
    return [card('sk-t', 'Skill tree', tag('cy', pts(S.points) + ' abilità'), h('p', { class: 'rp-intro' }, 'Le skill di base aprono i rami; ogni nodo richiede i precedenti. Seleziona un nodo per vedere dettagli e prerequisiti. Livelli e condizioni sono sintetici.'), legend, tree()),
      h('div', { class: 'rp-grid sk' }, h('div', { class: 'rp-stack' }, ways, assess), h('aside', { class: 'rp-stack rp-detail-col' }, detail()))];
  }
  function assessDialog() {
    openDialog('Valutazione iniziale · anteprima', h('div', { class: 'rp-stack' }, h('ol', { class: 'rp-steps' }, h('li', {}, 'Scegli quali skill di base verificare: Costanza, Concentrazione, Movimento, Curiosità.'), h('li', {}, 'Rispondi a poche domande brevi per ciascuna.'), h('li', {}, 'Vedi un livello di partenza proposto e lo confermi o lo correggi tu.'), h('li', {}, 'Puoi ripeterla quando vuoi; non sostituisce ciò che registri giorno per giorno.')),
      h('div', { class: 'rp-q' }, tag('sim', 'Fixture · esempio di domanda'), h('b', {}, 'Concentrazione · Quanto spesso riesci a lavorare 25 minuti senza interruzioni?'), h('ol', {}, h('li', {}, 'Quasi mai'), h('li', {}, 'A volte'), h('li', {}, 'Spesso'), h('li', {}, 'Quasi sempre'))),
      h('p', { class: 'rp-fine' }, 'Nessuna risposta viene raccolta e nessun livello viene assegnato. Le domande reali sono da definire.'), btn('Inizia la valutazione · non disponibile nel prototipo', 'assess-start', null, '', { disabled: '' })));
  }

  /* ---------- Boss ---------- */
  function segs(b) { return h('div', { class: 'rp-segs', role: 'img', 'aria-label': `${b.prog} su ${b.goal} ${b.unit}` }, Array.from({ length: b.goal }, (_, i) => h('i', { class: i < b.prog ? 'on' : '' }))); }
  function bossView() {
    const cards = Object.entries(BOSS).map(([k, b]) => { const r = N[b.reward], won = b.prog >= b.goal;
      return h('article', { class: 'rp-boss' + (won ? ' won' : ''), 'aria-labelledby': 'b-' + k }, h('div', { class: 'rp-boss-top' }, h('span', { class: 'rp-boss-ic', 'aria-hidden': 'true' }, b.icon), h('div', {}, h('h3', { id: 'b-' + k }, b.name), h('span', { class: 'sub' }, won ? 'Battuto nella demo' : 'Boss attivo · esempio'))), h('p', { class: 'rp-intro' }, b.desc),
        h('div', { class: 'rp-stack' }, h('div', { class: 'rp-hd' }, h('span', { class: 'rp-fine' }, 'Condizione di vittoria: ' + b.cond + ' (demo)'), h('b', { class: 'rp-xpv' }, `${b.prog}/${b.goal}`)), segs(b)),
        h('div', { class: 'rp-reward' + (won ? ' won' : '') }, h('i', { class: 'rp-dia', 'aria-hidden': 'true' }), h('span', {}, h('b', {}, (won ? 'Sbloccata: ' : 'Ricompensa: ') + r.name), h('small', {}, r.desc.replace('Abilità speciale da Boss: ', '')))),
        won ? h('p', { class: 'rp-won', role: 'status' }, 'Vittoria simulata. L’abilità compare nell’albero solo finché non ricarichi la pagina: non è permanente.') : null,
        h('div', { class: 'rp-acts' }, won ? btn('Ripristina il Boss · demo', 'b-reset-' + k, () => { b.prog = k === 'ritmo' ? 3 : 1; r.lvl = 0; S.log.unshift(`Boss ripristinato: ${b.name} (demo)`); render(); note('Boss ripristinato nella demo'); }, 'ghost') : btn(b.act + ' · demo', 'b-hit-' + k, () => { b.prog += 1; if (b.prog >= b.goal) { r.lvl = 1; S.log.unshift(`Boss battuto: ${b.name} · sbloccata ${r.name} (demo)`); note(`Vittoria simulata su ${b.name}: sbloccata ${r.name}`); } else { S.log.unshift(`${b.name}: ${b.prog}/${b.goal} (demo)`); note(`${b.name}: ${b.prog} su ${b.goal}`); } render(); }, 'gold'),
          btn('Vedi nello skill tree', 'b-tree-' + k, () => { S.selected = b.reward; go('albero'); }, 'ghost'))); });
    return [hero(), card('b-t', 'Boss', tag('sim', 'Vittorie simulate'), h('p', { class: 'rp-intro' }, 'Grandi obiettivi a lungo termine. Battere un Boss sblocca un’abilità speciale che non si può ottenere con i punti dell’albero. Il reset della giornata non tocca i Boss.'), h('div', { class: 'rp-bosses' }, cards)),
      card('b-w', 'Albero o Boss?', null, h('div', { class: 'rp-ways' }, h('div', { class: 'rp-way tree' }, h('b', {}, 'Albero'), h('span', { class: 'rp-intro' }, 'Si spendono punti abilità seguendo i prerequisiti. Esempio: «Flusso».')), h('div', { class: 'rp-way boss' }, h('b', {}, 'Boss'), h('span', { class: 'rp-intro' }, 'Si raggiunge la condizione di vittoria. Esempi: «Scudo del ritmo», «Visione d’insieme».'))), h('p', { class: 'rp-fine' }, 'Nessuna classifica e nessun confronto con altre persone.'))];
  }

  /* ---------- Profilo operativo ---------- */
  function profilo() {
    return [h('div', { class: 'rp-grid' }, card('p-t', 'Profilo operativo', tag('own', 'Sezione proprietaria'), h('p', { class: 'rp-intro' }, 'Life RPG mostra questa vista ma non ne è proprietario: i valori appartengono al Profilo operativo e qui sono inventati.'), h('div', { class: 'rp-profile' }, PROFILE.map(([a, b]) => h('div', { class: 'rp-profile-item' }, h('b', {}, a), h('span', {}, b), h('em', {}, 'FIXTURE · PROFILO OPERATIVO')))),
      h('div', { class: 'rp-acts' }, btn('Modifica nella sezione proprietaria', 'p-edit', () => openDialog('Modificare il Profilo operativo', h('div', { class: 'rp-stack' }, h('p', { class: 'rp-intro' }, 'Le modifiche si fanno nel Profilo operativo, con convalida, consenso e annullamento. Life RPG non tiene una seconda copia.'), h('p', { class: 'rp-fine' }, 'Il prototipo del Profilo operativo non esiste ancora: nessun campo viene modificato.'))), 'ghost'))),
      h('aside', { class: 'rp-stack' }, card('p-u', 'Come viene usato', null, h('div', {}, [['Per il gioco', 'routine e indisponibilità danno contesto al ritmo delle missioni, senza diventare completamenti'], ['Per la pianificazione', 'orari e blocchi fissi restano nel Profilo operativo e nel Calendario'], ['Per la privacy', 'nessun dato reale è caricato; nessun assistente o provider chiamato']].map(([a, b]) => h('div', { class: 'rp-own' }, h('b', {}, a), h('span', {}, b))))),
        card('p-l', 'Sezioni collegate', null, h('div', { class: 'rp-links' }, link('../leo/index.html', 'LEO Protocol', 'allenamento e check-in', 'ln-leo'), link('../calendar/index.html', 'Calendario', 'impegni', 'ln-cal'), link('../missions/index.html', 'Missioni', 'piano del giorno', 'ln-mis')))))];
  }

  /* ---------- Finestre ---------- */
  let opener = null;
  function openDialog(title, body) { opener = document.activeElement; document.getElementById('dlg-t').textContent = title; document.getElementById('dlg-b').replaceChildren(h('p', { class: 'rp-sim' }, 'Simulazione · nessun salvataggio'), body); if (!dlg.open) dlg.showModal(); }
  document.getElementById('dlg-x').onclick = () => dlg.close();
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => { const k = opener?.dataset?.k, id = opener?.id; setTimeout(() => (k && document.querySelector(`[data-k="${k}"]`) || id && document.getElementById(id) || document.querySelector(`[data-k="tab-${S.view}"]`))?.focus({ preventScroll: true }), 0); });
  const apps = ['Hub', 'Missioni', 'Calendario', 'Planner', 'Studio', 'Flashcard', 'Biblioteca', 'LEO Protocol', 'Recovery', 'Engineer', 'Agora', 'Nexus', 'Second Brain', 'Atlas', 'Diario'];
  document.getElementById('appsBtn').addEventListener('click', () => openDialog('Tutte le app', h('div', { class: 'rp-list' }, apps.map(n => btn(n, 'app-' + n, () => { dlg.close(); note('Collegamento demo · ' + n); }, 'ghost')))));
  document.getElementById('setBtn').addEventListener('click', () => openDialog('Impostazioni', h('p', { class: 'rp-intro' }, 'Le impostazioni reali non sono riprodotte. Qui progressi e sblocchi restano solo nella pagina.')));

  window.__rpg = { get state() { return { view: S.view, xp: S.xp, level: level(), points: S.points, done: S.done.size, quests: S.quests.length, selected: S.selected, skills: Object.fromEntries(Object.entries(N).map(([k, n]) => [k, n.lvl])), boss: Object.fromEntries(Object.entries(BOSS).map(([k, b]) => [k, b.prog])) }; }, go };
  render(false);
})();
