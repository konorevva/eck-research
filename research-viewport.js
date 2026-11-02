/* Size layout boxes to the visible viewport; never subtract the keyboard twice. */
(() => {
  const root = document.documentElement;
  let frame = 0;
  function viewport() {
    frame = 0;
    const vv = window.visualViewport;
    // Pinch zoom changes the visual viewport too, but must not reflow the app.
    if (vv && Math.abs(vv.scale - 1) > 0.01) return;
    const visibleHeight = vv?.height || innerHeight;
    const custom = window.SpotlightResearch?.keyboard;
    const keyboardHeight = custom?.height || 0;
    const height = Math.max(1, visibleHeight - keyboardHeight);
    const offset = vv?.offsetTop || 0;
    const focused = document.activeElement?.matches('input,textarea,[contenteditable="true"]');
    const keyboard = !!custom?.isOpen || (!!focused && innerHeight - visibleHeight - offset > 120);
    root.dataset.researchKeyboard = String(keyboard);
    root.style.setProperty('--research-height', height + 'px');
    root.style.setProperty('--research-visible-height', visibleHeight + 'px');
    root.style.setProperty('--research-keyboard-height', keyboardHeight + 'px');
    root.style.setProperty('--research-offset', offset + 'px');
    // Runtime remeasures sheets and the composer after CSS dimensions update.
    window.dispatchEvent(new Event('resize'));
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(viewport);
  }
  window.visualViewport?.addEventListener('resize', schedule);
  window.visualViewport?.addEventListener('scroll', schedule);
  window.addEventListener('orientationchange', schedule);
  window.addEventListener('resize', () => {
    // Ignore the synthetic runtime resize dispatched by viewport() below.
    if ((window.visualViewport?.height || innerHeight) !== parseFloat(root.style.getPropertyValue('--research-visible-height'))) schedule();
  });
  window.addEventListener('research-keyboard-change', schedule);
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  viewport();
})();
