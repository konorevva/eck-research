/* Spotlight UCC — общий snap-лист Связь / Обзор. */
(function () {
  'use strict';

  var VIEW_H = 852;
  var SHEET_TOP_FULL = window.SpotlightHubConfiguration ? (window.SpotlightHubConfiguration.state.stories ? 590 : 466) : 540;
  var SHEET_TOP_DOCKED = 140;
  var TRAVEL = SHEET_TOP_FULL - SHEET_TOP_DOCKED;
  var SHEET_RADIUS = 32;
  var SEG_H_FULL = 60, SEG_H_DOCKED = 60;
  var SEG_PAD_FULL = 20, SEG_PAD_DOCKED = 18;
  // Альфа-Интеллект input — ONE component, two variants of the same element (Figma Sptl
  // «Focus :: Connection» custom-input / «Spotlight :: Thread» ChatBar):
  //   resting 353×64 (4px rim, 345×56 surface), focused 377×48 (2px rim, 373×44 surface).
  // Rim, «+» and text inset are CSS variables of [data-ai-state] (v3.css) and animate with
  // the geometry, so focus/blur moves and resizes the same input instead of swapping it.
  var AI_INPUT = {
    resting: { x: 20, w: 353, h: 64 },
    focused: { x: 8, w: 377, h: 48 },
    textWidth: 281
  };
  var F0 = { x: 20, y: window.SpotlightHubConfiguration ? (window.SpotlightHubConfiguration.state.stories ? 494 : 370) : 444, w: 353, h: 64, r: 30, pad: 4, icon: 305, text: 56 };
  // Resting on Чаты: the page input's slot (dock bottom 34px).
  var AI_SLOT_Y = VIEW_H - 34 - AI_INPUT.resting.h;
  // V3 «Focus :: Scroll» (Figma 59:14251): the Custom Input no longer morphs into a navbar
  // control. It keeps its full form and settles at the bottom (custom-input frame y 727 + 16).
  var FB = { y: 743 };
  // OFF for now (1 Oct): the input stays in its designed place and the rising sheet covers it
  // like the rest of the upper content. Set true to bring back the Focus Scroll docking.
  var INPUT_SCROLL_DOCK = false;
  var INPUT_RESERVE = INPUT_SCROLL_DOCK ? VIEW_H - FB.y : 0;
  var GAP = SHEET_TOP_FULL - (F0.y + F0.h);
  var C_START = 0.30;
  var C_END = 0.97;
  var CB = { x1: 0.42, y1: 0, x2: 0.58, y2: 1 };
  var OPEN_THRESHOLD = 0.16;
  var VELOCITY_THRESHOLD = 0.48;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function norm(v, a, b) { return clamp((v - a) / (b - a), 0, 1); }
  function smoothstep(t) { return t * t * (3 - 2 * t); }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }

  function bezier(t) {
    var x1 = CB.x1, x2 = CB.x2, y1 = CB.y1, y2 = CB.y2;
    function cx(u) { return 3*u*(1-u)*(1-u)*x1 + 3*u*u*(1-u)*x2 + u*u*u; }
    function cy(u) { return 3*u*(1-u)*(1-u)*y1 + 3*u*u*(1-u)*y2 + u*u*u; }
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var lo = 0, hi = 1, u = t;
    for (var i = 0; i < 24; i++) {
      u = (lo + hi) / 2;
      if (cx(u) < t) lo = u; else hi = u;
    }
    return cy(u);
  }

  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage');
  var scroller = $('scroller');
  var spacer = $('spacer');
  var sheet = $('sheet');
  var seg = $('seg');
  var sheetList = $('sheetList');
  var listInner = $('listInner');
  var field = $('field');
  var inputTemplate = field.cloneNode(true);
  var grad = $('fieldGrad');
  var inner = $('fieldInner');
  var glass = $('fieldGlass');
  var icon = $('fieldIcon');
  var logo = $('fieldLogo');
  var composerGlow = $('composerGlow');
  var text = $('focusInput');
  var glow = $('fieldGlow');
  var focusHaze = $('focusInputHaze');
  var scrim = $('scrim');
  var home = $('homeIndicator');
  var upper = document.querySelector('.upper');
  var stories = document.querySelector('.stories');
  var greeting = document.querySelector('.greeting');
  var chips = document.querySelector('.chips');
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.seg-item'));
  var spotlightShell = $('spotlightShell');
  var entrySpotlight = $('entrySpotlight');
  var mainClose = $('mainClose');
  var fieldButton = $('field');
  var chatView = $('chatView');
  var notificationsView = $('notificationsView');
  var notificationView = $('notificationView');
  var chatBack = $('chatBack');
  var chatClose = $('chatClose');
  var notificationsBack = $('notificationsBack');
  var notificationBack = $('notificationBack');
  var notificationClose = $('notificationClose');
  var firstNotification = $('firstNotification');
  var bankRequestAction = $('bankRequestAction');
  var chatScroll = $('chatScroll');
  var chatEmptyIntro = $('chatEmptyIntro');
  var chatDate = $('chatDate');
  var chatMessages = $('chatMessages');
  var chatLoader = $('chatLoader');
  var chatComposer = $('assistantComposer');
  var chatInput = $('chatInput');
  var contactInput = $('contactInput');
  var contactComposer = $('contactComposer');
  var contactSend = $('contactSend');

  var connectionList = window.SpotlightConnectionList;
  function showsConnectionList() { return !!connectionList && window.SpotlightHubConfiguration.state.connectionDisplay === 'list'; }
  var letterShortcut = listInner.querySelector('.communication-action img[src="assets/figma/v2/mail.svg"]');
  if (window.SpotlightHubConfiguration && letterShortcut) letterShortcut.closest('button').setAttribute('data-open-letters','');
  if (window.SpotlightHubConfiguration) {
    listInner.querySelectorAll('.list-footer').forEach(function (node) { node.remove(); });
    var reminder = document.createElement('button');
    reminder.type = 'button'; reminder.className = 'communication-action hub-reminder-action';
    reminder.innerHTML = '<span class="communication-tile"><img src="' + window.SpotlightHubConfiguration.reminderIcon + '" alt=""></span><span>Уведомления</span>';
    listInner.querySelector('.communication-actions').appendChild(reminder);
  }
  if (connectionList && window.SpotlightHubConfiguration) {
    var contactHeading = listInner.querySelector('.chat-section-title');
    if (contactHeading) {
      contactHeading.innerHTML = '<button type="button" data-open-chats>Чаты <img src="assets/figma/2026-09-29/chevron-section.svg" alt=""></button>';
      listInner.querySelectorAll('[data-contact-chat]').forEach(function(row){row.remove();});
      contactHeading.insertAdjacentHTML('afterend', connectionList.chatsHTML);
    }
  }
  var connectionHTML = connectionList ? connectionList.render() : listInner.innerHTML;
  var overviewInsights = [{"title": "С 1 января меняются правила НДС для УСН", "note": "Касается вас", "body": "<h2>С 1 января меняются правила НДС для упрощёнки, и вас это касается.</h2><p>Порог освобождения от НДС снижается до 15 млн ₽ дохода за год. Ваш доход за 9 месяцев — 16,4 млн ₽, то есть порог уже превышен. Значит, с 1 января вы становитесь плательщиком НДС.</p><h3>Что это значит для вас в деньгах</h3><p>Если оборот останется прежним (около 22 млн ₽ в год), выбор такой:</p><ul><li><b>Пониженная ставка 5% без вычетов</b> — около 1,1 млн ₽ НДС в год.</li><li><b>Общая ставка с вычетами</b> — сумма зависит от того, сколько НДС вам выставляют поставщики. По вашим платежам примерно 60% закупок идёт от поставщиков с НДС, поэтому выходит около 1,4 млн ₽ в год.</li></ul>", "prompts": []}, {"title": "Через 2 недели возможен кассовый разрыв", "note": "Не хватит 210 000 ₽", "body": "<h2>23 октября на счёте может не хватить около 210 000 ₽.</h2><p>В эти дни у вас обычно уходят зарплата, налог и оплата поставщику, а поступлений меньше, чем платежей.</p><h3>Что можно сделать</h3><ul><li>Перенести платёж поставщику на конец месяца.</li><li>Напомнить покупателям об оплате.</li><li>Взять овердрафт на несколько дней.</li></ul>", "prompts": ["Подробнее об овердрафте"]}, {"title": "Wildberries повышает комиссию в вашей категории", "note": "Около −40 000 ₽ в месяц", "body": "<p>С 1 ноября комиссия WB в категории «Мебель» вырастет с 17% до 19%. В сентябре вы продали через WB на 2 млн ₽, при тех же продажах выплаты станут меньше примерно на 40 000 ₽ в месяц.</p>", "prompts": ["Пересчитай цены с новой комиссией", "Сравни WB и Ozon по моим товарам"]}, {"title": "Вы в топ-20% по росту среди похожих компаний", "note": "Ваш рост +18%", "body": "<h2>Вы в топ-20% по росту среди похожих компаний</h2><p>Ваш рост +18% · в среднем по сегменту +3% · у лидеров +25%</p><h3>Что отличает лидеров сегмента</h3><ul><li>Больше продаж через маркетплейсы: 55% выручки против ваших 20%.</li><li>Быстрее получают оплату: 14 дней против ваших 25.</li><li>Тратят меньше на логистику: 5% выручки против ваших 9%.</li></ul>", "prompts": ["Как продавать на маркетплейсах?", "Как ускорить оплату от покупателей?", "Как снизить логистику?"]}];
  var tabHTML = {
    connection: connectionHTML,
    events: [
      '<section class="content-pane events-pane">',
        '<h2 class="content-title">Сразу о важном</h2>',
        '<div class="event-strip-clip"><div class="event-strip">',
          '<button type="button" class="event-card event-card--payment" data-open-payment-detail data-long-press aria-haspopup="dialog" aria-expanded="false" aria-label="Платёж на 250 000 рублей отклонён. Подробнее"><span class="event-card-icon"><img src="assets/icons/flash.svg" alt=""></span><span class="hub-event-tag">Высокий риск</span><span class="event-card-label">Платёж от 17.09.26<br>отклонён</span></button>',
          '<button type="button" class="event-card event-card--payment hub-important-card hub-important-card--red" data-overview-event="documents"><span class="event-card-icon"><img src="assets/icons/flash.svg" alt=""></span><span class="hub-event-tag">Высокий риск</span><span class="event-card-label">Риск ограничений<br>по 115-ФЗ</span></button>', 
          '<button type="button" class="event-card event-card--payment hub-important-card hub-important-card--orange" data-overview-event="credit"><span class="event-card-icon"><img src="assets/icons/event-percent.svg" alt=""></span><span class="hub-event-tag hub-event-tag--upcoming">Скоро платёж</span><span class="event-card-label">Кредит<br><span class="hub-event-date">от 03.07.2024</span></span></button>', 
        '</div></div>',
        '<h2 class="content-title content-title--link"><span>Специально для вас</span><img class="title-chevron" src="assets/icons/chevron-right.svg" alt=""></h2>',
        '<div class="recommendation-list">',
          '<article class="recommendation-card"><div class="recommendation-tag recommendation-tag--blue">Кэшбэк</div><div class="recommendation-copy">5% на бизнес-траты по категории «Логистика»</div><div class="recommendation-note">Осталось 19 дней</div></article>',
          '<article class="recommendation-card"><div class="recommendation-tag recommendation-tag--purple">Тариф «Просто»</div><div class="recommendation-copy">Дешевле на 340 ₽/мес<br>при вашем обороте</div><div class="recommendation-note">Бессрочное предложение</div></article>',
          '<article class="recommendation-card"><div class="recommendation-tag recommendation-tag--teal">Бонусы за отзывы</div><div class="recommendation-copy">Получайте до 500 ₽<br>за каждую оценку сервиса</div><div class="recommendation-note">Акция действует до 30 июня</div></article>',
        '</div>',
        '<div class="list-footer"><span class="ico"><img src="assets/icons/gear.svg" alt=""></span><span>Настроить Обзор</span></div>',
      '</section>'
    ].join(''),

  };

  var insightPreviews = [["НДС для УСН", "С 1 января меняются правила. Посмотрите, как это повлияет на ваш бизнес."], ["Кассовый разрыв", "Через 2 недели может не хватить 210 000 ₽ на предстоящие платежи."], ["Комиссия Wildberries", "С 1 ноября выплаты могут сократиться на 40 000 ₽ в месяц."], ["Рост бизнеса", "Ваш рост — 18%. Вы в топ-20% среди похожих компаний."]];

  if (window.SpotlightHubConfiguration) {
    var eventContent = document.createElement('div'); eventContent.innerHTML = tabHTML.events;
    eventContent.querySelectorAll('.content-title--link,.recommendation-list,.list-footer').forEach(function (node) { node.remove(); });
    var insightSection = document.createElement('section');
    insightSection.className = 'hub-insights';
    insightSection.innerHTML = '<h2 class="content-title"><button type="button" class="hub-overview-section-link" data-open-overview-segment="insights">Инсайты<span aria-hidden="true" class="hub-overview-chevron"></span></button></h2><div class="event-strip-clip"><div class="event-strip">' + overviewInsights.map(function (item, index) {
      return '<button type="button" class="event-card event-card--payment hub-insight-card" data-overview-insight="' + index + '"><span class="event-card-icon"><img src="assets/icons/insight-sparkles.svg" alt=""></span><span class="event-card-label">' + insightPreviews[index][0] + '</span><span class="event-card-deadline">' + insightPreviews[index][1] + '</span></button>';
    }).join('') + '</div></div>';
    eventContent.querySelector('.events-pane').appendChild(insightSection);
    eventContent.querySelector('.events-pane').insertAdjacentHTML('beforeend', window.SpotlightRegular.cards());
    tabHTML.events = eventContent.innerHTML;
  }
  var authoredOverview = tabHTML.events;
  if (window.SpotlightHubConfiguration) Object.defineProperty(tabHTML, 'events', {
    get: function () {
      var c=window.SpotlightHubConfiguration.state;
      var shell=document.createElement('div');shell.innerHTML=authoredOverview;
      var pane=shell.querySelector('.events-pane');
      if(!c.important) pane.querySelectorAll(':scope > .content-title,:scope > .event-strip-clip').forEach(function(node){node.remove();});
      if(!c.insights)pane.querySelector('.hub-insights')?.remove();
      var tasks=pane.querySelector('.hub-regular');
      if(tasks){if(c.tasks)tasks.outerHTML=window.SpotlightRegular.cards();else tasks.remove();}
      return shell.innerHTML;
    }, set: function (value) { authoredOverview=value; }
  });
  function mainHTML() {
    if(window.SpotlightMergedSegments?.enabled()) return window.SpotlightMergedSegments.render(connectionHTML,tabHTML.events);
    if(window.SpotlightHubConfiguration) return activeTab === 'events' && window.SpotlightHubConfiguration.state.overviewEnabled ? window.SpotlightMergedSegments.overview(tabHTML.events) : tabHTML.connection;
    return tabHTML[activeTab || 'connection'];
  }
  var activeTab = 'connection';
  var tabScroll = { events: 0, connection: 0 };
  var listOverflow = 0;
  var scrollTotal = TRAVEL;
  var stableState = 'full';
  var snapping = false;
  var snapFrame = 0;
  var settleTimer = 0;
  var lastScroll = 0;
  var lastTime = performance.now();
  var velocity = 0;
  var scrollEvents = 0;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var applicationState = {
    activeMainTab: 'connection',
    spotlight: 'closed',
    spotlightOrigin: { area: 'focus', section: 'connection' },
    notificationNavigation: 'none',
    sheetState: 'full',
    conversationType: null,
    // Альфа-Интеллект conversation: 'new' = New Thread (nothing sent yet), 'active' = the first
    // request was sent, null = no assistant conversation. Focus/keyboard never change it.
    threadStatus: null
  };
  var contactThreads = {
    manager: { title: 'Чат с Менеджером', greeting: 'Здравствуйте! Я ваш менеджер Екатерина. Могу помочь с любым вопросом, обращайтесь.', messages: [], draft: '' },
    support: { title: 'Чат', greeting: 'Здравствуйте! Чем могу помочь?', messages: [], draft: '' },
    // V3 Связь chats preview (Figma 59:14319): the only content is the row's last message.
    krasnov: { title: 'Чат с Менеджером', greeting: 'Всегда пожалуйста! ☺️', messages: [], draft: '' }
  };
  contactThreads.ivanov = {title:'Сергей Иванов', role:'Валютный контролёр', greeting:'Документы по валютному переводу проверены', messages:[], draft:''};
  contactThreads.petrov = {title:'Кирилл Петров', role:'Клиентский менеджер', greeting:'Подготовил для вас предложение по эквайрингу', messages:[], draft:''};
  var MANAGER_GREETING = contactThreads.manager.greeting;
  // V3 (Figma 64:8167): where the GLOBAL «Спросите что угодно» entry is shown. This is the only
  // place to change it; chat composers (New Thread, Thread, Support, manager chats) are separate.
  var GLOBAL_AI_INPUT_VISIBILITY = {
    aiHome: true,
    threads: true,
    managers: false,
    manager: false,
    events: false,
    event: false,
    support: false
  };
  var managerThreadIds = { 'Екатерина Андреева': 'manager', 'Александр Краснов': 'krasnov' };
  if (window.SpotlightHubConfiguration) {
    contactThreads.manager.title = 'Екатерина Андреева';
    contactThreads.manager.role = 'Клиентский менеджер';
    contactThreads.krasnov.title = 'Александр Краснов';
    contactThreads.krasnov.role = 'Клиентский менеджер';
  }
  var contactsKey='spotlight-hub.mmb.contacts.v1';
  var contactStorage = window.SpotlightResearch ? window.SpotlightResearch.storage : {getItem: function(key){return sessionStorage.getItem(key);}, setItem: function(key,value){sessionStorage.setItem(key,value);}};
  try { var savedContacts=JSON.parse(contactStorage.getItem(contactsKey)||'{}');Object.keys(contactThreads).forEach(function(key){var saved=savedContacts[key];if(saved&&Array.isArray(saved.messages)){contactThreads[key].messages=saved.messages;contactThreads[key].draft=typeof saved.draft==='string'?saved.draft:'';}}); } catch(_) {}
  function saveContacts(){try{contactStorage.setItem(contactsKey,JSON.stringify(contactThreads));}catch(_){}}
  function openManagerChat(name) {
    var selected = connectionList.managers.find(function(manager){ return manager.name === name; });
    if (!selected) return;
    var type = managerThreadIds[name] || ('manager-' + connectionList.managers.indexOf(selected));
    managerThreadIds[name] = type;
    if (!contactThreads[type]) contactThreads[type] = { title: name, role: selected.role === 'Валютный контролёр' ? 'Валютный менеджер' : selected.role, greeting: 'Здравствуйте! Я ' + name + ', ваш ' + selected.role.toLocaleLowerCase('ru') + '. Чем могу помочь?', messages: [], draft: '' };
    openContactChat(type);
  }
  var contactReturn = null;
  // V3: where Back from Focus :: Threads goes when it was opened from the navbar bubble.
  var threadsReturn = null;
  var aiNavigationOrigin = null;
  var restoringView = false;
  // Shared AI compose state (inline New Thread). composeOrigin decides what a dismissal
  // without sending restores: 'aiHome' keeps the V3 centred compose, 'threads' returns to Чаты.
  var composeOrigin = null;
  var composeDraft = '';
  var composeLeaving = 0;
  // Compose ↔ Threads motion: same easing as every page transition, short content timings.
  // The keyboard keeps its own 360 ms slide; content does not wait for it.
  // Motion grammar for Threads ↔ New Thread (two states of one AI surface): the outgoing layer
  // drops `rise` px and softens, the incoming layer rises `rise` px into place, and the input
  // travels as one shared element. Opacity is always secondary to movement.
  var MORPH = { duration: 240, travel: 280, rise: 32 };
  // While a morph runs, taps are ignored so nothing can start twice or stack transforms.
  var morphing = false;
  var detailReturn = null;
  var spotlightReturn = null;
  var notificationsReturn = null;
  var directoryReturn = null;
  var directoryMode = null;
  var directoryMotion = null;
  function clearDirectoryMotion(){
    if(!directoryMotion)return;
    directoryMotion.animations.forEach(function(a){a.cancel();});
    directoryMotion.snapshot.remove();
    $('directoryView').style.zIndex='101';
    directoryMotion=null;
  }
  var managerProfileName = 'Екатерина Андреева';
  var eventRead = false;
  function isContactChat() { return Object.prototype.hasOwnProperty.call(contactThreads, applicationState.conversationType); }

  var activeView = 'main';
  var viewStack = ['main'];
  var lockedScrollTop = 0;
  var reminderTurn = 0;
  var replyTimer = 0;
  var pendingResponse = null;
  var dismissTimer = 0, dismissSequence = 0;
  var nativeKeyboard = !!window.SpotlightResearch || /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (nativeKeyboard) document.body.classList.add('native-keyboard');

  var composerMotion = [];
  var changingView = false;
  var keyboardFrame = 0;
  var KEYBOARD_DURATION = 380;
  var navigatingContact = false;
  var MOTION = { duration: 460, easing: 'cubic-bezier(.32,.72,0,1)' };

  function cancelComposerMotion() {
    stage.classList.remove('is-keyboard-morph');
    if (stage.classList.contains('is-input-entering')) {
      stage.classList.remove('is-input-entering');chatView.style.transition='';
    }
    composerMotion.forEach(function (animation) { animation.cancel(); });
    composerMotion = [];
  }

  function hostComposer(host) {
    if (field.parentElement !== host) { host.appendChild(composerGlow); host.appendChild(field); }
  }

  function hostMainContent() {
    if (upper.parentElement !== $('mainLayer')) $('mainLayer').appendChild(upper);
  }

  function blurContactForNavigation() {
    navigatingContact = true;
    contactInput.blur();
    navigatingContact = false;
    cancelAnimationFrame(keyboardFrame);
  }

  function morphComposer(change, duration) {
    if(window.SpotlightSurfaceMotion?.committing){cancelComposerMotion();change();return;}
    var before=getComputedStyle(chatComposer);
    var frame={transform:before.transform,width:before.width,height:before.height};
    var companions=[chatView.querySelector('.focus-ambient-scene'),greeting,chips,chatView.querySelector('.hub-compose-note')].filter(Boolean);
    var boxes=companions.map(function(node){return node.getBoundingClientRect();});
    var inputBefore=chatComposer.getBoundingClientRect();
    cancelComposerMotion();stage.classList.add('is-keyboard-morph');change();
    if(reduceMotion){stage.classList.remove('is-keyboard-morph');return;}
    var timing={duration:duration || KEYBOARD_DURATION,easing:MOTION.easing};
    var after=getComputedStyle(chatComposer);
    composerMotion.push(chatComposer.animate([frame,{transform:after.transform,width:after.width,height:after.height}],timing));
    var scale=stage.getBoundingClientRect().width/stage.offsetWidth;
    companions.forEach(function(node,index){var to=node.getBoundingClientRect();var dy=node.classList.contains('hub-compose-note') ? inputBefore.top-chatComposer.getBoundingClientRect().top : boxes[index].top-to.top;composerMotion.push(node.animate([{translate:'0 '+(dy/scale)+'px'},{translate:'0 0'}],timing));});
    var currentMotion=composerMotion;Promise.all(currentMotion.map(function(a){return a.finished.catch(function(){});})).then(function(){if(composerMotion===currentMotion)stage.classList.remove('is-keyboard-morph');});
  }

  function placeComposer(variant, y, h) {
    var field=chatComposer, inner=$('assistantInner'), text=chatInput, glass=$('assistantGlass'), grad=$('assistantGrad');
    field.dataset.aiState = variant === AI_INPUT.focused ? 'focused' : 'resting';
    field.style.transform = 'translate3d('+variant.x+'px,'+y+'px,0)';
    field.style.width = variant.w+'px'; field.style.height = (h || variant.h)+'px'; field.style.borderRadius = '';
    ['left','top','right','bottom','borderRadius'].forEach(function(k){inner.style[k]='';});
    text.style.left = ''; text.style.opacity = 1; text.style.pointerEvents = 'auto'; text.tabIndex = 0;
    glass.style.opacity=''; grad.style.opacity=''; field.style.boxShadow='';
  }

  function syncComposer() {
    var closed = applicationState.spotlight === 'closed';
    var chatting = !closed && activeView === 'chatView' && !isContactChat();
    // Each field stays with its page for entry AND exit transitions.
    field.style.visibility = !closed && !stage.classList.contains('is-manual-chat') && GLOBAL_AI_INPUT_VISIBILITY.aiHome ? 'visible' : 'hidden';
    field.inert = closed || activeView !== 'main';
    if (!closed && activeView === 'main') render();
    if (!chatting) return;
    var cs=getComputedStyle(chatView);
    var keyboard=chatView.classList.contains('has-keyboard') ? parseFloat(cs.getPropertyValue('--keyboard-height')) || 0 : 0;
    // Focused (keyboard) = ChatBar variant; otherwise the input rests in its larger variant.
    var variant=chatView.classList.contains('has-keyboard') ? AI_INPUT.focused : AI_INPUT.resting;
    var height=Math.max(variant.h,(parseFloat(chatInput.style.height)||36)+variant.h-36);
    chatView.style.setProperty('--composer-height',height+'px');
    var note = threadStore && chatView.querySelector('.hub-compose-note');
    var noteSpace = note ? note.offsetHeight + 28 : 60;
    if (threadStore) chatView.style.setProperty('--compose-note-space', noteSpace + 'px');
    var bottom=keyboard ? keyboard+(threadStore && applicationState.threadStatus === 'new' ? noteSpace : 12) : 34;
    var top=VIEW_H-bottom-height-chatView.offsetTop;
    if (threadStore) chatView.style.setProperty('--hub-glow-top', (top + height - 60) + 'px');
    placeComposer(variant,top,height);
    chatInput.placeholder=chatInput.dataset.contextPlaceholder || 'Спросите что угодно';
    chatInput.style.width=AI_INPUT.textWidth+'px';
    var empty=applicationState.conversationType !== 'help' && !chatMessages.querySelector('.chat-message');
    var introTop=upper.offsetTop+greeting.offsetTop-35;
    var introBottom=upper.offsetTop+chips.offsetTop+chips.offsetHeight-34;
    var headerBottom=chatView.offsetTop+chatView.querySelector('.flow-header').offsetHeight;
    var shift=empty ? (keyboard ? 89.6-greeting.offsetTop : (headerBottom+top+chatView.offsetTop-introBottom-introTop)/2) : 0;
    stage.style.setProperty('--intro-shift',shift+'px');
  }

  function keyboardVisible(on) {
    if (activeView !== 'chatView') return;
    var wasOpen=chatView.classList.contains('has-keyboard');
    if (wasOpen === on) return;
    var distance=chatScroll.scrollHeight-chatScroll.clientHeight-chatScroll.scrollTop;
    var pinned=chatView.classList.contains('has-task-questionnaire') || (chatMessages.children.length>0 && distance<48);
    var scrollBefore=chatScroll.scrollTop;
    var change=function(){
      chatView.classList.toggle('has-keyboard',on);
      $('iosKeyboard').inert=!on || nativeKeyboard;
      updateKeyboardViewport();
      syncComposer();
    };
    if (changingView || isContactChat() || chatView.classList.contains('has-task-questionnaire')) change(); else morphComposer(change,KEYBOARD_DURATION);
    cancelAnimationFrame(keyboardFrame);
    var start=performance.now();
    function follow(now) {
      if (activeView !== 'chatView') return;
      if (pinned) chatScroll.scrollTop=chatScroll.scrollHeight-chatScroll.clientHeight;
      else chatScroll.scrollTop=Math.min(scrollBefore,chatScroll.scrollHeight-chatScroll.clientHeight);
      if(now-start<KEYBOARD_DURATION+60) keyboardFrame=requestAnimationFrame(follow);
    }
    keyboardFrame=requestAnimationFrame(follow);
  }

  function updateKeyboardViewport() {
    if (!nativeKeyboard) return;
    var vv=window.visualViewport;
    var obscured=window.SpotlightResearch ? 0 : vv ? Math.max(0,window.innerHeight-vv.height-vv.offsetTop) : 0;
    var scale=parseFloat(stage.style.getPropertyValue('--fit')) || 1;
    chatView.style.setProperty('--keyboard-height',(obscured/scale)+'px');
    if(activeView === 'chatView') syncComposer();
  }

  function updateComposer() {
    if (isContactChat()) {
      contactInput.style.height = 'auto';
      var contactHeight = Math.max(36, Math.min(96, contactInput.value ? contactInput.scrollHeight : 36));
      contactInput.style.height = contactHeight + 'px';
      chatView.style.setProperty('--composer-height', Math.max(44, contactHeight + 8) + 'px');
      contactSend.disabled = !contactInput.value.trim();
      if (activeView === 'chatView' && !changingView) syncComposer();
      return;
    }
    // Measure actual text at the final chat width, never the collapsed button width.
    if (activeView === 'chatView') {
      var emptyChat = applicationState.conversationType !== 'help' && chatMessages.children.length === 0;
      chatInput.style.width = AI_INPUT.textWidth + 'px';
    }
    chatInput.style.height='36px';
    var height=Math.max(36,Math.min(96,chatInput.value ? chatInput.scrollHeight : 36));
    chatInput.style.height=height+'px';
    var variant = chatView.classList.contains('has-keyboard') ? AI_INPUT.focused : AI_INPUT.resting;
    chatView.style.setProperty('--composer-height',Math.max(variant.h,height+variant.h-36)+'px');
    $('chatSend').disabled=!chatInput.value.trim() || applicationState.spotlight === 'loading';
    $('chatSend').classList.toggle('is-empty',!chatInput.value.trim());
    if(activeView === 'chatView' && !changingView) syncComposer();
  }

  function segmentsEnabled() {
    return !window.SpotlightHubConfiguration || window.SpotlightHubConfiguration.state.mainSegments;
  }
  function sheetHeaderHeight(progress) {
    if (window.SpotlightMergedSegments?.enabled()) return 0;
    // MVP places the support chat 20px below the 28px title.
    if (window.SpotlightHubConfiguration?.state.supportAccess === 'preview' && !segmentsEnabled()) return 70;
    // The contact heading starts 24px below the visible 32px segment track.
    if (segmentsEnabled() && showsConnectionList()) return lerp(SEG_PAD_FULL, SEG_PAD_DOCKED, progress) + 32 + 24;
    // Other variants retain the existing section-heading gap.
    return segmentsEnabled() ? lerp(SEG_H_FULL, SEG_H_DOCKED, progress) : 50;
  }

  function connectionInputDock() {
    return !!window.SpotlightHubConfiguration && (activeTab === 'connection' || activeTab === 'events');
  }
  function measure() {

    // V3: the docked Custom Input occupies the bottom of the open sheet.
    var visibleH = VIEW_H - (SHEET_TOP_DOCKED + sheetHeaderHeight(1)) - (connectionInputDock() ? 118 : INPUT_RESERVE);
    window.SpotlightMergedSegments?.measureMain(visibleH);
    var contentH = listInner.scrollHeight;
    listOverflow = Math.max(0, contentH - visibleH);
    scrollTotal = TRAVEL + listOverflow;
    spacer.style.height = scrollTotal + 'px';
    if (scroller.scrollTop > scrollTotal) scroller.scrollTop = scrollTotal;
  }

  window.addEventListener('spotlight-hub:segment-selected',function(event){
    measure();scroller.scrollTop=Math.min(event.detail.offset,TRAVEL+(window.SpotlightMergedSegments?.mainAnchor || 0));lastScroll=scroller.scrollTop;render();
  });

  function render() {
    var s = scroller.scrollTop;
    stage.classList.toggle('is-operator-connection-dock', connectionInputDock() && activeView === 'main');
    stage.classList.toggle('is-overview-input-dock', connectionInputDock() && activeView === 'main');
    var p = clamp(s / TRAVEL, 0, 1);
    var c = bezier(norm(p, C_START, C_END));
    var sheetTop = SHEET_TOP_FULL - TRAVEL * p;
    sheet.style.transform = 'translate3d(0,' + sheetTop + 'px,0)';

    var edge = 1 - norm(p, 0.86, 1);
    sheet.style.borderRadius = (SHEET_RADIUS * edge) + 'px ' + (SHEET_RADIUS * edge) + 'px 0 0';
    sheet.style.boxShadow = edge <= 0.001 ? 'none' :
      '0 -2px 8px rgba(3,3,6,' + (0.04 * edge) + '),0 -12px 32px rgba(3,3,6,' + (0.05 * edge) + ')';

    var segH = sheetHeaderHeight(p);
    seg.style.padding = lerp(SEG_PAD_FULL, SEG_PAD_DOCKED, p) + 'px';
    sheetList.style.top = segH + 'px';
    listInner.style.transform = 'translate3d(0,' + -clamp(s - TRAVEL, 0, listOverflow) + 'px,0)';
    window.SpotlightMergedSegments?.pinMain(clamp(s-TRAVEL,0,listOverflow));

    if (activeView === 'main' && applicationState.spotlight !== 'closed') {
    // V3: one input, two positions. Only its vertical position follows the sheet; the
    // material, placeholder, logo and hit area stay those of the full Custom Input.
    var dock = (INPUT_SCROLL_DOCK || connectionInputDock()) ? bezier(p) : 0;
    var y = lerp(F0.y, connectionInputDock() ? VIEW_H-98 : FB.y, dock);
    field.classList.toggle('is-content-placed', !INPUT_SCROLL_DOCK && !connectionInputDock());
    field.style.transform = 'translate3d(' + F0.x + 'px,' + y + 'px,0)';
    field.style.width = F0.w + 'px';
    field.style.height = F0.h + 'px';
    grad.style.opacity = '';
    glass.style.opacity = '';
    field.style.boxShadow = '';
    icon.style.left = (F0.icon - 12) + 'px';
    icon.style.opacity = 0;
    logo.style.left = (F0.icon - 16) + 'px';
    logo.style.width = logo.style.height = '32px';
    logo.style.opacity = 1;
    text.style.opacity = 1;
    text.style.width = AI_INPUT.textWidth + 'px';
    text.style.pointerEvents = 'auto';
    text.tabIndex = 0;
    glow.style.transform = 'translate3d(' + (F0.x + F0.w/2 - 240) + 'px,' + (y + F0.h/2 - 76) + 'px,0)';
    glow.style.opacity = 1 - dock;
    // Figma «свечение» behind the bottom input (frame starts 30px above the field).
    focusHaze.style.transform = 'translate3d(0,' + (y - 30) + 'px,0)';
    focusHaze.style.opacity = dock;
    $('overviewInputGlass').style.opacity = dock;

    }

    /* Видео-референс: контент под листом слегка отдаляется (до 3.5%),
       а локальный белый fade поднимается непосредственно перед кромкой. */
    var fade = smoothstep(norm(p, 0.02, 0.82));
    upper.style.transform = 'translate3d(0,' + (-4 * fade) + 'px,0) scale(' + (1 - 0.035 * fade) + ')';
    stories.style.opacity = 1 - 0.48 * fade;
    stories.style.filter = 'blur(' + (1.4 * fade) + 'px)';
    greeting.style.opacity = 1 - 0.88 * fade;
    greeting.style.transform = 'translate3d(0,' + (-4 * fade) + 'px,0)';
    greeting.style.filter = 'blur(' + (2.2 * fade) + 'px)';
    chips.style.opacity = 1 - 0.72 * fade;
    chips.style.transform = 'translate3d(0,' + (-3 * fade) + 'px,0)';
    chips.style.filter = 'blur(' + (1.8 * fade) + 'px)';
    scrim.style.transform = 'translate3d(0,' + (sheetTop - 190) + 'px,0)';
    scrim.style.opacity = norm(p, 0.03, 0.62);
    /* Нативный iOS-индикатор закреплён у нижнего края и не зависит
       от положения или состояния листа. */
    home.style.opacity = 1;
  }

  function bindShortWords(root) { window.SpotlightTypography.bind(root); }

  function fit() {
    var research = window.SpotlightResearch;
    var k = research ? 1 : window.innerWidth / 393;
    VIEW_H = research ? research.height() : window.innerHeight / k;
    if (research) {
      var width = stage.clientWidth;
      AI_INPUT.resting.w = width - 40;
      AI_INPUT.focused.w = width - 16;
      AI_INPUT.textWidth = width - 112;
      F0.w = width - 40; F0.icon = width - 88;
      AI_SLOT_Y = VIEW_H - 34 - AI_INPUT.resting.h;
    }
    stage.style.setProperty('--fit', k);
    stage.style.setProperty('--embed-height', VIEW_H + 'px');
    measure();
    render();
    if (activeView === 'chatView') syncComposer();
  }

  function animateTo(target, initialVelocity) {
    clearTimeout(settleTimer);
    cancelAnimationFrame(snapFrame);
    var from = scroller.scrollTop;
    target = clamp(target, 0, scrollTotal);
    if (Math.abs(target - from) < 0.5) {
      scroller.scrollTop = target;
      stableState = target === 0 ? 'full' : 'open';
      applicationState.sheetState = stableState;
      render();
      return;
    }
    snapping = true;
    var distance = Math.abs(target - from);
    var velocityBoost = Math.min(70, Math.abs(initialVelocity || 0) * 55);
    var duration = reduceMotion ? 1 : 1.25 * clamp(330 + distance * 0.12 - velocityBoost, 230, 390);
    var started = performance.now();
    function frame(now) {
      var t = clamp((now - started) / duration, 0, 1);
      scroller.scrollTop = lerp(from, target, easeOutQuart(t));
      render();
      if (t < 1) {
        snapFrame = requestAnimationFrame(frame);
      } else {
        snapping = false;
        scroller.scrollTop = target;
        stableState = target === 0 ? 'full' : 'open';
        applicationState.sheetState = stableState;
        lastScroll = target;
        lastTime = performance.now();
        render();
      }
    }
    snapFrame = requestAnimationFrame(frame);
  }

  function settle() {
    if (snapping) return;
    var s = scroller.scrollTop;
    if (s > TRAVEL + 0.5) {
      stableState = 'open';
      applicationState.sheetState = stableState;
      return;
    }
    if (s <= 0.5) {
      stableState = 'full';
      applicationState.sheetState = stableState;
      return;
    }
    if (Math.abs(s - TRAVEL) <= 0.5) {
      stableState = 'open';
      applicationState.sheetState = stableState;
      return;
    }
    var p = s / TRAVEL;
    if (stableState === 'full') {
      animateTo((p >= OPEN_THRESHOLD || velocity >= VELOCITY_THRESHOLD) ? TRAVEL : 0, velocity);
    } else {
      var closing = 1 - p;
      animateTo((closing >= OPEN_THRESHOLD || velocity <= -VELOCITY_THRESHOLD) ? 0 : TRAVEL, velocity);
    }
  }

  var queued = false;
  function onScroll() {
    if (activeView !== 'main' || applicationState.spotlight === 'closed') {
      if (scroller.scrollTop !== lockedScrollTop) scroller.scrollTop = lockedScrollTop;
      return;
    }
    scrollEvents++;
    var now = performance.now();
    var s = scroller.scrollTop;
    var dt = Math.max(8, now - lastTime);
    if (!snapping) velocity = (s - lastScroll) / dt;
    lastScroll = s;
    lastTime = now;
    render();
    if (!queued) {
      queued = true;
      requestAnimationFrame(function () { queued = false; render(); });
    }
    if (snapping || s > TRAVEL + 0.5) return;
    clearTimeout(settleTimer);
    var p = s / TRAVEL;
    if ((stableState === 'full' && (p >= OPEN_THRESHOLD || velocity >= VELOCITY_THRESHOLD)) ||
        (stableState === 'open' && ((1 - p) >= OPEN_THRESHOLD || velocity <= -VELOCITY_THRESHOLD))) {
      settleTimer = setTimeout(settle, 0);
    } else {
      settleTimer = setTimeout(settle, 90);
    }
  }

  function switchTab(next) {
    if (!segmentsEnabled()) next = 'connection';
    dismissEventContext();
    if (!Object.prototype.hasOwnProperty.call(tabHTML, next) || next === activeTab) return;
    tabScroll[activeTab] = Math.max(0, scroller.scrollTop - TRAVEL);
    activeTab = next;
    applicationState.activeMainTab = next;
    tabs.forEach(function (tab) {
      var on = tab.dataset.tab === activeTab;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    listInner.innerHTML = mainHTML();
    if(window.SpotlightHubConfiguration)window.SpotlightHubConfiguration.decorate();
    bindShortWords(listInner);
    measure();
    var target = stableState === 'open'
      ? TRAVEL + clamp(tabScroll[activeTab], 0, listOverflow)
      : 0;
    scroller.scrollTop = target;
    lastScroll = target;
    render();
  }

  function allFlowViews() {
    return [chatView, notificationsView, notificationView, $('directoryView')];
  }

  function setFlowView(next) {
    window.dispatchEvent(new Event('spotlight-hub:navigation'));
    clearDirectoryMotion();
    // A destination is never left temporarily hidden (e.g. Event detail under a long-tap help thread).
    var destination = next === 'main' ? null : $(next);
    if (destination && destination.style.visibility === 'hidden') destination.style.visibility = '';
    dismissEventContext();
    clearTimeout(settleTimer);
    cancelAnimationFrame(snapFrame);
    snapping = false;
    // Switching from inline to pushed must establish the offscreen start before
    // the active class changes; otherwise the browser coalesces both layouts.
    if(next === 'chatView' && activeView !== 'chatView' && !chatView.classList.contains('is-manual') && !restoringView && viewStack.indexOf('chatView') < 0) {
      chatView.style.transition='none';
      chatView.classList.remove('is-active','is-behind');
      chatView.style.transform='translate3d(100%,0,0)';
      void chatView.offsetWidth;
      chatView.style.transform='';
      chatView.style.transition='';
      void chatView.offsetWidth;
    }
    if (activeView === 'main' && next !== 'main') lockedScrollTop = scroller.scrollTop;
    var stackIndex=viewStack.indexOf(next);
    if(next === 'main') viewStack=['main'];
    else if(stackIndex>=0) viewStack=viewStack.slice(0,stackIndex+1);
    else viewStack.push(next);
    activeView = next;
    if (next === 'main' || !stage.classList.contains('is-manual-chat')) hostMainContent();
    if (next !== 'main' && next !== 'chatView') {
      stage.classList.remove('is-manual-chat','is-conversation','is-dashboard-chat','is-contact-chat','is-threads-compose','is-threads-leaving');
      changingView=true; chatInput.blur(); changingView=false;
    }
    var ranks = { directoryView: 1, main: 0, notificationsView: 1, notificationView: 2, chatView: chatView.classList.contains('is-pushed') || applicationState.conversationType === 'help' ? 3 : 1 };
    allFlowViews().forEach(function (view) {
      var on = view.id === next;
      var position=viewStack.indexOf(view.id);
      var behind=position>=0 && position<viewStack.length-1;
      if(position>=0)view.dataset.depth=position;
      view.style.zIndex=100+(Number(view.dataset.depth)||ranks[view.id]);
      view.classList.toggle('is-active', on);
      view.classList.toggle('is-behind', behind);
      view.inert = !on;
      view.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    sheet.inert = next !== 'main';
    document.querySelector('.header').inert = next !== 'main';
    $('mainLayer').inert = next !== 'main' && !(next === 'chatView' && stage.classList.contains('is-manual-chat'));
    var subview = next !== 'main';
    stage.classList.toggle('is-subview', subview);
    if (!changingView) syncComposer();
    scroller.classList.toggle('is-locked', subview || applicationState.spotlight === 'closed');
    $('entryPoint').inert = applicationState.spotlight !== 'closed';
    syncChrome();
    bindShortWords(spotlightShell);
    if(window.SpotlightHubConfiguration){spotlightShell.inert=applicationState.spotlight==='closed';window.SpotlightHubConfiguration.decorate();}
    syncAIChrome();
  }

  function openSpotlight() {
    if(applicationState.spotlight !== 'closed') return;
    stage.classList.add('is-intro-preparing');
    clearTimeout(settleTimer);
    cancelAnimationFrame(snapFrame);
    snapping = false;
    velocity = 0;
    lastTime = performance.now();
    cancelComposerMotion();
    changingView=true;
    stage.classList.remove('is-manual-chat','is-conversation','is-dashboard-chat','is-contact-chat','is-threads-compose','is-threads-leaving');
    chatView.classList.remove('is-manual');
    clearTimeout(dismissTimer);
    dismissSequence++;
    clearTimeout(replyTimer);
    applicationState.spotlight = 'empty';
    applicationState.notificationNavigation = 'none';
    spotlightShell.setAttribute('aria-hidden', 'false');
    stage.classList.add('is-spotlight');
    stage.classList.remove('is-entry');
    setFlowView('main');
    if (activeTab !== 'connection') switchTab('connection');
    scroller.classList.remove('is-locked');
    stableState = 'full';
    scroller.scrollTop = 0;
    lastScroll = 0;
    bindShortWords(upper);
    render();
    changingView=false; syncComposer();
    void upper.offsetHeight;
    stage.classList.remove('is-intro-preparing');
  }

  function dismissSpotlight() {
    window.dispatchEvent(new Event('spotlight-hub:navigation'));
    saveAIThread();
    if(window.SpotlightMoreMenu)window.SpotlightMoreMenu.closeImmediately();
    dismissEventContext();
    if(isContactChat()) contactThreads[applicationState.conversationType].draft = contactInput.value;
    $('entryPoint').inert = false;
    clearTimeout(replyTimer);
    clearTimeout(settleTimer);
    cancelAnimationFrame(snapFrame);
    snapping = false;
    var closeComposer = function(){
      changingView=true;
      blurContactForNavigation();
      chatInput.blur();
      if (!isContactChat()) keyboardVisible(false);
      changingView=false;
    };
    cancelComposerMotion(); closeComposer();
    applicationState.spotlight = 'closed';
    applicationState.notificationNavigation = 'none';
    stage.classList.remove('is-spotlight');
    stage.classList.add('is-entry');
    spotlightShell.setAttribute('aria-hidden', 'true');
    scroller.classList.add('is-locked');
    field.inert=true;
    field.style.visibility='hidden';
    // Keep the outgoing page intact until the sheet has left the screen.
    clearTimeout(dismissTimer);
    dismissSequence++;
    var finishDismiss = function () { stage.classList.remove('is-manual-chat','is-conversation','is-dashboard-chat','is-contact-chat','is-threads-compose','is-threads-leaving'); chatView.classList.remove('is-manual'); chatInput.value=''; chatInput.style.height='36px'; setFlowView('main'); };
    if(window.SpotlightHubConfiguration){
      spotlightShell.inert=true;
      var sequence=++dismissSequence;
      Promise.all(spotlightShell.getAnimations().map(function(animation){return animation.finished.catch(function(){});})).then(function(){if(sequence===dismissSequence && applicationState.spotlight==='closed')finishDismiss();});
    }else dismissTimer=setTimeout(finishDismiss,reduceMotion ? 0 : 520);
  }

  function returnToMain(tab, restore) {
    if(window.SpotlightSurfaceMotion && !window.SpotlightSurfaceMotion.committing && activeView==='directoryView' && directoryMode==='threads')return window.SpotlightSurfaceMotion.run(function(){returnToMain(tab,restore);});
    if (!window.SpotlightHubConfiguration && activeView === 'directoryView' && directoryMode === 'threads' && tab === 'connection' && restore && !reduceMotion && !stage.classList.contains('is-list-return')) {
      var dir = $('directoryView');
      var source = dir.querySelector('.page-input, .hub-request-input');
      var sourceRect = source?.getBoundingClientRect();
      var first = dir.querySelector('.hub-thread-row');
      var rowTop = first?.getBoundingClientRect().top;
      stage.classList.add('is-list-return');
      dir.style.transition = 'none';
      lockMorph(true, 'threads→connection');
      returnToMain(tab, restore);
      void stage.offsetWidth;
      var scale = spotlightShell.getBoundingClientRect().width / spotlightShell.offsetWidth;
      var move = {duration:460,easing:MOTION.easing,fill:'both'};
      var animations = [];
      if (sourceRect) {
        var target = field.getBoundingClientRect();
        animations.push(field.animate([{translate:((sourceRect.left-target.left)/scale)+'px '+((sourceRect.top-target.top)/scale)+'px'},{translate:'0 0'}],move));
      }
      var preview = listInner.querySelector('.experiment-thread-row');
      var shift = preview && rowTop !== undefined ? (preview.getBoundingClientRect().top-rowTop)/scale : 24;
      animations.push(dir.querySelector('#directoryContent').animate([{opacity:1,translate:'0 0',offset:0},{opacity:0,translate:'0 '+shift+'px',offset:.5},{opacity:0,translate:'0 '+shift+'px'}],move));
      animations.push(dir.querySelector('.native-header').animate([{opacity:1},{opacity:0}],move));
      var glow = dir.querySelector('.focus-ambient');
      if (glow) animations.push(glow.animate([{opacity:1},{opacity:0}],move));
      animations.push(sheet.animate([{opacity:0,offset:0},{opacity:0,offset:.45},{opacity:1}],move));
      whenDone(animations).then(function(){
        dir.style.visibility='hidden';
        stage.classList.remove('is-list-return');
        void stage.offsetWidth;
        animations.forEach(function(animation){animation.cancel();});
        dir.style.transition=''; lockMorph(false);
      });
      return;
    }
    if (!segmentsEnabled()) tab = 'connection';
    if (!Object.prototype.hasOwnProperty.call(tabHTML, tab)) tab = 'connection';
    var restoreMain = function(){
    changingView=true;
    clearTimeout(replyTimer);
    chatInput.blur();
    setFlowView('main');
    stage.classList.remove('is-manual-chat','is-conversation','is-dashboard-chat','is-contact-chat','is-threads-compose','is-threads-leaving');
    if (window.SpotlightHubConfiguration) listInner.innerHTML = mainHTML();
  hostMainContent();
    if (activeTab !== tab) switchTab(tab);
    applicationState.spotlight = 'empty';
    applicationState.conversationType = null;
    applicationState.notificationNavigation = 'none';
    scroller.classList.remove('is-locked');
    measure();
    stableState = restore ? restore.sheetState : 'full';
    applicationState.sheetState = stableState;
    scroller.scrollTop = restore ? clamp(restore.scrollTop, 0, scrollTotal) : 0;
    lastScroll = scroller.scrollTop;
    chatInput.value='';
    bindShortWords(upper);
    render();
    changingView=false; syncComposer();
    };
    cancelComposerMotion(); restoreMain();
  }

  function resetChat() {
    if (cancelAnswerFollow) cancelAnswerFollow();
    clearTimeout(replyTimer);
    chatMessages.innerHTML = '';
    chatLoader.hidden = true;
    chatInput.value = '';
    chatInput.style.height = '';
    reminderTurn = 0;
    pendingResponse = null;
    chatScroll.style.paddingTop = '';
    chatView.classList.toggle('is-help', applicationState.conversationType === 'help');
    var contact = isContactChat();
    chatComposer.hidden = contact;
    chatEmptyIntro.innerHTML='';
    chatView.classList.toggle('is-contact', contact);
    stage.classList.toggle('is-contact-chat', contact);
    chatView.querySelector('.flow-header h1').textContent = contact ? contactThreads[applicationState.conversationType].title : 'Альфа-Интеллект';
    var managerRole = contact && window.SpotlightHubConfiguration ? contactThreads[applicationState.conversationType].role : null;
    chatView.classList.toggle('has-manager-title', !!managerRole);
    chatView.classList.remove('has-dialogue-caption');
    var contactTitle=chatView.querySelector('.flow-header h1');
    if(applicationState.conversationType==='manager'){contactTitle.setAttribute('role','button');contactTitle.tabIndex=0;contactTitle.setAttribute('aria-label','Профиль Екатерины Андреевой');contactTitle.title='Екатерина Андреева';}
    else{contactTitle.removeAttribute('role');contactTitle.removeAttribute('tabindex');contactTitle.removeAttribute('aria-label');}
    if (managerRole) {
      var title = chatView.querySelector('.flow-header h1');
      var name = document.createElement('span'); name.textContent = contactThreads[applicationState.conversationType].title;
      var role = document.createElement('small'); role.textContent = managerRole;
      title.replaceChildren(name, role);
    }
    chatView.classList.toggle('is-support', applicationState.conversationType === 'support');
    chatBack.querySelector('img').src = 'assets/figma/back.svg';
    $('chatSearchPanel').hidden=true; $('chatSearch').value='';
    chatView.classList.remove('is-searching');
    $('chatSearchToggle').setAttribute('aria-expanded','false');
    contactInput.value = '';
    contactInput.style.height = '';
    contactComposer.inert = !contact;
    updateComposer();
    syncChrome();
  }

  function scrollChatEnd() {
    var scrollRevision = transcriptScrollRevision;
    requestAnimationFrame(function () {
      if (scrollRevision !== transcriptScrollRevision || activeView !== 'chatView') return;
      if (applicationState.conversationType !== 'help') {
        chatScroll.scrollTo({ top: chatScroll.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }

  function insightQuestion(item) {
    return [
      'Как изменения НДС для УСН повлияют на мой бизнес и что нужно сделать?',
      'Почему через две недели может возникнуть кассовый разрыв и как его избежать?',
      'Как новая комиссия Wildberries повлияет на мою прибыль и цены?',
      'Как мой бизнес растёт по сравнению с похожими компаниями и что можно улучшить?'
    ][overviewInsights.indexOf(item)] || item.title;
  }

  function addAnswerFollowups(article) {
    if (article.querySelector('.experiment-operator-message,.experiment-operator-wait,.hub-statement-result,.hub-account-result,.hub-event-answer') || window.SpotlightBanking?.choices(article.textContent)) return;
    if (!window.SpotlightHubConfiguration || !['help','regular','reminder'].includes(applicationState.conversationType)) return;
    var record = threadStore && threadStore.get(activeAIThread);
    var copy = article.textContent;
    if ((record && record.reminder) || /Создание задачи отменено|Подготовка выписки отменена|Давайте выберем счёт|Какой период вам нужен|Остался формат|Выписка в |Какую задачу вы хотите поручить мне|Как часто выполнять задачу|В какой день недели|В какое время выполнять задачу|Задача (сохранена|создана)|Ваша ЭЦП действует/.test(copy)) return;
    if (record && record.messages.some(function(m){return m.kind === 'user' && m.text === 'Скачать выписку';})) return;
    var existing = article.querySelector('.detail-actions,.hub-insight-prompts');
    if (existing && existing.querySelectorAll('button').length >= 2) return;
    if (existing) existing.remove();
    var prompts = /НДС|УСН|упрощён/.test(copy) ? ['Сравни варианты НДС','Как подготовиться к изменениям?','Что уточнить у бухгалтера?']
      : /кассовый разрыв/.test(copy) ? ['Какие платежи можно перенести?','Кому напомнить об оплате?','Расскажи про овердрафт']
      : /115-ФЗ|документ|сведения|пояснен/.test(copy) ? ['Какие документы ещё нужны?','Помоги составить пояснение','Что будет, если не успеть?']
      : /кредит|пополнить счёт/.test(copy) ? ['Сколько нужно внести на счёт?','Какие поступления ожидаются?','Что будет при просрочке?']
      : /юан|CNY/.test(copy) ? ['Покажи динамику курса','Рассчитай стоимость покупки юаней','Когда обновляется курс?']
      : ['Расскажи подробнее','Что мне сделать дальше?','На что обратить внимание?'];
    var module = document.createElement('div'); module.className = 'detail-actions hub-answer-followups';
    prompts.forEach(function(text){var button=document.createElement('button');button.type='button';button.setAttribute('data-insight-prompt','');button.textContent=text;module.appendChild(button);});
    article.appendChild(module);
  }

  var cancelAnswerFollow = null;
  var transcriptScrollRevision = 0;
  var pendingReplyScrollRevision = 0;
  function releaseTranscriptScroll() {
    transcriptScrollRevision++;
    cancelAnimationFrame(keyboardFrame);
    if (cancelAnswerFollow) cancelAnswerFollow();
    // Cancel an earlier smooth scroll as well as the reveal's frame loop.
    chatScroll.scrollTo({top:chatScroll.scrollTop, behavior:'instant'});
  }
  function followAnswerReveal(article, interval, duration) {
    if (cancelAnswerFollow) cancelAnswerFollow();
    // A reply arriving after the reader has started scrolling must not take over.
    if (pendingReplyScrollRevision !== transcriptScrollRevision) return;
    var words = Array.from(article.querySelectorAll('.hub-answer-word'));
    var start = performance.now(), frame, stopped = false;
    function stop() {
      stopped = true; cancelAnimationFrame(frame);
      if (cancelAnswerFollow === stop) cancelAnswerFollow = null;
    }
    cancelAnswerFollow = stop;
    function tick(now) {
      if (stopped || !article.isConnected || activeView !== 'chatView') { stop(); return; }
      var elapsed = now - start;
      var last = words[Math.min(words.length - 1, Math.floor(elapsed / Math.max(1,interval)))];
      var viewport = chatScroll.getBoundingClientRect();
      var scale = viewport.height / chatScroll.clientHeight || 1;
      var edge = elapsed >= duration ? article.getBoundingClientRect().bottom : last ? last.getBoundingClientRect().bottom : viewport.bottom;
      var delta = (edge - viewport.bottom) / scale + 24;
      if (delta > 0) chatScroll.scrollTop += Math.max(.5, delta * .18);
      if (elapsed < duration + 650) frame = requestAnimationFrame(tick);
      else stop();
    }
    frame = requestAnimationFrame(tick);
  }

  function revealAnswer(article) {
    var walker = document.createTreeWalker(article, NodeFilter.SHOW_TEXT);
    var nodes = [], node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim() && !node.parentElement.closest('button,.detail-actions,.hub-insight-prompts,.hub-answer-feedback')) nodes.push(node);
    }
    var index = 0;
    var total = nodes.reduce(function(count,text){return count + text.textContent.split(/(\s+)/).filter(function(word){return word.trim();}).length;},0);
    var interval = Math.min(28, 1800 / Math.max(1,total));
    nodes.forEach(function(text) {
      var fragment = document.createDocumentFragment();
      text.textContent.split(/(\s+)/).forEach(function(word) {
        if (!word.trim()) { fragment.appendChild(document.createTextNode(word)); return; }
        var span = document.createElement('span'); span.textContent = word;
        span.className = 'hub-answer-word';
        span.style.animationDelay = (index++ * interval) + 'ms';
        fragment.appendChild(span);
      });
      text.replaceWith(fragment);
    });
    article.style.setProperty('--answer-reveal-delay', (index * interval) + 'ms');
    article.classList.add('hub-answer-revealing');
    followAnswerReveal(article, interval, index * interval);
    setTimeout(function () {
      article.classList.remove('hub-answer-revealing');
      article.querySelectorAll('.hub-answer-word').forEach(function(span){span.replaceWith(document.createTextNode(span.textContent));});
      article.normalize();
    }, index * interval + 350);
  }

  function addMessage(kind, content, rich) {
    if (rich && typeof content === 'string' && content.indexOf('experiment-operator-message') >= 0) {
      content = content.replace('<span class="support-avatar operator">И</span>', '').replace('<span class="message-author">Иван</span>', '<span class="message-author">Оператор Иван</span>');
      content = content.replace('<span class="experiment-operator-avatar">М</span><div><strong>Мария · Поддержка</strong>', '<div class="support-bubble"><span class="message-author">Оператор Иван</span>').replace('Я Мария, специалист поддержки. Подключилась', 'Я Иван, специалист поддержки. Подключился');
    }

    if (kind === 'assistant' && typeof content === 'string') content = content.replace(/(?:Как |[«“" ])*Банк запросил дополнительные сведения по вашей деятельности/g, 'Банк запросил дополнительные сведения по вашей деятельности');
    recordAIMessage(kind, content, rich);
    var article = kind === 'assistant' && pendingResponse ? pendingResponse : document.createElement('article');
    var oldHeight = article.offsetHeight;
    var replacingLoader = article === pendingResponse;
    article.className = 'chat-message ' + kind;
    if (rich) article.innerHTML = content;
    else article.textContent = content;
    if(kind === 'assistant') { addAnswerFollowups(article); bindShortWords(article); }
    if (!replacingLoader) chatMessages.appendChild(article);
    if (kind === 'assistant') pendingResponse = null;
    if (replacingLoader && !reduceMotion) {
      revealAnswer(article);
      var finalHeight = article.offsetHeight;
      var exceedsViewport = article.getBoundingClientRect().bottom > chatScroll.getBoundingClientRect().bottom + 1;
      var expansion = article.animate([{ height: oldHeight + 'px', opacity: .55 }, { height: finalHeight + 'px', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.32,.72,0,1)' });

    }
    if (!restoringAIThread && (!replacingLoader || reduceMotion)) scrollChatEnd();
    return article;
  }

  function setLoader(on, label) {
    chatLoader.hidden = true;
    applicationState.spotlight = on ? 'loading' : 'conversation';
    if (on) {
      pendingReplyScrollRevision = transcriptScrollRevision;
      chatMessages.querySelectorAll('.chat-message.is-loading').forEach(function(node){node.remove();});
      pendingResponse = document.createElement('article');
      var record = threadStore && activeAIThread && threadStore.get(activeAIThread);
      var operatorTyping = operatorEnabled() && record && record.operatorStatus === 'connected';
      pendingResponse.className = 'chat-message assistant is-loading' + (operatorTyping ? ' is-operator-typing' : '');
      if (operatorTyping) pendingResponse.textContent = 'Оператор печатает…';
      else {
        pendingResponse.innerHTML = chatLoader.innerHTML;
        if(label)pendingResponse.querySelector('.alfy-thinking-text').textContent=label;
      }
      pendingResponse.setAttribute('aria-live', 'polite');
      chatMessages.appendChild(pendingResponse);
      if (!operatorTyping && window.SpotlightAlfy) window.SpotlightAlfy.start(pendingResponse);
      var scrollRevision = transcriptScrollRevision;
      requestAnimationFrame(function () {
        if (scrollRevision !== transcriptScrollRevision || activeView !== 'chatView') return;
        chatScroll.scrollTo({top:chatScroll.scrollHeight, behavior:reduceMotion ? 'auto' : 'smooth'});
      });
    }
    updateComposer();
  }

  function positionFirstExchange() {
    if (!window.SpotlightHubConfiguration && applicationState.conversationType === 'reminder' && reminderTurn === 0) chatScroll.scrollTop=0;
  }

  // Start again in the current AI surface, retaining its original Back destination.
  var threadStore = window.SpotlightThreadStore;
  var activeAIThread = null;
  var restoringAIThread = false;
  function saveAIThread() {
    if (!threadStore || !activeAIThread || activeView !== 'chatView' || isContactChat() || restoringAIThread) return;
    threadStore.update(activeAIThread, {draft:chatInput.value, turn:reminderTurn, scroll:chatScroll.scrollTop});
  }
  function syncAIChrome() {
    if (!threadStore) return;
    var contact = isContactChat();
    var record = activeAIThread && threadStore.get(activeAIThread);
    chatView.dataset.aiStatus = contact ? 'contact' : record ? 'active' : 'new';
    var operatorConnected = !contact && operatorEnabled() && record && record.operatorStatus === 'connected';
    chatView.classList.toggle('has-dialogue-caption', !contact && !!record);
    if (!contact) {
      applicationState.threadStatus = record ? 'active' : 'new';
      var title = chatView.querySelector('.flow-header h1');
      var titleText = record ? record.title : 'Альфа-Интеллект';
      title.textContent = titleText;
      title.title = titleText;
      if (record) {
        var name = document.createElement('span');
        name.className = 'hub-dialogue-title';
        name.textContent = titleText;
        var caption = document.createElement('small');
        caption.className = 'hub-dialogue-caption';
        caption.textContent = operatorConnected ? 'Оператор на связи' : record.insightKey ? 'Инсайт' : (record.reminder || record.type === 'regular' || record.taskRun) ? 'Задача' : window.SpotlightHubConfiguration.state.preset === 'mvp' ? 'Запрос' : 'Диалог';
        title.replaceChildren(name, caption);
      }
    }
    if (window.SpotlightMoreMenu) window.SpotlightMoreMenu.sync();
  }
  function recordAIMessage(kind, copy, rich) {
    if (!threadStore || isContactChat() || restoringAIThread) return;
    if (!activeAIThread && kind === 'user') {
      activeAIThread = threadStore.create(copy.trim().split('\n')[0], applicationState.conversationType).id;
    }
    if (activeAIThread) threadStore.append(activeAIThread, kind, copy, !!rich);
    syncAIChrome();
  }
  function renderAIThreads() {
    if (!threadStore || directoryMode !== 'threads') return;
    if (window.SpotlightMergedSegments) {
      $('directoryTitle').textContent = !window.SpotlightHubConfiguration.state.requestsOnly ? 'Обзор' : window.SpotlightHubConfiguration?.state.preset === 'mvp' ? 'Запросы' : 'Диалоги';
      $('directoryContent').innerHTML = window.SpotlightMergedSegments.directory(tabHTML.events);
      return;
    }
    threadStore.seed();
    var rows = $('directoryRows');
    if (!rows) return;
    rows.replaceChildren();
    threadStore.list().filter(function (record) { return record.taskRun === true || (record.type !== 'regular' && !record.reminder); }).forEach(function (record) {
      var row = document.createElement('button');
      row.type = 'button'; row.className = 'row hub-thread-row'; row.dataset.aiThread = record.id;
      row.dataset.searchText = record.title;
      var tile = document.createElement('span'); tile.className = 'hub-request-icon';
      var icon = document.createElement('img'); icon.alt = ''; icon.draggable = false;
      var task = record.taskRun === true;
      icon.src = task ? 'assets/figma/mvp/clock-alarm.svg' : 'assets/icons/neuro-assistant.svg?v=outline-all';
      if (task) tile.classList.add('is-task');
      tile.appendChild(icon); row.appendChild(tile);

      var copy = document.createElement('span'); copy.className = 'row-text';
      var title = document.createElement('span'); title.className = 'row-title'; title.textContent = record.title;
      copy.appendChild(title);
      var last = record.messages[record.messages.length-1];
      {
        var preview = document.createElement('span'); preview.className = 'row-sub';
        var previewCopy=last ? last.text : 'Начните диалог по этому запросу';
        if(last && last.help){var parsed=document.createElement('div');parsed.innerHTML=last.text;previewCopy=parsed.querySelector('.hub-file-name') ? 'Выписка готова · '+parsed.querySelector('.hub-file-name').textContent : (parsed.querySelector('p') || parsed).textContent;}
        preview.textContent=record.pending ? 'Готовлю ответ…' : previewCopy;
        copy.appendChild(preview);
      }
      row.appendChild(copy);
      if(record.unread){var dot=document.createElement('span');dot.className='hub-thread-unread';dot.setAttribute('aria-label','Новый дайджест');row.appendChild(dot);}
      rows.appendChild(row);
    });
  }
  function openSavedThread(id, returnOrigin) {
    var record = threadStore && threadStore.get(id);
    if (!record) return;
    var destinationOrigin = returnOrigin || captureOrigin();
    threadStore.update(id,{unread:false});
    window.dispatchEvent(new Event('spotlight-hub:thread-read'));
    threadStore.ensureReply(id);
    saveAIThread();
    cancelComposerMotion();
    changingView = true;
    activeAIThread = id;
    aiNavigationOrigin = destinationOrigin;
    threadsReturn = null;
    viewStack = viewStack.filter(function(view){return view !== 'chatView';});
    if (destinationOrigin.view === 'directoryView' && viewStack.indexOf('directoryView') < 0) viewStack.push('directoryView');
    applicationState.conversationType = record.type;
    applicationState.spotlight = record.status;
    applicationState.threadStatus = 'active';
    applicationState.spotlightOrigin = {area:'focus',section:activeTab,state:destinationOrigin.view};
    spotlightReturn = destinationOrigin;
    stage.classList.remove('is-manual-chat','is-dashboard-chat','is-contact-chat','is-threads-compose','is-threads-leaving');
    stage.classList.add('is-conversation');
    chatView.classList.remove('is-manual','is-empty','has-keyboard');
    chatView.classList.add('is-pushed');
    resetChat();
    chatEmptyIntro.hidden = true; chatDate.hidden = false;
    restoringAIThread = true;
    record.messages.forEach(function (message) { addMessage(message.kind, message.text, message.help); });
    restoringAIThread = false;
    reminderTurn = record.turn;
    chatInput.value = record.draft;
    if (record.pending && record.operatorStatus !== 'waiting') setLoader(true, window.SpotlightBanking?.loadingLabel(record.pending.text, record.pending.help));
    setFlowView('chatView');
    chatScroll.scrollTop = chatScroll.scrollHeight;
    $('iosKeyboard').inert = true;
    changingView = false;
    updateComposer(); syncAIChrome();
    requestAnimationFrame(function () { chatScroll.scrollTop = chatScroll.scrollHeight; });
  }
  function queueAIReply(copy, rich, advance) {
    var loadingLabel=window.SpotlightBanking?.loadingLabel(copy,rich);
    if(loadingLabel)setLoader(true,loadingLabel);
    if (threadStore && activeAIThread) threadStore.queue(activeAIThread, copy, rich, advance, window.SpotlightHubConfiguration?.state.requestsOnly ? 700 : 3000);
    else replyTimer = setTimeout(function () { finishAIReply(copy, rich, advance); }, window.SpotlightHubConfiguration?.state.requestsOnly ? 700 : 3000);
  }
  window.addEventListener('spotlight-hub:thread-reply', function (event) {
    if (!threadStore) return;
    var record = threadStore.get(event.detail.id);
    if (!record) return;
    if (activeAIThread === record.id && activeView === 'chatView' && !isContactChat()) {
      if (record.taskCompletedAt && record.unread) threadStore.update(record.id,{unread:false});
      restoringAIThread = true;
      var last = record.messages[record.messages.length-1];
      finishAIReply(last.text, last.help, false);
      restoringAIThread = false;
      reminderTurn = record.turn;
      syncAIChrome();
    }
    if (activeView === 'directoryView' && directoryMode === 'threads') renderAIThreads();
  });
  $('directoryContent').addEventListener('click', function (event) {
    var row = event.target.closest('[data-ai-thread]');
    if (row) openSavedThread(row.dataset.aiThread);
  });

  function deleteRequest() {
    if (!threadStore || !activeAIThread || activeView !== 'chatView' || isContactChat()) return;
    var destination = aiNavigationOrigin;
    var deletingRecord = threadStore.get(activeAIThread);
    if (deletingRecord && deletingRecord.type === 'regular') window.SpotlightRegular.remove(deletingRecord);
    threadStore.remove(activeAIThread);
    aiNavigationOrigin = null;
    activeAIThread = null;
    threadsReturn = null;
    cancelComposerMotion();
    changingView = true;
    chatInput.blur(); keyboardVisible(false);
    changingView = false;
    applicationState.threadStatus = 'new';
    stage.classList.remove('is-conversation','is-manual-chat','is-dashboard-chat','is-threads-compose');
    viewStack = viewStack.filter(function (view) { return view !== 'chatView'; });
    if (destination) restoreOrigin(destination);
    else returnToMain(activeTab, spotlightReturn);
    syncAIChrome();
    window.dispatchEvent(new CustomEvent('spotlight-hub:toast',{detail:deletingRecord && (deletingRecord.type === 'regular' || deletingRecord.reminder) ? 'Задача удалена' : window.SpotlightHubConfiguration?.state.preset === 'mvp' ? 'Запрос удалён' : 'Диалог удалён'}));
  }

  function newRequest() {
    if (!window.SpotlightHubConfiguration) return;
    if (activeView === 'directoryView' && directoryMode === 'threads') { openManualChat(); return; }
    if (activeView !== 'chatView' || isContactChat()) return;
    var previousRequest = captureOrigin();
    saveAIThread();
    aiNavigationOrigin = previousRequest;
    activeAIThread = null;
    cancelComposerMotion();
    applicationState.conversationType = 'reminder';
    applicationState.spotlight = 'composing';
    applicationState.threadStatus = 'new';
    stage.classList.remove('is-conversation');
    composeDraft = '';
    setThreadStatus('new');
    var outgoing = chatMessages.cloneNode(true);
    outgoing.removeAttribute('id'); outgoing.inert = true; outgoing.classList.add('hub-thread-outgoing');
    outgoing.setAttribute('aria-hidden','true');
    resetChat();
    window.SpotlightHubConfiguration.decorate();
    chatView.classList.add('is-empty');
    var inline = stage.classList.contains('is-manual-chat');
    chatEmptyIntro.hidden = inline;
    chatDate.hidden = true;
    if (!inline) chatEmptyIntro.innerHTML = '<h2><span class="hub-greeting-name">Анна, добрый вечер</span><br>С чем помочь сегодня?</h2><div class="chat-prompts">' + chips.innerHTML + '</div>';
    chatScroll.scrollTop = 0;
    updateComposer();
    keyboardVisible(true);
    chatInput.focus({preventScroll:true});
    syncAIChrome();
    if (!reduceMotion && outgoing.children.length) {
      chatScroll.appendChild(outgoing);
      var exit = outgoing.animate([{opacity:1,translate:'0 0'},{opacity:0,translate:'0 -8px'}],{duration:180,easing:MOTION.easing,fill:'forwards'});
      exit.finished.then(function(){outgoing.remove();}).catch(function(){outgoing.remove();});
      var intro = inline ? upper : chatEmptyIntro;
      intro.animate([{opacity:0,translate:'0 8px'},{opacity:1,translate:'0 0'}],{duration:260,easing:MOTION.easing});
    }
  }

  function animateInputEntry() {
    if(window.SpotlightSurfaceMotion?.committing){chatInput.focus({preventScroll:true});chatView.style.transition='';stage.classList.remove('is-input-entering');return;}
    var finalFrame = getComputedStyle(chatComposer);
    var scale = stage.getBoundingClientRect().width / stage.offsetWidth;
    var to = chatComposer.getBoundingClientRect();
    var landing = (to.top - spotlightShell.getBoundingClientRect().top) / scale;
    var from = VIEW_H - 34 - parseFloat(finalFrame.height);
    var dy = Math.max(0, from - landing);
    var timing = {duration:KEYBOARD_DURATION,easing:MOTION.easing};
    var animations = [];
    if (!reduceMotion) {
      [chatComposer,chatView.querySelector('.focus-ambient-scene'),chatView.querySelector('.hub-compose-note')].filter(Boolean).forEach(function(node) {
        animations.push(node.animate([{translate:'0 '+dy+'px'},{translate:'0 0'}], timing));
      });
    }
    composerMotion = animations;
    chatInput.focus({preventScroll:true});
    Promise.all(animations.map(function(a){return a.finished.catch(function(){});})).then(function(){
      if (composerMotion !== animations) return;
      animations.forEach(function(a){a.cancel();});composerMotion=[];
      chatView.style.transition='';stage.classList.remove('is-input-entering');
    });
  }

  function openManualChat() {
    if(window.SpotlightSurfaceMotion && !window.SpotlightSurfaceMotion.committing && applicationState.spotlight!=='closed' && activeView!=='chatView') {
      var entryArgument=arguments[0];return window.SpotlightSurfaceMotion.run(function(){openManualChat(entryArgument);});
    }
    var proactive = arguments[0] === 'proactive';
    if(activeView === 'chatView' && applicationState.spotlight !== 'closed') return;
    stage.classList.add('is-intro-preparing','is-input-entering');
    saveAIThread(); activeAIThread = null;
    aiNavigationOrigin = null;
    var fromEntry=applicationState.spotlight === 'closed';
    if(threadsReturn && threadsReturn.chat && activeView === 'directoryView') threadsReturn.chat.replaced=true;
    var fromThreads = !fromEntry && activeView === 'directoryView' && directoryMode === 'threads';
    if (threadStore && fromThreads) threadsReturn = null;
    var fromConnection = !fromEntry && activeView === 'main' && connectionInputDock();
    var inline = fromEntry || fromThreads || fromConnection || (activeView === 'main' && stableState === 'full' && scroller.scrollTop < TRAVEL * .3);
    var morphInput = !proactive;
    clearTimeout(composeLeaving);
    composeOrigin = fromEntry ? 'dashboard' : fromThreads ? 'threads' : activeView === 'main' ? 'aiHome' : activeView;
    clearTimeout(dismissTimer);
    var enter=function(){
      changingView=true;
      if (window.SpotlightHubConfiguration) listInner.innerHTML = mainHTML();
  hostMainContent();
      hostComposer($('mainLayer'));
      spotlightReturn = { tab: activeTab, sheetState: stableState, scrollTop: stableState === 'full' ? 0 : scroller.scrollTop, view: activeView, directoryMode: directoryMode };
      if (fromEntry) spotlightReturn = {tab:'connection',sheetState:'full',scrollTop:0,view:'main'};
      applicationState.spotlightOrigin=fromEntry ? {area:'dashboard',section:'connection'} : {area:'focus', section:activeTab, state:activeView};
      applicationState.conversationType='reminder';
      applicationState.spotlight='composing';
      applicationState.threadStatus='new';
      // A Threads compose always sits directly above Чаты, even when Threads was opened
      // from a chat (that chat is being replaced), so Чаты never slides away underneath.
      if(fromThreads) viewStack=viewStack.filter(function(view){return view!=='chatView';});
      stage.classList.toggle('is-manual-chat',inline);
      stage.classList.toggle('is-threads-compose',fromThreads);
      stage.classList.remove('is-threads-leaving');
      stage.classList.toggle('is-dashboard-chat',fromEntry);
      stage.classList.remove('is-conversation');
      chatView.classList.remove('has-keyboard');
      chatView.classList.toggle('is-manual',inline);
      chatView.classList.toggle('is-pushed',!inline);
      chatView.classList.add('is-empty');
      resetChat();
      chatEmptyIntro.hidden=inline; chatDate.hidden=true;
      if(!inline) chatEmptyIntro.innerHTML='<h2><span class="hub-greeting-name">Анна, добрый вечер</span><br>С чем помочь сегодня?</h2><div class="chat-prompts">'+chips.innerHTML+'</div>';
      spotlightShell.setAttribute('aria-hidden','false');
      stage.classList.add('is-spotlight'); stage.classList.remove('is-entry');
      // From Чаты the compose surface does not fade in as a page; only its tint and navbar do.
      if(morphInput) chatView.style.transition='none';
      setFlowView('chatView');
      lockedScrollTop = spotlightReturn.scrollTop;
      scroller.scrollTop = lockedScrollTop;
      chatScroll.scrollTop=0;
      // Reset only the hidden main sheet, preserving each tab's saved content.
      render();
      if(!proactive){ keyboardVisible(true); if(!morphInput)chatInput.focus({preventScroll:true}); }
      changingView=false; syncComposer();
    };
    // The dashboard row stays in place; only an already-open Spotlight field morphs.
    cancelComposerMotion(); stage.classList.add('is-input-entering'); enter();
    void upper.offsetHeight;
    stage.classList.remove('is-intro-preparing');
    if(morphInput) {
      if(fromThreads){chatInput.value=composeDraft;updateComposer();}
      animateInputEntry();
    } else stage.classList.remove('is-input-entering');
  }

  var morphLockTimer = 0;
  function lockMorph(on, type) {
    morphing = on; stage.classList.toggle('is-morphing', on);
    applicationState.transition = on ? { type: type || 'morph', phase: 'animating' } : { type: null, phase: 'idle' };
    // Safety net only: a morph that never reports completion can never freeze the UI.
    clearTimeout(morphLockTimer);
    if (on) morphLockTimer = setTimeout(function () { lockMorph(false); }, 1200);
  }
  // The single place where New Thread becomes Active Thread (or a fresh New Thread starts).
  // Greeting + starter chips follow it through .is-conversation; the navbar through syncChrome.
  function setThreadStatus(status) {
    applicationState.threadStatus = status;
    stage.classList.toggle('is-conversation', status === 'active');
    syncChrome();
  }
  function whenDone(animations) {
    return Promise.all(animations.map(function (animation) { return animation.finished.catch(function () {}); }));
  }
  // The empty Альфа-Интеллект compose (New Thread), whatever its origin.
  function isCompose() {
    return activeView === 'chatView' && !isContactChat() && applicationState.threadStatus === 'new';
  }
  function composeIntro() { return stage.classList.contains('is-manual-chat') ? upper : chatEmptyIntro; }
  // Commit a view switch whose pages are already where the morph left them (no slide).
  function commitInPlace(next, pages) {
    pages.forEach(function (page) { page.style.transition = 'none'; });
    stage.classList.add('is-morph-snap');
    setFlowView(next);
    void stage.offsetWidth;
  }
  function endInPlace(pages, classes, animations) {
    classes.forEach(function (name) { stage.classList.remove(name); });
    void stage.offsetWidth;
    animations.forEach(function (animation) { animation.cancel(); });
    void stage.offsetWidth;
    pages.forEach(function (page) { page.style.transition = ''; });
    stage.classList.remove('is-morph-snap');
    lockMorph(false);
  }

  // Compose → Threads (navbar bubble): the same surface turns into Чаты. Чаты is laid out in
  // its final state UNDER the compose surface; focus is cleared first so the keyboard leaves
  // while the same input travels down into the Чаты slot, the greeting drops away, the
  // list rises in and the AI tint/navbar hand over in place. One commit at the end.
  function morphComposeToThreads() {
    var dir = $('directoryView');
    threadsReturn = captureOrigin();
    threadsReturn.focused = chatView.classList.contains('has-keyboard');
    clearTimeout(replyTimer);
    lockMorph(true, 'compose→threads');
    changingView = true; chatInput.blur(); changingView = false;
    cancelAnimationFrame(keyboardFrame);
    cancelComposerMotion();
    var before = getComputedStyle(chatComposer);
    chatView.classList.remove('has-keyboard');
    $('iosKeyboard').inert = true;
    chatComposer.dataset.aiState = 'resting';
    var intro = composeIntro();
    openDirectory('threads', false, true);
    stage.classList.add('is-threads-preview');
    var move = { duration: MORPH.duration, easing: MOTION.easing, fill: 'forwards' };
    var animations = [
      chatComposer.animate([
        { transform: before.transform, width: before.width, height: before.height },
        { transform: 'translate3d(' + AI_INPUT.resting.x + 'px,' + (AI_SLOT_Y - chatView.offsetTop) + 'px,0)', width: AI_INPUT.resting.w + 'px', height: AI_INPUT.resting.h + 'px' }
      ], { duration: MORPH.travel, easing: MOTION.easing, fill: 'forwards' }),
      intro.animate([{ translate: '0 0', opacity: 1 }, { translate: '0 ' + MORPH.rise + 'px', opacity: 0 }], move),
      dir.querySelector('#directoryContent').animate([{ translate: '0 ' + MORPH.rise + 'px', opacity: 0 }, { translate: '0 0', opacity: 1 }], move),
      dir.querySelector('.native-header').animate([{ opacity: 0 }, { opacity: 1 }], move)
    ];
    [chatView.querySelector('.focus-ambient'), chatView.querySelector('.flow-header')].forEach(function (layer) {
      if (layer) animations.push(layer.animate([{ opacity: 1 }, { opacity: 0 }], move));
    });
    whenDone(animations).then(function () {
      commitInPlace('directoryView', [dir, chatView]);
      endInPlace([dir, chatView], ['is-threads-preview'], animations);
    });
  }

  // Threads → Back → compose: exactly the Threads → input entry, restoring the compose that
  // opened Threads (focus and keyboard included). The slot input travels up into the composer,
  // the list drops away, the greeting rises in; Чаты stays laid out underneath until the end.
  function morphThreadsToCompose(origin) {
    var dir = $('directoryView');
    lockMorph(true, 'threads→compose');
    stage.classList.add('is-threads-overlay');
    origin.stageClasses.forEach(function (name) { stage.classList.add(name); });
    changingView = true;
    restoringView = true;
    commitInPlace('chatView', [dir, chatView]);
    restoringView = false;
    if (origin.focused) { keyboardVisible(true); chatInput.focus({ preventScroll: true }); }
    changingView = false;
    updateComposer();
    syncComposer();
    void stage.offsetWidth;
    var after = getComputedStyle(chatComposer);
    var move = { duration: MORPH.duration, easing: MOTION.easing, fill: 'forwards' };
    var animations = [
      chatComposer.animate([
        { transform: 'translate3d(' + AI_INPUT.resting.x + 'px,' + (AI_SLOT_Y - chatView.offsetTop) + 'px,0)', width: AI_INPUT.resting.w + 'px', height: AI_INPUT.resting.h + 'px' },
        { transform: after.transform, width: after.width, height: after.height }
      ], { duration: MORPH.travel, easing: MOTION.easing, fill: 'forwards' }),
      composeIntro().animate([{ translate: '0 ' + MORPH.rise + 'px', opacity: 0 }, { translate: '0 0', opacity: 1 }], move),
      dir.querySelector('#directoryContent').animate([{ translate: '0 0', opacity: 1 }, { translate: '0 ' + MORPH.rise + 'px', opacity: 0 }], move),
      dir.querySelector('.native-header').animate([{ opacity: 1 }, { opacity: 0 }], move)
    ];
    [chatView.querySelector('.focus-ambient'), chatView.querySelector('.flow-header')].forEach(function (layer) {
      if (layer) animations.push(layer.animate([{ opacity: 0 }, { opacity: 1 }], move));
    });
    stage.classList.remove('is-morph-snap');
    whenDone(animations).then(function () {
      dir.style.transition = 'none';
      endInPlace([dir, chatView], ['is-threads-overlay'], animations);
    });
  }

  // New Thread (opened on AI home or from the dashboard) → Back → AI home.
  // Root cause of the old flash: the whole switch happened in one frame — the greeting layer
  // dropped from above the chat (z106) to underneath it while the chat was still opaque, and the
  // AI-home input appeared next to the still-visible composer; then the chat page faded out.
  // Now AI home is committed first in its FINAL layout underneath, the New Thread stays on top as
  // an overlay, and only elements move: greeting/chips glide from compose to home positions above
  // the overlay, the composer travels into the AI-home input slot (handoff at landing), the AI
  // tint and navbar hand over in place, the keyboard slides out with them.
  function closeComposeToHome(commit) {
    var returningToConnection = spotlightReturn?.view === 'main' && spotlightReturn.tab === 'connection' && spotlightReturn.scrollTop >= TRAVEL * .8;
    stage.classList.toggle('is-connection-compose-return', returningToConnection);
    lockMorph(true, 'newThread→aiHome');
    clearTimeout(replyTimer);
    var scale = stage.getBoundingClientRect().width / stage.offsetWidth;
    var greetingFrom = greeting.getBoundingClientRect().top, chipsFrom = chips.getBoundingClientRect().top;
    var displayed = getComputedStyle(chatComposer);
    var displayedFrame = {transform:displayed.transform,width:displayed.width,height:displayed.height};
    changingView = true; chatInput.blur(); changingView = false;
    cancelAnimationFrame(keyboardFrame);
    cancelComposerMotion();
    var before = window.SpotlightHubConfiguration ? displayedFrame : getComputedStyle(chatComposer);
    chatView.classList.remove('has-keyboard');
    $('iosKeyboard').inert = true;
    stage.classList.add('is-compose-overlay', 'is-morph-snap');
    chatView.style.transition = 'none';
    commit();
    void stage.offsetWidth;
    var landing = field.getBoundingClientRect();
    var landingY = (landing.top - chatView.getBoundingClientRect().top) / scale;
    var greetingShift = (greetingFrom - greeting.getBoundingClientRect().top) / scale;
    var chipsShift = (chipsFrom - chips.getBoundingClientRect().top) / scale;
    stage.classList.remove('is-morph-snap');
    chatComposer.dataset.aiState = 'resting';
    var duration = window.SpotlightHubConfiguration ? KEYBOARD_DURATION : MORPH.duration;
    var travel = window.SpotlightHubConfiguration ? KEYBOARD_DURATION : MORPH.travel;
    var move = { duration: duration, easing: MOTION.easing, fill: 'forwards' };
    var animations = [
      greeting.animate([{ translate: '0 ' + greetingShift + 'px' }, { translate: '0 0' }], move),
      chips.animate([{ translate: '0 ' + chipsShift + 'px' }, { translate: '0 0' }], move),
      stories.animate([{ translate: '0 -20px', opacity: 0 }, { translate: '0 0', opacity: 1 }], move),
      chatComposer.animate([
        { transform: before.transform, width: before.width, height: before.height },
        { transform: 'translate3d(' + F0.x + 'px,' + landingY + 'px,0)', width: F0.w + 'px', height: F0.h + 'px' }
      ], { duration: travel, easing: MOTION.easing, fill: 'forwards' })
    ];
    [chatView.querySelector('.focus-ambient'), chatView.querySelector('.flow-header')].forEach(function (layer) {
      if (layer) animations.push(layer.animate([{ opacity: 1 }, { opacity: 0 }], move));
    });
    whenDone(animations).then(function () {
      chatView.style.transition = 'none';
      stage.classList.remove('is-compose-overlay', 'is-connection-compose-return');
      void stage.offsetWidth;
      animations.forEach(function (animation) { animation.cancel(); });
      void stage.offsetWidth;
      chatView.style.transition = '';
      lockMorph(false);
    });
  }

  // Back (or the bubble) from a New Thread opened in Чаты mirrors the entry back to Чаты.
  // Never called from blur / tap outside.
  function exitThreadsCompose() {
    if (!stage.classList.contains('is-threads-compose') || stage.classList.contains('is-threads-leaving')) return;
    clearTimeout(replyTimer);
    clearTimeout(composeLeaving);
    composeDraft = chatInput.value;
    lockMorph(true, 'newThread→threads');
    // 1. The input really loses focus; the keyboard state follows it.
    changingView = true; chatInput.blur(); changingView = false;
    cancelAnimationFrame(keyboardFrame);
    cancelComposerMotion();
    var before = getComputedStyle(chatComposer);
    var dir = $('directoryView');
    // 2. Keyboard and navigation overlap: the keyboard slides out (CSS, 360 ms) while the same
    //    composer travels down into the Чаты input slot, the greeting drops away and the
    //    list rises back into place. At landing the slot's input takes over in the same frame.
    chatView.classList.remove('has-keyboard');
    $('iosKeyboard').inert = true;
    chatComposer.dataset.aiState = 'resting';
    stage.classList.add('is-threads-leaving');
    var drop = { duration: MORPH.duration, easing: MOTION.easing, fill: 'forwards' };
    var animations = [];
    if (!reduceMotion) {
      animations.push(chatComposer.animate([
        { transform: before.transform, width: before.width, height: before.height },
        { transform: 'translate3d(' + AI_INPUT.resting.x + 'px,' + (AI_SLOT_Y - chatView.offsetTop) + 'px,0)', width: AI_INPUT.resting.w + 'px', height: AI_INPUT.resting.h + 'px' }
      ], { duration: MORPH.travel, easing: MOTION.easing, fill: 'forwards' }));
      animations.push(upper.animate([{ translate: '0 0', opacity: 1 }, { translate: '0 ' + MORPH.rise + 'px', opacity: 0 }], drop));
      [chatView.querySelector('.focus-ambient'), chatView.querySelector('.flow-header')].forEach(function (layer) {
        if (layer) animations.push(layer.animate([{ opacity: 1 }, { opacity: 0 }], drop));
      });
      animations.push(dir.querySelector('#directoryContent').animate([{ translate: '0 ' + MORPH.rise + 'px', opacity: 0 }, { translate: '0 0', opacity: 1 }], drop));
      animations.push(dir.querySelector('.native-header').animate([{ opacity: 0 }, { opacity: 1 }], drop));
    }
    composerMotion = animations.slice(0, 1);
    whenDone(animations).then(function () {
      composeOrigin = null;
      applicationState.conversationType = null;
      applicationState.threadStatus = null;
      [dir, chatView].forEach(function (page) { page.style.transition = 'none'; });
      stage.classList.add('is-morph-snap');
      openDirectory('threads', true);
      void stage.offsetWidth;
      composerMotion = [];
      endInPlace([dir, chatView], [], animations);
    });
  }
  // A started conversation is a real page: Back pops it like every other page. The inline chat
  // is turned into a pushed page in place (no visible change), so the existing horizontal pop
  // runs: the thread slides right while the previous screen returns from the left.
  function prepInlinePop() {
    stage.classList.add('is-pop-prep');
    chatView.classList.remove('is-manual');
    chatView.classList.add('is-pushed');
    stage.classList.remove('is-manual-chat', 'is-threads-compose');
    void stage.offsetWidth;
    stage.classList.remove('is-pop-prep');
    void stage.offsetWidth;
    chatView.classList.remove('has-keyboard');
    $('iosKeyboard').inert = true;
  }
  function inThreadsCompose() {
    return stage.classList.contains('is-threads-compose') && isCompose();
  }

  function openContactChat(type) {
    saveAIThread();
    if (!Object.prototype.hasOwnProperty.call(contactThreads, type)) return;
    contactReturn = { tab: activeTab, sheetState: stableState, scrollTop: scroller.scrollTop, view:activeView, directoryMode:directoryMode };
    composerMotion.forEach(function (animation) { animation.cancel(); });
    composerMotion = [];
    (function () {
      changingView = true;
      clearTimeout(replyTimer);
      applicationState.conversationType = type;
      applicationState.threadStatus = null;
      applicationState.spotlightOrigin = {area:'focus', section:activeTab};
      applicationState.spotlight = 'conversation';
      stage.classList.remove('is-manual-chat', 'is-conversation', 'is-dashboard-chat');
      chatView.classList.remove('is-manual', 'is-pushed', 'is-empty', 'has-keyboard');
      resetChat();
      chatEmptyIntro.hidden = true;
      chatDate.hidden = false;
      var thread = contactThreads[type];
      if (type === 'support') {
        chatDate.hidden = true;
        addMessage('assistant', '<span class="support-avatar bot">😊</span><div class="support-bubble">Могу рассказать про наши кредитки</div>', true);
        addMessage('user', 'Добрый день, у меня вопрос по карте, не понимаю откуда взялись списания');
        addMessage('assistant', '<span class="support-avatar bot">😊</span><div class="support-bubble">Вам наверное просто показалось, не переживайте</div>', true);
        addMessage('user', 'Спасибо!');
        var separator = document.createElement('div'); separator.className='support-date'; separator.textContent='Сегодня'; chatMessages.appendChild(separator);
        addMessage('user', 'Сообщение удалено у\u00a0всех').classList.add('support-deleted');
        addMessage('assistant', '<span class="support-avatar operator">И</span><div class="support-bubble"><span class="message-author">Иван</span>Я изучу ваш вопрос и вернусь с ответом через 2 минуты</div>', true);
        addMessage('assistant', '<span class="support-avatar bot">😊</span><div class="support-bubble">Евгений, назовите последние 4 цифры вашей кредитки</div>', true);
      } else addMessage('assistant', thread.greeting);
      thread.messages.forEach(function (message) { addMessage('user', message); });
      contactInput.value = thread.draft;
      setFlowView('chatView');
      updateComposer();
      changingView = false;
      syncComposer();
      scrollChatEnd();
    })();
  }

  function sendContactMessage(value) {
    var thread = contactThreads[applicationState.conversationType];
    thread.messages.push(value);
    thread.draft = '';saveContacts();
    addMessage('user', value);
    contactInput.value = '';
    contactInput.style.height = '';
    keyboardVisible(false);
    contactInput.blur();
    applicationState.spotlight = 'conversation';
    updateComposer();
  }

  function reminderReply(turn) {
    if (turn === 0) {
      return 'Ваша ЭЦП действует до 12 ноября.\nСоздам задачу на 12 октября.';
    }
    if (turn === 1) return 'Задача создана. Помочь чем-нибудь ещё?';
    return 'Готово — «Проверить тариф по эквайрингу», повтор каждые 3 месяца, начиная с сегодня.';
  }

  function operatorEnabled() { return !!window.SpotlightHubConfiguration?.state.operatorInThread; }
  function operatorReply(text) {
    return '<div class="experiment-operator-message"><div class="support-bubble"><span class="message-author">Оператор Иван</span><p>' + text + '</p></div></div>';
  }
  function scrollOperatorMessage(article) {
    if (activeView !== 'chatView' || !article) return;
    // Follow the new bubble through keyboard/composer and message-height animations.
    // Unlike the generic helper this also runs in AI help threads.
    cancelAnimationFrame(keyboardFrame);
    if (reduceMotion) {
      requestAnimationFrame(function () {
        if (activeView === 'chatView' && article.isConnected) chatScroll.scrollTop = chatScroll.scrollHeight;
      });
    } else followAnswerReveal(article, 1, KEYBOARD_DURATION + 60);
  }
  function callOperator() {
    if (!operatorEnabled() || !activeAIThread || isContactChat()) return;
    var record = threadStore.get(activeAIThread);
    if (!record || record.operatorStatus || record.pending) return;
    threadStore.update(record.id, {operatorStatus:'waiting'});
    var waitingMessage = addMessage('assistant', '<div class="experiment-operator-wait" role="status">Оператор подключится в течение 5 минут</div>', true);
    keyboardVisible(false); chatInput.blur(); scrollOperatorMessage(waitingMessage);
    threadStore.queue(record.id, operatorReply('Здравствуйте, Анна! Я Иван, специалист поддержки. Вижу историю вашего обращения. Чем могу помочь?'), true, false, 1800);
  }

  function finishAIReply(copy, markup, advance) {
    // Keep Requests visible while an answer finishes in the retained chat underneath.
    var history = window.SpotlightHubConfiguration && activeView === 'directoryView' && directoryMode === 'threads' && (threadsReturn && threadsReturn.chat);
    var directoryState = applicationState.spotlight;
    setLoader(false);
    if (markup && copy.indexOf('experiment-operator-message') >= 0) chatMessages.querySelectorAll('.chat-message:has(.experiment-operator-wait)').forEach(function(node){node.remove();});
    var replyMessage = addMessage('assistant', copy, markup);
    if (markup && copy.indexOf('experiment-operator-message') >= 0 && !history) scrollOperatorMessage(replyMessage);
    if (advance) reminderTurn += 1;
    if (history) { history.spotlight = 'conversation'; applicationState.spotlight = directoryState; }
  }

  function completeEventReminder(value) {
    if (!activeAIThread || pendingResponse || applicationState.spotlight === 'loading') return false;
    var reminder=window.SpotlightEventActions.reminder(value);
    if (!reminder) return false;
    window.SpotlightRegular.saveEventReminder(activeAIThread,reminder);
    threadStore.update(activeAIThread,{questionnaire:null});
    addMessage('user',reminder.selection);
    keyboardVisible(false);chatInput.blur();chatInput.value='';updateComposer();
    setLoader(true);queueAIReply(reminder.confirmation,true,false);
    return true;
  }

  function sendReminder(textValue) {
    if (pendingResponse || applicationState.spotlight === 'loading') return;
    if(window.SpotlightSurfaceMotion && !window.SpotlightSurfaceMotion.committing && (chatView.classList.contains('is-empty') || chatView.classList.contains('has-keyboard'))) return window.SpotlightSurfaceMotion.run(function(){sendReminder(textValue);});
    var bankingReply = window.SpotlightBanking?.reply(textValue, threadStore?.get(activeAIThread)?.messages || []);
    var statementRich = false;
    var statementReply = textValue === 'Скачать выписку' ? 'Давайте выберем счёт' : null;
    var history = Array.from(chatMessages.querySelectorAll('.chat-message'));
    var lastAnswer = history.filter(function(m){return m.classList.contains('assistant');}).pop();
    var lastCopy = lastAnswer ? lastAnswer.textContent.trim() : '';
    if (!statementReply && history.some(function(m){return m.classList.contains('user') && window.SpotlightRegular.questionnaireIntent(m.textContent.trim())==='statement';})) {
      if(lastCopy==='Давайте выберем счёт') statementReply='Какой период вам нужен?';
      else if(lastCopy==='Какой период вам нужен?') statementReply='Остался формат — какой подойдёт?';
      else if(lastCopy==='Остался формат — какой подойдёт?') {
        var userMessages=history.filter(function(m){return m.classList.contains('user');});
        var statementStart=userMessages.map(function(m){return window.SpotlightRegular.questionnaireIntent(m.textContent.trim());}).lastIndexOf('statement');
        var account=userMessages[statementStart+1];
        var period=userMessages[statementStart+2];
        var periodCopy=period ? period.textContent.trim().toLocaleLowerCase('ru') : 'вчера';
        statementReply=window.SpotlightBanking.statement([account ? account.textContent.trim() : 'Расчётный ••8080',periodCopy,textValue]);
        statementRich=true;
      }
    }

    if (composeOrigin === 'threads') composeDraft = '';
    chatEmptyIntro.hidden = true;
    chatView.classList.remove('is-empty');
    setThreadStatus('active');
    chatDate.hidden = false;
    addMessage('user', textValue);
    keyboardVisible(false);
    chatInput.blur();
    chatInput.value = '';
    chatInput.style.height = '';
    updateComposer();
    var operatorRecord = threadStore && threadStore.get(activeAIThread);
    if (operatorEnabled() && /(?:оператор|позови поддержку|вызови поддержку|соедини с поддержкой)/i.test(textValue) && !operatorRecord?.operatorStatus) { callOperator(); return; }
    if (operatorEnabled() && operatorRecord?.operatorStatus === 'waiting') { scrollChatEnd(); return; }
    if (operatorEnabled() && operatorRecord?.operatorStatus === 'connected') {
      setLoader(true);
      threadStore.queue(activeAIThread, operatorReply('Я изучу ваш вопрос и вернусь с ответом через 2 минуты'), true, false, 3000);
      return;
    }
    setLoader(true);
    positionFirstExchange();
    if(textValue==='Расскажите подробнее про новый навык «Прогноз кассовых разрывов»') {
      queueAIReply('Новый навык помогает заранее заметить, когда денег на счёте может не хватить на предстоящие платежи.\n\nДля вашего бизнеса он сопоставит ожидаемые выплаты от маркетплейсов с расходами на закупки, логистику и другие обязательные платежи. Покажет возможный дефицит и дату, к которой стоит подготовиться.\n\nХотите настроить прогноз для вашего бизнеса?', false, false);
      return;
    }
    var intent=window.SpotlightRegular.questionnaireIntent(textValue);
    if(lastAnswer?.querySelector('[data-event-question="credit-reminder"],.hub-event-reminder-options') && !intent) {
      threadStore.update(activeAIThread,{questionnaire:null});
      if(/отмен/i.test(textValue)){queueAIReply('Создание напоминания отменено.',false,false);return;}
      var eventReminder=window.SpotlightEventActions.reminder(textValue);
      if(eventReminder)window.SpotlightRegular.saveEventReminder(activeAIThread,eventReminder);
      queueAIReply(eventReminder?eventReminder.confirmation:window.SpotlightEventActions.answer('remind'),true,false);
      return;
    }
    if (intent === 'task' && window.SpotlightHubConfiguration && !window.SpotlightHubConfiguration.state.tasks) { queueAIReply('Создание задач выключено в этой сборке. Могу помочь с выпиской, тарифом, реквизитами и переводами.', false, false); return; }
    if(intent && activeAIThread) {
      threadStore.update(activeAIThread,{reminder:intent==='task'?{phase:'kind',wizard:true}:null});
      queueAIReply(intent==='task'?window.SpotlightRegular.question():'Давайте выберем счёт',intent==='task',false);
      return;
    }
    var setupRecord = threadStore && threadStore.get(activeAIThread);
    var setupReply = setupRecord && window.SpotlightRegular.clarify(setupRecord, textValue);
    if (setupReply) { queueAIReply(setupReply, true, false); return; }
    if (!statementReply && bankingReply) { queueAIReply(bankingReply.text, bankingReply.rich, false); return; }
    var skillCopy = window.SpotlightHubConfiguration?.skillAnswer(textValue);
    if (!statementReply && skillCopy) { queueAIReply(skillCopy, false, false); return; }
    if (!statementReply && window.SpotlightHubConfiguration?.state.requestsOnly) { queueAIReply('Уточните, что нужно узнать. В этой версии доступны выписка, информация о тарифе, реквизиты, прогноз кассовых разрывов, валюты и лимиты переводов.', false, false); return; }
    var turn = reminderTurn;
    var help = applicationState.conversationType === 'help';
    queueAIReply(statementReply || (help ? helpAnswerMarkup() : reminderReply(turn)), statementReply ? statementRich : help, !statementReply);
  }

  function openNotifications() {
    if(arguments[0] !== true) notificationsReturn = { tab: activeTab, sheetState: stableState, scrollTop: scroller.scrollTop };
    detailReturn = null;
    applicationState.notificationNavigation = 'notifications';
    applicationState.activeMainTab = 'events';
    setFlowView('notificationsView');
    if (arguments[0] !== true) notificationsView.querySelector('.native-scroll').scrollTop = 0;
  }

  window.addEventListener('spotlight-hub:seller', function () {
    var shell = document.createElement('div'); shell.innerHTML = authoredOverview;
    shell.querySelector('.hub-regular').outerHTML = window.SpotlightRegular.cards();
    tabHTML.events = shell.innerHTML;
    var visible = listInner.querySelector('.hub-regular');
    if (visible) visible.outerHTML = window.SpotlightRegular.cards();
    if (regularTask && activeView === 'notificationView') extraEventDetail.innerHTML = window.SpotlightRegular.detail(regularTask, regularEdition);
  });
  var regularTask = null;
  var regularEdition = 'current';
  var selectedOverviewEvent = 'payment';
  var originalEventDetail = notificationView.querySelector('.notification-detail');
  var extraEventDetail = document.createElement('div');
  extraEventDetail.className = 'native-scroll notification-detail';
  extraEventDetail.hidden = true;
  notificationView.appendChild(extraEventDetail);
  function renderOverviewEvent(type) {
    regularTask = null;
    selectedOverviewEvent = type;
    originalEventDetail.hidden = type !== 'payment';
    extraEventDetail.hidden = type === 'payment';
    if (type === 'payment') return;
    var documents = type === 'documents';
    extraEventDetail.innerHTML = documents
      ? '<time>20 сентября, 10:00</time><h1>Банк запросил документы по 115-ФЗ</h1><p>Банк запросил документы и пояснения по операциям. Если не прислать их до 3 октября, банк может ограничить операции по счёту.</p><h2><img src="assets/icons/neuro-assistant.svg?v=outline-all" alt="">Что нужно от вас:</h2><ol class="event-steps"><li><b>Акт по договору с ООО «Фанера-Опт»</b><p>На 260 000 ₽: загрузить скан или фото.</p></li><li><b>Пояснение по переводу ИП Сидорову</b><p>На 420 000 ₽ от 18 августа: за что был платёж.</p></li></ol><p>Остальные семь договоров и два акта Альфа-Интеллект уже собрал.</p><div class="detail-actions"><button type="button" data-event-help><img src="assets/figma/2026-09-29/arrow-dark.svg" alt="">Подготовить с Альфа-Интеллектом</button></div>'
      : '<time>13 октября, 09:00</time><h1>Платёж по кредиту</h1><p>До суммы платежа не хватает 12 000 ₽.</p><p>14 октября спишется очередной платёж по кредиту, 32 000 ₽. На счёте 20 000 ₽, и ещё 8 000 ₽ уйдут на запланированный тариф.</p><p><b>Если не хватит:</b> платёж уйдёт в просрочку. Это пени по договору и запись в кредитной истории, которая может повлиять на будущие кредиты.</p><h2><img src="assets/icons/neuro-assistant.svg?v=outline-all" alt="">Что нужно сделать?</h2><ol class="event-steps"><li><b>Выбрать, откуда взять деньги</b></li><li><b>Пополнить или дождаться поступления</b></li></ol><div class="detail-actions"><button type="button" data-event-help><img src="assets/figma/2026-09-29/arrow-dark.svg" alt="">Подготовить с Альфа-Интеллектом</button></div>';
    extraEventDetail.querySelector('.detail-actions').insertAdjacentHTML('beforeend',window.SpotlightEventActions.actions(type));
  }
  function openRegularDigest(id,edition) {
      regularTask = id;
      regularEdition = edition || 'current';
      var directDigest = window.SpotlightRegular.long(regularTask, regularEdition);
      var savedDigest = window.SpotlightRegular.taskRecord(id) || (threadStore && threadStore.list().find(function (record) { return record.title === directDigest.title; }));
      if (savedDigest) {
        openSavedThread(savedDigest.id);
      }
      else openHelp(directDigest.title, directDigest.body, 'regular');
      applicationState.spotlightOrigin = {area:'focus', section:'events', state:'main'};
      spotlightReturn = {tab:'events', sheetState:stableState, scrollTop:lockedScrollTop};
  }
  document.addEventListener('click', function(event) {
    var regular = event.target.closest('[data-regular-task]');
    if (regular) {
      openRegularDigest(regular.dataset.regularTask,regular.dataset.regularEdition);
    }
    var regularLong = event.target.closest('[data-regular-long]');
    if (regularLong) {
      var digest = window.SpotlightRegular.long(regularTask, regularEdition);
      var existing = threadStore && threadStore.list().find(function (record) { return record.title === digest.title; });
      if (existing) { openSavedThread(existing.id); applicationState.spotlightOrigin.state = 'notificationView'; }
      else openHelp(digest.title, digest.body);
    }
    var insight = event.target.closest('[data-overview-insight]');
    if (insight) {
      var item = overviewInsights[Number(insight.dataset.overviewInsight)];
      openInsight(item);
      applicationState.spotlightOrigin.state = 'main';
    }
    var prompt = event.target.closest('[data-insight-prompt]');
    if (prompt && !pendingResponse) {
      addMessage('user', prompt.textContent.trim());
      setLoader(true);
      queueAIReply('Давайте разберём этот вариант подробнее. Какие условия и ограничения для вас важны?', false, false);
    }
    var eventAction=event.target.closest('[data-important-action]');
    if(eventAction){
      var actionKey=eventAction.dataset.importantAction;
      openHelp(window.SpotlightEventActions.labels[actionKey],window.SpotlightEventActions.answer(actionKey));
    }
    var remind=event.target.closest('[data-event-remind]');
    if(remind)completeEventReminder(remind.dataset.eventRemind);

    var card = event.target.closest('[data-overview-event]');
    if (card) openNotificationDetail(card.dataset.overviewEvent);

  });
  function openNotificationDetail() {
    if (arguments[0] !== true) renderOverviewEvent(typeof arguments[0] === 'string' ? arguments[0] : 'payment');
    if (arguments[0] !== true) {
      detailReturn = activeView === 'main' ? { tab: activeTab, sheetState: stableState, scrollTop: scroller.scrollTop } : null;
    }
    applicationState.notificationNavigation = 'detail';
    setFlowView('notificationView');
    if (arguments[0] !== true) (selectedOverviewEvent === 'payment' ? originalEventDetail : extraEventDetail).scrollTop = 0;
  }

  function helpAnswerMarkup() {
    if (selectedOverviewEvent === 'documents') return '<h2>Подготовим ответ по 115-ФЗ</h2><p>7 договоров и 2 акта уже собраны. Осталось загрузить скан или фото акта по договору с ООО «Фанера-Опт» на 260 000 ₽ и пояснить перевод ИП Сидорову на 420 000 ₽ от 18 августа. За что был этот платёж?</p>';
    if (selectedOverviewEvent === 'credit') return '<h2>Подготовимся к платежу по кредиту</h2><p>14 октября спишется 32 000 ₽. На счёте 20 000 ₽, ещё 8 000 ₽ запланированы на тариф. Выберем, откуда взять деньги: пополнить счёт или дождаться поступления?</p>';
    return [
      '<h2>Банк запросил дополнительные сведения по вашей деятельности</h2>',
      '<p>Нужно пояснить 3 операции по счёту и предоставить 2 документа</p>',
      '<h3>Пояснения по операциям</h3>',
      '<ul><li>Платёж ООО «Поставка» на 2 500 ₽</li><li>Перевод ИП Соколову на 48 000 ₽</li><li>Поступление от ООО «Вектор»<br>на 120 000 ₽</li></ul>',
      '<p>Для каждой операции нужно указать, за что был платёж и как он связан с вашей деятельностью</p>',
      '<h3>Документы</h3>',
      '<ul><li>Договор с ООО «Поставка»</li><li>Документ, подтверждающий закупку или оказание услуг: счёт, акт или накладная</li><li>Поступление от ООО «Вектор»<br>на 120 000 ₽</li></ul>',
      '<p>Для каждой операции нужно указать, за что был платёж и как он связан с вашей деятельностью</p>'
    ].join('');
  }

  function openInsight(item) {
    // Commit lookup, creation and insight identity together. openHelp may defer its
    // work for surface motion; tagging activeAIThread before that commit corrupts
    // the previously opened insight and reopens it from another insight's card.
    if (window.SpotlightSurfaceMotion && !window.SpotlightSurfaceMotion.committing &&
        (activeView === 'main' || (activeView === 'directoryView' && directoryMode === 'threads') ||
         (activeView === 'chatView' && !isContactChat()))) {
      return window.SpotlightSurfaceMotion.run(function () { openInsight(item); });
    }
    var question = insightQuestion(item);
    // All insight entry points share one saved conversation, including an in-flight reply.
    var saved = threadStore && threadStore.list().find(function (record) {
      return record.insightKey === item.title || (!record.insightKey && record.title === question);
    });
    if (saved) {
      saved.messages.forEach(function(message){if(message.kind==='assistant' && /<(?:h[1-6]|p|div)[ >]/.test(message.text))message.help=true;});
      threadStore.update(saved.id, {insightKey:item.title});
      openSavedThread(saved.id);
      return;
    }
    var prompts = '<div class="hub-insight-prompts">' + item.prompts.map(function (prompt) {
      return '<button type="button" class="chip" data-insight-prompt>' + prompt + '</button>';
    }).join('') + '</div>';
    openHelp(question, item.body + prompts);
    if (activeAIThread) threadStore.update(activeAIThread, {insightKey:item.title});
    syncAIChrome();
  }

  function openHelp(question, answerMarkup, requestType) {
    if(window.SpotlightSurfaceMotion && !window.SpotlightSurfaceMotion.committing && (activeView==='main' || (activeView==='directoryView' && directoryMode==='threads') || (activeView==='chatView' && !isContactChat()))) return window.SpotlightSurfaceMotion.run(function(){openHelp(question,answerMarkup,requestType);});
    if (window.SpotlightHubConfiguration && activeView === 'chatView' && !isContactChat() && !answerMarkup && typeof question === 'string') { sendReminder(question); return; }
    var previousScreen = captureOrigin();
    aiNavigationOrigin = previousScreen;
    saveAIThread(); activeAIThread = null;
    if (typeof question !== 'string') question = 'Что именно запросил банк?';
    stage.classList.remove('is-manual-chat','is-conversation','is-dashboard-chat','is-contact-chat','is-threads-compose','is-threads-leaving');
    chatView.classList.remove('is-manual');
    chatView.classList.remove('has-keyboard');
    chatView.classList.add('is-pushed');
    applicationState.spotlightOrigin = {area:'focus', section:activeTab, state:question === 'Скачать выписку' ? 'main' : 'notificationView'};
    applicationState.conversationType = requestType || (question === 'Скачать выписку' ? 'reminder' : 'help');
    applicationState.threadStatus = 'active';
    resetChat();
    chatEmptyIntro.hidden = true;
    chatDate.hidden = false;
    field.hidden = false;
    keyboardVisible(false);
    addMessage('user', question);
    chatView.classList.remove('is-empty');
    stage.classList.add('is-conversation');
    setFlowView('chatView');
    syncComposer();
    // The composer travels inside the help page, using the same horizontal transition.
    chatScroll.scrollTop = 0;
    setLoader(true);
    var bankingReply = !answerMarkup && window.SpotlightBanking?.reply(question);
    var skillCopy = window.SpotlightHubConfiguration?.skillAnswer(question);
    queueAIReply(question === 'Скачать выписку' ? 'Давайте выберем счёт' : (answerMarkup || bankingReply?.text || skillCopy || helpAnswerMarkup()), answerMarkup ? true : bankingReply ? bankingReply.rich : question !== 'Скачать выписку' && !skillCopy, false);
  }

  function returnChatToConnection(origin) {
    lockMorph(true, 'chat→connection');
    var from = chatComposer.getBoundingClientRect();
    var scale = spotlightShell.getBoundingClientRect().width / spotlightShell.offsetWidth;
    changingView = true;
    chatInput.blur();
    changingView = false;
    cancelAnimationFrame(keyboardFrame);
    cancelComposerMotion();
    chatView.classList.remove('has-keyboard');
    $('iosKeyboard').inert = true;
    var returnsToHome = origin.scrollTop < TRAVEL * .8;
    stage.classList.toggle('is-chat-home-return', returnsToHome);
    stage.classList.add('is-chat-connection-return', 'is-morph-snap');
    chatView.style.transition = 'none';
    returnToMain(origin.tab || 'connection', origin);
    void stage.offsetWidth;
    var to = field.getBoundingClientRect();
    var timing = {duration: KEYBOARD_DURATION, easing: MOTION.easing, fill:'both'};
    var animations = [
      field.animate([
        {translate:((from.left-to.left)/scale)+'px '+((from.top-to.top)/scale)+'px',width:(from.width/scale)+'px',height:(from.height/scale)+'px'},
        {translate:'0 0',width:F0.w+'px',height:F0.h+'px'}
      ], timing),
      chatView.animate([{opacity:1,offset:0},{opacity:0,offset:.45},{opacity:0}],timing),
      sheet.animate([{opacity:0,offset:0},{opacity:0,offset:.45},{opacity:1}],timing)
    ];
    if (returnsToHome) animations.push(upper.animate([{opacity:0,offset:0},{opacity:0,offset:.45},{opacity:1}],timing));
    whenDone(animations).then(function(){
      chatView.style.visibility='hidden';
      stage.classList.remove('is-chat-connection-return', 'is-chat-home-return');
      void stage.offsetWidth;
      animations.forEach(function(animation){animation.cancel();});
      stage.classList.remove('is-morph-snap');
      chatView.style.transition = '';
      lockMorph(false);
    });
  }

  function leaveChat() {
    var surfaceOrigin=aiNavigationOrigin || spotlightReturn;
    if(window.SpotlightSurfaceMotion && !window.SpotlightSurfaceMotion.committing && !isContactChat() && surfaceOrigin && (surfaceOrigin.view==='main' || surfaceOrigin.view==='directoryView')) {
      return window.SpotlightSurfaceMotion.run(function(){
        saveAIThread();cancelComposerMotion();changingView=true;chatInput.blur();keyboardVisible(false);changingView=false;
        aiNavigationOrigin=null;restoreOrigin(surfaceOrigin);
      });
    }
    if (morphing) return;
    saveAIThread();
    var connectionOrigin = aiNavigationOrigin || spotlightReturn;
    if(window.SpotlightHubConfiguration && !isContactChat() && connectionOrigin?.view==='main' && chatView.classList.contains('is-manual') && !reduceMotion){
      aiNavigationOrigin=null;threadsReturn=null;returnChatToConnection(connectionOrigin);return;
    }
    if (window.SpotlightHubConfiguration && !isContactChat() && connectionOrigin) {
      if (chatView.classList.contains('is-manual')) prepInlinePop();
      cancelComposerMotion();
      changingView=true;chatInput.blur();keyboardVisible(false);changingView=false;
      aiNavigationOrigin=null;threadsReturn=null;
      restoreOrigin(connectionOrigin);
      return;
    }
    if (!isContactChat() && connectionOrigin?.view === 'main' && connectionOrigin.tab === 'connection' && !reduceMotion) {
      aiNavigationOrigin = null;
      returnChatToConnection(connectionOrigin);
      return;
    }
    if (!isContactChat() && aiNavigationOrigin) {
      var destination = aiNavigationOrigin;
      aiNavigationOrigin = null;
      cancelComposerMotion();
      changingView = true; chatInput.blur(); keyboardVisible(false); changingView = false;
      restoreOrigin(destination);
      return;
    }
    if (inThreadsCompose() && !window.SpotlightSurfaceMotion?.committing) { exitThreadsCompose(); return; }
    if (stage.classList.contains('is-manual-chat') && isCompose() && !reduceMotion) {
      var home = applicationState.spotlightOrigin.area === 'dashboard' ? 'connection' : (applicationState.spotlightOrigin.section || 'connection');
      var restore = spotlightReturn;
      closeComposeToHome(function () { returnToMain(home, restore); });
      return;
    }
    if (chatView.classList.contains('is-manual') && !isContactChat() && applicationState.threadStatus === 'active') prepInlinePop();
    clearTimeout(replyTimer);
    changingView=true;
    blurContactForNavigation();
    chatInput.blur();
    if (window.SpotlightHubConfiguration && !isContactChat()) {
      chatView.classList.remove('has-keyboard');
      $('iosKeyboard').inert = true;
    }
    cancelComposerMotion();
    changingView=false;
    if (isContactChat()) {
      contactThreads[applicationState.conversationType].draft = contactInput.value;
      if(contactReturn && contactReturn.view === 'directoryView') { stage.classList.remove('is-contact-chat'); openDirectory(contactReturn.directoryMode, true); }
      else returnToMain(contactReturn ? contactReturn.tab : 'connection', contactReturn);
      contactReturn = null;
    } else if (applicationState.spotlightOrigin.area === 'dashboard') {
      returnToMain('connection', spotlightReturn);
    } else if (applicationState.spotlightOrigin.state === 'notificationView') {
      openNotificationDetail(true);
    } else {
      if (spotlightReturn && spotlightReturn.view === 'directoryView') openDirectory(spotlightReturn.directoryMode, true);
      else if (spotlightReturn && spotlightReturn.view === 'notificationsView') openNotifications(true);
      else returnToMain(applicationState.spotlightOrigin.section || 'connection', spotlightReturn);
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { switchTab(tab.dataset.tab); });
  });

  entrySpotlight.addEventListener('click', openSpotlight);
  $('entrySearch').addEventListener('click', openManualChat);
  mainClose.addEventListener('click', dismissSpotlight);
  chatClose.addEventListener('click', dismissSpotlight);
  notificationClose.addEventListener('click', dismissSpotlight);
  $('notificationsClose').addEventListener('click', dismissSpotlight);
  fieldButton.addEventListener('pointerdown', function(e){
    if(activeView !== 'chatView' && e.button === 0) { e.preventDefault(); openManualChat(); }
  });
  fieldButton.addEventListener('click', function(e){if(!e.target.closest('#chatSend') && activeView !== 'chatView')openManualChat();});
  // Back owns keyboard dismissal. Prevent the pointer's default focus transfer from
  // starting a separate blur animation before the navigation click is dispatched.
  chatBack.addEventListener('pointerdown', function (event) {
    if (window.SpotlightHubConfiguration && event.button === 0 && !isContactChat()) event.preventDefault();
  });
  chatBack.addEventListener('click', leaveChat);
  notificationsBack.addEventListener('click', function () { returnToMain(notificationsReturn ? notificationsReturn.tab : 'events', notificationsReturn); });
  notificationBack.addEventListener('click', function () {
    if (detailReturn) {
      var destination = detailReturn; detailReturn = null;
      returnToMain(destination.tab, destination);
    } else openNotifications(true);
  });
  firstNotification.addEventListener('click', openNotificationDetail);
  bankRequestAction.addEventListener('click', openHelp);
  function revealOverview(category) {
    var from=activeView==='main'?scroller.scrollTop:TRAVEL;
    if(window.SpotlightMergedSegments && category)window.SpotlightMergedSegments.select('main',category);
    if (activeView !== 'main') returnToMain('events',{sheetState:'open',scrollTop:from});
    else if (segmentsEnabled() && activeTab !== 'events') switchTab('events');
    measure();
    var target=TRAVEL+(category ? window.SpotlightMergedSegments?.mainAnchor || 0 : 0);
    animateTo(target);
  }
  spotlightShell.addEventListener('click', function (event) {
    var navControl = event.target.closest('[data-nav]');
    // The kebab is a placeholder for future thread actions: intentionally no action yet.
    if (navControl) { if (navControl.dataset.nav === 'threads') openAllThreads(); return; }
    if (event.target.closest('[data-page-input]')) { openManualChat(); return; }
    var chatRow = event.target.closest('.chat-row[data-contact-chat="manager"]');
    if (chatRow) contactThreads.manager.greeting = MANAGER_GREETING;
    if (event.target.closest('[data-open-assistant]')) openManualChat();
    if (event.target.closest('[data-open-managers]')) openDirectory('managers');
    if (event.target.closest('[data-open-chats]')) openDirectory('chats');
    if (event.target.closest('[data-open-letters]')) openDirectory('letters');
    if (event.target.closest('[data-open-threads]')) openAllThreads();
    if (event.target.closest('[data-event-help]')) openHelp(event.target.closest('[data-event-help]').textContent.trim() || 'Что именно запросил банк?');
    var contact = event.target.closest('[data-contact-chat]');
    if (contact) openContactChat(contact.dataset.contactChat);
    var target = event.target.closest('[data-return-tab]');
    if (target) returnToMain(target.dataset.returnTab);
    if (event.target.closest('[data-open-notifications]')) revealOverview();
    if (event.target.closest('[data-open-digests]')) revealOverview('tasks');
    if (event.target.closest('[data-open-insights]')) revealOverview('insights');
    if (event.target.closest('.hub-reminder-action')) openDirectory('notifications');
    var company = event.target.closest('[data-feed-company]');
    if (company) { var options = company.nextElementSibling; options.hidden = !options.hidden; company.setAttribute('aria-expanded', String(!options.hidden)); }
    var filter = event.target.closest('[data-feed-filter]');
    if (filter) {
      var feed = filter.closest('.hub-notification-feed');
      feed.querySelectorAll('[data-feed-owner]').forEach(function (row) { row.hidden = filter.dataset.feedFilter !== 'all' && row.dataset.feedOwner !== filter.dataset.feedFilter; });
      feed.querySelectorAll('[data-feed-group]').forEach(function (group) { group.hidden = !group.querySelector('[data-feed-owner]:not([hidden])'); });
      feed.querySelector('[data-feed-company]').firstChild.textContent = filter.dataset.feedFilter === 'all' ? 'Компания ' : filter.textContent + ' ';
      filter.parentNode.hidden = true; feed.querySelector('[data-feed-company]').setAttribute('aria-expanded','false');
    }
    var details = event.target.closest('.hub-notification-details');
    if (details) { details.nextElementSibling.hidden = !details.nextElementSibling.hidden; details.setAttribute('aria-expanded',String(!details.nextElementSibling.hidden)); details.textContent = details.nextElementSibling.hidden ? 'Подробнее' : 'Свернуть'; }

    if (event.target.closest('[data-open-payment-detail]')) openNotificationDetail();
  });
  document.addEventListener('click', function(event) {
    var chip=event.target.closest('.chip');
    if(chip && chip.matches('[data-primary-skill-chip]') && window.SpotlightHubConfiguration?.state.proactiveCommunication) { window.Spotlight.openProactiveSkill(); return; }
    if(chip && chip.textContent.trim()==='Создать задачу') { window.Spotlight.createReminder(); return; }
    if(chip && chip.textContent.trim()==='Скачать выписку') {
      if(activeView==='chatView' && !isContactChat()) sendReminder('Скачать выписку');
      else openHelp('Скачать выписку');
    }
  });
  chatComposer.addEventListener('submit', function (event) {
    event.preventDefault();
    var value = chatInput.value.trim();
    if (!value || applicationState.spotlight === 'loading') return;
    sendReminder(value);
  });
  text.addEventListener('focus',function(){ if(activeView !== 'chatView') openManualChat(); });
  field.addEventListener('submit',function(e){e.preventDefault();openManualChat();});
  chatInput.addEventListener('focus', function () {
    if(activeView !== 'chatView' || applicationState.spotlight === 'closed') openManualChat();
    else keyboardVisible(true);
  });
  chatScroll.addEventListener('wheel',releaseTranscriptScroll,{passive:true});
  chatScroll.addEventListener('touchstart',releaseTranscriptScroll,{passive:true});
  chatScroll.addEventListener('keydown',function(event){
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key)) releaseTranscriptScroll();
  });
  chatInput.addEventListener('blur', function () {
    if (changingView || (window.SpotlightMoreMenu && window.SpotlightMoreMenu.isOpen())) return;
    // The keyboard always follows focus. Blur never navigates: New Thread stays New Thread.
    keyboardVisible(false);
  });
  spotlightShell.addEventListener('pointerdown', function (event) {
    if (morphing) { event.preventDefault(); event.stopImmediatePropagation(); return; }
    if (activeView !== 'chatView' || isContactChat()) return;
    var focused = chatView.classList.contains('has-keyboard');
    // Tap outside the focused input (New or Active Thread): only focus + keyboard change; the
    // composer settles down. Done directly: touch browsers do not blur on empty areas and an
    // unfocused page blurs without firing 'blur'.
    if (focused && !event.target.closest('#assistantComposer, #iosKeyboard, .hub-task-card, .flow-header button, .chip, .hub-suggestions')) {
      event.preventDefault();
      dismissInputFocus();
    }
    // Tap the composer again: the keyboard follows the returning focus.
    if (!focused && event.target.closest('#assistantComposer') && !event.target.closest('#chatSend')) keyboardVisible(true);
  }, true);
  function dismissInputFocus() {
    changingView = true; chatInput.blur(); changingView = false;
    keyboardVisible(false);
  }
  spotlightShell.addEventListener('click', function (event) {
    if (morphing) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);

  chatInput.addEventListener('input', function () {
    saveAIThread();
    if (applicationState.spotlight !== 'loading') applicationState.spotlight = this.value ? 'composing' : 'empty';
    updateComposer();
    requestAnimationFrame(updateComposer);
  });
  chatInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      chatComposer.requestSubmit();
    }
  });
  contactComposer.addEventListener('submit', function (event) {
    event.preventDefault();
    var value = contactInput.value.trim();
    if (activeView === 'chatView' && isContactChat() && value) sendContactMessage(value);
  });
  contactInput.addEventListener('focus', function () { keyboardVisible(true); });
  contactInput.addEventListener('blur', function () { if (!navigatingContact) keyboardVisible(false); });
  contactInput.addEventListener('input', function () {
    contactThreads[applicationState.conversationType].draft = this.value;saveContacts();
    updateComposer();
  });
  contactInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault(); contactComposer.requestSubmit();
    }
  });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', updateKeyboardViewport);

  /* Мышью лист можно потянуть так же, как пальцем. На touch остаётся
     нативная инерционная прокрутка единственного .scroller. */
  var drag = null;
  sheet.addEventListener('pointerdown', function (event) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('button, .event-strip-clip')) return;
    cancelAnimationFrame(snapFrame);
    snapping = false;
    drag = { id: event.pointerId, y: event.clientY, scroll: scroller.scrollTop, lastY: event.clientY, lastT: performance.now() };
  });
  window.addEventListener('pointermove', function (event) {
    if (!drag || event.pointerId !== drag.id) return;
    var dy = event.clientY - drag.y;
    if (Math.abs(dy) > 3) {
      sheet.classList.add('is-dragging');
      scroller.scrollTop = clamp(drag.scroll - dy, 0, scrollTotal);
      var now = performance.now();
      velocity = -(event.clientY - drag.lastY) / Math.max(8, now - drag.lastT);
      drag.lastY = event.clientY;
      drag.lastT = now;
      event.preventDefault();
    }
  }, { passive: false });
  window.addEventListener('pointerup', function (event) {
    if (!drag || event.pointerId !== drag.id) return;
    drag = null;
    sheet.classList.remove('is-dragging');
    settle();
  });

  var horizontalDrag = null;
  spotlightShell.addEventListener('pointerdown', function (event) {
    var rail = event.target.closest('.stories, .chips, .chat-prompts, .event-strip-clip');
    if (!rail || event.pointerType !== 'mouse' || event.button !== 0) return;
    horizontalDrag = { element: rail, id: event.pointerId, x: event.clientX, start: rail.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', function (event) {
    if (!horizontalDrag || horizontalDrag.id !== event.pointerId) return;
    var dx = event.clientX - horizontalDrag.x;
    if (Math.abs(dx) > 4) {
      horizontalDrag.moved = true;
      horizontalDrag.element.scrollLeft = horizontalDrag.start - dx;
      event.preventDefault();
    }
  }, { passive: false });
  window.addEventListener('pointerup', function () { setTimeout(function () { horizontalDrag = null; }, 0); });
  spotlightShell.addEventListener('click', function (event) {
    if (horizontalDrag && horizontalDrag.moved) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);

  // ── V3 shared navbar controls ───────────────────────────────────────────
  // One definition per control, mounted once into each page header. Which controls show is
  // derived from the semantic screen state (view, directory mode, conversation), never text.
  var NAV_CONTROLS = {
    threads: { icon: window.SpotlightHubConfiguration ? window.SpotlightHubConfiguration.historyIcon : 'assets/figma/v3/bubble.svg', label: 'Все чаты' },
    kebab: { icon: 'assets/figma/v3/kebab.svg', label: 'Действия с диалогом' }
  };
  var navHosts = [
    { view: 'main', header: document.querySelector('.header'), before: mainClose, cls: 'ctl', kinds: ['threads'] },
    { view: 'chatView', header: chatView.querySelector('.flow-header'), before: chatClose, cls: 'flow-control', kinds: ['threads', 'kebab'] },
    { view: 'notificationsView', header: notificationsView.querySelector('.native-header'), before: $('notificationsClose'), cls: 'flow-control', kinds: ['threads'] },
    { view: 'notificationView', header: notificationView.querySelector('.native-header'), before: notificationClose, cls: 'flow-control', kinds: ['threads'] },
    { view: 'directoryView', header: $('directoryView').querySelector('.native-header'), before: $('directoryClose'), cls: 'flow-control', kinds: ['threads'] }
  ];
  navHosts.forEach(function (host) {
    host.controls = {};
    host.kinds.forEach(function (kind) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = host.cls + ' nav-control nav-' + kind;
      button.dataset.nav = kind;
      button.hidden = true;
      button.setAttribute('aria-label', NAV_CONTROLS[kind].label);
      button.innerHTML = '<img draggable="false" src="' + NAV_CONTROLS[kind].icon + '" alt="">';
      host.header.insertBefore(button, host.before);
      host.controls[kind] = button;
    });
  });

  // ── V3 global Custom Input on product pages ───────────────────────────────
  // Every instance is the Focus Custom Input markup (captured before any inline styling) and
  // shares its behaviour: tapping it opens New Thread with this page as the Spotlight origin.
  var pageInputs = {};
  ['notificationsView', 'notificationView', 'directoryView'].forEach(function (view) {
    var dock = document.createElement('div');
    dock.className = 'page-input-dock';
    dock.dataset.pageInput = view;
    dock.hidden = true;
    var haze = document.createElement('div');
    haze.className = 'input-haze';
    haze.setAttribute('aria-hidden', 'true');
    var instance = inputTemplate.cloneNode(true);
    instance.removeAttribute('id');
    instance.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
    instance.classList.add('page-input');
    instance.setAttribute('aria-label', 'Спросите что угодно');
    instance.querySelector('.field-text').tabIndex = 0;
    instance.addEventListener('submit', function (event) { event.preventDefault(); openManualChat(); });
    instance.addEventListener('pointerdown', function (event) { if (event.button === 0) { event.preventDefault(); openManualChat(); } });
    instance.querySelector('.field-text').addEventListener('focus', function () { if (activeView === view) openManualChat(); });
    dock.appendChild(haze);
    dock.appendChild(instance);
    $(view).appendChild(dock);
    pageInputs[view] = dock;
  });

  function conversationStarted() {
    return !isContactChat() && applicationState.threadStatus === 'active';
  }
  function navState(view) {
    if (view === 'directoryView') return { threads: directoryMode !== 'threads', kebab: false };
    if (view === 'chatView' && window.SpotlightHubConfiguration) return { threads: isContactChat(), kebab: !isContactChat() };
    if (view === 'chatView') return { threads: !conversationStarted(), kebab: conversationStarted() };
    return { threads: true, kebab: false };
  }
  function inputScreen(view) {
    if (view === 'main') return 'aiHome';
    if (view === 'directoryView') return directoryMode === 'profile' ? 'manager' : directoryMode;
    if (view === 'notificationsView') return 'events';
    if (view === 'notificationView') return 'event';
    if (view === 'chatView') return applicationState.conversationType === 'support' ? 'support' : null;
    return null;
  }
  function hasGlobalInput(view) {
    return GLOBAL_AI_INPUT_VISIBILITY[inputScreen(view)] === true;
  }
  function syncChrome() {
    navHosts.forEach(function (host) {
      var state = navState(host.view);
      host.kinds.forEach(function (kind) { host.controls[kind].hidden = !state[kind]; });
    });
    Object.keys(pageInputs).forEach(function (view) {
      var on = hasGlobalInput(view);
      pageInputs[view].hidden = !on;
      $(view).classList.toggle('has-global-input', on);
    });
  }

  // ── V3 navbar bubble → Focus :: Threads, with an origin-aware Back ────────
  function captureOrigin() {
    var origin = { view: activeView, tab: activeTab, sheetState: stableState, scrollTop: activeView === 'main' ? scroller.scrollTop : lockedScrollTop, directoryMode: directoryMode };
    if(activeView==='directoryView'){origin.directoryOffset=$('directoryContent').scrollTop;origin.directoryReturn=directoryReturn;}
    if (activeView === 'directoryView' && directoryMode === 'threads') origin.requestsOrigin = threadsReturn;
    if (activeView === 'chatView') {
      origin.stageClasses = ['is-manual-chat', 'is-conversation', 'is-dashboard-chat', 'is-contact-chat'].filter(function (name) { return stage.classList.contains(name); });
      origin.chat = { navigationOrigin:aiNavigationOrigin, scroll:chatScroll.scrollTop, threadId:activeAIThread, draft:chatInput.value, focused:chatView.classList.contains('has-keyboard'), conversationType: applicationState.conversationType, threadStatus: applicationState.threadStatus, spotlight: applicationState.spotlight, spotlightOrigin: applicationState.spotlightOrigin, spotlightReturn: spotlightReturn, contactReturn: contactReturn, replaced: false };
    }
    return origin;
  }
  function restoreOrigin(origin) {
    if(window.SpotlightSurfaceMotion && !window.SpotlightSurfaceMotion.committing && activeView==='directoryView' && directoryMode==='threads' && (origin.view==='main' || (origin.view==='chatView' && !Object.prototype.hasOwnProperty.call(contactThreads,origin.chat?.conversationType)))) return window.SpotlightSurfaceMotion.run(function(){restoreOrigin(origin);});
    if (origin.view === 'chatView') {
      var chat = origin.chat;
      if (threadStore && chat.threadId) {
        if (!threadStore.get(chat.threadId)) {
          if (chat.navigationOrigin) restoreOrigin(chat.navigationOrigin);
          else returnToMain(origin.tab, origin);
          return;
        }
        openSavedThread(chat.threadId, chat.navigationOrigin || {view:'main',tab:origin.tab,sheetState:origin.sheetState,scrollTop:origin.scrollTop});
        requestAnimationFrame(function(){chatScroll.scrollTop = chat.scroll || 0;});
        return;
      }
      aiNavigationOrigin = chat.navigationOrigin || null;
      applicationState.conversationType = chat.conversationType;
      applicationState.threadStatus = chat.threadStatus;
      applicationState.spotlightOrigin = chat.spotlightOrigin;
      spotlightReturn = chat.spotlightReturn;
      contactReturn = chat.contactReturn;
      if (chat.replaced) {
        // The chat itself was replaced from Threads: continue to where it would have gone back.
        if (isContactChat()) contactInput.value = contactThreads[chat.conversationType].draft;
        leaveChat();
        return;
      }
      applicationState.spotlight = chat.spotlight;
      if (window.SpotlightHubConfiguration && !isContactChat() && chat.threadStatus === 'new') {
        activeAIThread=null;resetChat();chatInput.value=chat.draft || '';
        stage.classList.remove('is-manual-chat','is-conversation','is-dashboard-chat','is-contact-chat','is-threads-compose');
        origin.stageClasses.forEach(function(name){stage.classList.add(name);});
        var inline=origin.stageClasses.includes('is-manual-chat');
        chatView.classList.toggle('is-manual',inline);chatView.classList.toggle('is-pushed',!inline);chatView.classList.add('is-empty');
        chatEmptyIntro.hidden=inline;chatDate.hidden=true;
        if(!inline)chatEmptyIntro.innerHTML='<h2>Анна, добрый вечер<br>С чем помочь сегодня?</h2><div class="chat-prompts">'+chips.innerHTML+'</div>';
        setFlowView('chatView');updateComposer();keyboardVisible(!!chat.focused);
        return;
      }
      if (!isContactChat() && chat.threadStatus === 'new' && !reduceMotion) { morphThreadsToCompose(origin); return; }
      origin.stageClasses.forEach(function (name) { stage.classList.add(name); });
      restoringView = true;
      setFlowView('chatView');
      restoringView = false;
      updateComposer();
    } else if (origin.view === 'notificationView') openNotificationDetail(true);
    else if (origin.view === 'notificationsView') openNotifications(true);
    else if (origin.view === 'directoryView') { openDirectory(origin.directoryMode, true);$('directoryContent').scrollTop=origin.directoryOffset || 0;directoryReturn=origin.directoryReturn || directoryReturn; threadsReturn = origin.requestsOrigin || null; }
    else returnToMain(origin.tab, origin);
  }
  function openAllThreads() {
    if(window.SpotlightSurfaceMotion && !window.SpotlightSurfaceMotion.committing && (activeView==='main' || (activeView==='chatView' && !isContactChat())))return window.SpotlightSurfaceMotion.run(function(){openAllThreads();});
    if (morphing) return;
    if (inThreadsCompose() && !window.SpotlightSurfaceMotion?.committing) { exitThreadsCompose(); return; }
    if (applicationState.spotlight === 'closed' || (activeView === 'directoryView' && directoryMode === 'threads')) return;
    if (!window.SpotlightHubConfiguration && isCompose() && !reduceMotion) { morphComposeToThreads(); return; }
    threadsReturn = threadStore && activeAIThread && spotlightReturn && spotlightReturn.view === 'directoryView' && spotlightReturn.directoryMode === 'threads' ? null : captureOrigin();
    if (activeView === 'chatView') {
      if (!window.SpotlightHubConfiguration || isContactChat()) clearTimeout(replyTimer);
      changingView = true;
      blurContactForNavigation();
      chatInput.blur();
      keyboardVisible(false);
      changingView = false;
    }
    openDirectory('threads');
  }

  // Refreshed Figma directories extend the existing view stack.
  var managerOrigin = 'managers';
  var directorySearch = { managers: '', threads: '' };
  var directoryScroll = { managers: 0, threads: 0, chats: 0, letters: 0 };
  var requestNames = ['Исследование','Тарифы в Альфа-Банке','Аналитика','Отчет','Анализ','Обзор','Статья','Исследование удовлетворенности клиентов после внедрения CRM-системы','Анализ конкурентоспособности на рынке SaaS-решений','Оценка влияния социальных сетей на бренд','Прогнозирование спроса на сезонные товары','Изучение факторов текучести кадров','Внедрение искусственного интеллекта в обслуживание клиентов','Проверка контрагента перед заключением договора','Подготовка выписки по расчётному счёту','Условия подключения эквайринга','Открытие дополнительного счёта','Документы для валютного контроля','Расчёт комиссии за переводы','Подключение зарплатного проекта','Изменение лимитов бизнес-карты','Сверка платежей за прошлый месяц','Возврат ошибочного платежа','Справка об открытых счетах','Реквизиты для международного перевода','Продление электронной подписи','Выбор тарифа для нового бизнеса','Проверка статуса платёжного поручения','Настройка уведомлений по счёту','Подключение сотрудника к интернет-банку','Анализ расходов на банковские услуги','Планирование платежей на следующий месяц'];
  var requestNotes = ['Влияние удаленной работы на производительность','Расскажу про тарифы в Альфе, какой выбрать стоит','Вот отчёт по вашим счетам за первый квартал 2026','Влияние цветовой палитры на восприятие бренда','Преимущества гибкого графика в корпоративной культуре','Тренды мобильных приложений в 2024 году','Как UX-дизайн влияет на поведение пользователей'];
  function openDirectory(mode, returning, renderOnly) {
    if(window.SpotlightSurfaceMotion && !window.SpotlightSurfaceMotion.committing && !renderOnly && mode==='threads' && activeView==='chatView' && !isContactChat())return window.SpotlightSurfaceMotion.run(function(){openDirectory(mode,returning,renderOnly);});
    var dockTransition = !window.SpotlightHubConfiguration && !renderOnly && !returning && mode === 'threads' && activeView === 'main' && connectionInputDock() && scroller.scrollTop >= TRAVEL * .8 && !reduceMotion;
    var dockFrom = dockTransition ? field.getBoundingClientRect() : null;
    var previewRow = dockTransition && window.SpotlightHubConfiguration.state.operatorInThread ? listInner.querySelector('.experiment-thread-row') : null;
    var previewTop = previewRow ? previewRow.getBoundingClientRect().top : null;
    if (!renderOnly) saveAIThread();
    clearDirectoryMotion();
    var backwards=(directoryMode==='profile' && mode==='managers') || (directoryMode==='threads' && returning===true);
    var snapshot=!window.SpotlightHubConfiguration && activeView==='directoryView' && directoryMode!==mode ? $('directoryView').cloneNode(true) : null;
    var snapshotScroll=snapshot ? $('directoryContent').scrollTop : 0;

    if (!returning && activeView === 'main') directoryReturn = {tab:activeTab,sheetState:stableState,scrollTop:scroller.scrollTop};
    directoryMode = mode;
    $('directoryView').dataset.mode=mode;
    applicationState.spotlight = 'empty';
    var content = $('directoryContent'), action = $('directoryAction');
    action.hidden = mode !== 'profile' && mode !== 'letters';
    if(mode === 'chats') action.hidden = true;
    action.textContent = mode === 'letters' ? 'Новое письмо' : mode === 'profile' ? 'Написать в чат' : window.SpotlightHubConfiguration?.state.operatorInThread ? 'Новый диалог' : window.SpotlightHubConfiguration?.state.preset === 'mvp' ? 'Новый диалог' : 'Новый диалог';
    $('directoryTitle').textContent = mode === 'managers' ? 'Менеджеры' : mode === 'profile' ? 'Менеджер' : mode === 'chats' ? 'Чаты' : mode === 'letters' ? 'Письма' : window.SpotlightHubConfiguration && !window.SpotlightHubConfiguration.state.requestsOnly ? 'Обзор' : window.SpotlightHubConfiguration?.state.preset === 'mvp' ? 'Запросы' : 'Диалоги';
    if (mode === 'notifications') {
      $('directoryTitle').textContent = 'Уведомления';
      content.innerHTML = "<div class=\"hub-notification-feed\"><div class=\"hub-notification-filters\"><button type=\"button\" data-feed-company aria-expanded=\"false\">Компания <span aria-hidden=\"true\"><svg width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\"><path d=\"m4 6 4 4 4-4\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg></span></button><div class=\"hub-company-options\" hidden><button type=\"button\" data-feed-filter=\"all\">Все компании</button><button type=\"button\" data-feed-filter=\"shipletsova\">ИП Щиплецова</button><button type=\"button\" data-feed-filter=\"iossa\">ИП Иосса</button><button type=\"button\" data-feed-filter=\"nagatino\">ООО «Город Нагатино»</button></div></div><section data-feed-group><time>20 июня</time><article data-feed-owner=\"shipletsova\"><small>ИП ЩИПЛЕЦОВА НАТАЛИЯ ВАЛЕНТИНОВНА</small><h2>Один шаг до получения финансирования</h2><p>Заполните заявку на факторинг и застрахуйте дебиторскую задолженность</p></article><article data-feed-owner=\"iossa\"><small>ИП ИОССА АЛЕКСАНДР НИКОЛАЕВИЧ</small><h2>Приостановление ПЛ «Альфа-Выгодно»</h2><p>Действие ПЛ Альфа-Выгодно для вашей организации будет приостановлено</p><div class=\"hub-notification-file\"><span class=\"hub-notification-file-icon\"><img src=\"assets/figma/v3/notification-doc.svg\" alt=\"Документ\"></span><span class=\"hub-notification-file-copy\"><span>Правила Программы лояльности</span><small>20 МБ</small></span><img src=\"assets/figma/v3/notification-download.svg\" alt=\"Скачать\"></div><button type=\"button\" class=\"hub-notification-details\" aria-expanded=\"false\">Подробнее</button><p class=\"hub-notification-expanded\" hidden>Правила Программы лояльности «Альфа-Выгодно» — документ к уведомлению о приостановлении программы.</p></article></section><section data-feed-group><time>15 июня</time><article data-feed-owner=\"nagatino\"><small>ООО «Город Нагатино»</small><h2>Документы для подписи<br>по эквайрингу готовы</h2><p>Для организации ИП ИОССА АЛЕКСАНДР НИКОЛАЕВИЧ</p></article></section></div>";
    } else if (mode === 'chats' && connectionList) {
      content.innerHTML = connectionList.chatsHTML;
    } else if (mode === 'letters' && connectionList) {
      content.innerHTML = connectionList.lettersHTML;
    } else if (mode === 'profile') {
      var currency = managerProfileName === 'Сергей Иванов';
      var role = currency ? 'Валютный контролёр' : 'Клиентский менеджер';
      var initials = currency ? 'СИ' : 'ЕА';
      var email = currency ? 'SIvanov@alfabank.ru' : 'EAndreeva@alfabank.ru';
      content.innerHTML = '<div class="manager-profile"><img class="manager-portrait" src="assets/figma/2026-09-29/manager-'+(currency?'ivanov':'andreeva')+'.png" alt="'+managerProfileName+'" data-initials="'+initials+'"><h2>'+managerProfileName+'</h2><p>'+role+'</p></div><div class="manager-contact"><span class="profile-icon"><img src="assets/figma/2026-09-29/phone-fill.svg" alt=""></span><div><small>Для звонков и сообщений</small><p>+7 (999) 111-22-33</p></div></div><div class="profile-info"><span class="profile-icon"><img src="assets/figma/2026-09-29/person-add.svg" alt=""></span>Добавить в контакты</div><div class="profile-info"><span class="profile-icon"><img src="assets/figma/2026-09-29/mail-soft.svg" alt=""></span>'+email+'</div><div class="profile-info"><span class="profile-icon"><img src="assets/figma/2026-09-29/rate-soft.svg" alt=""></span>Оценить работу</div>';
      var selectedManager = connectionList && connectionList.managers.find(function(manager){return manager.name === managerProfileName;});
      if(selectedManager){
        content.querySelector('.manager-portrait').src = selectedManager.image;
        if(!currency && managerProfileName !== 'Екатерина Андреева') content.querySelectorAll('.profile-info')[1].remove();
      }

    } else {
      var placeholder = 'Фамилия или должность';
      var search = mode === 'managers' ? '<label class="search-field"><img src="assets/icons/search.svg" alt=""><input class="directory-search" id="directorySearch" type="search" placeholder="'+placeholder+'" aria-label="'+placeholder+'"></label>' : '';
      content.innerHTML = search + '<div id="directoryRows"></div><p class="directory-empty" hidden>Ничего не найдено</p>';
      var rows = $('directoryRows');
      if (mode === 'managers') {
        rows.innerHTML = '<h2>Клиентский менеджер</h2><button type="button" class="manager-row" data-manager-profile="Екатерина Андреева" data-search-text="Екатерина Андреева Клиентский менеджер"><img class="manager-photo" src="assets/figma/2026-09-29/manager-andreeva.png" alt=""><span>Екатерина Андреева</span></button><h2>Валютный контролёр</h2><button type="button" class="manager-row" data-manager-profile="Сергей Иванов" data-search-text="Сергей Иванов Валютный контролёр"><img class="manager-photo" src="assets/figma/2026-09-29/manager-ivanov.png" alt=""><span>Сергей Иванов</span></button>';
        if(connectionList) rows.innerHTML = '<h2>Клиентские менеджеры</h2>' + connectionList.managers.map(function(manager,index){return (index===5?'<h2>Валютный контролёр</h2>':'')+'<button type="button" class="manager-row" data-manager-profile="'+manager.name+'" data-search-text="'+manager.name+' '+manager.role+'"><img class="manager-photo" src="'+manager.image+'" alt=""><span>'+manager.name+'</span></button>';}).join('');

      } else {
        rows.innerHTML = requestNames.map(function(name,i){var sub=requestNotes[i]||'';return '<div class="row" data-search-text="'+name+'"><span class="row-text"><span class="row-title">'+name+'</span>'+(sub?'<span class="row-sub">'+sub+'</span>':'')+'</span>'+(i===0?'<span class="thread-unread-count" aria-label="1 непрочитанное сообщение">1</span>':'')+'</div>';}).join('');
      }
      var input=$('directorySearch');
      if (input) {
        if(window.SpotlightHubConfiguration && mode === 'managers'){input.disabled=true;input.tabIndex=-1;input.closest('.search-field').classList.add('hub-search-disabled');directorySearch[mode]='';}input.value=directorySearch[mode];
        input.addEventListener('input',function(){directorySearch[mode]=this.value;filterDirectory();});
        filterDirectory();
      }
    }
    if (mode === 'threads') renderAIThreads();
    if (renderOnly) { content.scrollTop = 0; return; }
    if (dockTransition) { $('directoryView').style.transition='none'; lockMorph(true, 'connection→threads'); }
    setFlowView('directoryView');
    content.scrollTop = returning ? directoryScroll[mode] || 0 : 0;
    if (dockTransition) {
      var page = $('directoryView');
      void page.offsetWidth;
      var destination = page.querySelector('.page-input') || page.querySelector('.hub-request-input');
      var scale = spotlightShell.getBoundingClientRect().width / spotlightShell.offsetWidth;
      var firstRow = page.querySelector('.hub-thread-row');
      var offset = previewTop !== null && firstRow ? (previewTop-firstRow.getBoundingClientRect().top)/scale : 24;
      var timing = {duration:460,easing:MOTION.easing,fill:'both'};
      var transitionAnimations = [
        content.animate([{opacity:previewTop !== null ? 1 : 0,translate:'0 '+offset+'px'},{opacity:1,translate:'0 0'}],timing),
        page.querySelector('.native-header').animate([{opacity:0},{opacity:1}],timing)
      ];
      var ambient = page.querySelector('.focus-ambient');
      if (ambient) transitionAnimations.push(ambient.animate([{opacity:0},{opacity:1}],timing));
      if (destination) {
        var to = destination.getBoundingClientRect();
        transitionAnimations.push(destination.animate([{translate:((dockFrom.left-to.left)/scale)+'px '+((dockFrom.top-to.top)/scale)+'px'},{translate:'0px 0px'}],timing));
      }
      whenDone(transitionAnimations).then(function(){
        transitionAnimations.forEach(function(animation){animation.cancel();});
        page.style.transition=''; lockMorph(false);
      });
    }

    if(snapshot && !reduceMotion){
      // The snapshot keeps its ids so every #directoryView… rule still styles it exactly like
      // the outgoing page (stripping them unstyled it and exposed the AI ambient layer for a
      // frame). It is appended after the live page, so getElementById still finds the live one.
      snapshot.dataset.snapshot='true';
      snapshot.inert=true;snapshot.setAttribute('aria-hidden','true');
      snapshot.style.pointerEvents='none';snapshot.style.zIndex=backwards?'105':'104';
      spotlightShell.appendChild(snapshot);
      snapshot.querySelector('#directoryContent').scrollTop=snapshotScroll;
      var page=$('directoryView');page.style.zIndex=backwards?'104':'105';
      var timing={duration:420,easing:MOTION.easing};
      var animations=[page.animate([{transform:backwards?'translateX(-28%)':'translateX(100%)'},{transform:'translateX(0)'}],timing),snapshot.animate([{transform:'translateX(0)'},{transform:backwards?'translateX(100%)':'translateX(-28%)'}],timing)];
      var record={snapshot:snapshot,animations:animations};directoryMotion=record;
      animations[0].finished.then(function(){if(directoryMotion===record)clearDirectoryMotion();}).catch(function(){});
    }

  }
  function filterDirectory() {
    var query=$('directorySearch').value.toLocaleLowerCase('ru').trim(), visible=0;
    $('directoryRows').querySelectorAll('[data-search-text]').forEach(function(row){row.hidden=!row.dataset.searchText.toLocaleLowerCase('ru').includes(query);if(!row.hidden)visible++;});
    $('directoryRows').querySelectorAll('h2').forEach(function(h){h.hidden=!!query;});
    $('directoryContent').querySelector('.directory-empty').hidden=visible>0;
  }
  var managerProfileReturn=null;
  chatView.querySelector('.flow-header h1').addEventListener('click',function(){
    if(applicationState.conversationType!=='manager')return;
    managerProfileReturn={origin:contactReturn,scroll:chatScroll.scrollTop};
    viewStack=viewStack.filter(function(view){return view!=='directoryView';});
    contactThreads.manager.draft=contactInput.value;
    managerOrigin='chat';managerProfileName='Екатерина Андреева';
    openDirectory('profile');
  });
  chatView.querySelector('.flow-header h1').addEventListener('keydown',function(event){if(applicationState.conversationType==='manager'&&(event.key==='Enter'||event.key===' ')){event.preventDefault();this.click();}});
  $('directoryContent').addEventListener('scroll',function(){if(directoryMode!=='profile')directoryScroll[directoryMode]=this.scrollTop;},{passive:true});
  spotlightShell.addEventListener('click',function(e){var row=e.target.closest('[data-manager-profile]');if(row){managerOrigin=activeView==='main'?'main':'managers';managerProfileName=row.dataset.managerProfile;openDirectory('profile',activeView!=='main');}});
  $('directoryBack').addEventListener('click',function(){
    if(directoryMode==='profile'){if(managerOrigin==='chat'){openContactChat('manager');contactReturn=managerProfileReturn.origin;requestAnimationFrame(function(){if(activeView==='chatView')chatScroll.scrollTop=managerProfileReturn.scroll;});return;}if(managerOrigin==='main')returnToMain('connection',directoryReturn);else openDirectory('managers',true);}
    else if(directoryMode==='threads' && threadsReturn){var origin=threadsReturn;threadsReturn=null;restoreOrigin(origin);}
    else returnToMain(directoryReturn ? directoryReturn.tab : 'connection',directoryReturn);
  });
  $('directoryClose').addEventListener('click',dismissSpotlight);
  $('directoryAction').addEventListener('click',function(){if(directoryMode==='letters')return;if(directoryMode==='profile'){if(window.SpotlightHubConfiguration){if(managerOrigin==='chat'){openContactChat('manager');contactReturn=managerProfileReturn.origin;requestAnimationFrame(function(){if(activeView==='chatView')chatScroll.scrollTop=managerProfileReturn.scroll;});}else openManagerChat(managerProfileName);return;}contactThreads.manager.greeting='Здравствуйте! Я '+managerProfileName+', ваш '+(managerProfileName==='Сергей Иванов'?'валютный контролёр':'клиентский менеджер')+'. Чем могу помочь?';openContactChat('manager');}else openManualChat();});

  $('chatSearchToggle').addEventListener('click',function(){
    var on=$('chatSearchPanel').hidden;
    $('chatSearchPanel').hidden=!on;
    chatView.classList.toggle('is-searching',on);
    this.setAttribute('aria-expanded',String(on));
    if(on)$('chatSearch').focus({preventScroll:true});
    else { $('chatSearch').value=''; filterChat(); }
  });
  function filterChat(){
    var query=$('chatSearch').value.trim().toLocaleLowerCase('ru'), count=0;
    chatMessages.querySelectorAll('.chat-message').forEach(function(message){
      var match=!query || message.textContent.replace(/\u00a0/g,' ').toLocaleLowerCase('ru').includes(query);
      message.hidden=!match; if(match)count++;
    });
    $('chatSearchCount').textContent=query ? (count ? 'Найдено: '+count : 'Ничего не найдено') : '';
  }
  $('chatSearch').addEventListener('input',filterChat);

  // Pointer Events cover touch, pen and mouse. A drag must never become a click.
  var hold = null, suppressedTarget = null, suppressUntil = 0, contextAnchor = null, contextInert = [];
  function cancelHold(suppress) {
    if(!hold)return;
    clearTimeout(hold.timer);
    hold.target.classList.remove('is-pressing');
    if(suppress){suppressedTarget=hold.target;suppressUntil=Infinity;}
    hold=null;
  }
  function dismissEventContext(restoreFocus) {
    cancelHold(false);
    var overlay=$('eventContext');
    if(!overlay || overlay.hidden)return;
    overlay.hidden=true;
    contextInert.forEach(function(item){item.element.inert=item.inert;});contextInert=[];
    if(contextAnchor){contextAnchor.setAttribute('aria-expanded','false');contextAnchor.classList.remove('is-pressing');if(restoreFocus && contextAnchor.isConnected)contextAnchor.focus({preventScroll:true});}
    contextAnchor=null;
  }
  function showEventContext(anchor) {
    cancelHold(true);contextAnchor=anchor;
    var rect=anchor.getBoundingClientRect(),box=spotlightShell.getBoundingClientRect(),scale=box.width/stage.offsetWidth;
    var popover=$('eventPopover');
    var summary = anchor.matches('.chip[data-open-notifications],.chip[data-open-insights],.chip[data-open-digests]');
    popover.classList.toggle('hub-summary-popover',summary);
    Array.from(popover.children).forEach(function(child){ if(!child.classList.contains('hub-summary-items'))child.hidden=summary; });
    var oldSummary=popover.querySelector('.hub-summary-items');if(oldSummary)oldSummary.remove();
    if(summary){
      var insights=anchor.hasAttribute('data-open-insights');
      var digests=anchor.hasAttribute('data-open-digests');
      popover.setAttribute('aria-label',digests?'Новые дайджесты':insights?'Инсайты':'Срочные события');
      var list=document.createElement('div');list.className='hub-more-items hub-summary-items';list.setAttribute('role','menu');
      var entries=digests?[{title:'Курс юаня',digest:'yuan',emoji:'💱'},{title:'Мои итоги недели в банке',digest:'weekly',emoji:'🗓'},{title:'Маркетплейсы для продавцов',digest:'marketplaces',emoji:'🛒'}]:insights?overviewInsights.map(function(item,index){return {title:item.title,index:index};}):[{title:'Платёж на 250 000 ₽ отклонён',event:'payment'},{title:'Банк запросил документы по 115-ФЗ · до 3 октября',event:'documents'}];
      if (digests) entries = entries.filter(function(item){return window.SpotlightRegular.hasTask(item.digest);});
      entries.forEach(function(item){
        var button=document.createElement('button');button.type='button';button.setAttribute('role','menuitem');
        var icon=document.createElement(insights || digests?'span':'img');
        if(digests){icon.className='hub-digest-menu-emoji';icon.textContent=item.emoji;icon.setAttribute('aria-hidden','true');}else if(insights){icon.className='hub-chip-pink-star';icon.setAttribute('aria-hidden','true');}else{icon.src=digests?'assets/figma/mvp/clock-alarm.svg':'assets/figma/refresh/event-alert.svg';icon.alt='';}
        var label=document.createElement('span');label.textContent=item.title;button.append(icon,label);
        button.addEventListener('click',function(e){
          e.stopPropagation();dismissEventContext();
          if(digests){openRegularDigest(item.digest);return;}
          if(!insights){openNotificationDetail(item.event);return;}
          var insight=overviewInsights[item.index];
          openInsight(insight);applicationState.spotlightOrigin.state='main';
        });list.appendChild(button);
      });popover.appendChild(list);
    }

    popover.style.left=summary ? '16px' : clamp((rect.left-box.left)/scale+16,20,68)+'px';
    popover.style.top=clamp((rect.top-box.top)/scale+6,140,VIEW_H-360)+'px';
    anchor.setAttribute('aria-expanded','true');
    [$('mainLayer'),chatView,notificationsView,notificationView,$('directoryView'),field,upper].forEach(function(element){contextInert.push({element:element,inert:element.inert});element.inert=true;});
    $('eventContext').hidden=false;
    popover.focus({preventScroll:true});
  }
  spotlightShell.addEventListener('pointerdown',function(e){
    var target=e.target.closest('[data-long-press]');
    if(!target || e.button!==0 || e.isPrimary===false)return;
    cancelHold(false);suppressedTarget=null;
    hold={target:target,x:e.clientX,y:e.clientY,id:e.pointerId,timer:0};
    target.classList.add('is-pressing');
    hold.timer=setTimeout(function(){if(hold)showEventContext(target);},500);
  });
  window.addEventListener('pointermove',function(e){if(hold && e.pointerId===hold.id && Math.hypot(e.clientX-hold.x,e.clientY-hold.y)>9)cancelHold(true);},{passive:true});
  window.addEventListener('pointerup',function(){cancelHold(false);if(suppressedTarget)suppressUntil=performance.now()+900;},{passive:true});
  window.addEventListener('pointercancel',function(){cancelHold(true);},{passive:true});
  window.addEventListener('blur',function(){cancelHold(true);dismissEventContext();});
  spotlightShell.addEventListener('scroll',function(){cancelHold(true);},{capture:true,passive:true});
  scroller.addEventListener('scroll',function(){cancelHold(true);},{passive:true});
  spotlightShell.addEventListener('wheel',function(){cancelHold(true);},{passive:true});
  spotlightShell.addEventListener('click',function(e){if(suppressedTarget && performance.now()<suppressUntil && suppressedTarget.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();suppressedTarget=null;}},true);
  spotlightShell.addEventListener('contextmenu',function(e){if(e.target.closest('[data-long-press]'))e.preventDefault();});
  $('eventContext').addEventListener('click',function(e){if(e.target===this)dismissEventContext(true);});
  $('prepareEventReply').addEventListener('click',function(){
    dismissEventContext();
    notificationView.style.visibility='hidden';
    openNotificationDetail();
    openHelp('Начать подготовку ответа');
    // Event detail stays the Back destination but never shows until the help thread covers it.
    var reveal=function(){ chatView.removeEventListener('transitionend',onEnd); clearTimeout(timer); notificationView.style.visibility=''; };
    var onEnd=function(event){ if(event.target===chatView && event.propertyName==='transform') reveal(); };
    var timer=setTimeout(reveal,700);
    chatView.addEventListener('transitionend',onEnd);
  });
  $('markEventRead').addEventListener('click',function(){
    eventRead=true;
    dismissEventContext();
    var neighbors=Array.prototype.slice.call(document.querySelectorAll('.chip-row .chip:not([data-long-press])'));
    var positions=neighbors.map(function(chip){return chip.getBoundingClientRect().left;});
    document.querySelectorAll('.chip[data-long-press]').forEach(function(chip){chip.remove();});
    var scale=stage.getBoundingClientRect().width/stage.offsetWidth;
    if(!reduceMotion) neighbors.forEach(function(chip,i){
      var dx=(positions[i]-chip.getBoundingClientRect().left)/scale;
      if(dx)chip.animate([{transform:'translateX('+dx+'px)'},{transform:'translateX(0)'}],{duration:220,easing:MOTION.easing});
    });
    var first=document.querySelector(activeView==='chatView'?'.chat-prompts .chip':'.upper .chip');if(first)first.focus({preventScroll:true});
  });
  document.addEventListener('keydown',function(e){
    if(!$('eventContext').hidden){
      if(e.key==='Escape' || e.key==='BrowserBack' || (e.altKey&&e.key==='ArrowLeft')){e.preventDefault();dismissEventContext(true);return;}
      if(e.key==='Tab'){e.preventDefault();var buttons=Array.from($('eventPopover').querySelectorAll('button')).filter(function(b){return !b.hidden;});var i=buttons.indexOf(document.activeElement);buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}
      return;
    }
    if(e.key==='ContextMenu' || (e.shiftKey&&e.key==='F10')){var anchor=document.activeElement.closest('[data-long-press]');if(anchor){e.preventDefault();showEventContext(anchor);}return;}
    if(e.key==='Escape' && applicationState.spotlight!=='closed'){
      e.preventDefault();if(activeView==='chatView')leaveChat();else if(activeView==='directoryView')$('directoryBack').click();else if(activeView==='notificationView')notificationBack.click();else if(activeView==='notificationsView')notificationsBack.click();else dismissSpotlight();
    }
  });

  window.addEventListener('spotlight-hub:operator', function () {
    if (window.SpotlightMoreMenu) window.SpotlightMoreMenu.sync();
  });
  if(connectionList)window.addEventListener('spotlight-hub:configuration-applied',function(event){
    var c=window.SpotlightHubConfiguration.state;
    // Preserve live drafts, pending replies and questionnaire state before hiding a capability.
    if(isContactChat()){contactThreads[applicationState.conversationType].draft=contactInput.value;saveContacts();}
    else saveAIThread();
    connectionHTML=connectionList.render();tabHTML.connection=connectionHTML;
    if(!segmentsEnabled() || c.sectionLayout==='combined')activeTab='connection';
    applicationState.activeMainTab=activeTab;
    tabs.forEach(function(tab){var on=tab.dataset.tab===activeTab;tab.classList.toggle('is-active',on);tab.setAttribute('aria-selected',String(on));});
    clearTimeout(settleTimer);cancelAnimationFrame(snapFrame);snapping=false;
    listInner.innerHTML=mainHTML();bindShortWords(listInner);measure();
    lockedScrollTop=Math.min(lockedScrollTop,scrollTotal);lastScroll=scroller.scrollTop;
    var record=activeAIThread && threadStore.get(activeAIThread);
    var taskHidden=!c.tasks && record && (record.reminder || record.taskRun || record.type==='regular');
    var contactHidden=isContactChat() && (applicationState.conversationType==='support'?c.supportAccess==='thread':!c.manager);
    if(activeView==='chatView' && (taskHidden || contactHidden)) {
      if(contactHidden)leaveChat();else openAllThreads();
    }
    if(activeView==='directoryView' && directoryMode==='threads')renderAIThreads();
    if(activeView==='directoryView' && ((!c.notifications && directoryMode==='notifications') || (!c.manager && ['profile','managers'].includes(directoryMode))))returnToMain('connection',directoryReturn);
    if(activeView==='notificationView' && (regularTask?!c.tasks:(!c.important&&!c.insights)))returnToMain('connection');
    if(activeView==='notificationsView' && !c.important)returnToMain('connection');
    if(window.SpotlightMoreMenu)window.SpotlightMoreMenu.closeImmediately();
    render();
  });
  if(window.SpotlightHubConfiguration)window.addEventListener('spotlight-hub:stories',function(){
    clearTimeout(settleTimer);cancelAnimationFrame(snapFrame);snapping=false;
    var fraction=Math.min(scroller.scrollTop/TRAVEL,1);
    SHEET_TOP_FULL=window.SpotlightHubConfiguration.state.stories ? 590 : 466;
    F0.y=window.SpotlightHubConfiguration.state.stories ? 494 : 370;
    TRAVEL=SHEET_TOP_FULL-SHEET_TOP_DOCKED;
    measure();scroller.scrollTop=fraction*TRAVEL;
    lockedScrollTop=scroller.scrollTop;lastScroll=scroller.scrollTop;render();
  });
  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', fit);
  if (window.SpotlightResearch && window.visualViewport) window.visualViewport.addEventListener('resize', fit);
  var q = new URLSearchParams(location.search);
  if (q.get('qa') === '1') document.body.classList.add('qa');
  if (window.SpotlightHubConfiguration) listInner.innerHTML = mainHTML();
  hostMainContent();
  hostComposer($('mainLayer'));
  measure();
  fit();
  scroller.scrollTop = q.has('p') ? clamp(parseFloat(q.get('p')) || 0, 0, 1) * TRAVEL : 0;
  stableState = scroller.scrollTop >= TRAVEL ? 'open' : 'full';
  applicationState.sheetState = stableState;
  lastScroll = scroller.scrollTop;
  render();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { measure(); render(); });
  }
  window.addEventListener('load', function () { measure(); render(); });

  window.Spotlight = {
    setProgress: function (p) {
      clearTimeout(settleTimer);
      cancelAnimationFrame(snapFrame);
      snapping = false;
      this.setScroll(clamp(p, 0, 1) * TRAVEL);
    },
    setScroll: function (px) {
      scroller.scrollTop = clamp(px, 0, scrollTotal);
      render();
    },
    open: function () { animateTo(TRAVEL, 0); },
    close: function () { animateTo(0, 0); },
    switchTab: switchTab,
    activeTab: function () { return activeTab; },
    state: function () { return stableState; },
    renderNow: render,
    progress: function () { return clamp(scroller.scrollTop / TRAVEL, 0, 1); },
    scrollEvents: function () { return scrollEvents; },
    metrics: function () {
      return { travel: TRAVEL, listOverflow: listOverflow, scrollTotal: scrollTotal };
    },
    openFromEntry: openSpotlight,
    dismiss: dismissSpotlight,
    openChat: openManualChat,
    openProactiveSkill: function () { openManualChat('proactive'); sendReminder('Расскажите подробнее про новый навык «Прогноз кассовых разрывов»'); },
    newRequest: newRequest,
    taskKeyboard: function (open) { keyboardVisible(open); },
    completeEventReminder: completeEventReminder,
    cancelQuestionnaire: function (mode) {
      if(activeAIThread)threadStore.update(activeAIThread,{reminder:null});
      addMessage('assistant',mode==='statement'?'Подготовка выписки отменена.':mode==='event-reminder'?'Создание напоминания отменено.':'Создание задачи отменено.',false);
      scrollChatEnd();
    },
    resumeInlineQuestionnaire: function (snapshot, keys, questions, start) {
      if (!activeAIThread || activeView !== 'chatView' || isContactChat()) return;
      var record=threadStore.get(activeAIThread), index=start;
      // Materialize only completed answers. The active answer remains an editable draft.
      for (; index<snapshot.step && snapshot.values[keys[index]]; index++) {
        var answer=snapshot.values[keys[index]];
        addMessage('user',answer,false);
        var next=snapshot.mode==='task' ? window.SpotlightRegular.clarify(record,answer) : questions[keys[index+1]][0];
        if(next)addMessage('assistant',next,snapshot.mode==='task');
      }
      chatInput.value=snapshot.values[keys[index]] || '';
      threadStore.update(activeAIThread,{questionnaire:null,draft:chatInput.value});
      updateComposer();scrollChatEnd();
    },
    completeStatementQuestionnaire: function (answers, summary) {
      if (!activeAIThread || applicationState.spotlight === 'loading') return;
      addMessage('user',summary,true);
      setLoader(true);
      var complete=answers.every(function(answer){return answer && answer.trim();});
      var reply=window.SpotlightBanking.statement(answers);
      queueAIReply(reply,complete,false);
    },
    completeTaskQuestionnaire: function (answers, keys) {
      if (!activeAIThread || applicationState.spotlight === 'loading') return;
      var record = threadStore.get(activeAIThread);
      if (!record || !record.reminder || record.reminder.phase === 'saved') return;
      if (answers.some(function(answer){return !answer || !answer.trim();})) {
        addMessage('user',window.SpotlightRegular.answerSummary(answers,keys),true);
        setLoader(true);
        queueAIReply('<h2>Черновик задачи</h2><p>Часть вопросов пропущена. Задача пока не запущена — можно вернуться к настройке.</p>',true,false);
        return;
      }
      threadStore.update(activeAIThread, {reminder:{phase:'kind',wizard:true}});
      var reply;
      answers.forEach(function(answer){reply=window.SpotlightRegular.clarify(threadStore.get(activeAIThread),answer);});
      addMessage('user', window.SpotlightRegular.answerSummary(answers,keys), true);
      setLoader(true);
      queueAIReply(reply, true, false);
    },
    createReminder: function () {
      if(window.SpotlightHubConfiguration && !window.SpotlightHubConfiguration.state.tasks)return;
      openHelp('Создать задачу', window.SpotlightRegular.question(), 'regular');
      threadStore.update(activeAIThread, {reminder:{phase:'kind',wizard:true}});
      applicationState.spotlightOrigin.state = 'main';
    },
    canRunTask: function () { return window.SpotlightRegular.canRun(threadStore?.get(activeAIThread)); },
    runTask: function () {
      var record=threadStore?.get(activeAIThread);
      var result=window.SpotlightRegular.startRun(record);
      if (!result) return;
      addMessage('user','Выполнить сейчас');setLoader(true);queueAIReply(result,true,false);
      keyboardVisible(false);chatInput.blur();syncAIChrome();
    },
    callOperator: callOperator,
    deleteRequest: deleteRequest,
    isRegularRequest: function () { var record=threadStore?.get(activeAIThread);return !!(record && (record.type === 'regular' || record.reminder || record.taskRun)); },
    configureReminder: function () { var record = threadStore && threadStore.get(activeAIThread); if (record) window.SpotlightRegular.configure(record); },
    openSavedThread: openSavedThread,
    openNotifications: openNotifications,
    openNotification: openNotificationDetail,
    openHelp: openHelp,
    openThreads: openAllThreads,
    openContact: openContactChat,
    openDirectory: openDirectory,
    composeOrigin: function () { return composeOrigin; },
    transition: function () { return applicationState.transition || { type: null, phase: 'idle' }; },
    navState: function () { var s = navState(activeView); return { threads: s.threads, kebab: s.kebab, input: hasGlobalInput(activeView) }; },
    currentThread: function () { return activeAIThread; },
    appState: function () { return JSON.parse(JSON.stringify(applicationState)); },
    activeView: function () { return activeView; }
  };
  dismissSpotlight();
  // Explicit local visual QA entry points; ordinary navigation is unchanged.
  if(q.get('qa') === '1' && q.has('screen')) {
    openSpotlight();
    var qaScreen=q.get('screen');
    if(['events','event','longtap'].indexOf(qaScreen)>=0)switchTab('events');
    if(qaScreen==='event')openNotificationDetail();
    if(qaScreen==='newthread')openManualChat();
    if(qaScreen==='managers')openDirectory('managers');
    if(qaScreen==='longtap')showEventContext(document.querySelector('.chip[data-long-press]'));
    if(qaScreen==='scroll'){stableState='open';scroller.scrollTop=TRAVEL;lastScroll=TRAVEL;render();}
    if(qaScreen==='threads')openAllThreads();
    if(qaScreen==='eventslist'){switchTab('events');openNotifications();}
    if(qaScreen==='support')openContactChat('support');
    if(qaScreen==='manager'){openDirectory('managers');openDirectory('profile',true);}
    if(qaScreen==='thread'){switchTab('events');openNotificationDetail();openHelp();}
  }
})();
