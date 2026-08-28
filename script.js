// ---------- loading screen ----------
const loaderLines = ['booting up an AI engineer', 'compiling good vibes', 'training the mascot', 'almost there'];
let loaderLineIdx = 0;
const loaderTextEl = document.getElementById('loader-text');
const loaderInterval = setInterval(()=>{
  loaderLineIdx = (loaderLineIdx+1) % loaderLines.length;
  loaderTextEl.innerHTML = loaderLines[loaderLineIdx] + '<span id="loader-dots">.</span>';
}, 420);

window.addEventListener('load', ()=>{
  setTimeout(()=>{
    document.getElementById('loader').classList.add('hide');
    clearInterval(loaderInterval);
  }, 1300);
});

// ---------- contact button confetti ----------
const confettiColors = ['#5F4A8B', '#F4A896', '#B7DFD4', '#FFFACD'];
function burstConfetti(x, y){
  for(let i=0; i<14; i++){
    const bit = document.createElement('div');
    bit.className = 'confetti-bit';
    bit.style.left = x+'px';
    bit.style.top = y+'px';
    bit.style.background = confettiColors[i % confettiColors.length];
    document.body.appendChild(bit);
    const angle = (Math.PI*2*i)/14 + Math.random()*0.5;
    const dist = 40 + Math.random()*50;
    const dx = Math.cos(angle)*dist, dy = Math.sin(angle)*dist;
    bit.animate([
      { transform:'translate(0,0) rotate(0deg)', opacity:1 },
      { transform:`translate(${dx}px, ${dy}px) rotate(${Math.random()*360}deg)`, opacity:0 }
    ], { duration:700+Math.random()*300, easing:'cubic-bezier(.2,.8,.2,1)' })
    .onfinish = () => bit.remove();
  }
}
document.querySelectorAll('.social-btn').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    const r = btn.getBoundingClientRect();
    burstConfetti(r.left + r.width/2, r.top + r.height/2);
  });
});

// ---------- quest log accordion ----------
document.querySelectorAll('.quest-head').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    btn.closest('.quest').classList.toggle('open');
  });
});

// ---------- view switching: game <-> panel ----------
function openPanel(id){
  document.querySelectorAll('.panel').forEach(p=> p.classList.toggle('active', p.dataset.panel === id));
  document.body.classList.add('view-panel');
  window.scrollTo(0,0);
  if(id === 'projects') initPhysics();
  if(id === 'research'){
    const fill = document.getElementById('neuro-bar-fill');
    if(fill){ fill.style.width = '0%'; requestAnimationFrame(()=> setTimeout(()=> fill.style.width = '91%', 200)); }
  }
  if(id === 'contact'){
    const title = document.querySelector('.pop-title');
    if(title){ title.style.animation = 'none'; void title.offsetWidth; title.style.animation = ''; }
  }
}
function backToGame(){
  document.body.classList.remove('view-panel');
  document.querySelectorAll('.panel').forEach(p=> p.classList.remove('active'));
}
document.getElementById('back-to-game')?.addEventListener('click', backToGame);
document.querySelectorAll('[data-open]').forEach(el=>{
  el.addEventListener('click', (e)=>{ e.preventDefault(); openPanel(el.dataset.open); });
});

// ---------- konami code easter egg ----------
(function(){
  const code = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let pos = 0;
  window.addEventListener('keydown', (e)=>{
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if(key === code[pos]) pos++; else pos = (key === code[0]) ? 1 : 0;
    if(pos === code.length){
      pos = 0;
      triggerKonami();
    }
  });
  function triggerKonami(){
    document.body.classList.add('konami');

    const cx = window.innerWidth/2, cy = window.innerHeight/2;
    burstConfetti(cx, cy);
    for(let i=1;i<8;i++){
      setTimeout(()=> burstConfetti(Math.random()*window.innerWidth, Math.random()*window.innerHeight*0.7), i*150);
    }

    const banner = document.getElementById('konami-banner');
    if(banner){
      banner.classList.add('show');
      setTimeout(()=> banner.classList.remove('show'), 2600);
    }

    const bubble = document.getElementById('speech-bubble');
    const mascotWrap = document.getElementById('mascot-wrap');
    if(bubble && mascotWrap){
      const wasHidden = mascotWrap.style.opacity === '0' || getComputedStyle(mascotWrap).opacity === '0';
      if(wasHidden) mascotWrap.classList.add('force-show');
      bubble.textContent = "okay you actually typed the Konami code. respect.";
      bubble.classList.add('show');
      mascotWrap.classList.add('spin');
      setTimeout(()=>{
        bubble.classList.remove('show');
        mascotWrap.classList.remove('spin');
        if(wasHidden) mascotWrap.classList.remove('force-show');
      }, 3000);
    }
    setTimeout(()=> document.body.classList.remove('konami'), 1400);
  }
  document.getElementById('konami-btn')?.addEventListener('click', triggerKonami);
})();

