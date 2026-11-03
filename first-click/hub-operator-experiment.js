/* Navigation labels follow the chosen layout, independently of support mode. */
(function(){
  if(!window.SpotlightHubConfiguration)return;
  function updateLabels(){
    var combined=!window.SpotlightHubConfiguration.state.requestsOnly;
    document.querySelectorAll('[data-nav="threads"],.hub-history').forEach(function(button){button.setAttribute('aria-label',combined?'Обзор':window.SpotlightHubConfiguration.state.preset==='mvp'?'Все запросы':'Все диалоги');var icon=button.querySelector('img');if(icon)icon.src=window.SpotlightHubConfiguration.historyIcon;});
    document.querySelectorAll('[data-nav="kebab"]').forEach(function(button){button.setAttribute('aria-label',window.SpotlightHubConfiguration.state.preset==='mvp'?'Действия с запросом':'Действия с диалогом');});
    var directory=document.getElementById('directoryView');
    if(directory.dataset.mode==='threads')document.getElementById('directoryTitle').textContent=combined?'Обзор':window.SpotlightHubConfiguration.state.preset==='mvp'?'Запросы':'Диалоги';
  }
  window.addEventListener('spotlight-hub:configuration-applied',updateLabels);updateLabels();
})();
