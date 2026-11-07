/* Contenuti SINTETICI condivisi dai due prototipi dell'Hub.
   Nessun dato reale: ogni cifra è un esempio. Dove manca una fonte dati certa
   nell'Hub di produzione, l'elemento ha placeholder:true o sta in `placeholders`
   e viene mostrato come segnaposto esplicito. */
window.HUB = {
  today: { weekday: 'Lunedì', date: '2 novembre', time: '09:40' },
  level: { n: 7, name: 'Esploratore', xp: 1240, next: 1500 },
  streak: { days: 12, apps: 5 },
  nextEvent: { title: 'Revisione capitolo 4', area: 'studio', at: '10:30', inMin: 50, where: 'Studio · 45 min' },
  focus: { title: 'Leggere 20 pagine', area: 'library', why: 'Obiettivo giornaliero a metà', done: 11, total: 20 },
  agenda: [
    { at: '10:30', title: 'Revisione capitolo 4', area: 'studio', dur: '45 min' },
    { at: '12:30', title: 'Allenamento gambe', area: 'leo', dur: '60 min' },
    { at: '15:00', title: 'Esercizi circuiti RC', area: 'engineer', dur: '90 min' },
    { at: '19:30', title: 'Sessione di disegno', area: 'arte', dur: '40 min' }
  ],
  missions: [
    { title: 'Leggere 20 pagine', area: 'library', done: false },
    { title: 'Ripasso flashcard', area: 'studio', done: false },
    { title: 'Stretching serale', area: 'recovery', done: false }
  ],
  quick: [
    { id: 'nota', label: 'Nota rapida', icon: '✎' },
    { id: 'diario', label: 'Diario della giornata', icon: '☰' },
    { id: 'review', label: 'Weekly review', icon: '◷' },
    { id: 'brain', label: 'Second brain', icon: '✦' },
    { id: 'decisioni', label: 'Decisioni', icon: '⚖' },
    { id: 'jarvis', label: 'Jarvis', icon: '◎' },
    { id: 'calendario', label: 'Calendario', icon: '▦' },
    { id: 'refresh', label: 'Aggiorna', icon: '↺' }
  ],
  areas: [
    { id: 'studio', name: 'Studio', color: '#4f8cff', metric: '3 sessioni', detail: 'Streak 12 · 4 h in settimana', pct: 70 },
    { id: 'library', name: 'Library', color: '#a78bfa', metric: '11/20 pagine', detail: '1 libro in corso', pct: 55 },
    { id: 'rpg', name: 'Life RPG', color: '#ef4444', metric: '1.240 XP', detail: 'Livello 7 · 260 XP al prossimo', pct: 83 },
    { id: 'leo', name: 'Leo Protocol', color: '#fb7185', metric: '4 allenamenti', detail: 'Prossimo: oggi 12:30', pct: 80 },
    { id: 'agora', name: 'Agora', color: '#fbbf24', metric: '2 dialoghi', detail: 'Ultimo: ieri', pct: 40 },
    { id: 'engineer', name: 'Engineer', color: '#34d399', metric: '2 esercizi', detail: 'Circuiti RC in corso', pct: 50 },
    { id: 'dungeon', name: 'Dungeon', color: '#00e5ff', metric: '38 unità', detail: 'Esercito (esempio)', pct: 60 },
    { id: 'recovery', name: 'Recovery', color: '#f97316', metric: 'Coda attiva', detail: 'Attività spostate · analisi in Recovery', pct: 30 },
    { id: 'arte', name: 'Arte & Musica', color: '#f472b6', metric: '2 sessioni', detail: 'Disegno stasera', pct: 45 },
    { id: 'orch', name: 'Orchestrator', color: '#c4b5fd', metric: 'Piano attivo', detail: 'Profilo operativo', pct: 65, placeholder: true }
  ],
  activity7: [
    { d: 'Mar', v: 62 }, { d: 'Mer', v: 80 }, { d: 'Gio', v: 45 }, { d: 'Ven', v: 90 },
    { d: 'Sab', v: 30 }, { d: 'Dom', v: 55 }, { d: 'Lun', v: 25 }
  ],
  notes: [
    { text: 'Chiedere chiarimenti sul teorema di Thevenin', when: 'ieri' },
    { text: 'Idea: playlist per le sessioni di studio', when: '3 giorni fa' }
  ],
  placeholders: [
    { id: 'sintesi', title: 'Sintesi Hub (consultiva)', text: 'Nessuna sintesi preparata. Nel prodotto richiede fonti preparate e un provider: qui è un segnaposto.' },
    { id: 'proposta', title: 'Proposta AI facoltativa', text: 'Non adottata, senza effetti finché non applicata. Qui è un segnaposto.' },
    { id: 'profilo', title: 'Profilo polimata', text: 'Nessun dato personale letto. Segnaposto per il profilo operativo.' }
  ],
  utility: ['Backup e ripristino', 'Chiave API']
};
window.HUB.area = id => window.HUB.areas.find(a => a.id === id) || { name: id, color: '#8da0b3' };

/* Helpers condivisi di rendering (nessuna dipendenza). */
window.h = function (tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) e.append(kid.nodeType ? kid : document.createTextNode(kid));
  return e;
};
window.fmt = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
window.toast = function (msg) {
  let t = document.getElementById('toast');
  if (!t) { t = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(t); }
  t.textContent = msg + ' — prototipo: nessuna azione eseguita.';
  t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2200);
};
