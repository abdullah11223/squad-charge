// عائق ثلاثي الأبعاد (برميل) — يحتاج عدد جنود أدنى عشان يُكسر (القسم ٥)

import * as THREE from 'three';
import { COLORS3D } from '../config/GameConfig.js';
import { makeTextSprite } from './SpriteText.js';

export class ObstacleMesh {
  constructor(scene, worldY, threshold) {
    this.scene = scene;
    this.worldY = worldY;
    this.threshold = threshold;
    this.triggered = false;

    this.group = new THREE.Group();
    this.group.position.z = -1000;
    scene.add(this.group);

    const bodyMat = new THREE.MeshStandardMaterial({ color: COLORS3D.obstacle, roughness: 0.8 });
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.95, 16), bodyMat);
    barrel.position.y = 0.48;
    barrel.castShadow = true;
    this.group.add(barrel);

    const bandMat = new THREE.MeshStandardMaterial({ color: COLORS3D.obstacleBand, roughness: 0.6 });
    for (const y of [0.24, 0.72]) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.515, 0.515, 0.09, 16), bandMat);
      band.position.y = y;
      this.group.add(band);
    }

    const label = makeTextSprite(`${threshold}+`, {
      fontSize: 42,
      color: '#ffffff',
      bg: 'rgba(20,20,30,0.75)',
      width: 160,
      height: 80,
    });
    label.position.set(0, 1.35, 0);
    label.scale.set(0.72, 0.36, 1);
    this.group.add(label);

    const warn = makeTextSprite('⚠', { fontSize: 60, width: 100, height: 100 });
    warn.position.set(0, 1.85, 0);
    warn.scale.set(0.5, 0.5, 1);
    this.group.add(warn);
  }

  setZ(z) {
    this.group.position.z = z;
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
