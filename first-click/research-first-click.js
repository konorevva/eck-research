/* Fixed build contract. Future variants get explicit entries; URL cannot switch them. */
(() => {
  const id = document.currentScript.dataset.variant || 'icon-1_threads-1';
  const variants = {};
  for (const icon of [1, 2, 3]) {
    for (const threads of [1, 2]) {
      const key = `icon-${icon}_threads-${threads}`;
      variants[key] = {id:key, preset:'mvp', threads,
        configuration:Object.freeze({}), unifiedTabbar:icon !== 2,
        entryLabel:icon === 3 ? 'АИ' : undefined,
        historyLabel:'Диалоги'};
    }
  }
  window.SpotlightResearchVariant = Object.freeze(variants[id] || variants['icon-1_threads-1']);
  document.addEventListener('DOMContentLoaded', () => {
    if (window.SpotlightResearch.start === 'center') document.getElementById('entrySpotlight').click();
  }, {once:true});
})();
