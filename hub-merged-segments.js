/* One connection sheet; reuse the real request store, tasks and insight actions. */
(() => {
  if (!window.SpotlightHubConfiguration) return;
  const selections = {main:'requests', directory:'requests'};
  let mainAnchor = 0;
  let seeded = false;
  let overview = '';
  const assetBase = new URL('.',document.currentScript.src);
  const requestIcon = new URL('assets/icons/neuro-assistant.svg?v=outline-all',assetBase).href;
  const taskIcon = new URL('assets/figma/mvp/clock-alarm.svg',assetBase).href;
  const config = () => window.SpotlightHubConfiguration.state;
  const enabled = () => config().overviewEnabled && config().sectionLayout === 'combined';
  const categories = surface => surface === 'main' ? config().overviewCategories : config().categories;
  const selection = surface => categories(surface).includes(selections[surface]) ? selections[surface] : categories(surface)[0];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function requestRows(tasks = false) {
    const records = window.SpotlightThreadStore.list().filter(record => tasks ? !!record.reminder && record.reminder.phase !== 'saved' : record.taskRun === true || (record.type !== 'regular' && !record.reminder));
    return records.filter(record => config().tasks || (!record.taskRun && record.type !== 'regular' && !record.reminder)).map(record => {
      if (tasks) return '<button type="button" class="hub-task-preview" data-task-created="'+(record.created || record.updated || 0)+'" data-merged-thread="'+escape(record.id)+'"><b><span aria-hidden="true">'+window.SpotlightRegular.taskEmoji(record.reminder.title || record.questionnaire?.values?.kind || record.title)+'</span> '+escape(record.reminder.title || record.questionnaire?.values?.kind || record.title)+'</b><span class="hub-task-summary">Продолжите настройку задачи, чтобы получать результат по расписанию.</span><span class="hub-regular-schedule">'+escape(window.SpotlightRegular.formatSchedule([record.reminder.repeat,record.reminder.time].filter(Boolean).join(', ')))+'</span></button>';
      const last = record.messages.at(-1);
      const text = document.createElement('div');
      if (last?.help) text.innerHTML = last.text;
      const preview = record.pending ? 'Готовлю ответ…' : last?.help ? text.querySelector('.hub-file-name') ? 'Выписка готова · '+text.querySelector('.hub-file-name').textContent : (text.querySelector('p') || text).textContent : last?.text || 'Начните диалог';
      return '<button type="button" class="chat-row" data-merged-thread="'+escape(record.id)+'"><span class="chat-row-tile"><img src="'+(record.taskRun?taskIcon:requestIcon)+'" alt=""></span><span class="chat-row-text"><span class="chat-row-title">'+escape(record.title)+'</span><span class="chat-row-sub">'+escape(preview)+'</span></span>'+(record.unread?'<span class="hub-thread-unread" aria-label="Новый ответ"></span>':'')+'</button>';
    }).join('');
  }
  function pane(selected) {
    const source = document.createElement('div'); source.innerHTML = overview;
    if (selected === 'insights') return source.querySelector('.hub-insights')?.outerHTML || '';
    if (selected === 'tasks') {
      const content=document.createElement('div');content.innerHTML=window.SpotlightRegular.cards()+requestRows(true);
      const list=content.querySelector('.event-strip');
      Array.from(content.querySelectorAll('.hub-regular-card,.hub-task-preview')).sort((a,b)=>Number(b.dataset.taskCreated)-Number(a.dataset.taskCreated)).forEach(card=>list.appendChild(card));
      return content.innerHTML;
    }
    return requestRows() || '<p class="hub-merged-empty">Здесь появятся ваши диалоги</p>';
  }
  const labels = {get requests(){return config().preset==='mvp'?'Запросы':'Диалоги';},insights:'Инсайты',tasks:'Задачи'};
  function previewPane(key) {
    const body=document.createElement('div');body.innerHTML=pane(key);
    body.querySelectorAll('.content-title').forEach(node=>node.remove());
    const selector={requests:'.chat-row',insights:'.hub-insight-card',tasks:'.hub-regular-card,.hub-task-preview'}[key];
    body.querySelectorAll(selector).forEach((node,index)=>{if(index>=3)node.remove();});
    return body.innerHTML;
  }
  function content(surface, segmented) {
    const selected=selection(surface), prefix=surface==='main'?'merged':'directoryMerged';
    const tabs=categories(surface);
    if(!tabs.length)return '';
    // In operator mode every request is a support conversation. With no other
    // categories, show the complete request list directly below the channels.
    if(surface==='main' && config().inlineRequests && config().requestsOnly) return '<section class="hub-unsegmented-section" data-category="requests"><h2 class="content-title">'+labels.requests+'</h2>'+pane('requests')+'</section>';
    if(!segmented) return ['insights','tasks','requests'].filter(key=>tabs.includes(key)).map(key=>'<section class="hub-unsegmented-section" data-category="'+key+'"><h2 class="content-title"><button type="button" class="hub-overview-section-link" data-open-overview-segment="'+key+'">'+labels[key]+'<span aria-hidden="true" class="hub-overview-chevron"></span></button></h2>'+previewPane(key)+'</section>').join('');
    return '<div class="hub-category-sticky"><div class="hub-category-backdrop" aria-hidden="true"></div><div class="hub-merged-tabs seg-track" role="tablist" aria-label="'+tabs.map(key=>labels[key]).join(', ')+'">'+tabs.map(key=>'<button type="button" class="seg-item '+(selected===key?'is-active':'')+'" role="tab" aria-selected="'+(selected===key)+'" aria-controls="'+prefix+'Panel" id="'+prefix+'Tab-'+key+'" data-merged-tab="'+key+'" data-tab-surface="'+surface+'">'+labels[key]+'</button>').join('')+'</div></div><div id="'+prefix+'Panel" class="hub-merged-panel" role="tabpanel" aria-labelledby="'+prefix+'Tab-'+selected+'">'+pane(selected)+'</div>';
  }
  function seed() { if (!seeded) { seeded=true; window.SpotlightThreadStore.seed(); } }
  function overviewHTML(events) {
    seed();overview=events;
    if(!config().overviewEnabled)return '';
    const source=document.createElement('div');source.innerHTML=events;
    const important=source.querySelector('.events-pane > .event-strip-clip')?.outerHTML || '';
    const target=config().preset==='target';
    const title=target && categories('main').length ? '<h2 class="content-title hub-overview-title">Обзор</h2>' : '';
    return '<section class="hub-overview'+(target?' hub-target-overview':'')+'" data-content-surface="main">'+(config().important?'<section class="events-pane hub-merged-important"><h2 class="content-title">'+'Сразу о важном'+'</h2>'+important+'</section>':'')+title+'<div class="hub-category-content">'+content('main',config().segments)+'</div></section>';
  }
  function render(connection, events) {
    return '<section class="hub-merged'+(config().preset==='target'?' hub-target-sheet':'')+'">'+connection+overviewHTML(events)+'</section>';
  }
  function directory(events) {
    seed();overview=events;
    return '<section class="hub-ai-directory '+(config().requestsOnly?'hub-mvp-requests':'hub-merged')+'" data-content-surface="directory" aria-label="'+labels.requests+'">'+(config().requestsOnly?pane('requests'):content('directory',true))+'</section>';
  }
  function refresh() {
    document.querySelectorAll('[data-content-surface]').forEach(shell=>{
      const surface=shell.dataset.contentSurface;
      const target=surface==='main'?shell.querySelector('.hub-category-content'):shell;
      const container=surface==='main'?document.getElementById('scroller'):document.getElementById('directoryContent');
      const offset=container.scrollTop;
      target.innerHTML=surface==='directory' && config().requestsOnly?pane('requests'):content(surface,surface==='directory'||config().segments);
      window.SpotlightTypography.bind(target);
      container.scrollTop=offset;
    });
    window.dispatchEvent(new Event('resize'));
  }
  document.addEventListener('pointerdown',event=>{if(event.target.closest('[data-merged-tab]'))event.preventDefault();},true);
  document.addEventListener('click', event => {
    const overviewLink=event.target.closest('[data-open-overview-segment]');
    if(overviewLink){selections.directory=overviewLink.dataset.openOverviewSegment;window.Spotlight.openThreads();return;}
    const tab=event.target.closest('[data-merged-tab]');
    if(tab){
      const surface=tab.dataset.tabSurface;
      const container=surface==='main'?document.getElementById('scroller'):document.getElementById('directoryContent');
      const offset=container.scrollTop;
      selections[surface]=tab.dataset.mergedTab;refresh();
      if(surface==='directory')container.scrollTo({top:0,behavior:'instant'});
      else window.dispatchEvent(new CustomEvent('spotlight-hub:segment-selected',{detail:{offset}}));
      // The selected list is fully painted in the same frame as its segment.
    }
    const row=event.target.closest('[data-merged-thread]');
    if(row)window.Spotlight.openSavedThread(row.dataset.mergedThread);
  });
  window.addEventListener('spotlight-hub:threads-changed', refresh);
  window.addEventListener('spotlight-hub:thread-reply', refresh);
  function measureMain(height) {
    const shell=document.querySelector('#listInner .hub-category-content');
    const tabs=shell?.querySelector('.hub-category-sticky');
    if(!tabs){mainAnchor=0;return;}
    shell.style.minHeight=height+'px';
    tabs.style.transform='';
    const list=document.getElementById('listInner');
    const scale=list.getBoundingClientRect().width/list.offsetWidth;
    mainAnchor=(tabs.getBoundingClientRect().top-list.getBoundingClientRect().top)/scale;
  }
  function pinMain(offset) {
    const tabs=document.querySelector('#listInner .hub-category-sticky');
    if(tabs){tabs.style.transform='translate3d(0,'+Math.max(0,offset-mainAnchor)+'px,0)';tabs.classList.toggle('is-pinned',offset>=mainAnchor);tabs.querySelector('.hub-merged-tabs').classList.toggle('is-pinned',offset>=mainAnchor);}
  }
  window.SpotlightMergedSegments = {measureMain,pinMain,get mainAnchor(){return mainAnchor;},enabled,render,overview:overviewHTML,directory,select:function(surface,key){if(categories(surface).includes(key))selections[surface]=key;refresh();}};
})();
