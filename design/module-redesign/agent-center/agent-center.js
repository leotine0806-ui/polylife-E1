(() => {
  const root = document.querySelector('#root'), live = document.querySelector('#live'), dialog = document.querySelector('#dlg');
  const state = { page: 'overview', tasks: [{ title: 'Rivedere il piano della settimana', owner: 'Jarvis · consultivo', status: 'Da rivedere' }], rules: { approval: true, sources: true, automatic: false }, selected: null };
  const squad = [
    { icon: '▦', name: 'Agenda', areas: 'Calendario · Missioni · Planner · Focus', reads: 'Impegni, missioni e piani.', proposes: 'Ordine della giornata, Focus e possibili spostamenti.', never: 'Non sposta impegni da solo.' },
    { icon: '◈', name: 'Studio', areas: 'Studio · Flashcard · Biblioteca', reads: 'Materie, verifiche, carte e letture.', proposes: 'Ripassi, carte da preparare e prossima lettura.', never: 'Non crea voti né carte senza revisione.' },
    { icon: '◍', name: 'Corpo', areas: 'LEO Protocol · Recovery', reads: 'Sessioni, check-in e attività saltate.', proposes: 'Piano della settimana e recupero.', never: 'Non dà diagnosi né valutazioni cliniche.' },
    { icon: '⌬', name: 'Laboratorio', areas: 'Engineer', reads: 'Progetti, esercizi e diario.', proposes: 'Prossima milestone o esercizio.', never: 'Non valuta la competenza.' },
    { icon: '❖', name: 'Dialoghi', areas: 'Agora · Nexus · Arte & Musica', reads: 'Conversazioni con i personaggi.', proposes: 'Personaggio o tema da riprendere.', never: 'Non trasforma interpretazioni in fatti.' },
    { icon: '✦', name: 'Memoria', areas: 'Second Brain · fonti · archivio', reads: 'Solo fonti autorizzate una a una.', proposes: 'Collegamenti tra note e idee.', never: 'Non legge Obsidian senza consenso.' }
  ];
  const pages = [['overview', 'Panoramica'], ['squad', 'Squadra proposta'], ['tasks', 'Incarichi'], ['rules', 'Regole e accessi'], ['connectors', 'Connettori']];
  function el(tag, attrs = {}, ...children) { const node = document.createElement(tag); for (const [key, value] of Object.entries(attrs)) { if (key === 'class') node.className = value; else if (key.startsWith('on')) node.addEventListener(key.slice(2), value); else if (value != null && value !== false) node.setAttribute(key, value === true ? '' : String(value)); } for (const child of children.flat()) node.append(child instanceof Node ? child : document.createTextNode(child ?? '')); return node; }
  const button = (text, fn, cls = 'j-btn') => el('button', { type: 'button', class: cls, onclick: fn }, text);
  const card = (title, ...children) => el('section', { class: 'card j-card' }, el('h2', {}, title), ...children);
  const copy = text => el('p', { class: 'ac-copy' }, text);
  const announce = text => { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 20); };
  function frame(content) {
    const nav = el('nav', { class: 'ac-nav', 'aria-label': 'Agent Center' });
    pages.forEach(([id, title]) => { const b = button(title, () => { state.page = id; render(); }, state.page === id ? 'j-btn primary' : 'j-btn ghost'); if (state.page === id) b.setAttribute('aria-current', 'page'); nav.append(b); });
    root.replaceChildren(el('div', { class: 'ac-root' }, nav, content));
  }
  function hero(title, text) { return el('section', { class: 'card ac-hero' }, el('div', {}, el('div', { class: 'eyebrow' }, 'Orchestrazione · demo'), el('h2', {}, title), copy(text), el('div', { class: 'ac-summary' }, stat('Agente attivo nel prodotto', '1 · Jarvis v1'), stat('Specialisti proposti', '6 · non attivi'), stat('Connessioni demo attive', '0'))), el('div', { class: 'ac-stamp', 'aria-hidden': 'true' }, 'AC')); }
  function stat(label, value) { return el('div', { class: 'ac-stat' }, el('b', {}, value), el('small', {}, label)); }
  function flow() { const labels = ['Tu · richiesta', 'Jarvis · agente v1', 'Responsabile proposto', 'Guardiano · controlli', 'Tua approvazione']; return el('div', { class: 'ac-flow' }, labels.map((label, i) => el('div', { class: 'ac-step' }, el('b', {}, String(i + 1).padStart(2, '0')), label))); }
  function agentCard(agent) { return el('article', { class: 'ac-agent' }, el('div', { class: 'ac-agent-head' }, el('span', { class: 'ac-icon', 'aria-hidden': 'true' }, agent.icon), el('div', {}, el('h3', {}, agent.name), el('span', { class: 'ac-tag' }, 'Responsabile proposto · non attivo'))), el('small', { class: 'j-muted' }, agent.areas), el('ul', {}, el('li', {}, el('b', {}, 'Legge: '), agent.reads), el('li', {}, el('b', {}, 'Propone: '), agent.proposes), el('li', {}, el('b', {}, 'Limite: '), agent.never)), button('Esamina il ruolo', () => { state.selected = agent; render(); }, 'j-btn ghost')); }
  function overview() {
    const status = card('Sistema · stato dichiarato',
      el('div', { class: 'ac-demo-marker' }, 'PROTOTIPO · NESSUNA TELEMETRIA'),
      el('div', { class: 'ac-brief' },
        [['Agente v1', 'Jarvis · consultivo'], ['Specialisti', '6 proposti · 0 attivi'], ['Avvii automatici', 'Nessuno nella demo'], ['Connessioni', '0 collegate']].map(([name, value]) =>
          el('div', { class: 'ac-brief-row' }, el('b', {}, name), el('span', {}, value)))),
      copy('I valori descrivono la demo. Non misurano lo stato del computer o dell’app installata.'));
    status.classList.add('ac-area-status');
    const control = card('Controllo umano',
      el('div', { class: 'ac-demo-marker' }, 'NESSUNA ESECUZIONE AUTONOMA'),
      el('div', { class: 'ac-brief' },
        [['Preparazione', 'Jarvis propone'], ['Verifica', 'Fonti e limiti visibili'], ['Conferma', 'Sempre tua'], ['Connettori', 'Disconnessi nella demo']].map(([name, value]) =>
          el('div', { class: 'ac-brief-row' }, el('b', {}, name), el('span', {}, value)))),
      button('Apri regole e accessi', () => { state.page = 'rules'; render(); }, 'j-btn ghost'));
    control.classList.add('ac-area-control');
    const core = el('section', { class: 'ac-core-panel ac-area-core', 'aria-labelledby': 'ac-core-title' },
      el('div', { class: 'eyebrow' }, 'Capo della squadra · proposta'),
      el('div', { class: 'ac-core', id: 'ac-core' },
        el('div', { class: 'ac-core-text' }, el('span', { class: 'ac-core-mark', 'aria-hidden': 'true' }, '✦'), el('b', { id: 'ac-core-title' }, 'ATLAS'), el('small', {}, 'CAPO PROPOSTO'))),
      el('p', { class: 'ac-core-note' }, 'Oggi nel prodotto c’è solo Jarvis v1. Atlas e la squadra sotto sono una proposta di design.'),
      el('a', { class: 'ac-link', href: '../jarvis/index.html' }, 'Apri Jarvis'));
    const sel = state.selected;
    const roles = el('div', { class: 'ac-tree ac-area-tree', role: 'group', 'aria-label': 'Squadra proposta collegata ad Atlas: sei responsabili, nessuno attivo' },
      el('div', { class: 'ac-tree-label' }, el('span', { class: 'ac-tag' }, 'Collegamenti proposti · nessuno attivo')),
      el('div', { class: 'ac-role-map' }, squad.map(agent => {
        const b = el('button', { type: 'button', class: 'ac-role-button', 'data-k': 'role-' + agent.name, 'aria-pressed': String(sel === agent), onclick: () => { state.selected = sel === agent ? null : agent; render(); } },
          el('span', { class: 'ac-role-head' }, el('span', { class: 'ac-icon', 'aria-hidden': 'true' }, agent.icon), el('strong', {}, agent.name)),
          el('small', {}, agent.areas),
          el('span', { class: 'ac-role-foot' }, el('span', { class: 'ac-tag' }, 'Proposto · off'), el('i', { class: 'ac-flat', 'aria-hidden': 'true' })));
        return b;
      })));
    const detail = sel ? card('Ruolo selezionato · ' + sel.name,
      el('span', { class: 'ac-tag' }, 'Responsabile proposto · non attivo'),
      el('small', { class: 'j-muted' }, sel.areas),
      el('ul', { class: 'ac-detail-list' }, el('li', {}, el('b', {}, 'Legge: '), sel.reads), el('li', {}, el('b', {}, 'Propone: '), sel.proposes), el('li', {}, el('b', {}, 'Limite: '), sel.never)),
      el('div', { class: 'ac-actions' }, button('Apri nella Squadra proposta', () => { state.page = 'squad'; render(); }, 'j-btn ghost'), button('Chiudi il dettaglio', () => { state.focusKey = 'role-' + sel.name; state.selected = null; render(); }, 'j-btn ghost'))) : null;
    if (detail) detail.classList.add('ac-area-detail');
    const command = el('section', { class: 'ac-command', 'aria-label': 'Centro di comando: Atlas e squadra proposta' }, wiresSvg(), core, status, control, roles, detail);
    const missions = card('Incarichi · demo', taskList(2),
      button('Apri la coda', () => { state.page = 'tasks'; render(); }, 'j-btn ghost'));
    const approvals = card('Da rivedere · demo',
      el('div', { class: 'ac-callout' }, 'Una bozza consultiva di esempio attende revisione. Questa schermata non approva né avvia alcuna azione.'),
      button('Esamina la bozza', () => { state.page = 'tasks'; render(); }, 'j-btn ghost'));
    const activity = card('Attività illustrativa', el('div', { class: 'ac-feed' },
      ['Richiesta consultiva preparata · fixture', 'Nessun provider collegato', 'Memoria personale non consultata'].map(text =>
        el('div', { class: 'ac-feed-row' }, el('span', { class: 'ac-feed-dot', 'aria-hidden': 'true' }), el('span', {}, text)))));
    const memory = card('Memoria e fonti',
      copy('Le fonti del Second Brain e di Obsidian non entrano automaticamente nella squadra.'),
      el('div', { class: 'ac-demo-marker' }, '0 FONTI PERSONALI LETTE NELLA DEMO'),
      el('a', { class: 'ac-link', href: '../second-brain/index.html' }, 'Apri Second Brain'));
    const dashboard = el('div', { class: 'ac-dashboard' }, missions, approvals, activity, memory,
      card('Percorso delle richieste', flow(), copy('Schema di progetto: gli specialisti non ricevono ancora incarichi reali.')));
    frame(el('div', {},
      hero('Agent Center', 'Supervisiona Jarvis e disegna la futura squadra. In alto Atlas, il capo proposto, collegato ai sei responsabili di area: tutti ancora da costruire.'),
      command, dashboard));
    requestAnimationFrame(drawWires);
  }
  function wiresSvg() { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('class', 'ac-wires'); s.setAttribute('aria-hidden', 'true'); return s; }
  /* Collegamenti Atlas → responsabili: percorsi ortogonali calcolati sulle posizioni reali, quindi validi a ogni larghezza. */
  function drawWires() {
    const box = document.querySelector('.ac-command'), svg = box && box.querySelector('.ac-wires'), coreEl = document.getElementById('ac-core');
    if (!box || !svg || !coreEl) return;
    const NS = 'http://www.w3.org/2000/svg', B = box.getBoundingClientRect(), C = coreEl.getBoundingClientRect(), P = box.querySelector('.ac-area-core').getBoundingClientRect();
    const cards = [...box.querySelectorAll('.ac-role-button')].map(e => { const r = e.getBoundingClientRect(); return { l: r.left - B.left, r: r.right - B.left, t: r.top - B.top, b: r.bottom - B.top, cx: (r.left + r.right) / 2 - B.left }; });
    svg.setAttribute('viewBox', `0 0 ${B.width} ${B.height}`); svg.setAttribute('width', B.width); svg.setAttribute('height', B.height);
    svg.replaceChildren();
    const defs = document.createElementNS(NS, 'defs'), mk = document.createElementNS(NS, 'marker');
    [['id', 'ac-arrow'], ['viewBox', '0 0 10 10'], ['refX', '8'], ['refY', '5'], ['markerWidth', '7'], ['markerHeight', '7'], ['orient', 'auto-start-reverse']].forEach(([k, v]) => mk.setAttribute(k, v));
    const tip = document.createElementNS(NS, 'path'); tip.setAttribute('d', 'M0 0 L10 5 L0 10 z'); tip.setAttribute('class', 'ac-wire-tip'); mk.append(tip); defs.append(mk); svg.append(defs);
    const ax = (C.left + C.right) / 2 - B.left, ay = P.bottom - B.top;
    const rows = []; cards.forEach(c => { const row = rows.find(r => Math.abs(r.t - c.t) < 8); if (row) row.items.push(c); else rows.push({ t: c.t, items: [c] }); });
    rows.sort((a, b) => a.t - b.t); rows.forEach(r => r.items.sort((a, b) => a.l - b.l));
    const path = (d, end) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'ac-wire'); if (end) p.setAttribute('marker-end', 'url(#ac-arrow)'); svg.append(p); };
    if (!rows.length) return;
    const single = rows.every(r => r.items.length === 1);
    if (single) {
      const lx = Math.min(...cards.map(c => c.l)) - 12, y0 = rows[0].t - 16;
      path(`M${ax} ${ay} V${y0} H${lx}`);
      cards.forEach(c => { const my = c.t + 28; path(`M${lx} ${y0} V${my} H${c.l - 2}`, true); });
      return;
    }
    const first = rows[0].items, gaps = first.slice(1).map((c, i) => (first[i].r + c.l) / 2);
    const gx = gaps.length ? gaps.reduce((best, g) => Math.abs(g - ax) < Math.abs(best - ax) ? g : best, gaps[0]) : ax;
    rows.forEach((row, ri) => {
      const busY = row.t - 16;
      if (ri === 0) path(`M${ax} ${ay} V${busY}`);
      else path(`M${ax} ${rows[0].t - 16} H${gx} V${busY}`);
      const xs = row.items.map(c => c.cx), x0 = Math.min(...xs, ri === 0 ? ax : gx), x1 = Math.max(...xs, ri === 0 ? ax : gx);
      path(`M${x0} ${busY} H${x1}`);
      row.items.forEach(c => path(`M${c.cx} ${busY} V${c.t - 2}`, true));
    });
  }
  function taskList(limit = Infinity) { return el('div', { class: 'ac-stack' }, state.tasks.slice(0, limit).map((task, index) => el('div', { class: 'ac-row' }, el('span', { class: 'j-pill cyan' }, String(index + 1).padStart(2, '0')), el('div', {}, el('b', {}, task.title), el('small', {}, `${task.owner} · solo fixture`)), el('span', { class: 'j-pill gold' }, task.status)))); }
  function taskPage() {
    const form = el('form', { class: 'ac-task-form', onsubmit: event => { event.preventDefault(); const title = String(new FormData(event.currentTarget).get('title') || '').trim(); const err = event.currentTarget.querySelector('.ac-form-error'), field = event.currentTarget.querySelector('textarea'); if (!title) { err.hidden = false; field.setAttribute('aria-invalid', 'true'); field.focus(); announce('Scrivi un incarico prima di aggiungerlo'); return; } state.tasks.unshift({ title, owner: 'Jarvis · consultivo', status: 'Bozza · da rivedere' }); event.currentTarget.reset(); render(); announce('Incarico demo creato; nessuna esecuzione avviata'); } }, el('label', { for: 'ac-task-title' }, 'Descrivi un incarico consultivo'), el('textarea', { id: 'ac-task-title', name: 'title', maxlength: 240, placeholder: 'Es. confronta le priorità di oggi', required: true, 'aria-describedby': 'ac-task-error', oninput: e => { e.target.removeAttribute('aria-invalid'); e.target.form.querySelector('.ac-form-error').hidden = true; } }), el('p', { class: 'ac-form-error', id: 'ac-task-error', hidden: true }, 'Scrivi almeno una parola: un incarico vuoto non viene aggiunto.'), el('div', { class: 'ac-callout' }, 'Creare un incarico non lo esegue. La demo non invia il testo a Jarvis.'), el('button', { class: 'j-btn primary', type: 'submit' }, 'Aggiungi incarico demo'));
    frame(el('div', {}, hero('Incarichi', 'Coda dimostrativa di richieste e proposte. Nessun incarico viene eseguito automaticamente.'), el('div', { class: 'ac-layout', style: 'margin-top:12px' }, card('Nuova richiesta', form), card('Coda volatile', taskList()))));
  }
  function ruleRow(id, title, detail) { const toggle = button(state.rules[id] ? 'ATTIVO' : 'SPENTO', () => { state.rules[id] = !state.rules[id]; render(); announce('Regola demo aggiornata solo nella pagina'); }, 'ac-toggle'); toggle.setAttribute('data-k', 'rule-' + id); toggle.setAttribute('aria-label', title + ': ' + (state.rules[id] ? 'attivo' : 'spento') + ' (solo demo)'); toggle.setAttribute('aria-pressed', String(state.rules[id])); return el('div', { class: 'ac-rule' }, el('span', {}, el('b', {}, title), el('br'), detail), toggle); }
  function rulesPage() { frame(el('div', {}, hero('Regole e accessi', 'Controlli illustrativi. I selettori cambiano soltanto lo stato locale della demo e non modificano permessi reali.'), el('div', { class: 'ac-layout', style: 'margin-top:12px' }, card('Controlli di sicurezza', ruleRow('approval', 'Conferma umana', 'Richiedi approvazione prima degli effetti.'), ruleRow('sources', 'Fonti selezionate', 'Mostra la provenienza dei dati usati.'), ruleRow('automatic', 'Avvii automatici', 'Disattivato come impostazione dimostrativa.'), el('div', { class: 'ac-callout' }, 'Nella v1 ogni scrittura richiede consenso. Questa schermata non cambia la policy del prodotto.')), card('Ambiti mostrati', ['Focus', 'Missioni', 'Calendario', 'Studio', 'Second Brain / Obsidian'].map(name => el('div', { class: 'ac-row' }, el('span', { class: 'ac-icon' }, '◇'), el('div', {}, el('b', {}, name), el('small', {}, 'Solo informativo · non collegato')), el('span', { class: 'j-pill' }, 'demo'))))))); }
  function connectorsPage() {
    const providers = [['Codex', 'Nessuna sessione collegata'], ['MCP', 'Connettori non attivati'], ['Obsidian', 'Vault non letto'], ['Provider AI', 'Nessun modello contattato']];
    const rows = el('div', { class: 'ac-stack' }, providers.map(([name, desc]) => el('div', { class: 'ac-connector' }, el('span', { class: 'ac-icon' }, '⌘'), el('div', {}, el('b', {}, name), el('small', {}, desc)), el('span', { class: 'j-pill' }, 'OFF'))));
    const warning = card('Prima di collegare', el('div', { class: 'ac-callout' }, 'Autorizzazioni, ambito dei dati, revoca e log dovrebbero essere spiegati prima di qualsiasi connessione reale. Nessun pulsante OAuth o MCP è simulato qui.'));
    frame(el('div', {}, hero('Connettori', 'Inventario di esempio per mostrare lo stato delle connessioni. Tutti restano disconnessi.'), el('div', { class: 'ac-layout', style: 'margin-top:12px' }, card('Stato delle connessioni', rows), warning)));
  }
  function squadPage() {
    const detail = state.selected ? card('Ruolo selezionato: ' + state.selected.name,
      el('div', { class: 'ac-callout' }, `${state.selected.reads} ${state.selected.proposes} ${state.selected.never}`)) : null;
    const roles = card('Responsabili di area', el('div', { class: 'ac-agent-grid' }, squad.map(agentCard)), detail);
    const design = card('Criterio di progettazione', el('div', { class: 'ac-callout' }, 'Separare le responsabilità può rendere Jarvis più chiaro, ma ogni specialista futuro dovrà restare sotto lo stesso controllo, con fonti selezionate e approvazione umana.'));
    frame(el('div', {}, hero('Squadra proposta', 'Sei responsabilità di area ideate nella vista Squadra di Jarvis. Sono ruoli di design: non sono agenti creati, connessi o in esecuzione.'),
      el('div', { class: 'ac-layout', style: 'margin-top:12px' }, roles, design)));
  }
  function showGlobal(title) { document.getElementById('dlg-title').textContent = title; document.getElementById('dlg-body').replaceChildren(el('p', { class: 'ac-copy' }, 'Segnaposto del prototipo: nessuna app o impostazione reale viene aperta o modificata.')); dialog.showModal(); }
  /* Il focus resta sul controllo usato: dopo ogni ridisegno si ritrova lo stesso pulsante (per data-k o testo). */
  function render() {
    const prev = document.activeElement, key = state.focusKey || (prev && root.contains(prev) ? (prev.getAttribute('data-k') || prev.textContent.trim()) : null), top = window.scrollY; state.focusKey = null;
    ({ overview, squad: squadPage, tasks: taskPage, rules: rulesPage, connectors: connectorsPage }[state.page] || overview)();
    if (key) { const t = [...root.querySelectorAll('button,a,textarea,input')].find(e => (e.getAttribute('data-k') || e.textContent.trim()) === key) || root.querySelector('.ac-nav [aria-current=page]'); if (t) t.focus({ preventScroll: true }); window.scrollTo(0, top); }
  }
  let wireTimer = null; window.addEventListener('resize', () => { clearTimeout(wireTimer); wireTimer = setTimeout(drawWires, 80); });
  document.getElementById('dlg-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  document.getElementById('appsBtn').addEventListener('click', () => showGlobal('Tutte le app'));
  document.getElementById('setBtn').addEventListener('click', () => showGlobal('Impostazioni'));
  render();
})();
