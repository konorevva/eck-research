/* One measured handoff for AI home, focused composer and Overview. */
(() => {
  if (!window.SpotlightHubConfiguration) return;
  const stage=document.getElementById('stage');
  const duration=380,easing='cubic-bezier(.32,.72,0,1)';
  let committing=false,running=false;
  const visible=node=>{
    if(!node || !node.getClientRects().length)return false;
    for(let p=node;p && p!==stage;p=p.parentElement){const s=getComputedStyle(p);if(p.hidden || s.visibility==='hidden' || s.display==='none' || Number(s.opacity)===0)return false;}
    return true;
  };
  function surface(){
    const page=stage.querySelector('.flow-view.is-active');
    const input=page?.id==='chatView'?page.querySelector('#assistantComposer'):page?.querySelector('.page-input-dock:not([hidden]) .page-input,.hub-request-input') || document.getElementById('field');
    const host=page || document.querySelector('#mainLayer > .modal');
    // The home stays mounted behind Overview. Its covered greeting is not a source
    // for the next transition: measuring it there picks up the background page offset.
    const ownsIntro=!page || (page.id==='chatView' && stage.classList.contains('is-manual-chat') && !stage.classList.contains('is-conversation'));
    return {page,input,glow:host?.querySelector('.focus-ambient-scene'),intro:ownsIntro?[document.querySelector('.greeting'),document.querySelector('.chips')].filter(visible):[]};
  }
  // Freeze presentation only. No duplicated IDs, handlers, forms or live state observers.
  function freeze(node){
    const copy=node.tagName==='IMG'?node.cloneNode(false):document.createElement('div'),style=getComputedStyle(node);
    for(const key of style)copy.style.setProperty(key,style.getPropertyValue(key));
    copy.style.setProperty('animation','none');copy.style.setProperty('transition','none');
    for(const child of node.childNodes){if(child.nodeType===3)copy.append(document.createTextNode(child.textContent));else if(child.nodeType===1)copy.append(freeze(child));}
    for(const pseudo of ['::before','::after']){
      const ps=getComputedStyle(node,pseudo);if(ps.content==='none' || ps.content==='normal')continue;
      const layer=document.createElement('div');for(const key of ps)layer.style.setProperty(key,ps.getPropertyValue(key));layer.style.animation='none';layer.style.transition='none';
      if(pseudo==='::before')copy.prepend(layer);else copy.append(layer);
    }
    return copy;
  }
  function overlay(node,rect,scale,bounds){
    const copy=freeze(node);copy.setAttribute('aria-hidden','true');copy.inert=true;
    Object.assign(copy.style,{position:'absolute',left:(rect.left-bounds.left)/scale+'px',top:(rect.top-bounds.top)/scale+'px',width:rect.width/scale+'px',height:rect.height/scale+'px',margin:'0',transform:'none',translate:'none',visibility:'visible',pointerEvents:'none',zIndex:'310'});
    stage.append(copy);return copy;
  }
  function run(change){
    if(committing)return change();
    if(running)return;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){committing=true;try{return change();}finally{committing=false;}}
    const from=surface();if(!visible(from.input)){committing=true;try{return change();}finally{committing=false;}}
    const scale=stage.getBoundingClientRect().width/stage.offsetWidth,bounds=stage.getBoundingClientRect();
    const inputRect=from.input.getBoundingClientRect();
    const intro=from.intro.map(node=>({node,rect:node.getBoundingClientRect(),copy:freeze(node)}));
    const glowRect=visible(from.glow)?from.glow.getBoundingClientRect():null;
    const glowCopy=glowRect?overlay(from.glow,glowRect,scale,bounds):null;
    if(glowCopy)glowCopy.style.visibility='hidden';
    const keyboard=document.getElementById('iosKeyboard'),wasKeyboard=visible(keyboard);
    const keyboardRect=wasKeyboard?keyboard.getBoundingClientRect():null;
    const keyboardImage=wasKeyboard?keyboard.querySelector('img')?.cloneNode(true):null;
    stage.classList.add('is-ai-surface-motion');running=true;committing=true;
    try {change();} finally {committing=false;}
    const to=surface(),animations=[],copies=[glowCopy].filter(Boolean),timing={duration,easing,fill:'both'};
    // Light belongs behind the destination's input, not above the entire shell.
    // A stage-level overlay tinted the input and vanished abruptly on cleanup.
    if(glowCopy && to.glow){
      const host=to.glow.parentElement,rect=host.getBoundingClientRect();
      host.append(glowCopy);
      Object.assign(glowCopy.style,{left:(glowRect.left-rect.left)/scale+'px',top:(glowRect.top-rect.top)/scale+'px',zIndex:'1',visibility:'visible'});
    }

    const landingGlowRect=visible(to.glow)?to.glow.getBoundingClientRect():null;
    // A frozen glow replaces its source; never paint both during the handoff.
    const sourceVisibility=from.glow?.style.visibility;
    if(glowCopy && from.glow!==to.glow)from.glow.style.visibility='hidden';
    const animate=(node,frames)=>{if(node)animations.push(node.animate(frames,timing));};
    if(to.input){
      const rect=to.input.getBoundingClientRect(),style=getComputedStyle(to.input);
      const dx=(inputRect.left-rect.left)/scale,dy=(inputRect.top-rect.top)/scale;
      animate(to.input,[{translate:dx+'px '+dy+'px',width:inputRect.width/scale+'px',height:inputRect.height/scale+'px'},{translate:'0 0',width:style.width,height:style.height}]);
      const note=to.page?.querySelector('.hub-compose-note');
      if(visible(note))animate(note,[{translate:'0 '+dy+'px',opacity:0},{translate:'0 0',opacity:1}]);
      // The destination glow starts at the same input position and moves on the same clock.
      if(visible(to.glow)){const opacity=getComputedStyle(to.glow).opacity;animate(to.glow,[{translate:'0 '+dy+'px',opacity:glowCopy?0:opacity},{translate:'0 0',opacity}]);}
    }
    for(const item of intro){
      if(to.intro.includes(item.node)){
        const rect=item.node.getBoundingClientRect();animate(item.node,[{translate:(item.rect.left-rect.left)/scale+'px '+(item.rect.top-rect.top)/scale+'px'},{translate:'0 0'}]);
      }else{
        const copy=item.copy;Object.assign(copy.style,{position:'absolute',left:(item.rect.left-bounds.left)/scale+'px',top:(item.rect.top-bounds.top)/scale+'px',width:item.rect.width/scale+'px',height:item.rect.height/scale+'px',margin:'0',transform:'none',translate:'none',pointerEvents:'none',zIndex:'305'});copy.inert=true;copy.setAttribute('aria-hidden','true');stage.append(copy);copies.push(copy);animate(copy,[{opacity:1},{opacity:0}]);
      }
    }
    for(const node of to.intro)if(!intro.some(item=>item.node===node))animate(node,[{opacity:0},{opacity:1}]);
    if(glowCopy){
      const end=landingGlowRect || glowRect;
      animate(glowCopy,[{opacity:1,transform:'translate(0,0) scale(1)'},{opacity:0,transform:'translate('+(end.left-glowRect.left)/scale+'px,'+(end.top-glowRect.top)/scale+'px) scale('+(end.width/glowRect.width)+','+(end.height/glowRect.height)+')'}]);glowCopy.style.transformOrigin='0 0';
    }
    const hasKeyboard=document.getElementById('chatView').classList.contains('has-keyboard') && to.page?.id==='chatView';
    if(hasKeyboard)to.input?.querySelector('textarea')?.focus({preventScroll:true});
    if(hasKeyboard && !wasKeyboard)animate(keyboard,[{transform:'translate3d(0,100%,0)'},{transform:'translate3d(0,0,0)'}]);
    else if(wasKeyboard && !hasKeyboard && keyboardImage){
      const ghost=document.createElement('div');Object.assign(ghost.style,{position:'absolute',left:'0',top:(keyboardRect.top-bounds.top)/scale+'px',width:'100%',height:keyboardRect.height/scale+'px',zIndex:'320',pointerEvents:'none'});keyboardImage.style.width='100%';keyboardImage.style.height='100%';ghost.append(keyboardImage);ghost.inert=true;ghost.setAttribute('aria-hidden','true');stage.append(ghost);copies.push(ghost);animate(ghost,[{translate:'0 0'},{translate:'0 '+keyboardRect.height/scale+'px'}]);
    }
    Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>{
      // Read the landing state before restoring transitions, so no second CSS animation starts.
      if(from.page && from.page!==to.page)from.page.style.visibility='hidden';
      animations.forEach(a=>a.cancel());copies.forEach(node=>node.remove());
      if(glowCopy && from.glow!==to.glow)from.glow.style.visibility=sourceVisibility;
      void stage.offsetHeight;stage.classList.remove('is-ai-surface-motion');running=false;
    });
  }
  // Pages and headers remain opaque during navigation; only shared surfaces move.
  window.SpotlightSurfaceMotion={run,get committing(){return committing;},get running(){return running;}};
})();
