(function () {
  'use strict';
  var stage = document.getElementById('stage');
  if (!stage) return;
  var base = new URL('.', document.currentScript.src);
  var overlay = document.createElement('div');
  overlay.className = 'hub-call-overlay';
  overlay.hidden = true;
  overlay.innerHTML = '<section class="hub-call-sheet" role="dialog" aria-modal="true" aria-labelledby="hubCallTitle">' +
    '<header><h2 id="hubCallTitle">Звонок в Банк</h2><button class="hub-call-close" type="button" aria-label="Закрыть звонок"><img src="' + new URL('assets/icons/cross.svg', base) + '" alt=""></button></header>' +
    '<div class="hub-call-options"><a class="hub-call-row" href="tel:+74957555858"><span class="hub-call-icon"><img src="' + new URL('assets/figma/v2/phone.svg', base) + '" alt=""></span><span>Для Москвы и области<small>+7 (495) 755-58-58</small></span></a>' +
    '<a class="hub-call-row" href="tel:88001007733"><span class="hub-call-icon"><img src="' + new URL('assets/figma/v2/phone.svg', base) + '" alt=""></span><span>Для регионов России<small>8 (800) 100-77-33</small></span></a></div></section>';
  stage.appendChild(overlay);
  var closeButton = overlay.querySelector('button');
  var sheet = overlay.querySelector('.hub-call-sheet');
  var drag = null;
  var trigger, background = [], closing = false;
  function open(button) {
    if (!overlay.hidden) return;
    trigger = button;
    background = Array.from(stage.children).filter(function (el) { return el !== overlay; }).map(function (el) {
      var wasInert = el.inert;
      el.inert = true;
      return [el, wasInert];
    });
    overlay.hidden = false;
    closeButton.focus({ preventScroll: true });
  }
  function close() {
    if (overlay.hidden || closing) return;
    closing = true;
    overlay.classList.add('is-closing');
    setTimeout(function () {
      overlay.hidden = true;
      overlay.classList.remove('is-closing');
      sheet.style.removeProperty('transform');
      sheet.classList.remove('is-dragging');
      background.forEach(function (item) { item[0].inert = item[1]; });
      if (trigger && trigger.isConnected) trigger.focus({ preventScroll: true });
      closing = false;
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 280);
  }
  document.addEventListener('click', function (event) {
    var button = event.target.closest('[data-open-call]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    open(button);
  }, true);
  closeButton.addEventListener('click', close);
  overlay.addEventListener('click', function (event) { if (event.target === overlay) close(); });
  // Only the header/grabber drags; long option labels retain native scrolling.
  sheet.addEventListener('pointerdown', function (event) {
    if (event.button !== 0 || closing || event.target.closest('button,a') || !event.target.closest('header,.hub-call-grabber')) return;
    drag = { id:event.pointerId, y:event.clientY, distance:0, scale:sheet.getBoundingClientRect().width / sheet.offsetWidth };
    sheet.setPointerCapture(event.pointerId);
    sheet.classList.add('is-dragging');
  });
  sheet.addEventListener('pointermove', function (event) {
    if (!drag || event.pointerId !== drag.id) return;
    drag.distance = Math.max(0, (event.clientY - drag.y) / drag.scale);
    sheet.style.transform = 'translateY(' + drag.distance + 'px)';
  });
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    var dismiss = event.type === 'pointerup' && drag.distance > 64;
    drag = null;
    sheet.classList.remove('is-dragging');
    if (dismiss) close();
    else sheet.style.removeProperty('transform');
  }
  sheet.addEventListener('pointerup', finishDrag);
  sheet.addEventListener('pointercancel', finishDrag);
  overlay.addEventListener('touchmove', function (event) {
    if (!event.target.closest('.hub-call-options')) event.preventDefault();
  }, { passive:false });
  overlay.addEventListener('wheel', function (event) {
    if (!event.target.closest('.hub-call-options')) event.preventDefault();
  }, { passive:false });
  document.addEventListener('keydown', function (event) {
    if (overlay.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); }
    if (event.key === 'Tab') {
      var items = Array.from(overlay.querySelectorAll('button,a'));
      var current = items.indexOf(document.activeElement);
      if ((event.shiftKey && current <= 0) || (!event.shiftKey && current === items.length - 1)) {
        event.preventDefault();
        items[event.shiftKey ? items.length - 1 : 0].focus();
      }
    }
  }, true);
})();
