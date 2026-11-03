(function () {
  'use strict';
  if (!window.SpotlightHubConfiguration || !window.Spotlight) return;

  var app = window.Spotlight;
  var stage = document.getElementById('stage');
  var chat = document.getElementById('chatView');
  var header = chat.querySelector('.flow-header');
  var base = new URL('.', document.currentScript.src);
  var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  var trigger = header.querySelector('.nav-kebab');
  if (!trigger) {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'flow-control';
    trigger.innerHTML = '<img src="' + new URL('assets/figma/v3/kebab.svg', base) + '" alt="">';
    header.insertBefore(trigger, document.getElementById('chatClose'));
  }
  trigger.classList.add('hub-more-trigger');
  trigger.setAttribute('aria-label', 'Ещё');
  trigger.setAttribute('aria-haspopup', 'menu');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'hubMoreMenu');
  var chatTrigger = trigger;
  var directory = document.getElementById('directoryView');
  var directoryTrigger = trigger.cloneNode(true);
  directoryTrigger.className = 'flow-control hub-more-trigger';
  directoryTrigger.removeAttribute('data-nav');
  // Each page keeps its control throughout incoming/outgoing navigation animations.
  // CSS follows the page's own mode; the page controls visibility and interactivity.
  chatTrigger.hidden = false;
  directoryTrigger.hidden = false;
  directory.querySelector('.native-header').insertBefore(directoryTrigger, document.getElementById('directoryClose'));
  var openContext = null;


  var overlay = document.createElement('div');
  overlay.className = 'hub-more-overlay';
  overlay.hidden = true;
  overlay.innerHTML = '<div class="hub-more-glass">' +
    '<img class="hub-more-origin" src="' + new URL('assets/figma/v3/kebab.svg', base) + '" alt="">' +
    '<div class="hub-more-items" id="hubMoreMenu" role="menu" aria-label="Действия с чатом">' +
    '<button type="button" role="menuitem" tabindex="-1" aria-disabled="true"><img src="' + new URL('assets/figma/v2/crown.svg', base) + '" alt=""><span>Альфа-Интеллект Pro</span></button>' +
    '<div class="hub-more-separator" role="separator"></div>' +
    '<button type="button" role="menuitem" tabindex="-1" data-request-action="new"><img src="' + new URL('assets/figma/v3/compose.svg', base) + '" alt=""><span>Новый диалог</span></button>' +
    '<button type="button" role="menuitem" tabindex="-1" data-request-action="reminder"><img src="' + new URL('assets/figma/mvp/clock-alarm.svg', base) + '" alt=""><span>Новая задача</span></button>' +
    '<button type="button" role="menuitem" tabindex="-1" data-request-action="history"><img src="' + window.SpotlightHubConfiguration.historyIcon + '" alt=""><span>Чаты</span></button>' +
    '<div class="hub-more-separator hub-delete-separator" role="separator" hidden></div>' +
    '<button type="button" role="menuitem" tabindex="-1" data-request-action="run" hidden><img src="' + new URL('assets/icons/play.svg', base) + '" alt=""><span>Выполнить сейчас</span></button>' +
    '<button type="button" role="menuitem" tabindex="-1" data-request-action="operator"><img src="' + new URL('assets/icons/headphones.svg', base) + '" alt=""><span>Позвать оператора</span></button>' +
    '<button type="button" role="menuitem" tabindex="-1" data-request-action="delete" hidden><img src="' + new URL('assets/figma/mvp/trash.svg', base) + '" alt=""><span>Удалить чат</span></button>' +
    '</div></div>';
  stage.appendChild(overlay);
  var glass = overlay.querySelector('.hub-more-glass');
  var content = overlay.querySelector('.hub-more-items');
  var originIcon = overlay.querySelector('.hub-more-origin');
  var items = Array.from(content.querySelectorAll('[role="menuitem"]'));
  var phase = 'closed';
  var pendingAction = null;
  var animations = [];
  var revision = 0;
  var previousFocus = null;
  var anchor = null;

  function context() {
    if (app.appState().spotlight === 'closed') return null;
    if (app.activeView() === 'directoryView' && directory.dataset.mode === 'threads') return 'list';
    if (app.activeView() === 'chatView' && !chat.classList.contains('is-contact')) return app.appState().threadStatus === 'active' ? 'thread' : 'compose';
    return null;
  }
  function eligible() { return !!context(); }
  function visibleItems() { return items.filter(function (item) { return !item.hidden; }); }
  function updateItems() {
    var current = context();
    content.querySelector('[data-request-action="history"] img').src = window.SpotlightHubConfiguration.historyIcon;
    content.setAttribute('aria-label', window.SpotlightHubConfiguration.state.preset === 'mvp' ? 'Действия с запросом' : 'Действия с диалогом');
    content.querySelector('[data-request-action="history"] span').textContent = !window.SpotlightHubConfiguration.state.requestsOnly ? 'Обзор' : window.SpotlightHubConfiguration.state.preset === 'mvp' ? 'Запросы' : 'Диалоги';
    content.querySelector('[data-request-action="new"] span').textContent = window.SpotlightHubConfiguration.state.preset === 'mvp' ? 'Новый диалог' : 'Новый диалог';
    var regular = current === 'thread' && app.isRegularRequest();
    var run=content.querySelector('[data-request-action="run"]');
    run.hidden=!regular;run.disabled=!app.canRunTask();
    content.querySelector('[data-request-action="operator"]').hidden = current !== 'thread' || !window.SpotlightHubConfiguration.state.operatorInThread;
    content.querySelector('[data-request-action="reminder"]').hidden = !window.SpotlightHubConfiguration.state.tasks;
    content.querySelector('[data-request-action="delete"] span').textContent = regular ? 'Удалить задачу' : window.SpotlightHubConfiguration.state.preset === 'mvp' ? 'Удалить запрос' : 'Удалить диалог';
    content.querySelector('[data-request-action="new"]').hidden = current === 'compose';
    content.querySelector('[data-request-action="history"]').hidden = current === 'list';
    content.querySelector('[data-request-action="delete"]').hidden = current !== 'thread';
    content.querySelector('.hub-delete-separator').hidden = current !== 'thread';
  }
  function cancelAnimations() {
    animations.forEach(function (animation) { animation.cancel(); });
    animations = [];
  }
  function frame(rect, radius) {
    return {left:rect.left+'px', top:rect.top+'px', width:rect.width+'px', height:rect.height+'px', borderRadius:radius+'px'};
  }
  function currentFrame() {
    var style = getComputedStyle(glass);
    return {left:style.left, top:style.top, width:style.width, height:style.height, borderRadius:style.borderRadius};
  }
  function finishClose(restoreFocus) {
    cancelAnimations();
    overlay.hidden = true;
    trigger.classList.remove('is-menu-source');
    trigger.setAttribute('aria-expanded', 'false');
    phase = 'closed';
    // A resize or view refresh can interrupt the closing animation. The user's
    // selected action still runs exactly once, independently of that animation.
    var action=pendingAction;pendingAction=null;
    if(action)action();
    if (restoreFocus && eligible()) {
      var destination = previousFocus && previousFocus.isConnected ? previousFocus : trigger;
      destination.focus({preventScroll:true});
    }
  }
  function closeImmediately() {
    revision++;
    finishClose(false);
  }
  function close(restoreFocus, action) {
    if (phase === 'closed' || phase === 'closing') return;
    pendingAction=action || null;
    var from = currentFrame();
    var opacity = getComputedStyle(content).opacity;
    cancelAnimations();
    phase = 'closing';
    content.inert = true;
    var token = ++revision;
    var finish = function () {
      if (token !== revision) return;
      finishClose(restoreFocus);
    };
    if (reducedMotion.matches) { finish(); return; }
    animations = [
      glass.animate([from, frame(anchor, anchor.width/2)], {duration:220, easing:'cubic-bezier(.32,.72,0,1)', fill:'forwards'}),
      content.animate([{opacity:opacity}, {opacity:0, offset:.45}, {opacity:0}], {duration:220, fill:'forwards'}),
      originIcon.animate([{opacity:0}, {opacity:0, offset:.3}, {opacity:1}], {duration:220, fill:'forwards'})
    ];
    animations[0].finished.then(finish).catch(function () {});
  }
  function focusItem(index) {
    var visible = visibleItems();
    visible[(index + visible.length) % visible.length].focus({preventScroll:true});
  }
  function open(keyboard) {
    if (!eligible() || phase !== 'closed') return;
    updateItems();
    openContext = context();
    previousFocus = document.activeElement;
    var stageRect = stage.getBoundingClientRect();
    var source = trigger.getBoundingClientRect();
    var scale = stageRect.width / stage.offsetWidth;
    anchor = {left:(source.left-stageRect.left)/scale, top:(source.top-stageRect.top)/scale, width:source.width/scale, height:source.height/scale};
    var width = Math.min(288, stage.offsetWidth-24);
    content.style.width = (width-2)+'px';
    overlay.hidden = false;
    content.inert = false;
    var target = {left:Math.max(12, anchor.left+anchor.width-width), top:anchor.top, width:width, height:content.offsetHeight+2};
    target.top = Math.min(target.top, stage.offsetHeight-target.height-12);
    Object.assign(glass.style, frame(target, 28));
    phase = 'open';
    trigger.classList.add('is-menu-source');
    trigger.setAttribute('aria-expanded', 'true');
    // Preserve input focus for touch/pointer opening so a native keyboard stays in place.
    // Keyboard/assistive activation instead enters the menu's arrow-key navigation.
    if (keyboard) focusItem(0);
    var token = ++revision;
    if (reducedMotion.matches) return;
    animations = [
      glass.animate([frame(anchor, anchor.width/2), frame(target, 28)], {duration:360, easing:'cubic-bezier(.22,.8,.22,1)', fill:'both'}),
      content.animate([{opacity:0}, {opacity:0, offset:.15}, {opacity:1}], {duration:280, fill:'both'}),
      originIcon.animate([{opacity:1}, {opacity:0}], {duration:120, fill:'both'})
    ];
    animations[0].finished.then(function () { if(token === revision) cancelAnimations(); }).catch(function () {});
  }
  function sync() {
    var current = context();
    if (phase !== 'closed' && current !== openContext) closeImmediately();
    var history = header.querySelector('.hub-history, .nav-threads');
    if (history) history.hidden = !chat.classList.contains('is-contact');
    if (phase === 'closed') trigger = current === 'list' ? directoryTrigger : chatTrigger;
    updateItems();
  }

  [chatTrigger, directoryTrigger].forEach(function (button) {
    button.addEventListener('pointerdown', function (event) { event.preventDefault(); });
    button.addEventListener('click', function (event) {
      event.stopPropagation();
      trigger = button;
      if (phase === 'closed') open(event.detail === 0);
      else close(true);
    });
  });
  overlay.addEventListener('pointerdown', function (event) { event.preventDefault(); });
  overlay.addEventListener('click', function (event) {
    var item = event.target.closest('[data-request-action]');
    if (item) {
      var actions = {run:app.runTask,operator:app.callOperator, new:app.newRequest, history:app.openThreads, delete:app.deleteRequest, reminder:app.createReminder};
      close(false, actions[item.dataset.requestAction]);
    } else if (event.target === overlay) close(true);
  });
  window.addEventListener('keydown', function (event) {
    if (phase === 'closed') return;
    var visible = visibleItems();
    var index = visible.indexOf(document.activeElement);
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault(); event.stopImmediatePropagation(); close(true);
    } else if (['ArrowDown','ArrowUp','Home','End'].indexOf(event.key) !== -1) {
      event.preventDefault(); event.stopImmediatePropagation();
      focusItem(event.key === 'Home' ? 0 : event.key === 'End' ? visible.length-1 : index < 0 ? 0 : index + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); event.stopImmediatePropagation();
      if (index >= 0) visible[index].click();
      else focusItem(0);
    } else if (document.activeElement === previousFocus && event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
    }
  }, true);
  window.addEventListener('resize', closeImmediately);
  window.SpotlightMoreMenu = {sync:sync, isOpen:function(){return phase !== 'closed';}, closeImmediately:closeImmediately};
  sync();
})();
