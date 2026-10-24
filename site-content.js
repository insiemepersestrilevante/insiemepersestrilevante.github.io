(() => {
  const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt = (el, v) => { if (el && v !== undefined && v !== null) el.textContent = v; };
  const attr = (el, k, v) => { if (el && v) el.setAttribute(k, v); };
  function renderActivities(items) {
    const section = document.querySelector('#attivita');
    const bar = section && section.querySelector('.filter-btn')?.parentElement;
    const recentGrid = bar && bar.nextElementSibling;
    if (!recentGrid || !Array.isArray(items)) return;

    const categoryLabels = { verde: 'Verde & Decoro', eventi: 'Sport & Eventi', quartiere: 'Pulizie di Quartiere', sociale: 'Attività Sociali' };
    const normaliseDate = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? String(value) : '';
    const formatDate = value => {
      const d = normaliseDate(value);
      if (!d) return '';
      const parts = d.split('-');
      return parts[2] + '/' + parts[1] + '/' + parts[0];
    };
    const sorted = [...items].sort((a,b) => (normaliseDate(b.date) || '').localeCompare(normaliseDate(a.date) || '') || String(a.title || '').localeCompare(String(b.title || ''), 'it'));
    const recent = sorted.filter(item => item.status !== 'archivio');
    const archived = sorted.filter(item => item.status === 'archivio');

    const card = item => {
      const cat = ['verde','eventi','quartiere','sociale'].includes(item.category) ? item.category : 'verde';
      const photos = (Array.isArray(item.images) ? item.images.filter(Boolean) : []).length
        ? item.images.filter(Boolean) : [item.imageUrl || item.image || ''];
      const galleryPhotos = photos.filter(Boolean);
      const gallery = galleryPhotos.length > 1;
      const media = galleryPhotos.length
        ? '<div class="activity-gallery relative h-64 bg-slate-900 overflow-hidden" data-gallery="' + esc(item.title || '') + '">' +
          galleryPhotos.map((photo,index) => '<img src="' + esc(photo) + '" alt="' + esc((item.imageAlt || item.title || '') + ' - foto ' + (index+1)) + '" loading="lazy" class="activity-gallery-photo ' + (index === 0 ? '' : 'hidden ') + 'w-full h-full object-cover object-center">').join('') +
          (gallery ? '<button type="button" aria-label="Foto precedente" data-gallery-prev class="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-10 h-10 text-2xl hover:bg-black/80">‹</button><button type="button" aria-label="Foto successiva" data-gallery-next class="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white w-10 h-10 text-2xl hover:bg-black/80">›</button><div class="absolute bottom-3 left-0 right-0 flex justify-center gap-2">' + galleryPhotos.map((photo,index) => '<button type="button" aria-label="Vai alla foto ' + (index+1) + '" data-gallery-dot="' + index + '" class="w-2.5 h-2.5 rounded-full ' + (index===0?'bg-white':'bg-white/50') + '"></button>').join('') + '</div>' : '') + '</div>'
        : '<div class="h-64 bg-emerald-50 flex items-center justify-center text-brand-green"><i class="fa-solid fa-leaf text-5xl"></i></div>';
      const date = formatDate(item.date);
      const metadata = [date, item.period].filter(Boolean).join(' · ');
      const videoUrl = String(item.videoUrl || '').trim();
      const youtubeMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/i);
      const video = youtubeMatch
        ? '<div class="mt-4 w-full overflow-hidden rounded-xl bg-black aspect-video"><iframe class="w-full h-full" src="https://www.youtube-nocookie.com/embed/' + youtubeMatch[1] + '" title="Video: ' + esc(item.title || 'attività') + '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div><a href="https://youtu.be/' + youtubeMatch[1] + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:underline mt-2"><i class="fa-brands fa-youtube"></i> Apri su YouTube</a>'
        : (/^https?:\/\//i.test(videoUrl) ? '<a href="' + esc(videoUrl) + '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:underline mt-3"><i class="fa-brands fa-youtube"></i> Guarda il video</a>' : '');
      return '<article class="activity-card ' + cat + ' bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col">' +
        media + '<div class="p-6 flex-grow flex flex-col justify-between"><div><span class="inline-block mb-2 rounded-full bg-emerald-50 text-brand-green px-3 py-1 text-xs font-bold">' + esc(categoryLabels[cat]) + '</span>' +
        '<h3 class="text-xl font-bold text-slate-900 mb-2">' + esc(item.title || '') + '</h3><p class="text-slate-600 text-sm leading-relaxed mb-1">' + esc(item.description || '') + '</p>' + video + '</div>' +
        '<div class="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center gap-3 text-xs text-slate-500 font-medium">' +
        '<span><i class="fa-regular fa-calendar text-brand-green mr-1"></i>' + esc(metadata || 'Data non indicata') + '</span>' +
        '<span><i class="fa-solid fa-location-dot text-brand-blue mr-1"></i>' + esc(item.location || '') + '</span></div></div></article>';
    };

    recentGrid.innerHTML = recent.map(card).join('');
    let archive = section.querySelector('#archivio-attivita');
    if (!archive) {
      archive = document.createElement('div');
      archive.id = 'archivio-attivita';
      archive.className = 'mt-16 border-t border-slate-200 pt-12';
      recentGrid.insertAdjacentElement('afterend', archive);
    }
    const years = [...new Set(archived.map(item => normaliseDate(item.date).slice(0,4)).filter(Boolean))].sort((a,b) => b.localeCompare(a));
    archive.innerHTML = '<div class="text-center max-w-3xl mx-auto mb-8"><h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900">Archivio delle attività</h3><p class="text-slate-600 mt-2">Le attività passate, consultabili per anno e categoria. Per spostare una scheda qui, scegli “archivio” dal pannello di gestione.</p></div>' +
      '<div class="flex flex-col sm:flex-row justify-center gap-3 mb-8"><label class="sr-only" for="archive-year">Filtra per anno</label><select id="archive-year" class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"><option value="all">Tutti gli anni</option>' + years.map(y => '<option value="' + y + '">' + y + '</option>').join('') + '</select>' +
      '<label class="sr-only" for="archive-category">Filtra per categoria</label><select id="archive-category" class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm"><option value="all">Tutte le categorie</option>' + Object.keys(categoryLabels).map(k => '<option value="' + k + '">' + esc(categoryLabels[k]) + '</option>').join('') + '</select></div>' +
      '<div id="archive-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div><p id="archive-empty" class="hidden text-center text-slate-500 py-8">Nessuna attività corrisponde ai filtri selezionati.</p>';
    const archiveGrid = archive.querySelector('#archive-grid');
    const yearSelect = archive.querySelector('#archive-year');
    const categorySelect = archive.querySelector('#archive-category');
    const updateArchive = () => {
      const filtered = archived.filter(item => {
        const date = normaliseDate(item.date);
        return (yearSelect.value === 'all' || date.slice(0,4) === yearSelect.value) &&
          (categorySelect.value === 'all' || item.category === categorySelect.value);
      });
      archiveGrid.innerHTML = filtered.map(card).join('');
      archive.querySelector('#archive-empty').classList.toggle('hidden', filtered.length > 0);
      bindGalleries(archiveGrid);
    };
    yearSelect.addEventListener('change', updateArchive);
    categorySelect.addEventListener('change', updateArchive);
    bindGalleries(recentGrid);
    updateArchive();
    if (typeof window.filterActivities === 'function') window.filterActivities('all');
  }

  function bindGalleries(root) {
    root.querySelectorAll('[data-gallery]').forEach(galleryEl => {
      const photos = [...galleryEl.querySelectorAll('.activity-gallery-photo')];
      const dots = [...galleryEl.querySelectorAll('[data-gallery-dot]')];
      if (photos.length < 2) return;
      let current = 0;
      const show = index => {
        current = (index + photos.length) % photos.length;
        photos.forEach((photo,i) => photo.classList.toggle('hidden', i !== current));
        dots.forEach((dot,i) => {
          dot.classList.toggle('bg-white', i === current);
          dot.classList.toggle('bg-white/50', i !== current);
        });
      };
      galleryEl.querySelector('[data-gallery-prev]')?.addEventListener('click', () => show(current - 1));
      galleryEl.querySelector('[data-gallery-next]')?.addEventListener('click', () => show(current + 1));
      dots.forEach((dot,index) => dot.addEventListener('click', () => show(index)));
      let autoAdvance = window.setInterval(() => show(current + 1), 4000);
      galleryEl.addEventListener('mouseenter', () => window.clearInterval(autoAdvance));
      galleryEl.addEventListener('mouseleave', () => {
        window.clearInterval(autoAdvance);
        autoAdvance = window.setInterval(() => show(current + 1), 4000);
      });
    });
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
