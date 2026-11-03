/* Native banking pages slide as a whole, including their navbar and composer. */
(() => {
  if (!window.SpotlightHubConfiguration) return;
  const stage=document.getElementById('stage');
  const shell=document.getElementById('spotlightShell');
  // Keep the sheet's silhouette fixed while its pages move underneath it.
  // This also keeps the system home indicator above both moving pages.
  const viewport=document.createElement('div');
  viewport.className='hub-sheet-viewport';
  shell.before(viewport);viewport.append(shell);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let moving=false;
  const controls='[data-contact-chat],[data-open-managers],[data-open-chats],[data-open-letters],.hub-reminder-action,[data-overview-event],[data-open-payment-detail],[data-manager-profile],#chatView .flow-header h1,#directoryBack,#chatBack,#notificationBack,#notificationsBack,#firstNotification';
  function route(){
    const page=stage.querySelector('.flow-view.is-active');
    if(!page)return {key:'main',native:false};
    const mode=page.dataset.mode || '';
    const contact=page.id==='chatView' && page.classList.contains('is-contact');
    return {key:page.id+':'+mode+':'+contact,native:contact || page.id==='notificationView' || page.id==='notificationsView' || (page.id==='directoryView' && mode!=='threads')};
  }
  // Freeze the outgoing presentation before the route mutates a reused page.
  // No IDs, classes or data attributes: observers cannot mistake it for live UI.
  function snapshot(){
    const scrolls=[],bounds=stage.getBoundingClientRect();
    const styles=style=>Array.from(style,key=>key+':'+style.getPropertyValue(key)+';').join('');
    function copy(node){
      if(node.nodeType===3)return document.createTextNode(node.textContent);
      if(node.nodeType!==1 || /^(SCRIPT|STYLE)$/.test(node.tagName))return null;
      const style=getComputedStyle(node);
      if(style.display==='none')return null;
      const clone=node.cloneNode(false);
      for(const a of [...clone.attributes])if(/^(id|class|name|style|on.*|data-.*|aria-.*)$/.test(a.name))clone.removeAttribute(a.name);
      clone.style.cssText=styles(style);
      clone.style.animation='none';clone.style.transition='none';
      if('value' in node)clone.value=node.value;
      if(node.scrollTop || node.scrollLeft)scrolls.push([clone,node.scrollTop,node.scrollLeft]);
      // Keep offscreen boxes for layout, but do not freeze hundreds of clipped rows.
      const rect=node.getBoundingClientRect();
      const painted=style.visibility!=='hidden' && Number(style.opacity)>0 && rect.bottom>bounds.top && rect.top<bounds.bottom && rect.right>bounds.left && rect.left<bounds.right;
      if(!painted)return clone;
      for(const child of node.childNodes){const c=copy(child);if(c)clone.append(c);}
      for(const pseudo of ['::before','::after']){
        const ps=getComputedStyle(node,pseudo);
        if(ps.content==='none' || ps.content==='normal' || ps.display==='none')continue;
        const layer=document.createElement('span');
        layer.style.cssText=styles(ps);
        layer.style.animation='none';layer.style.transition='none';
        if(/^".*"$/.test(ps.content))layer.textContent=ps.content.slice(1,-1);
        if(pseudo==='::before')clone.prepend(layer);else clone.append(layer);
      }
      return clone;
    }
    const ghost=copy(shell);ghost.className='hub-native-snapshot';ghost.inert=true;ghost.setAttribute('aria-hidden','true');
    Object.assign(ghost.style,{position:'absolute',inset:'0',margin:'0',width:'100%',height:'100%',transform:'none',translate:'none',pointerEvents:'none',zIndex:'401'});
    // Both screens must share a stacking context. A stage-level ghost covers
    // the shell inside the sticky viewport regardless of the shell z-index.
    shell.parentElement.append(ghost);
    for(const [node,top,left] of scrolls){node.scrollTop=top;node.scrollLeft=left;}
    return ghost;
  }
  document.addEventListener('click',event=>{
    const control=event.target.closest(controls);
    if(!control || moving || reduce.matches || !stage.classList.contains('is-spotlight'))return;
    const from=route(),back=control.matches('#directoryBack,#chatBack,#notificationBack,#notificationsBack');
    if(back && !from.native)return;
    if(control.matches('#chatView .flow-header h1') && !from.native)return;
    const ghost=snapshot();
    requestAnimationFrame(()=>{
      const to=route();
      if(from.key===to.key || (!from.native && !to.native)){ghost.remove();return;}
      moving=true;stage.classList.add('is-native-slide');
      const timing={duration:380,easing:'cubic-bezier(.32,.72,0,1)',fill:'both'};
      const oldZ=shell.style.zIndex;shell.style.zIndex=back?'400':'402';
      const animations=[
        shell.animate([{translate:back?'-24% 0':'100% 0'},{translate:'0 0'}],timing),
        ghost.animate([{translate:'0 0'},{translate:back?'100% 0':'-24% 0'}],timing)
      ];
      Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>{
        ghost.remove();animations.forEach(a=>a.cancel());shell.style.zIndex=oldZ;
        stage.classList.remove('is-native-slide');moving=false;
      });
    });
  },true);
})();
