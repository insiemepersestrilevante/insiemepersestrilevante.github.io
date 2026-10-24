(() => {
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt = (el, v) => { if (el && v !== undefined && v !== null) el.textContent = v; };
  const attr = (el, k, v) => { if (el && v) el.setAttribute(k, v); };
  function renderActivities(items) {
    const section = document.querySelector('#attivita');
    const bar = section && section.querySelector('.filter-btn')?.parentElement;
    const grid = bar && bar.nextElementSibling;
    if (!grid || !Array.isArray(items)) return;
    grid.innerHTML = items.map(item => {
      const cat = ['verde','eventi','quartiere'].includes(item.category) ? item.category : 'verde';
      return '<article class="activity-card '+cat+' bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col">' +
        '<div class="relative h-64 bg-slate-900 flex items-center justify-center overflow-hidden"><img src="'+esc(item.imageUrl || item.image || '')+'" alt="'+esc(item.imageAlt || item.title || '')+'" loading="lazy" class="w-full h-full object-cover object-center"></div>' +
        '<div class="p-6 flex-grow flex flex-col justify-between"><div><h3 class="text-xl font-bold text-slate-900 mb-2">'+esc(item.title)+'</h3><p class="text-slate-600 text-sm leading-relaxed mb-4">'+esc(item.description)+'</p></div>' +
        '<div class="pt-4 border-t border-slate-100 flex justify-between items-center gap-3 text-xs text-slate-500 font-medium"><span><i class="fa-regular fa-calendar text-brand-green mr-1"></i>'+esc(item.period || '')+'</span><span><i class="fa-solid fa-location-dot text-brand-blue mr-1"></i>'+esc(item.location || '')+'</span></div></div></article>';
    }).join('');
    if (typeof window.filterActivities === 'function') window.filterActivities('all');
  }
  function renderDocuments(items) {
    const section = document.querySelector('#modulistica');
    const grid = section && [...section.querySelectorAll('.grid')].find(el => el.classList.contains('md:grid-cols-3'));
    if (!grid || !Array.isArray(items)) return;
    grid.innerHTML = items.map(item => {
      const privacy = item.icon === 'privacy';
      return '<article class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"><div>' +
        '<div class="w-12 h-12 rounded-xl '+(privacy?'bg-blue-100 text-brand-blue':'bg-red-100 text-red-600')+' flex items-center justify-center text-xl font-bold mb-4"><i class="fa-solid '+(privacy?'fa-shield-halved':'fa-file-pdf')+'"></i></div>' +
        '<h3 class="font-bold text-slate-900 text-lg mb-2">'+esc(item.title)+'</h3><p class="text-slate-500 text-xs mb-4">'+esc(item.description)+'</p></div>' +
        '<a href="'+esc(item.file)+'" download class="w-full bg-slate-100 hover:bg-brand-green hover:text-white text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"><i class="fa-solid fa-download"></i> Scarica PDF</a></article>';
    }).join('');
  }
  function apply(data) {
    const home = data.home || {}, hero = document.querySelector('#home');
    if (hero) {
      attr(hero.querySelector('.absolute.inset-0 img'),'src',home.backgroundImage);
      const ps = hero.querySelectorAll('p');
      txt(ps[0], home.quote ? '"'+home.quote+'"' : '');
      txt(hero.querySelector('h1'),home.title);
      txt(ps[1],home.subtitle ? '"'+home.subtitle+'"' : '');
    }
    const news = data.latestNews || {}, ns = document.querySelector('section.py-12.bg-emerald-900');
    if (ns) {
      txt(ns.querySelector('h3'),news.title); txt(ns.querySelector('p'),news.summary);
      txt(ns.querySelector('span'),news.label);
      const a=ns.querySelector('a'); txt(a,news.linkLabel); attr(a,'href',news.link);
    }
    const about=data.about||{}, ab=document.querySelector('#chi-siamo');
    if(ab){txt(ab.querySelector('.text-center p.text-3xl'),about.title);const ps=ab.querySelectorAll('.space-y-6 > p');txt(ps[0],about.introduction);txt(ps[1],about.collaboration);}
    const event=data.featuredEvent||{}, es=document.querySelector('#eventi');
    if(es){
      const h=es.querySelector('h3');txt(h,event.title);
      txt(h&&h.parentElement.querySelector('p'),event.description);
      txt(es.querySelector('span.bg-amber-400'),event.status);
      txt(es.querySelector('span.text-xs.text-slate-300'),event.collaboration);
      const info=[...es.querySelectorAll('.grid')].find(el=>el.classList.contains('sm:grid-cols-3'));
      if(info){const vals=info.querySelectorAll('.font-bold');txt(vals[0],event.date);txt(vals[1],event.location);txt(vals[2],event.time);}
    }
    renderActivities(data.activities); renderDocuments(data.documents);
  }
  fetch('content/site.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('contenuti non disponibili');return r.json();}).then(apply).catch(e=>console.error('Errore caricamento contenuti CMS:',e));
})();
