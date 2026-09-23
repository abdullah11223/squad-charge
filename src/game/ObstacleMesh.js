// عائق ثلاثي الأبعاد (برميل) — يحتاج عدد جنود أدنى عشان يُكسر (القسم ٥)
// مع مسدس/بندقية عائمة فوقه كديكور (زي فيديو المرجع)

import * as THREE from 'three';
import { COLORS3D } from '../config/GameConfig.js';
import { makeTextSprite } from './SpriteText.js';

let woodTexture = null;
function getWoodTexture() {
  if (woodTexture) return woodTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#8a5a34';
  ctx.fillRect(0, 0, 64, 64);
  for (let x = 0; x < 64; x += 5) {
    ctx.strokeStyle = `rgba(60,35,15,${0.15 + Math.random() * 0.25})`;
    ctx.lineWidth = 1 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x + (Math.random() - 0.5) * 3, 0);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, 64);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = 'rgba(40,22,10,0.3)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    const y = Math.random() * 64;
    ctx.moveTo(0, y);
    ctx.lineTo(64, y + (Math.random() - 0.5) * 6);
    ctx.stroke();
  }
  woodTexture = new THREE.CanvasTexture(canvas);
  woodTexture.wrapS = THREE.RepeatWrapping;
  woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(3, 1);
  return woodTexture;
}

function buildWeaponProp() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x9fb4c9, metalness: 0.7, roughness: 0.25 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2d3a, metalness: 0.5, roughness: 0.4 });

  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.09), metal);
  barrel.position.set(0.1, 0.06, 0);
  group.add(barrel);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.11), dark);
  body.position.set(-0.16, 0.02, 0);
  group.add(body);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.09), dark);
  grip.position.set(-0.22, -0.14, 0);
  grip.rotation.z = -0.35;
  group.add(grip);

  group.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });

  const glowMat = new THREE.MeshBasicMaterial({ color: 0x66d1ff, transparent: true, opacity: 0.35 });
  const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20), glowMat);
  glow.position.y = -0.28;

  const wrapper = new THREE.Group();
  wrapper.add(group, glow);
  wrapper.userData.gun = group;
  return wrapper;
}

export class ObstacleMesh {
  constructor(scene, worldY, threshold) {
    this.scene = scene;
    this.worldY = worldY;
    this.threshold = threshold;
    this.triggered = false;
    this.time = Math.random() * Math.PI * 2;

    this.group = new THREE.Group();
    this.group.position.z = -1000;
    scene.add(this.group);

    const bodyMat = new THREE.MeshStandardMaterial({ map: getWoodTexture(), roughness: 0.85 });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.95, 16), bodyMat);
    barrel.position.y = 0.48;
    barrel.castShadow = true;
    this.group.add(barrel);

    const bandMat = new THREE.MeshStandardMaterial({ color: COLORS3D.obstacleBand, roughness: 0.5, metalness: 0.4 });
    for (const y of [0.24, 0.72]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.515, 0.515, 0.09, 16), bandMat);
      band.position.y = y;
      this.group.add(band);
    }

    this.weaponProp = buildWeaponProp();
    this.weaponProp.position.set(0, 1.55, 0);
    this.group.add(this.weaponProp);

    const label = makeTextSprite(`${threshold}+`, {
      fontSize: 42,
      color: '#ffffff',
      bg: 'rgba(20,20,30,0.75)',
      width: 160,
      height: 80,
    });
    label.position.set(0, 1.05, 0);
    label.scale.set(0.72, 0.36, 1);
    this.group.add(label);

    const warn = makeTextSprite('⚠', { fontSize: 60, width: 100, height: 100 });
    warn.position.set(0, 0.55, 0.45);
    warn.scale.set(0.4, 0.4, 1);
    this.group.add(warn);
  }

  setZ(z) {
    this.group.position.z = z;
  }

  update(dt) {
    this.time += dt;
    this.weaponProp.position.y = 1.55 + Math.sin(this.time * 2) * 0.08;
    this.weaponProp.userData.gun.rotation.y = this.time * 1.2;
  }

  playResolveEffect(broken) {
    const start = performance.now();
    const duration = broken ? 280 : 220;
    this.group.traverse((o) => {
      if (o.isMesh) o.material.transparent = true;
    });
    const animate = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      if (broken) {
        this.group.scale.setScalar(1 + t * 0.5);
      } else {
        this.group.scale.x = 1 - t * 0.4;
      }
      this.group.traverse((o) => {
        if (o.isMesh) o.material.opacity = 1 - t;
      });
      if (t < 1) requestAnimationFrame(animate);
      else this.destroy();
    };
    requestAnimationFrame(animate);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
