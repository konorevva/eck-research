/* Feedback assets extracted from Sptl.fig, 133:691/711/714. */
(function () {
  'use strict';
  var base = new URL('.', document.currentScript.src);
  var icons = {
    'thumb-up': 'assets/figma/feedback/thumb-up.svg',
    'thumb-down': 'assets/figma/feedback/thumb-down.svg',
    'copy': 'assets/figma/feedback/copy.svg'
  };
  var messages = document.getElementById('chatMessages');
  var toast = document.createElement('div');
  toast.className = 'hub-feedback-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.getElementById('stage').appendChild(toast);
  var hideTimer, navigationVersion=0;
  window.addEventListener('spotlight-hub:navigation',function(){navigationVersion++;});
  function hide(){clearTimeout(hideTimer);toast.classList.remove('is-visible');}
  toast.addEventListener('click',hide);
  window.addEventListener('spotlight-hub:navigation',hide);
  function notify(text) {
    clearTimeout(hideTimer);
    toast.textContent = text;
    toast.classList.add('is-visible');
    window.SpotlightDialogControls?.update();
    hideTimer = setTimeout(hide, 5000);
  }
  window.addEventListener('spotlight-hub:toast',function(event){notify(event.detail);});
  function sync() {
    messages.querySelectorAll('.chat-message.assistant:not(.is-loading)').forEach(function (answer) {
      var followups = answer.querySelector('.detail-actions,.hub-insight-prompts');
      if (!followups || !followups.querySelector('button') || answer.querySelector('.hub-answer-feedback')) return;
      var row = document.createElement('div');
      row.className = 'hub-answer-feedback';
      row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Оценка ответа');
      [['thumb-up','Полезный ответ'],['thumb-down','Неполезный ответ'],['copy','Копировать ответ']].forEach(function (item) {
        var button = document.createElement('button');
        button.type = 'button'; button.dataset.feedback = item[0]; button.setAttribute('aria-label',item[1]);
        if (item[0] !== 'copy') button.setAttribute('aria-pressed','false');
        var icon = document.createElement('img'); icon.alt = ''; icon.src = new URL(icons[item[0]],base).href;
        button.appendChild(icon); row.appendChild(button);
      });
      followups.before(row);
    });
  }
  messages.addEventListener('click', async function (event) {
    var button = event.target.closest('[data-feedback]');
    if (!button) return;
    var row = button.closest('.hub-answer-feedback');
    if (button.dataset.feedback === 'copy') {
      var requestVersion=navigationVersion;
      var copy = button.closest('.chat-message').cloneNode(true);
      copy.querySelectorAll('.hub-answer-feedback,.detail-actions,.hub-insight-prompts').forEach(function (node) { node.remove(); });
      try {
        // Preserve paragraph and list breaks without copying action labels.
        copy.querySelectorAll('p,h1,h2,h3,li').forEach(function (node) { node.appendChild(document.createTextNode('\n\n')); });
        await navigator.clipboard.writeText(copy.textContent.trim());
        if(requestVersion===navigationVersion)notify('Ответ скопирован');
      } catch (_) { if(requestVersion===navigationVersion)notify('Не удалось скопировать ответ'); }
    } else {
      var selected = button.getAttribute('aria-pressed') !== 'true';
      row.querySelectorAll('[aria-pressed]').forEach(function (node) { node.setAttribute('aria-pressed',String(node === button && selected)); });
      if (selected) notify('Спасибо за оценку!');
    }
  });
  new MutationObserver(sync).observe(messages,{childList:true,subtree:true});
  sync();
})();
