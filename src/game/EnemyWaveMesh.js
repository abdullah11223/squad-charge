// تمثيل مجموعة الأعداء ثلاثية الأبعاد — حائط من الشخصيات الحمر (أو زعيم أكبر)

import * as THREE from 'three';
import { createCharacter, animateWalk, layoutFormation } from './CharacterFactory.js';
import { COLORS3D } from '../config/GameConfig.js';

export class EnemyWaveMesh {
  constructor(scene, worldY, count, unitDamage, isBoss = false) {
    this.scene = scene;
    this.worldY = worldY;
    this.count = count;
    this.unitDamage = unitDamage;
    this.isBoss = isBoss;
    this.triggered = false;
    this.time = 0;

    this.group = new THREE.Group();
    this.group.position.z = -1000;
    scene.add(this.group);

    this.figures = [];
    this.build();
  }

  build() {
    const cap = this.isBoss ? 40 : 22;
    const spacing = this.isBoss ? 0.66 : 0.62;
    const { visible, positions } = layoutFormation(this.count, cap, spacing, this.isBoss ? 8 : 6);
    const scale = this.isBoss ? 1.5 : 1;

    for (let i = 0; i < visible; i++) {
      const fig = createCharacter({
        bodyColor: COLORS3D.enemyBody,
        accentColor: this.isBoss ? COLORS3D.bossAccent : COLORS3D.enemyAccent,
        pantsColor: 0x3d1f1f,
      });
      fig.position.set(positions[i].x, 0, positions[i].z);
      fig.scale.setScalar(scale);
      this.group.add(fig);
      this.figures.push(fig);
    }
  }

  setZ(z) {
    this.group.position.z = z;
  }

  update(dt) {
    this.time += dt;
    this.figures.forEach((fig) => animateWalk(fig, this.time, 6));
  }

  playDefeatEffect(onComplete) {
    const start = performance.now();
    const duration = 260;
    const animate = () => {
      const t = Math.min(1, (performance.now() - start) / duration);
      this.group.scale.setScalar(1 + t * 0.2);
      this.figures.forEach((fig) => {
        fig.traverse((o) => {
          if (o.isMesh) o.material.opacity = 1 - t;
        });
      });
      if (t < 1) requestAnimationFrame(animate);
      else {
        this.destroy();
        if (onComplete) onComplete();
      }
    };
    this.figures.forEach((fig) =>
      fig.traverse((o) => {
        if (o.isMesh) {
          o.material.transparent = true;
        }
      })
    );
    requestAnimationFrame(animate);
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
