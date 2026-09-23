// مصنع شخصيات "ستيك فيقر" ثلاثية الأبعاد بأسلوب chibi بسيط — مبنية بالكامل من أشكال هندسية
// أولية بالكود (كرات/كبسولات/أسطوانات)، بدون أي نماذج أو أصول خارجية.

import * as THREE from 'three';

let gradientMap = null;
function getGradientMap() {
  if (gradientMap) return gradientMap;
  const canvas = document.createElement('canvas');
  canvas.width = 5;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  const shades = [55, 110, 165, 210, 255];
  for (let i = 0; i < shades.length; i++) {
    ctx.fillStyle = `rgb(${shades[i]},${shades[i]},${shades[i]})`;
    ctx.fillRect(i, 0, 1, 1);
  }
  gradientMap = new THREE.CanvasTexture(canvas);
  gradientMap.minFilter = THREE.NearestFilter;
  gradientMap.magFilter = THREE.NearestFilter;
  return gradientMap;
}

function toonMat(color) {
  return new THREE.MeshToonMaterial({ color, gradientMap: getGradientMap() });
}

const OUTLINE_COLOR = 0x14151f;
function outlineMat() {
  return new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide });
}

function addOutline(mesh, scale = 1.07) {
  const outline = new THREE.Mesh(mesh.geometry, outlineMat());
  outline.scale.setScalar(scale);
  mesh.add(outline);
}

const bodyGeo = new THREE.CapsuleGeometry(0.26, 0.4, 4, 8);
const headGeo = new THREE.SphereGeometry(0.25, 12, 10);
const helmetGeo = new THREE.SphereGeometry(0.27, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
const legGeo = new THREE.CylinderGeometry(0.085, 0.085, 0.44, 6);
const armGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.34, 6);
const packGeo = new THREE.BoxGeometry(0.22, 0.28, 0.14);
const gunGeo = new THREE.BoxGeometry(0.07, 0.07, 0.42);

function jitter(hex, range = 0.05) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, (Math.random() - 0.5) * range);
  return c;
}

export function createCharacter({ bodyColor = 0xffffff, accentColor = 0x4361ee, pantsColor = 0x2b2d42, skinColor = 0xffd9b0 } = {}) {
  const group = new THREE.Group();

  const body = new THREE.Mesh(bodyGeo, toonMat(jitter(bodyColor)));
  body.position.y = 0.52;
  addOutline(body, 1.08);
  group.add(body);

  const pack = new THREE.Mesh(packGeo, toonMat(jitter(pantsColor, 0.03)));
  pack.position.set(0, 0.58, -0.22);
  group.add(pack);

  const head = new THREE.Mesh(headGeo, toonMat(skinColor));
  head.position.y = 1.0;
  addOutline(head, 1.1);
  group.add(head);

  const helmet = new THREE.Mesh(helmetGeo, toonMat(accentColor));
  helmet.position.y = 1.03;
  group.add(helmet);

  const armL = new THREE.Mesh(armGeo, toonMat(jitter(bodyColor)));
  armL.position.set(-0.32, 0.58, 0);
  armL.rotation.z = 0.25;
  const armR = armL.clone();
  armR.position.x = 0.32;
  armR.rotation.z = -0.25;
  group.add(armL, armR);

  const gun = new THREE.Mesh(gunGeo, toonMat(0x3a3d46));
  gun.position.set(0.36, 0.5, 0.16);
  gun.rotation.y = 0.3;
  group.add(gun);

  const legGroupL = new THREE.Mesh(legGeo, toonMat(jitter(pantsColor)));
  legGroupL.position.set(-0.12, 0.2, 0);
  const legGroupR = legGroupL.clone();
  legGroupR.position.x = 0.12;
  group.add(legGroupL, legGroupR);

  group.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = false;
    }
  });

  group.userData.legs = [legGroupL, legGroupR];
  group.userData.arms = [armL, armR];
  group.userData.helmet = helmet;
  group.userData.body = body;
  group.userData.walkPhase = Math.random() * Math.PI * 2;

  return group;
}

export function retint(character, accentColor, bodyColor) {
  character.userData.helmet.material.color.set(accentColor);
  if (bodyColor !== undefined) character.userData.body.material.color.set(bodyColor);
}

export function animateWalk(character, t, speed = 8) {
  const phase = t * speed + character.userData.walkPhase;
  const swing = Math.sin(phase) * 0.55;
  const [legL, legR] = character.userData.legs;
  const [armL, armR] = character.userData.arms;
  legL.rotation.x = swing;
  legR.rotation.x = -swing;
  armL.rotation.x = -swing * 0.8;
  armR.rotation.x = swing * 0.8;
  character.position.y = Math.abs(Math.sin(phase)) * 0.035;
  character.rotation.z = Math.sin(phase * 2) * 0.03;
  character.userData.helmet.rotation.y = Math.sin(phase * 0.5) * 0.15;
}

export function layoutFormation(count, cap, spacing, maxCols = 6) {
  const visible = Math.min(cap, count);
  const cols = Math.min(maxCols, Math.max(1, visible));
  const rows = Math.max(1, Math.ceil(visible / cols));
  const positions = [];
  const startX = -((cols - 1) * spacing) / 2;
  for (let i = 0; i < visible; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({ x: startX + col * spacing, z: row * spacing * 0.9 });
  }
  return { visible, positions, rows, cols };
}
