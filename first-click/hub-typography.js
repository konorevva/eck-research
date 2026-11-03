/* Russian short words and monetary amounts stay together in every rendered list. */
(function(root){
  function format(value){
    let text=String(value);
    text=text.replace(/(\d(?:[\d \u00a0\u202f]*\d)?(?:[.,]\d+)?)[ \u00a0\u202f]*(₽|руб(?:лей|ля|ль|\.)?|тыс\.?[ \u00a0]*(?:₽|руб(?:лей|ля|ль|\.)?)?|млн[ \u00a0]*(?:₽|руб(?:лей|ля|ль|\.)?)?)/gi,(_,number,unit)=>number.replace(/[ \u00a0\u202f]/g,'\u00a0')+'\u00a0'+unit.replace(/ /g,'\u00a0'));
    for(let i=0;i<3;i++)text=text.replace(/(^|[\s(«])((?:в|во|на|по|с|со|к|ко|у|о|об|от|до|из|за|для|при|без|под|над|через|среди|после|перед|и|а|но|не|или|либо|как|что|чтобы|да)) +(?=\S)/gi,'$1$2\u00a0');
    return text;
  }
  function bind(element){
    if(!element)return;
    const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      if(!node.parentElement || node.parentElement.closest('textarea,input,script,style,.chat-message.user'))continue;
      const value=format(node.nodeValue);if(value!==node.nodeValue)node.nodeValue=value;
    }
  }
  root.SpotlightTypography={format,bind};
  if(typeof module!=='undefined')module.exports={format};
})(typeof window==='undefined'?globalThis:window);
