// بوابة ثلاثية الأبعاد — قوس مضيء لكل خيار بعرض حارة، مع أيقونة ورقم عائمين (القسم ٤)

import * as THREE from 'three';
import { ROAD_WIDTH, ROAD_HALF, COLORS3D } from '../config/GameConfig.js';
import { makeTextSprite } from './SpriteText.js';

const ICONS = {
  addPercent: '➕',
  multiply: '✖',
  weaponUp: '🔫',
  powerMerge: '🔗',
  fireRate: '⚡',
  subPercent: '➖',
  divide: '➗',
  weaponDown: '💢',
  slow: '🐢',
  trap: '💀',
};

export class GateMesh {
  constructor(scene, worldY, gates) {
    this.scene = scene;
    this.worldY = worldY;
    this.gates = gates;
    this.triggered = false;

    this.group = new THREE.Group();
    this.group.position.z = -1000;
    scene.add(this.group);

    this.slots = [];
    const n = gates.length;
    const slotWidth = ROAD_WIDTH / n;

    gates.forEach((gate, i) => {
      const x0 = -ROAD_HALF + slotWidth * i;
      const x1 = x0 + slotWidth;
      const cx = x0 + slotWidth / 2;
      const color = gate.color === 'blue' ? COLORS3D.gateBlue : COLORS3D.gateRed;

      const slotGroup = new THREE.Group();
      slotGroup.position.x = cx;

      const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35 });
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(slotWidth * 0.42, slotWidth * 0.42, 0.05, 20), glowMat);
      glow.position.y = 0.03;
      slotGroup.add(glow);

      const pillarMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.4 });
      const pillarGeo = new THREE.BoxGeometry(0.12, 2.2, 0.12);
      const pillarL = new THREE.Mesh(pillarGeo, pillarMat);
      pillarL.position.set(-slotWidth * 0.38, 1.1, 0);
      const pillarR = pillarL.clone();
      pillarR.position.x = slotWidth * 0.38;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(slotWidth * 0.76, 0.14, 0.14), pillarMat);
      bar.position.y = 2.2;
      slotGroup.add(pillarL, pillarR, bar);

      const icon = makeTextSprite(ICONS[gate.type] || '?', { fontSize: 60, width: 128, height: 128 });
      icon.position.set(0, 1.55, 0);
      icon.scale.set(0.6, 0.6, 1);
      slotGroup.add(icon);

      const label = makeTextSprite(gate.label, {
        fontSize: 40,
        color: '#ffffff',
        bg: gate.color === 'blue' ? 'rgba(67,97,238,0.9)' : 'rgba(230,57,70,0.9)',
        width: 220,
        height: 80,
      });
      label.position.set(0, 0.9, 0);
      label.scale.set(0.85, 0.31, 1);
      slotGroup.add(label);

      this.group.add(slotGroup);
      this.slots.push({ x0, x1, gate, slotGroup, glow, pillarL, pillarR, bar, icon, label });
    });
  }

  setZ(z) {
    this.group.position.z = z;
  }

  gateForX(worldX) {
    for (const s of this.slots) {
      if (worldX >= s.x0 && worldX < s.x1) return s.gate;
    }
    if (worldX < this.slots[0].x0) return this.slots[0].gate;
    return this.slots[this.slots.length - 1].gate;
  }

  playPassEffect(chosenGate) {
    this.slots.forEach((s) => {
      const isChosen = s.gate === chosenGate;
      const start = performance.now();
      const duration = 260;
      const targetScale = isChosen ? 1.4 : 0.7;
      const animate = () => {
        const t = Math.min(1, (performance.now() - start) / duration);
        s.slotGroup.scale.setScalar(1 + (targetScale - 1) * t);
        [s.glow, s.pillarL, s.pillarR, s.bar, s.icon, s.label].forEach((obj) => {
          obj.traverse ? obj.traverse((o) => setOpacity(o, 1 - t)) : setOpacity(obj, 1 - t);
        });
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    });
    setTimeout(() => this.destroy(), 280);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}

function setOpacity(obj, opacity) {
  if (obj.material) {
    obj.material.transparent = true;
    obj.material.opacity = opacity;
  }
}
