/* Research-only keyboard. No editable DOM element receives native focus on iOS. */
(() => {
  const research = window.SpotlightResearch;
  if (!research) return;
  const root = document.documentElement;
  const panel = document.createElement('section');
  panel.className = 'research-keyboard';
  panel.setAttribute('aria-label', 'Экранная клавиатура');
  panel.hidden = true;
  let active = null;
  let checking = 0;
  let shift = false;
  const preview = document.createElement('div');
  preview.className = 'research-input-preview';
  preview.setAttribute('aria-hidden', 'true');
  preview.hidden = true;
  document.body.append(preview);
  function refreshPreview() {
    // Render the real textarea value in its own layout box. A fixed duplicate
    // drifted away during composer transforms and viewport resize animations.
    preview.hidden = true;
  }
  const paint = () => requestAnimationFrame(refreshPreview);
  window.addEventListener('resize', paint);
  window.addEventListener('research-keyboard-change', paint);
  const editable = el => el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !['hidden','checkbox','radio','button','submit','reset','file','range','color'].includes(el.type));
  const announce = () => window.dispatchEvent(new Event('research-keyboard-change'));
  function configure(el) {
    el.readOnly = true;
    el.inputMode = 'none';
    el.tabIndex = -1;
    el.removeAttribute('autofocus');
  }
  function blur(el) {
    if (active !== el) return;
    active.classList.remove('research-input-active');
    active = null;
    panel.hidden = true;
    preview.hidden = true;
    announce();
    el.dispatchEvent(new FocusEvent('blur'));
    el.dispatchEvent(new FocusEvent('focusout', {bubbles:true}));
  }
  function focus(el) {
    if (!editable(el) || el.disabled || el.closest('[inert]')) return;
    configure(el);
    if (active === el) return;
    if (active) blur(active);
    active = el;
    el.classList.add('research-input-active');
    panel.hidden = false;
    if (el.selectionStart !== null) el.setSelectionRange(el.value.length, el.value.length);
    announce();
    // Reuse the source's focus handlers, without invoking Safari's input UI.
    el.dispatchEvent(new FocusEvent('focus'));
    el.dispatchEvent(new FocusEvent('focusin', {bubbles:true}));
    paint();
  }
  function edit(text, backward = false) {
    const el = active;
    if (!el) return;
    let start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    if (backward && start === end && start) {
      start -= Array.from(el.value.slice(0, start)).pop().length;
    }
    const inputType = backward ? 'deleteContentBackward' : 'insertText';
    if (!el.dispatchEvent(new InputEvent('beforeinput', {bubbles:true,cancelable:true,inputType,data:text}))) return;
    const value = el.value.slice(0, start) + text + el.value.slice(end);
    if (el.maxLength >= 0 && value.length > el.maxLength) return;
    el.value = value;
    if (el.selectionStart !== null) el.setSelectionRange(start + text.length, start + text.length);
    el.dispatchEvent(new InputEvent('input', {bubbles:true,inputType,data:text}));
    el.scrollTop = el.scrollHeight;
    paint();
  }
  function enter() {
    if (!active) return;
    const el = active;
    // The source owns send, validation, questionnaire progression and search.
    const proceed = el.dispatchEvent(new KeyboardEvent('keydown', {key:'Enter',code:'Enter',bubbles:true,cancelable:true}));
    if (proceed && el.form) el.form.requestSubmit();
  }
  const letters = [];
  function key(row, label, action, name, kind) {
    const button = document.createElement('button');
    button.type = 'button';
    button.tabIndex = -1;
    button.textContent = label;
    button.setAttribute('aria-label', name || label);
    if (kind) button.className = kind;
    button.addEventListener('click', action);
    row.append(button);
    return button;
  }
  for (const rowText of ['йцукенгшщзх','фывапролджэ','ячсмитьбю']) {
    const row = document.createElement('div');
    row.className = 'research-keyboard-row';
    for (const char of rowText) letters.push([key(row, char, () => edit(shift ? char.toUpperCase() : char)), char]);
    if (rowText === 'ячсмитьбю') key(row, '⌫', () => edit('', true), 'Удалить символ', 'research-keyboard-delete');
    panel.append(row);
  }
  const footer = document.createElement('div');
  footer.className = 'research-keyboard-row research-keyboard-footer';
  key(footer, '↓', () => { if (active) blur(active); }, 'Скрыть клавиатуру');
  const shiftKey = key(footer, '⇧', () => {
    shift = !shift;
    shiftKey.setAttribute('aria-pressed', String(shift));
    for (const [button, char] of letters) button.textContent = shift ? char.toUpperCase() : char;
  }, 'Заглавные буквы');
  shiftKey.setAttribute('aria-pressed', 'false');
  key(footer, ',', () => edit(','));
  key(footer, 'пробел', () => edit(' '), 'Пробел', 'research-keyboard-space');
  key(footer, '.', () => edit('.'));
  key(footer, '↑', enter, 'Ввод', 'research-keyboard-enter');
  panel.append(footer);
  document.body.append(panel);
  // Inputs created and focused synchronously by questionnaire code are covered too.
  for (const proto of [HTMLInputElement.prototype, HTMLTextAreaElement.prototype]) {
    const nativeFocus = proto.focus;
    const nativeBlur = proto.blur;
    proto.focus = function(options) { if (editable(this)) focus(this); else nativeFocus.call(this, options); };
    proto.blur = function() { if (editable(this)) blur(this); else nativeBlur.call(this); };
  }
  function scan(node) {
    if (!(node instanceof Element)) return;
    if (editable(node)) configure(node);
    node.querySelectorAll('input,textarea').forEach(el => { if (editable(el)) configure(el); });
  }
  scan(document.body);
  document.addEventListener('pointerdown', event => {
    if (panel.contains(event.target)) { event.preventDefault(); return; }
    if (editable(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      focus(event.target);
      return;
    }
    // The composer includes a logo, background and padding outside the textarea.
    // Those clicks used to toggle only the source keyboard class, not this panel.
    const composer = event.target.closest('#assistantComposer, #contactComposer, .page-input');
    if (composer && !event.target.closest('button')) {
      const input = composer.querySelector('textarea,input');
      if (input && editable(input) && !input.disabled) {
        event.preventDefault();
        event.stopImmediatePropagation();
        focus(input);
      }
    }
  }, true);
  // Prevent Safari from focusing controls via a synthesized click or tab navigation.
  document.addEventListener('click', event => { if (editable(event.target)) event.preventDefault(); }, true);
  document.addEventListener('focusin', event => {
    if (!event.isTrusted || !editable(event.target)) return;
    HTMLElement.prototype.blur.call(event.target);
    focus(event.target);
  }, true);
  document.addEventListener('keydown', event => {
    if (!event.isTrusted || !active || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Escape') { event.preventDefault(); blur(active); }
    else if (event.key === 'Backspace') { event.preventDefault(); edit('', true); }
    else if (event.key === 'Enter') { event.preventDefault(); enter(); }
    else if (event.key.length === 1) { event.preventDefault(); edit(event.key); }
  });
  const observer = new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) scan(node);
    if (!active || checking) return;
    checking = requestAnimationFrame(() => {
      checking = 0;
      if (!active) return;
      const view = active.closest('.flow-view');
      if (!active.isConnected || active.closest('[hidden],[inert],[aria-hidden="true"]') || (view && view.getAttribute('aria-hidden') === 'true')) blur(active);
    });
  });
  observer.observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['hidden','inert','aria-hidden']});
  research.keyboard = {
    get activeInput() { return active; },
    get height() { return panel.hidden ? 0 : panel.offsetHeight; },
    get isOpen() { return !panel.hidden; },
    hide() { if (active) blur(active); }
  };
  root.dataset.researchCustomKeyboard = 'true';
  // The dashboard is a static backdrop, not a scrollable banking screen.
  const dashboard = document.getElementById('entryPoint');
  dashboard?.addEventListener('pointerdown', event => event.stopPropagation());
  dashboard?.addEventListener('wheel', event => event.preventDefault(), {passive:false});
  const dashboardScroll = dashboard?.querySelector('.entry-scroll');
  if (dashboardScroll) {
    dashboardScroll.tabIndex = -1;
    dashboardScroll.removeAttribute('aria-label');
    dashboardScroll.scrollTop = 0;
  }
  announce();
})();
