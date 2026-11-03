/* Shared Focus / Spotlight ambient light (promoted from the 29 September light experiment).
   One decorative layer per surface, one shared random drift. Presentation only:
   it observes the prototype state and never changes navigation. */
(function () {
  'use strict';
  var stage = document.getElementById('stage');
  // V3: Focus :: Threads («Запросы») joins the same AI space (Figma 64:8816).
  var directory = document.getElementById('directoryView');
  var hosts = [document.querySelector('#mainLayer > .modal'), document.getElementById('chatView'), directory];
  var lights = hosts.map(function (host) {
    var layer = document.createElement('div');
    layer.className = 'focus-ambient';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div class="focus-ambient-scene"><div class="focus-ambient-light"></div></div>';
    host.insertBefore(layer, host.firstChild);
    return layer.querySelector('.focus-ambient-light');
  });
  var movingLights = window.SpotlightHubConfiguration ? lights.slice(0, 1) : lights;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var motions = [];
  // Normalized drift: direction (-1/0/1) plus a 0–1 random reach per axis.
  var position = { dx: 0, dy: 0, rx: 0, ry: 0, angle: 60 };
  var destinations = [];
  var running = false;
  var SCENE_SCALE = .65946;
  // Focus: glowBounds = upper Focus zone (original pixel ranges, unchanged).
  // Dialog: glowBounds = full dialog surface, measured from the host itself.
  function bounds(index) {
    // Focus and Threads: glowBounds = upper AI zone (Threads uses the Focus «Gradi» frame).
    if (index === 0 || hosts[index] === directory) return { x: [85, 55], y: [105, 70] };
    var height = hosts[index].offsetHeight || 792;
    return { x: [85, 55], y: [height * .16 / SCENE_SCALE, height * .2 / SCENE_SCALE] };
  }
  function transform(point, index) {
    var range = bounds(index);
    var x = point.dx * (range.x[0] + point.rx * range.x[1]);
    var y = point.dy * (range.y[0] + point.ry * range.y[1]);
    return 'translate(-50%, -50%) translate3d(' + x + 'px,' + y + 'px,0) rotate(' + point.angle + 'deg)';
  }
  function cancelMotion() {
    motions.forEach(function (animation) { animation.cancel(); });
    motions = [];
  }
  function drift() {
    // Visit all four regions in a freshly shuffled order, never the same loop.
    if (!destinations.length) {
      destinations = [[-1,-1],[1,-1],[-1,1],[1,1]];
      for (var i = destinations.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var swap = destinations[i]; destinations[i] = destinations[j]; destinations[j] = swap;
      }
    }
    var direction = destinations.pop();
    var target = {
      dx: direction[0], dy: direction[1],
      rx: Math.random(), ry: Math.random(),
      angle: 35 + Math.random() * 50
    };
    var timing = { duration: 4200 + Math.random() * 1400, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' };
    // One shared path and timing; each surface maps it into its own bounds.
    var current = movingLights.map(function (light, index) {
      return light.animate([{ transform: transform(position, index) }, { transform: transform(target, index) }], timing);
    });
    motions = current;
    playMotions();
    current[0].finished.then(function () {
      if (motions !== current) return;
      position = target;
      movingLights.forEach(function (light, index) { light.style.transform = transform(position, index); });
      cancelMotion();
      if (running) drift();
    }).catch(function () { /* Cancellation on reduced motion is intentional. */ });
  }
  function syncDock() {
    var progress = window.Spotlight.progress();
    var t = Math.max(0, Math.min(1, (progress - .6) / .4));
    stage.style.setProperty('--ambient-dock', t * t * (3 - 2 * t));
  }
  document.getElementById('scroller').addEventListener('scroll', syncDock, { passive: true });
  // A light only renders while its surface is on screen; the dialog's resumes in step
  // with the shared drift, so there is no jump when the dialog opens.
  function surfaceActive(index) {
    if (hosts[index] === directory) return directory.classList.contains('is-active') && directory.dataset.mode === 'threads';
    return index === 0 || hosts[index].classList.contains('is-active');
  }
  function playMotions() {
    motions.forEach(function (animation, index) {
      if (!surfaceActive(index)) { animation.pause(); return; }
      if (index && animation.playState === 'paused') animation.currentTime = motions[0].currentTime;
      animation.play();
    });
  }
  function sync() {
    syncDock();
    running = stage.classList.contains('is-spotlight') && !document.hidden && !reduced.matches && (!window.SpotlightHubConfiguration || window.Spotlight.activeView() === 'main');
    if (reduced.matches) {
      cancelMotion();
      position = { dx: 0, dy: 0, rx: 0, ry: 0, angle: 60 };
      lights.forEach(function (light) { light.style.removeProperty('transform'); });
    } else if (running) {
      if (motions.length) playMotions();
      else drift();
    } else motions.forEach(function (animation) { animation.pause(); });
  }
  new MutationObserver(sync).observe(stage, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(sync).observe(hosts[1], { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(sync).observe(directory, { attributes: true, attributeFilter: ['class', 'data-mode'] });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  sync();
})();
