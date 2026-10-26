const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

let currentIndex = 0;

function showImage(index){
  currentIndex = (index + galleryItems.length) % galleryItems.length;
  const item = galleryItems[currentIndex];
  const img = item.querySelector('img');
  const caption = item.querySelector('.gallery-caption');
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightboxCaption.textContent = caption ? caption.textContent : '';
}

galleryItems.forEach((item, index) => {
  item.addEventListener('click', () => {
    showImage(index);
    lightbox.classList.add('open');
  });
});

function closeLightbox(){ lightbox.classList.remove('open'); }

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

lightbox.addEventListener('click', (e) => {
  if(e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if(!lightbox.classList.contains('open')) return;
  if(e.key === 'Escape') closeLightbox();
  if(e.key === 'ArrowLeft') showImage(currentIndex - 1);
  if(e.key === 'ArrowRight') showImage(currentIndex + 1);
});

// swipe support for mobile
let touchStartX = 0;
lightbox.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
});
lightbox.addEventListener('touchend', (e) => {
  const touchEndX = e.changedTouches[0].clientX;
  const diff = touchEndX - touchStartX;
  if(Math.abs(diff) > 50){
    diff > 0 ? showImage(currentIndex - 1) : showImage(currentIndex + 1);
  }
});

const navToggleBtn = document.getElementById('navToggle');
const navLinksMobile = document.getElementById('navLinksMobile');
const siteHeader = document.getElementById('siteHeader');

navToggleBtn.addEventListener('click', () => {
  const isOpen = navLinksMobile.classList.toggle('open');
  navToggleBtn.classList.toggle('open', isOpen);
  navToggleBtn.setAttribute('aria-expanded', isOpen);
});

function onScroll(){
  siteHeader.classList.toggle('scrolled', window.scrollY > 8);
}
onScroll();
window.addEventListener('scroll', onScroll, {passive:true});

/*src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js">*/


(function(){
const container = document.getElementById('impactStage');
if(!container || typeof THREE === 'undefined') return;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, 0.6, 5.2);

const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

const textureLoader = new THREE.TextureLoader();
/*const moonTexture = textureLoader.load('lroc_color_2k.jpg'
);
moonTexture.colorSpace = THREE.SRGBColorSpace;*/

function resize(){
  const size = container.clientWidth;
  if(size === 0) return;
  renderer.setSize(size, size, false);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
}
resize();
window.__impactResize = resize;
window.addEventListener('resize', resize);
window.addEventListener('load', resize);

scene.add(new THREE.AmbientLight(0x404850, 0.4));
const sun = new THREE.DirectionalLight(0xfff6e8, 1.4);
sun.position.set(3, 2.2, 4);
scene.add(sun);
const rim = new THREE.PointLight(0x3e6e64, 1.1, 12);
rim.position.set(-3, -1, 2);
scene.add(rim);

// impact flash light (off by default)
const flashLight = new THREE.PointLight(0xffb066, 0, 8, 2);
scene.add(flashLight);

// --- cratered moon, higher resolution ---
const geo = new THREE.IcosahedronGeometry(1.5, 10);
const posAttr = geo.attributes.position;
const v = new THREE.Vector3();
const craterCenters = [
  {c:new THREE.Vector3(0.62,0.48,0.60).normalize(), r:0.34, d:0.45},
  {c:new THREE.Vector3(-0.55,0.18,0.78).normalize(), r:0.20, d:0.30},
  {c:new THREE.Vector3(0.10,-0.72,0.58).normalize(), r:0.26, d:0.35},
  {c:new THREE.Vector3(-0.35,-0.45,-0.65).normalize(), r:0.15, d:0.22},
  {c:new THREE.Vector3(0.70,-0.10,-0.55).normalize(), r:0.12, d:0.18},
  {c:new THREE.Vector3(-0.75,0.55,-0.20).normalize(), r:0.22, d:0.28}
];
for(let i=0;i<posAttr.count;i++){
  v.fromBufferAttribute(posAttr, i);
  const n = v.clone().normalize();
  let bump = 0;
  bump += Math.sin(n.x*11 + n.y*7)*0.012;
  bump += Math.sin(n.y*18 + n.z*13)*0.008;
  bump += Math.sin(n.z*26 + n.x*21)*0.005;
  craterCenters.forEach(cr=>{
    const dist = n.distanceTo(cr.c);
    if(dist < cr.r){
      const f = 1 - dist/cr.r;
      bump -= f*f*cr.d*0.4;
      if(dist > cr.r*0.7) bump += f*0.06; // raised rim
    }
  });
  v.copy(n.multiplyScalar(1.5 + bump));
  posAttr.setXYZ(i, v.x, v.y, v.z);
}
geo.computeVertexNormals();
const moon = new THREE.Mesh(
  geo,
  new THREE.MeshStandardMaterial({color:0x9a968d, roughness:0.98, metalness:0.02, flatShading:false})
);
scene.add(moon);

// impact glow ring, appears briefly at impact site
const glowGeo = new THREE.RingGeometry(0.001, 0.4, 48);
const glowMat = new THREE.MeshBasicMaterial({color:0xffb066, transparent:true, opacity:0, side:THREE.DoubleSide, blending:THREE.AdditiveBlending});
const glowRing = new THREE.Mesh(glowGeo, glowMat);
scene.add(glowRing);

// asteroid
const asteroid = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.09, 2),
  new THREE.MeshStandardMaterial({color:0x3a332c, roughness:1})
);
scene.add(asteroid);

// dust trail
const trailCount = 44;
const trailGeo = new THREE.BufferGeometry();
const trailPos = new Float32Array(trailCount*3);
trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({color:0xcfc6b8, size:0.032, transparent:true, opacity:0.45}));
scene.add(trail);
let trailHistory = [];

