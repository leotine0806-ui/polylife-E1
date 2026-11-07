(() => {
  const root = document.querySelector('#root');
  const live = document.querySelector('#live');
  const dialog = document.querySelector('#dlg');
  const state = {
    view: 'oggi', artXp: 180, musicXp: 145,
    sessions: [
      { kind: 'arte', area: 'Disegno', minutes: 25, note: 'Studio di forme e volumi', day: 'Oggi' },
      { kind: 'musica', area: 'Ascolto attivo', minutes: 20, note: 'Riconoscere il basso', day: 'Ieri' }
    ],
    projects: [
      { id: 'p1', title: 'Studio di luci · demo', kind: 'arte', status: 'In corso', desc: 'Esercizi sintetici di luce e ombra.' },
      { id: 'p2', title: 'Tema di otto battute · demo', kind: 'musica', status: 'Bozza', desc: 'Idea musicale di prova.' }
    ], coach: null
  };
  const skills = [
    { name: 'Disegno di base', kind: 'arte', level: 2, pct: 62, next: 'Prospettiva' },
    { name: 'Composizione visiva', kind: 'arte', level: 1, pct: 38, next: 'Studio del colore' },
    { name: 'Teoria musicale', kind: 'musica', level: 2, pct: 55, next: 'Armonia' },
    { name: 'Ritmo e timing', kind: 'musica', level: 1, pct: 44, next: 'Poliritmia' }
  ];

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') node.className = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else if (key === 'style') node.setAttribute(key, value);
      else if (value != null && value !== false) node.setAttribute(key, value === true ? '' : String(value));
    }
    for (const child of children.flat()) node.append(child instanceof Node ? child : document.createTextNode(child ?? ''));
    return node;
  }
  const button = (label, action, cls = 'am-action') => el('button', { type: 'button', class: cls, onclick: action }, label);
  const card = (title, ...children) => el('section', { class: 'card' }, el('h2', {}, title), ...children);
  const field = (label, control) => { if (!control.id) control.id = `am-field-${Math.random().toString(36).slice(2, 9)}`; return el('div', { class: 'am-field' }, el('label', { for: control.id }, label), control); };
  const announce = text => { live.textContent = ''; setTimeout(() => { live.textContent = text; }, 25); };
  const stat = (label, value) => el('div', { class: 'am-stat' }, el('b', {}, String(value)), el('span', {}, label + ' · demo'));

  function hero(title, copy) {
    return el('section', { class: 'card am-hero' },
      el('div', {}, el('span', { class: 'eyebrow' }, 'Creatività · demo'), el('h2', {}, title),
        el('p', { class: 'am-copy' }, copy),
        el('div', { class: 'am-statrow' }, stat('XP Arte', state.artXp), stat('XP Musica', state.musicXp), stat('Sessioni', state.sessions.length))),
      el('div', { class: 'am-mark', 'aria-hidden': 'true' }, '✦'));
  }
  const navItems = [['oggi', 'Panoramica'], ['arte', 'Arte'], ['musica', 'Musica'], ['portfolio', 'Portfolio'], ['skill', 'Skill'], ['coach', 'Mentor demo']];
  function shell(content) {
    const nav = el('nav', { class: 'am-nav', 'aria-label': 'Viste Arte e Musica' });
    navItems.forEach(([id, label]) => {
      const item = button(label, () => { state.view = id; render(); }, state.view === id ? 'am-action primary' : 'am-action ghost');
      if (state.view === id) item.setAttribute('aria-current', 'page');
      nav.append(item);
    });
    root.replaceChildren(el('div', { class: 'am-shell' }, nav, content));
  }
  function sessionList(kind = null) {
    const sessions = state.sessions.filter(item => !kind || item.kind === kind);
    if (!sessions.length) return el('div', { class: 'am-empty' }, 'Nessuna sessione nella demo.');
    return el('div', { class: 'am-list' }, sessions.slice(0, 6).map(item =>
      el('div', { class: 'am-row' }, el('span', { class: 'icon', 'aria-hidden': 'true' }, item.kind === 'arte' ? '✎' : '♫'),
        el('div', {}, el('b', {}, item.area + (item.instrument ? ' · ' + item.instrument : '')),
          el('small', {}, `${item.minutes} min · ${item.day}${item.note ? ' · ' + item.note : ''}`)), el('span', { class: 'am-xp' }, 'demo'))));
  }
  function projectRow(project) {
    return el('article', { class: 'am-project' },
      el('div', { class: 'am-project-head' }, el('div', {}, el('span', { class: 'am-badge ' + (project.kind === 'arte' ? 'art' : 'music') }, project.kind === 'arte' ? 'Arte' : 'Musica'), el('h3', {}, project.title)), el('span', { class: 'tag' }, project.status)),
      el('p', {}, project.desc),
      el('div', { class: 'am-actions' },
        button('Cambia stato demo', () => { project.status = project.status === 'In corso' ? 'Completato' : 'In corso'; render(); announce('Stato progetto cambiato solo nella demo'); }),
        button('Rimuovi demo', () => { state.projects = state.projects.filter(item => item.id !== project.id); render(); announce('Progetto rimosso dalla demo'); }, 'am-action ghost')));
  }
  function today() {
    const links = el('div', { class: 'am-actions' },
      el('a', { class: 'am-link', href: '../engineer/index.html' }, 'Engineer'),
      el('a', { class: 'am-link', href: '../life-rpg/index.html' }, 'Life RPG'),
      el('a', { class: 'am-link', href: '../jarvis/index.html' }, 'Jarvis'));
    const side = el('aside', { class: 'am-stack' },
      card('Ritmo della demo', el('div', { class: 'am-statrow' }, stat('Serie', '3 giorni'), stat('Arte', state.sessions.filter(s => s.kind === 'arte').length), stat('Musica', state.sessions.filter(s => s.kind === 'musica').length)), el('p', { class: 'am-copy' }, 'La serie è una fixture dimostrativa, non un dato personale.')),
      card('Proprietà dei dati', el('p', { class: 'am-copy' }, 'Questa sezione tiene sessioni e portfolio creativi. Engineer conserva i progetti tecnici; Life RPG mostra la progressione generale. Nessuna fonte personale è collegata.'), links),
      card('Spunto statico', el('p', { class: 'am-copy' }, 'Confronta una sessione di studio tecnico con una breve pratica libera. È un suggerimento fisso, non generato da AI.')));
    shell(el('div', {}, hero('Una pratica creativa alla volta', 'Scegli Arte o Musica, registra una sessione sintetica e rivedi i progetti. XP e registrazioni vivono solo in questa scheda.'),
      el('div', { class: 'am-grid', style: 'margin-top:12px' },
        el('div', { class: 'am-stack' }, card('Scegli una pratica', el('div', { class: 'am-actions' }, button('✎ Apri Arte', () => { state.view = 'arte'; render(); }, 'am-action primary'), button('♫ Apri Musica', () => { state.view = 'musica'; render(); })), el('p', { class: 'am-copy' }, 'Registra durata, area e una nota nella vista dedicata.')), card('Sessioni recenti', sessionList()), card('Portfolio creativo', state.projects.length ? el('div', { class: 'am-list' }, state.projects.map(projectRow)) : el('div', { class: 'am-empty' }, 'Nessun progetto demo.'))), side)));
  }
  function practice(kind) {
    const art = kind === 'arte';
    const areas = art ? ['Disegno', 'Pittura', 'Design visivo', 'Composizione visiva', 'Anatomia artistica', 'Portfolio'] : ['Teoria musicale', 'Ritmo e timing', 'Ascolto attivo', 'Composizione', 'Analisi musicale', 'Pratica strumento'];
    const form = el('form', { class: 'am-form', onsubmit: event => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      const minutes = Number(data.get('minutes'));
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 300) { announce('Inserisci una durata da 1 a 300 minuti.'); return; }
      const xp = Math.max(5, Math.round(minutes * (art ? 0.4 : 0.45)));
      state.sessions.unshift({ kind, area: String(data.get('area')), instrument: String(data.get('instrument') || ''), minutes, note: String(data.get('note') || '').trim(), day: 'Ora · demo' });
      if (art) state.artXp += xp; else state.musicXp += xp;
      event.currentTarget.reset(); render(); announce(`Sessione ${art ? 'Arte' : 'Musica'} simulata · +${xp} XP`);
    } });
    form.append(field('Area di pratica', el('select', { name: 'area' }, areas.map(area => el('option', { value: area }, area)))));
    if (!art) form.append(field('Strumento (facoltativo)', el('input', { name: 'instrument', maxlength: 80, placeholder: 'Chitarra, piano, voce…' })));
    form.append(field('Minuti praticati', el('input', { name: 'minutes', type: 'number', min: 1, max: 300, value: 25, required: true })),
      field('Nota della sessione (facoltativa)', el('textarea', { name: 'note', maxlength: 500, placeholder: 'Che cosa hai provato?' })),
      el('div', { class: 'am-notice' }, 'Registrazione e XP sono simulati; non vengono salvati nel profilo PolyLife.'),
      el('button', { class: 'am-action primary', type: 'submit' }, `Registra sessione demo · ${art ? 'Arte' : 'Musica'}`));
    const quick = art ? [['Pratica libera', 10], ['Studio tecnico', 25], ['Opera completata', 40], ['Analisi artista', 15]] : [['Pratica libera', 10], ['Teoria musicale', 20], ['Ascolto attivo', 25], ['Composizione breve', 40]];
    const references = art ? ['Andrew Loomis · proporzioni', 'Sargent · pennellata', 'Kim Jung Gi · memoria spaziale', 'Bridgman · anatomia'] : ['Bach · contrappunto', 'Coltrane · modal jazz', 'Radiohead · poliritmia', 'Debussy · colore armonico'];
    const quickCard = card('Azioni XP rapide · demo', el('p', { class: 'am-copy' }, 'XP aggiunti solo allo stato volatile della pagina.'), el('div', { class: 'am-actions' }, quick.map(([label, xp]) => button(`${label} · +${xp} XP`, () => { if (art) state.artXp += xp; else state.musicXp += xp; render(); announce(`${xp} XP simulati`); }))));
    shell(el('div', {}, hero(art ? 'Arte · pratica visiva' : 'Musica · pratica e ascolto', art ? 'Disegno, pittura, composizione visiva e portfolio. La sessione non assegna una valutazione tecnica.' : 'Teoria, ritmo, ascolto, composizione, analisi e strumento. Nessuna valutazione di competenza.'),
      el('div', { class: 'am-grid', style: 'margin-top:12px' }, el('div', { class: 'am-stack' }, card('Registra una sessione', form), quickCard),
        el('aside', { class: 'am-stack' }, card(`Registro ${art ? 'Arte' : 'Musica'}`, sessionList(kind)), card(art ? 'Artisti di riferimento' : 'Ascolti da esplorare', el('div', { class: 'am-list' }, references.map(ref => {
          const [name, detail] = ref.split(' · ');
          return el('div', { class: 'am-row' }, el('span', { class: 'icon', 'aria-hidden': 'true' }, art ? '✎' : '♫'), el('div', {}, el('b', {}, name), el('small', {}, detail)), el('span', { class: 'am-badge ' + (art ? 'art' : 'music') }, 'demo'));
        })))))));
  }
  function portfolio() {
    const projects = state.projects.length ? el('div', { class: 'am-list' }, state.projects.map(projectRow)) : el('div', { class: 'am-empty' }, 'Il portfolio demo è vuoto.');
    const categories = ['Studi visivi', 'Opere e serie', 'Composizioni', 'Esperimenti sonori'];
    shell(el('div', {}, hero('Portfolio creativo', 'Progetti di Arte e Musica in una vista sola. I progetti tecnici restano in Engineer.'),
      el('div', { class: 'am-grid', style: 'margin-top:12px' }, card('Progetti', el('div', { class: 'am-actions' }, button('+ Nuovo progetto demo', openProject, 'am-action primary')), projects),
        card('Aree del portfolio', el('div', { class: 'am-list' }, categories.map(name => el('div', { class: 'am-row' }, el('span', { class: 'icon' }, '◇'), el('div', {}, el('b', {}, name), el('small', {}, 'Categoria dimostrativa')), el('span', { class: 'am-badge' }, 'demo')))), el('p', { class: 'am-copy' }, 'Riferimenti a file e link non vengono aperti in questa demo.')))));
  }
  function tree(kind) {
    const art = kind === 'arte';
    const names = art ? ['Fondamenti del disegno', 'Prospettiva', 'Composizione visiva', 'Teoria del colore'] : ['Ascolto e ritmo', 'Teoria musicale', 'Armonia', 'Composizione'];
    const nodes = names.map((name, index) => el('div', { class: 'am-tree-node' }, el('span', { class: 'node-icon', 'aria-hidden': 'true' }, index ? '◇' : '✦'), el('span', {}, el('b', {}, name), el('small', {}, index ? `Richiede ${names[index - 1]}` : 'Fondamento del percorso')), el('span', { class: 'am-badge ' + (!index ? 'art' : '') }, index === 0 ? 'Esempio base' : index === 1 ? 'In percorso · demo' : 'Bloccata · esempio')));
    return card(`Percorso ${art ? 'Arte' : 'Musica'} · demo`, el('div', { class: 'am-tree-group' }, el('h3', {}, art ? 'Fondamenta visive' : 'Fondamenta musicali'), nodes), el('p', { class: 'am-copy' }, 'Percorso illustrativo: livelli e requisiti non sono stati verificati su una persona.'));
  }
  function skillView() {
    const progress = card('Progressi illustrativi', el('div', { class: 'am-skills' }, skills.map(skill =>
      el('div', { class: 'am-skill' }, el('div', { class: 'am-project-head' }, el('b', {}, skill.name), el('span', { class: 'am-badge ' + (skill.kind === 'arte' ? 'art' : 'music') }, `Lv ${skill.level} · demo`)),
        el('div', { class: 'bar' }, el('i', { style: `width:${skill.pct}%` })), el('small', {}, `${skill.pct}% · prossimo nodo: ${skill.next}`)))));
    const warning = card('Nessuna valutazione personale', el('p', { class: 'am-notice' }, 'Non è stato fatto alcun test delle skill. I livelli mostrati sono fixture.'));
    shell(el('div', {}, hero('Percorsi creativi', 'Skill e progressi d’esempio. Non sono una valutazione delle tue capacità.'),
      el('div', { class: 'am-grid', style: 'margin-top:12px' }, el('div', { class: 'am-stack' }, tree('arte'), tree('musica')), el('aside', { class: 'am-stack' }, progress, warning))));
  }
  function coachView() {
    const panels = ['arte', 'musica'].map(kind => {
      const isArt = kind === 'arte';
      const panel = card(isArt ? 'Mentor Arte · demo' : 'Mentor Musica · demo', el('p', { class: 'am-copy' }, isArt ? 'Tecnica, stile, composizione e portfolio.' : 'Teoria, composizione, ascolto e strumento.'),
        el('div', { class: 'am-notice' }, 'Nessuna AI viene chiamata. Il testo d’esempio è statico.'),
        field('Tema', el('select', { id: `theme-${kind}` }, (isArt ? ['Disegno', 'Composizione', 'Colore'] : ['Teoria', 'Ritmo', 'Ascolto']).map(x => el('option', {}, x)))),
        field('Domanda di prova', el('textarea', { id: `ask-${kind}`, maxlength: 500, placeholder: 'Scrivi una richiesta sintetica…' })),
        el('div', { class: 'am-actions' }, button('Mostra risposta statica', () => {
          const area = document.getElementById(`theme-${kind}`).value;
          state.coach = { kind, area, text: isArt ? 'Prova a costruire la scena con tre masse grandi prima di rifinire i dettagli.' : 'Batti il ritmo lentamente e individua l’accento prima di aumentare la velocità.' };
          render(); announce('Risposta statica di esempio; nessuna AI chiamata');
        }, 'am-action primary')));
      if (state.coach?.kind === kind) panel.append(el('div', { class: 'am-result' }, `Esempio statico · ${state.coach.area}: ${state.coach.text}`));
      return panel;
    });
    panels.push(card('Limiti della demo', el('div', { class: 'am-list' }, ['La domanda resta nel browser e non viene inviata.', 'La risposta non è generata da un modello.', 'Nessuna nota, skill o sessione personale viene letta.'].map(text => el('div', { class: 'am-row' }, el('span', { class: 'icon' }, '◇'), el('div', {}, el('b', {}, text)))))));
    shell(el('div', {}, hero('Mentor creativi · anteprima', 'Interfaccia dimostrativa per un futuro coach. Dati e risposta restano locali alla pagina.'), el('div', { class: 'am-grid', style: 'margin-top:12px' }, el('div', { class: 'am-stack' }, panels))));
  }
  function openProject() {
    const form = el('form', { class: 'am-form', onsubmit: event => {
      event.preventDefault(); const data = new FormData(event.currentTarget); const title = String(data.get('title') || '').trim();
      if (!title) return;
      state.projects.unshift({ id: 'p-' + Date.now(), title, kind: String(data.get('kind')), status: 'Bozza', desc: String(data.get('desc') || '') });
      dialog.close(); render(); announce('Progetto aggiunto soltanto alla demo');
    } });
    form.append(field('Nome progetto', el('input', { name: 'title', maxlength: 100, required: true, placeholder: 'Titolo sintetico' })),
      field('Area', el('select', { name: 'kind' }, el('option', { value: 'arte' }, 'Arte'), el('option', { value: 'musica' }, 'Musica'))),
      field('Descrizione', el('textarea', { name: 'desc', maxlength: 500, placeholder: 'Obiettivo o tecnica, solo demo' })),
      el('div', { class: 'am-actions' }, el('button', { type: 'submit', class: 'am-action primary' }, 'Crea progetto demo'), button('Annulla', () => dialog.close(), 'am-action ghost')));
    document.getElementById('dlg-title').textContent = 'Nuovo progetto creativo';
    document.getElementById('dlg-body').replaceChildren(form); dialog.showModal(); form.querySelector('input').focus();
  }
  function globalDialog(title) {
    document.getElementById('dlg-title').textContent = title;
    document.getElementById('dlg-body').replaceChildren(el('p', { class: 'am-copy' }, 'Anteprima di design: nessuna impostazione o app viene aperta o modificata.'));
    dialog.showModal();
  }
  /* Dopo ogni ridisegno il focus torna sul controllo appena usato (stesso testo), così la tastiera non riparte dall'inizio. */
  function render() {
    const prev = document.activeElement, key = prev && root.contains(prev) ? (prev.getAttribute('aria-label') || prev.textContent.trim()) : null, top = window.scrollY;
    const pages = { oggi: today, arte: () => practice('arte'), musica: () => practice('musica'), portfolio, skill: skillView, coach: coachView };
    (pages[state.view] || today)();
    if (key) { const t = [...root.querySelectorAll('button,a,input,select,textarea')].find(e => (e.getAttribute('aria-label') || e.textContent.trim()) === key) || root.querySelector('.am-nav [aria-current=page]'); if (t) t.focus({ preventScroll: true }); window.scrollTo(0, top); }
  }
  document.getElementById('dlg-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.getElementById('appsBtn').addEventListener('click', () => globalDialog('Tutte le app'));
  document.getElementById('setBtn').addEventListener('click', () => globalDialog('Impostazioni'));
  render();
})();
