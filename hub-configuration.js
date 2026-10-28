/* Shared Hub bridge. Seed from the URL before styles/first paint; live changes never reload. */
(() => {
  const query = new URLSearchParams(location.search);
  if (query.get('update') !== '3') return;
  const root = document.documentElement;
  const assetBase = new URL('.', document.currentScript.src);
  const historyIcon = new URL('assets/figma/mvp/history.svg', document.currentScript.src).href;
  const model = window.SpotlightConfigModel;
  const state = model.fromURL(query);
  function derive() {
    Object.assign(state, model.derive(state), {sellerConnected:true, reminders:state.notifications});
  }
  derive();
  root.dataset.hubUpdate = '3';
  let proactiveDismissed = false;
  root.dataset.proactiveDismissed = String(proactiveDismissed);
  function attributes() {
    root.dataset.mvp = String(state.requestsOnly);
    root.dataset.sectionLayout = state.overviewEnabled ? state.sectionLayout : 'separate';
    root.dataset.overviewEnabled = String(state.overviewEnabled);
    root.dataset.overviewSegments = String(state.segments);
    root.dataset.supportAccess = state.supportAccess;
    root.dataset.tasks = String(state.tasks);
    root.dataset.notifications = String(state.notifications);
    root.dataset.operatorInThread = String(state.operatorInThread);
    root.dataset.proactiveCommunication = String(state.proactiveCommunication);
    root.dataset.skillsUpdate = String(state.skillsUpdate);
    root.dataset.stories = String(state.stories);
    root.dataset.reminders = String(state.reminders);
    root.dataset.segments = String(state.mainSegments);
    root.dataset.important = String(state.important);
    root.dataset.insights = String(state.insights);
    root.dataset.unifiedTabbar = String(state.unifiedTabbar);
    root.dataset.connectionDisplay = state.connectionDisplay;
  }
  attributes();
  let chipTemplates;
  let chipSignature = '';
  function decorate() {
    const chips = document.querySelector('.upper .chips');
    if (chips) {
      if (!chipTemplates) chipTemplates=Object.fromEntries([['important','notifications'],['insights','insights'],['tasks','digests']].map(([key,action])=>[key,chips.querySelector('[data-open-'+action+']')?.outerHTML]));
      const items=model.chips(state), signature=JSON.stringify(items);
      if(signature!==chipSignature){
        chipSignature=signature;
        const nodes=items.map(item=>{
          if(chipTemplates[item.key])return chipTemplates[item.key];
          const action=item.key==='statement'||item.key==='create'?'':' data-mvp-skill';
          return '<button type="button" class="chip"'+action+'>'+item.label+'</button>';
        });
        chips.innerHTML='<div class="chip-row">'+nodes.slice(0,3).join('')+'</div><div class="chip-row">'+nodes.slice(3).join('')+'</div>';
      }
    }
    const help = window.Spotlight?.appState().conversationType === 'help';
    document.querySelector('#chatView')?.classList.toggle('hub-event-help', help);
  }
  function skillAnswer(value) {
    const text = value.toLocaleLowerCase('ru');
    if (/реквизит/.test(text)) return 'Выберите счёт, реквизиты которого нужны: расчётный ••8080, расчётный ••7435 или валютный ••2915. Можно подготовить реквизиты для копирования или отправки контрагенту.';
    if (/тариф/.test(text)) return 'В тариф входят обслуживание счёта, платежи, переводы и операции с бизнес-картой. Что разобрать подробнее: стоимость обслуживания, комиссии за переводы или включённые лимиты?';
    if (/кассов|разрыв/.test(text)) return 'Прогноз кассовых разрывов сопоставляет остаток на счетах, ожидаемые поступления и предстоящие платежи. На какой период подготовить прогноз: на неделю или на месяц?';
    if (/курс|валют/.test(text)) return 'Курс какой валюты показать: доллара, евро или юаня? Уточните также, нужен курс покупки или продажи. В этом прототипе биржевые котировки не подключены.';
    if (/лимит|перевод/.test(text)) return 'Какие лимиты вас интересуют: переводы физлицам, между своими счетами или контрагентам? Лимиты и комиссии зависят от типа перевода и вашего тарифа.';
    return null;
  }
  window.SpotlightHubConfiguration = { state, decorate, skillAnswer, get historyIcon() { return new URL('assets/icons/overview-list.svg?v=menu-20261012', assetBase).href; }, reminderIcon: new URL('assets/figma/bell.svg', assetBase).href };
  document.addEventListener('DOMContentLoaded', () => {
    decorate();
    document.addEventListener('click', event => {
      const chip = event.target.closest('[data-mvp-skill]');
      if (chip) window.Spotlight.openHelp(chip.textContent.trim());
    });
    const stories = document.querySelector('.stories');
    stories.replaceChildren();
    [
      ['Сервисы\nАльфа Бизнес', 'assets/stories/services-cover-light.png'],
      ['Привилегии\nдля бизнеса', 'assets/stories/privileges-cover-light.png'],
      ['Время\nдля себя', 'assets/stories/travel-cover-light.png'],
      ['Деньги\nна развитие', 'assets/stories/funding-cover-light.png']
    ].forEach(([title, asset]) => {
      const card = document.createElement('div');
      card.className = 'story hub-story';
      const illustration = document.createElement('img');
      illustration.src = new URL(asset, assetBase).href;
      illustration.alt = ''; illustration.draggable = false;
      illustration.loading = 'eager';
      if (illustration.decode) illustration.decode().catch(() => {});
      const artwork = document.createElement('span');
      artwork.className = 'hub-story-art';
      const caption = document.createElement('span');
      caption.className = 'hub-story-caption'; caption.textContent = title;
      artwork.append(illustration, caption); card.append(artwork); stories.append(card);
    });
    const glass = document.createElement('div');
    glass.className = 'hub-transcript-glass';
    glass.setAttribute('aria-hidden', 'true');
    document.querySelector('#chatView').append(glass);
    const note = document.createElement('p');
    note.className = 'hub-compose-note';
    note.textContent = 'Альфа-Интеллект может ошибаться, проверяйте ответы';
    document.querySelector('#chatView').append(note);
    const proactive = document.createElement('aside');
    proactive.className = 'hub-proactive-card';
    proactive.setAttribute('aria-label','Новый навык Альфа-Интеллекта');
    proactive.innerHTML = '<p>Анна, вам доступен новый навык — Прогноз кассовых разрывов. Хотите подключить?</p><button type="button"><span aria-hidden="true"></span>Подробнее</button>';
    proactive.addEventListener('click',()=>window.Spotlight.openProactiveSkill());
    document.querySelector('#entryPoint').append(proactive);
    document.addEventListener('click', event => {
      if (proactiveDismissed || !state.proactiveCommunication || !document.querySelector('.stage.is-entry')) return;
      proactiveDismissed = true;
      root.dataset.proactiveDismissed = 'true';
      // A click anywhere on the card opens its thread; outside clicks only dismiss it.
    }, {capture:true});
    const entry = document.querySelector('#entrySpotlight');
    entry.setAttribute('aria-label', 'Открыть АИ');
    // Keep the existing button/listener. The split orb uses the original local asset.
    entry.lastChild.textContent = 'АИ';
    window.addEventListener('message', event => {
      if (event.source !== parent || event.origin !== location.origin || event.data?.type !== 'spotlight-hub:configuration') return;
      const requested = event.data.configuration;
      if (!requested || typeof requested !== 'object') return;
      const previous = {...state};
      const next = model.normalize({...state, ...requested});
      if (model.keys.every(key => next[key] === state[key]) && next.preset === state.preset) return;
      if (next.proactiveCommunication && !state.proactiveCommunication) {
        proactiveDismissed = false;
        root.dataset.proactiveDismissed = 'false';
      }
      Object.assign(state, next); derive(); attributes(); decorate();
      // Every listener observes the complete new configuration, never a partial preset.
      window.dispatchEvent(new CustomEvent('spotlight-hub:configuration-applied', {detail:{previous,current:{...state}}}));
      if (next.skillsUpdate !== previous.skillsUpdate || next.tasks !== previous.tasks) window.dispatchEvent(new Event('spotlight-hub:skills'));
      window.dispatchEvent(new Event('spotlight-hub:operator'));
      if (next.stories !== previous.stories) window.dispatchEvent(new Event('spotlight-hub:stories'));

    });
    parent.postMessage({ type: 'spotlight:ready' }, location.origin);
  }, { once: true });
})();
