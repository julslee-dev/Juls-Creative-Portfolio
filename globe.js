/* Natural Wonders — Juls Lee. Vanilla JS + locally bundled D3 geography.
   Destination content is static; no API keys, tracking, or build step required. */
(() => {
  'use strict';
  const places = [
    {id:'banff', short:'Banff', name:'Banff National Park', location:'Alberta, Canada', type:'Alpine escape', lon:-116.177, lat:51.425, description:'Turquoise Lake Louise rests beneath glacier-carved peaks. A little reminder of how much there is to explore.', alt:'Turquoise Lake Louise framed by mountains in Banff National Park', url:'https://parks.canada.ca/pn-np/ab/banff'},
    {id:'yosemite', short:'Yosemite', name:'Yosemite National Park', location:'California, USA', type:'Granite & wilderness', lon:-119.533, lat:37.745, description:'Half Dome rises above forests and glacial valleys. Yosemite’s granite landscape makes even the everyday feel extraordinary.', alt:'Half Dome and the granite landscape of Yosemite National Park', url:'https://www.nps.gov/yose/index.htm'},
    {id:'grand-canyon', short:'Grand Canyon', name:'Grand Canyon', location:'Arizona, USA', type:'Layers of time', lon:-112.112, lat:36.106, description:'The Colorado River winds through a vast landscape of layered rock. Light and shadow reveal a different canyon with every passing hour.', alt:'Layered cliffs and deep valleys in the Grand Canyon', url:'https://www.nps.gov/grca/index.htm'},
    {id:'monument-valley', short:'Monument Valley', name:'Monument Valley', location:'Navajo Nation · Arizona–Utah', type:'Navajo Tribal Park', lon:-110.099, lat:37.004, description:'Sandstone buttes rise above a sweeping desert floor. This living Navajo landscape is best explored with respect for its people and traditions.', alt:'Sandstone buttes rising from the desert floor in Monument Valley', url:'https://navajonationparks.org/navajo-tribal-parks/monument-valley/'},
    {id:'bryce', short:'Bryce Canyon', name:'Bryce Canyon', location:'Utah, USA', type:'Dark-sky wonder', lon:-112.167, lat:37.593, description:'Sculpted hoodoos fill the amphitheaters by day. After sunset, this International Dark Sky Park opens a window onto a sky full of stars.', alt:'Orange hoodoos at Inspiration Point in Bryce Canyon National Park', url:'https://www.nps.gov/brca/index.htm'},
    {id:'uluru', short:'Uluru', name:'Uluṟu–Kata Tjuṯa', location:'Northern Territory, Australia', type:'Living cultural landscape', lon:131.036, lat:-25.344, description:'Uluṟu glows in the changing light of Australia’s red desert. This is Aṉangu Country, a landscape of deep cultural and spiritual significance.', alt:'The red sandstone formation of Uluru in Australia', url:'https://uluru.gov.au/'}
  ];
  const $ = id => document.getElementById(id);
  const root = document.querySelector('.wonder-explorer');
  if (!root) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0, spinning = !reduced.matches, hovering = false, inView = true;
  let lon = -105, lat = 25, target = null, dragging = null, width = 0, height = 0;
  const canvas = $('wonder-globe'), ctx = canvas.getContext('2d');
  const buttons = [], markers = [];
  const photos = window.WONDER_PHOTOS || {};
  places.forEach((p,i) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'wonder-destination';
    button.setAttribute('aria-pressed',String(i===0));
    button.setAttribute('aria-label','Explore '+p.short);
    const img = document.createElement('img'); img.src = `images/wonders/${p.id}.jpg`; img.alt = ''; img.width=120; img.height=80;
    const span = document.createElement('span'); span.textContent=p.short;
    button.append(img,span); $('wonder-destinations').append(button); buttons.push(button);
    button.addEventListener('click',()=>select(i,true));
    button.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse') select(i,false);});
    button.addEventListener('focus',()=>select(i,false));
    const marker = document.createElement('button');
    marker.type='button'; marker.className='globe-marker'; marker.textContent=p.short;
    marker.setAttribute('aria-label','Show '+p.short); marker.setAttribute('aria-pressed',String(i===0));
    marker.addEventListener('click',()=>select(i,true));
    marker.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse') select(i,false);});
    marker.addEventListener('focus',()=>{hovering=true;select(i,false);});
    $('globe-markers').append(marker);markers.push(marker);
  });
  function setSpin(value){spinning=value;$('toggle-rotation').textContent=value?'Pause spin':'Resume spin';$('toggle-rotation').setAttribute('aria-pressed',String(!value));}
  function select(i,fly){
    const p=places[i]; selected=i;
    $('wonder-name').textContent=p.name; $('wonder-location').textContent=p.location.toUpperCase();
    $('wonder-type').textContent=p.type; $('wonder-description').textContent=p.description;
    $('wonder-photo').src=`images/wonders/${p.id}.jpg`; $('wonder-photo').alt=p.alt;
    $('wonder-link').href=p.url;
    $('wonder-credit').href=photos[p.id]?.credit || p.url;
    $('wonder-credit').textContent=photos[p.id]?.label || 'Photo & license';
    buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
    markers.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
    if(fly){setSpin(false);target={lon:p.lon+12,lat:p.lat-8};$('wonder-announcement').textContent=p.name+'. '+p.description;}
  }
  setSpin(spinning);select(0,false);
  $('toggle-rotation').addEventListener('click',()=>{target=null;setSpin(!spinning);});
  $('rotate-left').addEventListener('click',()=>{setSpin(false);target={lon:lon-35,lat};});
  $('rotate-right').addEventListener('click',()=>{setSpin(false);target={lon:lon+35,lat};});
  root.addEventListener('pointerenter',()=>{hovering=true;});
  root.addEventListener('pointerleave',()=>{hovering=false;});
  root.addEventListener('focusin',()=>{hovering=true;});
  root.addEventListener('focusout',e=>{if(!root.contains(e.relatedTarget)) hovering=false;});
  reduced.addEventListener('change',()=>{if(reduced.matches)setSpin(false);});
  canvas.addEventListener('pointerdown',e=>{dragging={x:e.clientX,y:e.clientY,lon,lat};target=null;setSpin(false);canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;lon=dragging.lon-(e.clientX-dragging.x)*.35;lat=Math.max(-70,Math.min(70,dragging.lat+(e.clientY-dragging.y)*.25));});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{dragging=null;});
  if (!ctx || !window.d3 || !window.topojson || !window.WONDER_LAND) {
    $('globe-view').hidden=true; document.querySelector('.wonder-card').style.position='relative'; return;
  }
  const land=topojson.feature(window.WONDER_LAND,window.WONDER_LAND.objects.land);
  const projection=d3.geoOrthographic().clipAngle(90), path=d3.geoPath(projection,ctx), grid=d3.geoGraticule10();
  function resize(){width=canvas.clientWidth;height=canvas.clientHeight;const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);}
  new ResizeObserver(resize).observe(canvas);resize();
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;},{threshold:0}).observe(root);
  let last=0;
  function draw(now){
    requestAnimationFrame(draw);
    const dt=Math.min((now-last)/1000,.05);last=now;
    if(!inView||document.hidden||!width)return;
    if(target){const delta=((target.lon-lon+540)%360)-180;const speed=reduced.matches?1:Math.min(1,dt*4.5);lon+=delta*speed;lat+=(target.lat-lat)*speed;if(Math.abs(delta)<.1&&Math.abs(target.lat-lat)<.1)target=null;}
    else if(spinning&&!hovering&&!dragging)lon+=dt*3;
    const mobile=width<450, cx=width*(mobile?.52:.43), cy=height*.49, radius=Math.min(width*(mobile?.38:.32),height*.39);
    projection.translate([cx,cy]).scale(radius).rotate([-lon,-lat]);
    ctx.clearRect(0,0,width,height);
    // Deterministic small stars: decorative, never used as map data.
    for(let i=0;i<65;i++){const x=(i*127.7+31)%width,y=(i*71.3+17)%height;ctx.fillStyle=i%4?'#efe9d52b':'#efe9d56b';ctx.fillRect(x,y,i%4?1:1.5,i%4?1:1.5);}
    const halo=ctx.createRadialGradient(cx,cy,radius*.85,cx,cy,radius*1.13);halo.addColorStop(0,'#9ac5be00');halo.addColorStop(.7,'#9ac5be33');halo.addColorStop(1,'#9ac5be00');ctx.fillStyle=halo;ctx.fillRect(cx-radius*1.15,cy-radius*1.15,radius*2.3,radius*2.3);
    const sea=ctx.createRadialGradient(cx-radius*.35,cy-radius*.4,0,cx,cy,radius);sea.addColorStop(0,'#719ba1');sea.addColorStop(.65,'#496f7b');sea.addColorStop(1,'#294551');
    ctx.beginPath();path({type:'Sphere'});ctx.fillStyle=sea;ctx.fill();
    ctx.beginPath();path(land);ctx.fillStyle='#adb393';ctx.fill();ctx.strokeStyle='#d1ceb244';ctx.lineWidth=.6;ctx.stroke();
    ctx.beginPath();path(grid);ctx.strokeStyle='#e6ecdc18';ctx.lineWidth=.6;ctx.stroke();
    const shade=ctx.createRadialGradient(cx-radius*.45,cy-radius*.45,radius*.1,cx+radius*.1,cy+radius*.1,radius*1.2);shade.addColorStop(0,'#fcf5cb18');shade.addColorStop(.7,'#152b3310');shade.addColorStop(1,'#071a2be0');ctx.beginPath();path({type:'Sphere'});ctx.fillStyle=shade;ctx.fill();ctx.strokeStyle='#b8d2ca88';ctx.lineWidth=1;ctx.stroke();
    places.forEach((p,i)=>{
      const visible=d3.geoDistance([p.lon,p.lat],[lon,lat])<Math.PI/2-.08;
      markers[i].hidden=!visible;if(!visible)return;
      const point=projection([p.lon,p.lat]);
      // Offset clustered US labels, keeping leader lines tied to real coordinates.
      const x=i<5?Math.max(56,cx-radius*.83):Math.min(width-50,cx+radius*.73);
      const y=i<5?cy-radius*.72+i*32:cy+radius*.56;
      ctx.beginPath();ctx.moveTo(point[0],point[1]);ctx.lineTo(x,y);ctx.strokeStyle=i===selected?'#f7c59c':'#d9c5a577';ctx.lineWidth=i===selected?1.3:.7;ctx.stroke();
      ctx.beginPath();ctx.arc(point[0],point[1],i===selected?4:2.5,0,Math.PI*2);ctx.fillStyle=i===selected?'#f4c397':'#eed7b7';ctx.fill();
      markers[i].style.left=`${x}px`;markers[i].style.top=`${y}px`;
    });
  }
  requestAnimationFrame(draw);
})();