// heat/ejecta burst — colored per-particle, hot core cooling to grey dust
const burstCount = 130;
const burstGeo = new THREE.BufferGeometry();
const burstPos = new Float32Array(burstCount*3);
const burstCol = new Float32Array(burstCount*3);
const burstVel = [];
const burstSpeed = [];
for(let i=0;i<burstCount;i++){
  const dir = new THREE.Vector3((Math.random()-0.5),(Math.random()*0.7+0.1),(Math.random()-0.5)).normalize();
  burstVel.push(dir);
  burstSpeed.push(0.012 + Math.random()*0.028);
}
burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPos,3));
burstGeo.setAttribute('color', new THREE.BufferAttribute(burstCol,3));
const burstMat = new THREE.PointsMaterial({size:0.05, vertexColors:true, transparent:true, opacity:0, blending:THREE.AdditiveBlending});
const burst = new THREE.Points(burstGeo, burstMat);
scene.add(burst);

const hotColor = new THREE.Color(0xffffff);
const midColor = new THREE.Color(0xff9a4d);
const coolColor = new THREE.Color(0x8a8378);

const impactPoint = craterCenters[0].c.clone().multiplyScalar(1.55);
const startPoint = new THREE.Vector3(3.2, 2.0, 2.4);

let t = 0, phase = 'approach', phaseTimer = 0;
function resetApproach(){ phase='approach'; t=0; trailHistory=[]; burstMat.opacity=0; glowMat.opacity=0; flashLight.intensity=0; }

glowRing.lookAt(impactPoint.clone().multiplyScalar(2));
glowRing.position.copy(impactPoint).multiplyScalar(1.001);

const clock = new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  moon.rotation.y += dt * 0.12;
  glowRing.rotation.y += dt * 0.12;

  if(phase === 'approach'){
    t += dt * 0.18;
    if(t >= 1){
      t = 1; phase = 'burst'; phaseTimer = 0;
      burstMat.opacity = 1;
      glowMat.opacity = 0.85;
      flashLight.position.copy(impactPoint).multiplyScalar(1.3);
      flashLight.intensity = 3.5;
      for(let i=0;i<burstCount;i++){
        burstPos[i*3]=impactPoint.x; burstPos[i*3+1]=impactPoint.y; burstPos[i*3+2]=impactPoint.z;
        burstCol[i*3]=hotColor.r; burstCol[i*3+1]=hotColor.g; burstCol[i*3+2]=hotColor.b;
      }
      burstGeo.attributes.color.needsUpdate = true;
    }
    asteroid.position.lerpVectors(startPoint, impactPoint, t);
    trailHistory.unshift(asteroid.position.clone());
    if(trailHistory.length > trailCount) trailHistory.pop();
    for(let i=0;i<trailCount;i++){
      const p = trailHistory[i] || impactPoint;
      trailPos[i*3]=p.x; trailPos[i*3+1]=p.y; trailPos[i*3+2]=p.z;
    }
    trailGeo.attributes.position.needsUpdate = true;
    asteroid.visible = true;
  }

  if(phase === 'burst'){
    phaseTimer += dt;
    const cool = Math.min(phaseTimer / 1.6, 1);
    const tmpColor = new THREE.Color();
    for(let i=0;i<burstCount;i++){
      burstPos[i*3]   += burstVel[i].x * burstSpeed[i];
      burstPos[i*3+1] += burstVel[i].y * burstSpeed[i] - cool*0.0006;
      burstPos[i*3+2] += burstVel[i].z * burstSpeed[i];
      if(cool < 0.4) tmpColor.copy(hotColor).lerp(midColor, cool/0.4);
      else tmpColor.copy(midColor).lerp(coolColor, (cool-0.4)/0.6);
      burstCol[i*3]=tmpColor.r; burstCol[i*3+1]=tmpColor.g; burstCol[i*3+2]=tmpColor.b;
    }
    burstGeo.attributes.position.needsUpdate = true;
    burstGeo.attributes.color.needsUpdate = true;
    burstMat.opacity = Math.max(0, 1 - phaseTimer*0.55);
    glowMat.opacity = Math.max(0, 0.85 - phaseTimer*0.9);
    flashLight.intensity = Math.max(0, 3.5 - phaseTimer*3.2);
    asteroid.visible = false;
    if(phaseTimer > 1.9){ phase = 'pause'; phaseTimer = 0; }
  }

  if(phase === 'pause'){
    phaseTimer += dt;
    if(phaseTimer > 1.0) resetApproach();
  }

  renderer.render(scene, camera);
}
animate();
})();

const pages = document.querySelectorAll('.page');
const navButtons = document.querySelectorAll('[data-nav]');
const navLinks = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');

function showPage(id){
  pages.forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + id);
  if(target) target.classList.add('active');
  if(id === 'about' && typeof window.__impactResize === 'function'){
    requestAnimationFrame(() => window.__impactResize());
  }
  document.querySelectorAll('.navlinks button').forEach(b=>{
    b.classList.toggle('active', b.dataset.nav === id);
  });
  window.scrollTo({top:0, behavior:'smooth'});
  if(navLinks) navLinks.classList.remove('open');
}

navButtons.forEach(el=>{
  el.addEventListener('click', (e)=>{
    e.preventDefault();
    showPage(el.dataset.nav);
  });
});

if(navToggle){
  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

showPage('home');

const revealEls = document.querySelectorAll('[data-reveal]');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => revealObserver.observe(el));

document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const text = btn.getAttribute('data-copy');
    const label = btn.getAttribute('data-label');
    try{
      await navigator.clipboard.writeText(text);
      const original = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => { btn.textContent = original; }, 1600);
    }catch(e){
      alert('Could not copy — please copy manually.');
    }
  });
});
