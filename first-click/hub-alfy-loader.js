// Alfy loop geometry and timing adapted from https://ds-alchemy.ru/#/experiments/alfy-thinking
(function () {
"use strict";
var points=values=>values.map(([x,y])=>({x,y})),shape0={v:points([[63.993,9.444],[-39.61,-33.483],[-.609,-52.483],[-35.487,39.914],[37.39,-33.483],[-61.11,8.017]]),i:points([[-4.126,-41.175],[5.947,34.495],[-13.501,-19],[-13.73,-30.788],[36.541,38.925],[-9.328,-35.826]]),o:points([[3.695,36.877],[-5,-29],[28.117,39.569],[16.56,37.135],[-23,-24.5],[10.307,39.586]])},shape1={v:points([[57.131,37.948],[-22.87,-32.045],[21.631,-53.053],[-46.369,46.948],[65.631,-15.553],[-61.869,-20.553]]),i:points([[47,-45.5],[5.947,34.495],[-13.501,-19],[41.656,35.581],[-20.518,-49.289],[-5.168,53.398]]),o:points([[-33.768,32.691],[-5,-29],[28.117,39.569],[-48,-41],[18.942,45.5],[4.5,-46.5]])},LOOP_SHAPE_KEYFRAMES=[{start:0,end:120,left:shape0,right:shape1,easing:[.333,0,.667,1]},{start:120,end:240,left:shape1,right:shape0,easing:[.333,0,.667,1]}],LOOP_TIMELINE={middleFrame:120,outPoint:240,offsetDegrees:610},TRIM_EASING=[.333,0,.667,1],ROTATION_EASING=[.167,.167,.833,.833],LOOP_LAYER={position:{x:128.29,y:128.391},anchor:{x:67.5,y:59},groupPosition:{x:66,y:66.49}},SAMPLES_PER_CURVE=32,EPSILON=1e-4,LOOP_START_RGB=[255,99,249],LOOP_END_RGB=[255,1,3];function clamp(value,min=0,max=1){return Math.min(max,Math.max(min,value))}function cubicBezierY(progress,x1,y1,x2,y2){let target=clamp(progress),t=target;for(let index=0;index<8;index+=1){let inverse2=1-t,x=3*inverse2*inverse2*t*x1+3*inverse2*t*t*x2+t*t*t,derivative=3*inverse2*inverse2*x1+6*inverse2*t*(x2-x1)+3*t*t*(1-x2);if(Math.abs(derivative)<1e-7)break;t=clamp(t-(x-target)/derivative)}let inverse=1-t;return 3*inverse*inverse*t*y1+3*inverse*t*t*y2+t*t*t}function interpolate(left,right,progress){return left+(right-left)*progress}function interpolateShape(frame){let boundedFrame=Math.min(LOOP_TIMELINE.outPoint-EPSILON,Math.max(0,frame)),interval=boundedFrame<LOOP_TIMELINE.middleFrame?LOOP_SHAPE_KEYFRAMES[0]:LOOP_SHAPE_KEYFRAMES[1],localProgress=(boundedFrame-interval.start)/(interval.end-interval.start),easedProgress=cubicBezierY(localProgress,...interval.easing);return{v:interval.left.v.map((point,index)=>({x:interpolate(point.x,interval.right.v[index].x,easedProgress),y:interpolate(point.y,interval.right.v[index].y,easedProgress)})),i:interval.left.i.map((point,index)=>({x:interpolate(point.x,interval.right.i[index].x,easedProgress),y:interpolate(point.y,interval.right.i[index].y,easedProgress)})),o:interval.left.o.map((point,index)=>({x:interpolate(point.x,interval.right.o[index].x,easedProgress),y:interpolate(point.y,interval.right.o[index].y,easedProgress)}))}}function transformPoint(point,rotation){let groupPoint={x:point.x+LOOP_LAYER.groupPosition.x,y:point.y+LOOP_LAYER.groupPosition.y},relative={x:groupPoint.x-LOOP_LAYER.anchor.x,y:groupPoint.y-LOOP_LAYER.anchor.y},angle=rotation*Math.PI/180;return{x:LOOP_LAYER.position.x+relative.x*Math.cos(angle)-relative.y*Math.sin(angle),y:LOOP_LAYER.position.y+relative.x*Math.sin(angle)+relative.y*Math.cos(angle)}}function cubicPoint(p0,p1,p2,p3,t){let inverse=1-t;return{x:inverse**3*p0.x+3*inverse**2*t*p1.x+3*inverse*t**2*p2.x+t**3*p3.x,y:inverse**3*p0.y+3*inverse**2*t*p1.y+3*inverse*t**2*p2.y+t**3*p3.y}}function distance(left,right){return Math.hypot(right.x-left.x,right.y-left.y)}function sourcePath(frame,rotation){let shape=interpolateShape(frame),points2=[];for(let segment=0;segment<shape.v.length;segment+=1){let next=(segment+1)%shape.v.length,p0=shape.v[segment],p1={x:p0.x+shape.o[segment].x,y:p0.y+shape.o[segment].y},p2={x:shape.v[next].x+shape.i[next].x,y:shape.v[next].y+shape.i[next].y},p3=shape.v[next];for(let sample=0;sample<SAMPLES_PER_CURVE;sample+=1)points2.push(transformPoint(cubicPoint(p0,p1,p2,p3,sample/SAMPLES_PER_CURVE),rotation))}return points2}function createMeasuredPath(points2){let lengths=[0],total=0;for(let index=1;index<=points2.length;index+=1)total+=distance(points2[index-1],points2[index%points2.length]),lengths.push(total);return{points:points2,lengths,total}}function pointAt2(measured,rawDistance){let target=(rawDistance%measured.total+measured.total)%measured.total,edge=0;for(;edge<measured.points.length-1&&measured.lengths[edge+1]<target;)edge+=1;let start=measured.points[edge],end=measured.points[(edge+1)%measured.points.length],edgeStart=measured.lengths[edge],edgeLength=measured.lengths[edge+1]-edgeStart,progress=edgeLength<EPSILON?0:(target-edgeStart)/edgeLength;return{x:interpolate(start.x,end.x,progress),y:interpolate(start.y,end.y,progress)}}function colorAt(progress){let value=clamp(progress);return`#${LOOP_START_RGB.map((channel,index)=>Math.round(interpolate(channel,LOOP_END_RGB[index],value))).map(channel=>channel.toString(16).padStart(2,"0")).join("").toUpperCase()}`}function pathData(start,end){return`M ${start.x.toFixed(3)} ${start.y.toFixed(3)} L ${end.x.toFixed(3)} ${end.y.toFixed(3)}`}function buildLoopFrame(phase){let boundedPhase=(phase%1+1)%1,frame=boundedPhase*LOOP_TIMELINE.outPoint,globalProgress=cubicBezierY(boundedPhase,...ROTATION_EASING),start=frame<LOOP_TIMELINE.middleFrame?0:cubicBezierY((frame-LOOP_TIMELINE.middleFrame)/LOOP_TIMELINE.middleFrame,...TRIM_EASING)*30,end=frame<LOOP_TIMELINE.middleFrame?interpolate(20,50,cubicBezierY(frame/LOOP_TIMELINE.middleFrame,...TRIM_EASING)):50,rotation=globalProgress*360,measured=createMeasuredPath(sourcePath(frame,rotation)),startDistance=((start/100+globalProgress*LOOP_TIMELINE.offsetDegrees/360)%1+1)%1*measured.total,visibleLength=Math.max(EPSILON,(end-start)/100*measured.total),strokes=[],cursor=0;for(;cursor<visibleLength-EPSILON;){let absolute=(startDistance+cursor)%measured.total,edgeEnd=measured.lengths.find(length=>length>absolute+EPSILON)??measured.total,pieceLength=Math.min(visibleLength-cursor,Math.max(EPSILON,edgeEnd-absolute)),from=pointAt2(measured,absolute),to=pointAt2(measured,absolute+pieceLength);strokes.push({d:pathData(from,to),start:colorAt(cursor/visibleLength),end:colorAt((cursor+pieceLength)/visibleLength),capStart:cursor<EPSILON,capEnd:cursor+pieceLength>=visibleLength-EPSILON}),cursor+=pieceLength}return{strokes}}

  var sequence = 0;
  window.SpotlightAlfy = {
    start: function (article) {
      var slot = article.querySelector('[data-alfy-loader]');
      if (!slot) return;
      var ns = 'http://www.w3.org/2000/svg';
      var id = 'alfy-' + (++sequence);
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', '40 40 176 176');
      svg.setAttribute('width', '36');
      svg.setAttribute('height', '36');
      svg.setAttribute('aria-hidden', 'true');
      var defs = document.createElementNS(ns, 'defs');
      svg.appendChild(defs);
      var pieces = Array.from({length:194}, function (_, index) {
        var gradient = document.createElementNS(ns, 'linearGradient');
        gradient.id = id + '-' + index;
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse');
        var stops = [0,1].map(function (offset) {
          var stop = document.createElementNS(ns, 'stop');
          stop.setAttribute('offset', offset);
          gradient.appendChild(stop);
          return stop;
        });
        defs.appendChild(gradient);
        var path = document.createElementNS(ns, 'path');
        path.setAttribute('fill','none');
        path.setAttribute('stroke','url(#' + gradient.id + ')');
        path.setAttribute('stroke-width','8');
        path.setAttribute('stroke-linejoin','round');
        svg.appendChild(path);
        return {path:path,gradient:gradient,stops:stops};
      });
      slot.replaceChildren(svg);
      var label = article.querySelector('.alfy-thinking-text');
      var band = document.createElement('span');
      band.className = 'alfy-thinking-band';
      band.textContent = label.textContent;
      band.setAttribute('aria-hidden','true');
      label.appendChild(band);
      var fontScale = parseFloat(getComputedStyle(label).fontSize) / 14;
      var bandWidth = Math.max(36 * fontScale, Math.min(band.textContent.length * 3 * fontScale, 48 * fontScale) * 2);
      band.style.backgroundSize = bandWidth + 'px 100%';
      band.style.maskSize = bandWidth + 'px 100%';
      band.style.webkitMaskSize = bandWidth + 'px 100%';
      var labelWidth = label.offsetWidth;
      var start = performance.now();
      var reduced = matchMedia('(prefers-reduced-motion: reduce)');
      function tick(now) {
        if (!article.isConnected || !article.classList.contains('is-loading')) return;
        if (!document.hidden) {
          var sweep = Math.min(((now-start) % 2150) / 1450, 1);
          var position = (-bandWidth + (labelWidth + bandWidth) * cubicBezierY(sweep, .3, 0, .2, 1)) + 'px center';
          band.style.backgroundPosition = position;
          band.style.maskPosition = position;
          band.style.webkitMaskPosition = position;
          band.hidden = reduced.matches;
          var strokes = buildLoopFrame(reduced.matches ? 0 : (now-start)/4100).strokes;
          pieces.forEach(function (piece,index) {
            var stroke = strokes[index];
            piece.path.setAttribute('display', stroke ? 'inline' : 'none');
            if (!stroke) return;
            piece.path.setAttribute('d',stroke.d);
            piece.path.setAttribute('stroke-linecap',stroke.capStart || stroke.capEnd ? 'round' : 'butt');
            var coords = stroke.d.match(/-?\d+(?:\.\d+)/g);
            ['x1','y1','x2','y2'].forEach(function (key,i) {piece.gradient.setAttribute(key,coords[i]);});
            piece.stops[0].setAttribute('stop-color',stroke.start);
            piece.stops[1].setAttribute('stop-color',stroke.end);
          });
        }
        requestAnimationFrame(tick);
      }
      tick(start);
    }
  };
})();
