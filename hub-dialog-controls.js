/* Bottom controls follow only a docked composer, including above the keyboard. */
(() => {
  if (!window.SpotlightHubConfiguration) return;
  const stage=document.getElementById('stage');
  const chat=document.getElementById('chatView');
  const scroll=document.getElementById('chatScroll');
  const jump=document.createElement('button');
  jump.type='button';jump.className='hub-jump-latest';jump.setAttribute('aria-label','К последним сообщениям');jump.hidden=true;
  const jumpIcon=document.createElement('img');
  jumpIcon.src=document.querySelector('#chatSend img').getAttribute('src');
  jumpIcon.alt='';jumpIcon.draggable=false;
  jump.append(jumpIcon);
  stage.append(jump);
  jump.addEventListener('click',()=>scroll.scrollTo({top:scroll.scrollHeight,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
  function visible(node){
    if(!node || !node.getClientRects().length)return null;
    for(let parent=node;parent && parent!==stage;parent=parent.parentElement){
      const style=getComputedStyle(parent);
      if(parent.hidden || style.visibility==='hidden' || style.display==='none' || Number(style.opacity)===0)return null;
    }
    return node;
  }
  function composer(){
    if(chat.classList.contains('is-active'))return visible(document.getElementById(chat.classList.contains('is-contact')?'contactComposer':'assistantComposer'));
    const page=document.querySelector('.flow-view.is-active');
    // An input on the hidden home screen must not anchor a toast on another page.
    if(page)return visible(page.querySelector('.page-input-dock:not([hidden]) .page-input,.hub-request-input'));
    // Home starts with an inline input below the chips. It becomes a toast anchor
    // only once scrolling has docked it at the bottom; dashboard search never is one.
    if(stage.classList.contains('is-entry') || !stage.classList.contains('is-overview-input-dock') || window.Spotlight.progress()<1)return null;
    return visible(document.getElementById('field'));
  }
  let frame=0,until=0;
  function place(){
    const input=composer(),toast=stage.querySelector('.hub-feedback-toast.is-visible');
    const bounds=stage.getBoundingClientRect(),scale=bounds.width/stage.offsetWidth;
    const top=input?(input.getBoundingClientRect().top-bounds.top)/scale:0;
    const bottom=input?stage.offsetHeight-top+16:32;
    const up=chat.classList.contains('is-active') && !chat.classList.contains('is-empty') && scroll.scrollHeight-scroll.clientHeight-scroll.scrollTop>80;
    jump.hidden=!up;jump.style.bottom=bottom+'px';
    if(toast)toast.style.bottom=bottom+'px';
    if(performance.now()<until){frame=requestAnimationFrame(place);}else frame=0;
  }
  function update(){until=performance.now()+650;if(!frame)frame=requestAnimationFrame(place);}
  scroll.addEventListener('scroll',update,{passive:true});
  document.getElementById('scroller').addEventListener('scroll',update,{passive:true});
  new MutationObserver(update).observe(stage,{attributes:true,subtree:true,attributeFilter:['class']});
  new ResizeObserver(update).observe(scroll);
  new MutationObserver(update).observe(chat,{attributes:true,attributeFilter:['class','data-ai-status']});
  new MutationObserver(update).observe(document.getElementById('chatMessages'),{childList:true,subtree:true});
  window.addEventListener('spotlight-hub:toast',update);
  window.addEventListener('resize',update);
  window.SpotlightDialogControls={update};
})();
