(() => {
  'use strict';
  const groups = [
    ['Inizio', [['Hub E1','hub']]],
    ['Quotidiano', [['Diario','diary'],['Missioni','missions'],['Calendario','calendar'],['Planner','planner']]],
    ['Studio e crescita', [['Studio · KnowStudy','studio'],['Flashcard','flashcards'],['Biblioteca','library'],['Recovery','recovery'],['LEO Protocol','leo']]],
    ['Progetti e creatività', [['Engineer','engineer'],['Arte & Musica','arte-musica'],['Life RPG','life-rpg']]],
    ['Conoscenza e intelligenza', [['Second Brain','second-brain'],['Agora','agora'],['Nexus','nexus'],['Jarvis · Atlas','jarvis'],['Agent Center','agent-center'],['PolyFeed','polyfeed']]]
  ];
  const page = slug => slug === 'hub' ? '/' : `/module-redesign/${slug}/index.html`;
  const removeSettings = root => {
    for (const node of root.querySelectorAll('#setBtn,[href*="settings.html"]')) {
      if (node.matches('#setBtn')) { node.remove(); continue; }
      const label = document.createElement('span'); label.className = 'prototype-unavailable';
      label.textContent = 'Impostazioni · non incluse'; label.setAttribute('aria-label', label.textContent); node.replaceWith(label);
    }
    for (const node of root.querySelectorAll('button,a')) {
      if (/^(?:Impostazioni|Settings|Dungeon|Onboarding)$/i.test(node.textContent.trim())) node.remove();
    }
  };
  const setup = () => {
    removeSettings(document);
    const style = document.createElement('style');
    style.textContent = `#prototype-app-menu{width:min(680px,calc(100vw - 24px));max-height:min(82vh,760px);padding:0;border:1px solid #284460;border-radius:14px;background:#0b1421;color:#e8f1fb;box-shadow:0 24px 80px #000b}#prototype-app-menu::backdrop{background:#02060bcc;backdrop-filter:blur(4px)}.pam-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px;border-bottom:1px solid #22364c}.pam-head h2{margin:0;font:700 17px/1.2 system-ui,sans-serif}.pam-close,.pam-link{font:600 14px/1.3 system-ui,sans-serif;color:#dceafa}.pam-close{border:1px solid #34516c;background:#101e2d;border-radius:8px;padding:8px 12px;cursor:pointer}.pam-search{display:block;box-sizing:border-box;width:calc(100% - 36px);margin:16px 18px 4px;padding:11px 12px;border:1px solid #34516c;border-radius:8px;background:#07101a;color:#fff;font:14px system-ui,sans-serif}.pam-groups{padding:8px 18px 20px;overflow:auto;max-height:62vh}.pam-group h3{margin:14px 0 8px;color:#76cfff;font:700 11px system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase}.pam-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.pam-link{display:flex;align-items:center;min-height:44px;padding:10px 12px;border:1px solid #263c52;border-radius:8px;background:#101c2a;text-decoration:none}.pam-link:hover,.pam-link:focus-visible{border-color:#54c8ff;background:#14263a;outline:2px solid #54c8ff;outline-offset:2px}.prototype-unavailable{display:inline-flex;align-items:center;min-height:36px;padding:4px 9px;border:1px dashed #506174;border-radius:6px;color:#93a6ba;font:12px system-ui,sans-serif}@media(max-width:460px){.pam-list{grid-template-columns:1fr}.pam-head{padding:14px}.pam-groups{max-height:66vh}}`;
    document.head.append(style);
    const dialog = document.createElement('dialog'); dialog.id='prototype-app-menu'; dialog.setAttribute('aria-labelledby','pam-title');
    const head=document.createElement('div');head.className='pam-head';const title=document.createElement('h2');title.id='pam-title';title.textContent='Sezioni PolyLife E1';
    const close=document.createElement('button');close.className='pam-close';close.type='button';close.textContent='Chiudi';close.addEventListener('click',()=>dialog.close());head.append(title,close);
    const search=document.createElement('input');search.className='pam-search';search.type='search';search.placeholder='Cerca una sezione';search.setAttribute('aria-label','Cerca una sezione');
    const list=document.createElement('div');list.className='pam-groups';
    for(const [group,apps] of groups){const section=document.createElement('section');section.className='pam-group';const h=document.createElement('h3');h.textContent=group;const grid=document.createElement('div');grid.className='pam-list';for(const [label,slug] of apps){const a=document.createElement('a');a.className='pam-link';a.href=page(slug);a.textContent=label;a.dataset.search=label.toLocaleLowerCase('it');grid.append(a);}section.append(h,grid);list.append(section);}
    search.addEventListener('input',()=>{const q=search.value.trim().toLocaleLowerCase('it');for(const section of list.querySelectorAll('.pam-group')){let visible=0;for(const a of section.querySelectorAll('.pam-link')){const show=!q||a.dataset.search.includes(q);a.hidden=!show;if(show)visible++;}section.hidden=visible===0;}});
    dialog.append(head,search,list);document.body.append(dialog);dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
    document.addEventListener('click',e=>{const button=e.target.closest('#appsBtn');if(!button)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(!dialog.open)dialog.showModal();search.value='';search.dispatchEvent(new Event('input'));},true);
    if(!document.querySelector('#appsBtn')){const launch=document.createElement('button');launch.id='appsBtn';launch.type='button';launch.className='pam-launch';launch.textContent='⊞ Tutte le app';launch.style.cssText='position:fixed;right:12px;top:12px;z-index:99999;min-height:44px;padding:10px 14px;border:1px solid #34516c;border-radius:9px;background:#0b1421;color:#e8f1fb;font:600 13px system-ui,sans-serif;cursor:pointer';document.body.append(launch);}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();
