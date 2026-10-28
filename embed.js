/* Put dashboard content in a scrollable region; bottom controls stay anchored. */
(()=>{
 const entry=document.querySelector('#entryPoint');
 const content=document.createElement('div');content.className='entry-scroll';content.tabIndex=0;content.setAttribute('aria-label','Прокрутка главной');
 for(const child of [...entry.children]){
  if(child.matches('.entry-tabbar,.entry-spotlight,.boss-tabbar'))continue;
  if(child.matches('.boss-dashboard-image')){const crop=document.createElement('div');crop.className='boss-image-crop';crop.append(child);content.append(crop)}else content.append(child);
 }
 entry.prepend(content);
})();