// ---------- hero game: walkable mascot + signposts ----------
(function(){
  const stage = document.getElementById('game-stage');
  const player = document.getElementById('player');
  const prompt = document.getElementById('sign-prompt');
  if(!stage || !player) return;

  const PLAYER_W = 64, GRAVITY = 1400, JUMP_V = 620, SPEED = 220;
  let stageW = stage.clientWidth;
  let x = 40, vy = 0, onGround = true, facing = 1;
  const keys = {left:false, right:false};

  const signs = Array.from(stage.querySelectorAll('.signpost')).map(el=>{
    return {el, x: (parseFloat(el.style.left)/100) * stageW, target: el.dataset.goto};
  });

  let nearSign = null;
  function updatePrompt(){
    let found = null;
    signs.forEach(s=>{
      const dist = Math.abs((x+PLAYER_W/2) - s.x);
      if(dist < 40) found = s;
    });
    nearSign = found;
    if(found){
      prompt.innerHTML = 'press <kbd>space</kbd> to open ' + found.target;
      const promptW = prompt.offsetWidth || 160;
      const clampedLeft = Math.max(6, Math.min(stageW - promptW - 6, found.x - promptW/2));
      prompt.style.left = clampedLeft + 'px';
      prompt.style.bottom = (stage.clientHeight < 260 ? '120px' : '150px');
      prompt.classList.add('show');
    } else {
      prompt.classList.remove('show');
    }
  }

  signs.forEach(s=> s.el.addEventListener('click', ()=> openPanel(s.target)));

  let secretFound = false;
  const secretLines = [
    "you found the edge of the map. there's nothing here, just vibes.",
    "congrats, you're the kind of person who checks every corner. hire that instinct.",
  ];
  function checkSecretEdge(){
    if(secretFound) return;
    if(x >= stageW - PLAYER_W - 3){
      secretFound = true;
      const bubble = document.getElementById('speech-bubble');
      bubble.textContent = secretLines[Math.floor(Math.random()*secretLines.length)];
      bubble.classList.add('show', 'secret');
      const r = stage.getBoundingClientRect();
      burstConfetti(r.right - 20, r.bottom - 60);
      setTimeout(()=> bubble.classList.remove('show','secret'), 4200);
    }
  }

  window.addEventListener('keydown', (e)=>{
    if(document.body.classList.contains('view-panel')) return;
    if(['ArrowLeft','a','A'].includes(e.key)) keys.left = true;
    if(['ArrowRight','d','D'].includes(e.key)) keys.right = true;
    if([' ','ArrowUp','w','W'].includes(e.key)){
      if(nearSign){ openPanel(nearSign.target); }
      else if(onGround){ vy = -JUMP_V; onGround = false; }
    }
    if(['ArrowLeft','ArrowRight',' ','ArrowUp'].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', (e)=>{
    if(['ArrowLeft','a','A'].includes(e.key)) keys.left = false;
    if(['ArrowRight','d','D'].includes(e.key)) keys.right = false;
  });

  function bindHold(btn, onDown, onUp){
    if(!btn) return;
    btn.addEventListener('mousedown', onDown); btn.addEventListener('touchstart', (e)=>{e.preventDefault();onDown();});
    btn.addEventListener('mouseup', onUp); btn.addEventListener('touchend', onUp);
    btn.addEventListener('mouseleave', onUp);
  }
  bindHold(document.getElementById('btn-left'), ()=>keys.left=true, ()=>keys.left=false);
  bindHold(document.getElementById('btn-right'), ()=>keys.right=true, ()=>keys.right=false);
  document.getElementById('btn-jump')?.addEventListener('click', ()=>{
    if(nearSign){ openPanel(nearSign.target); }
    else if(onGround){ vy = -JUMP_V; onGround = false; }
  });

  let last = performance.now();
  function loop(now){
    const dt = Math.min((now-last)/1000, 0.033);
    last = now;

    if(!document.body.classList.contains('view-panel')){
      if(keys.left){ x -= SPEED*dt; facing = -1; }
      if(keys.right){ x += SPEED*dt; facing = 1; }
      x = Math.max(0, Math.min(stageW-PLAYER_W, x));

      vy += GRAVITY*dt;
      let y = parseFloat(player.style.getPropertyValue('--y')||0) + vy*dt;
      if(y >= 0){ y = 0; vy = 0; onGround = true; }

      player.style.setProperty('--y', y);
      player.style.transform = `translate(${x}px, ${y}px)`;
      player.classList.toggle('face-left', facing === -1);

      updatePrompt();
      checkSecretEdge();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('resize', ()=>{
    stageW = stage.clientWidth;
    signs.forEach(s=> s.x = (parseFloat(s.el.style.left)/100) * stageW);
  });
})();

// ---------- custom cursor + stationary mascot widget (outside hero) ----------
const cursorDot = document.getElementById('cursor-dot');
const mascotWrap = document.getElementById('mascot-wrap');
const mascot = document.getElementById('mascot');
const mascotDot = document.getElementById('mascot-dot');
const mascotHint = document.getElementById('mascot-hint');
const bubble = document.getElementById('speech-bubble');

document.addEventListener('mousemove', (e)=>{
  cursorDot.style.left = e.clientX+'px';
  cursorDot.style.top = e.clientY+'px';
});

document.addEventListener('mouseover', (e)=>{
  if(e.target.closest('a,button,.phys-card,.note')) cursorDot.classList.add('hover');
});
document.addEventListener('mouseout', (e)=>{
  if(e.target.closest('a,button,.phys-card,.note')) cursorDot.classList.remove('hover');
});

const mascotLines = [
  "hi! I'm Aakanksha, or a small drawing of her",
  "psst — drag the project cards, they collide",
  "zero frameworks were used to build this site",
  "the research paper is the one I'm proudest of",
  "good debugging and good detective work are the same skill",
  "hit back to game to explore the other signs",
];
let bubbleTimer;
function sayLine(){
  const line = mascotLines[Math.floor(Math.random()*mascotLines.length)];
  bubble.textContent = line;
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(()=> bubble.classList.remove('show'), 3200);
}
mascot.addEventListener('click', ()=>{
  sayLine();
  mascotWrap.classList.add('dismissed');
});
setInterval(()=>{ if(!bubble.classList.contains('show')) sayLine(); }, 14000);

function syncMascotVisibility(){
  const hide = !document.body.classList.contains('view-panel');
  mascotWrap.style.opacity = hide ? '0' : '1';
  mascotWrap.style.pointerEvents = hide ? 'none' : 'auto';
}
syncMascotVisibility();
new MutationObserver(syncMascotVisibility).observe(document.body, {attributes:true, attributeFilter:['class']});

// ---------- scroll reveal ----------
const revealObserver = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, {threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=> revealObserver.observe(el));

// ---------- physics playground for project cards (lazy init) ----------
let physicsInited = false;
function initPhysics(){
  if(physicsInited) return;
  const stage = document.getElementById('physics-stage');
  if(!stage || window.innerWidth < 860 || !window.Matter) return;
  physicsInited = true;

  requestAnimationFrame(()=>{
    const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint } = Matter;
    const w = stage.clientWidth, h = stage.clientHeight;

    const engine = Engine.create();
    engine.gravity.y = 0.35;

    const walls = [
      Bodies.rectangle(w/2, -10, w, 20, {isStatic:true}),
      Bodies.rectangle(w/2, h+10, w, 20, {isStatic:true}),
      Bodies.rectangle(-10, h/2, 20, h, {isStatic:true}),
      Bodies.rectangle(w+10, h/2, 20, h, {isStatic:true}),
    ];
    Composite.add(engine.world, walls);

    const cards = Array.from(stage.querySelectorAll('.phys-card'));
    const perRow = Math.max(2, Math.floor(w / 250));
    const bodies = cards.map((card, i)=>{
      const cw = card.offsetWidth, ch = card.offsetHeight;
      const col = i % perRow, row = Math.floor(i / perRow);
      const x = 130 + col*(w-160)/(perRow-1||1) + (Math.random()*16-8);
      const y = 70 + row*160 + Math.random()*10;
      const body = Bodies.rectangle(x, y, cw, ch, {
        restitution:0.5, friction:0.15, frictionAir:0.02,
        chamfer:{radius:14}
      });
      card.style.width = cw+'px';
      return body;
    });
    Composite.add(engine.world, bodies);

    const mouse = Mouse.create(stage);
    mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
    mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse, constraint:{stiffness:0.2, render:{visible:false}}
    });
    Composite.add(engine.world, mouseConstraint);

    mouseConstraint.mouse.element.style.touchAction = 'auto';

    const runner = Runner.create();
    Runner.run(runner, engine);

    function draggingLink(e){
      if(mouseConstraint.body) e.preventDefault();
    }
    cards.forEach(c=> c.querySelector('a')?.addEventListener('click', draggingLink));

    (function update(){
      bodies.forEach((body, i)=>{
        const card = cards[i];
        const cw = card.offsetWidth, ch = card.offsetHeight;
        const x = body.position.x - cw/2;
        const y = body.position.y - ch/2;
        card.style.transform = `translate(${x}px, ${y}px) rotate(${body.angle}rad)`;
      });
      requestAnimationFrame(update);
    })();
  });
}
