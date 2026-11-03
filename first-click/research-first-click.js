/* Fixed build contract. Future variants get explicit entries; URL cannot switch them. */
(() => {
  const id = document.currentScript.dataset.variant || 'icon-1_threads-1';
  const variants = {
    'icon-1_threads-2': {id:'icon-1_threads-2', preset:'mvp', threads:2, configuration:Object.freeze({})},
    'icon-2_threads-2': {id:'icon-2_threads-2', preset:'mvp', threads:2, configuration:Object.freeze({}), unifiedTabbar:false},
    'icon-1_threads-1': {id: 'icon-1_threads-1', preset: 'mvp', configuration: Object.freeze({})},
    'icon-2_threads-1': {id: 'icon-2_threads-1', preset: 'mvp', configuration: Object.freeze({}), unifiedTabbar: false}
  };
  window.SpotlightResearchVariant = Object.freeze(variants[id] || variants['icon-1_threads-1']);
  document.addEventListener('DOMContentLoaded', () => {
    if (window.SpotlightResearch.start === 'center') document.getElementById('entrySpotlight').click();
  }, {once:true});
})();
