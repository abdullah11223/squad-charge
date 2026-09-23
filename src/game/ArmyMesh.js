// تمثيل الجيش ثلاثي الأبعاد — تشكيلة من الشخصيات تتبع القائد وتتحرك أفقيًا بالسحب

import * as THREE from 'three';
import { createCharacter, retint, animateWalk, layoutFormation } from './CharacterFactory.js';
import { weaponTier, COLORS3D, ROAD_HALF, clamp } from '../config/GameConfig.js';

const CAP = 30;
const SPACING = 0.6;

export class ArmyMesh {
  constructor(scene, count, weaponLevel) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.count = count;
    this.weaponLevel = weaponLevel;
    this.figures = [];
    this.time = 0;

    this.redraw();
  }

  get damage() {
    return weaponTier(this.weaponLevel).damage;
  }

  get x() {
    return this.group.position.x;
  }

  get z() {
    return this.group.position.z;
  }

  setCount(n) {
    this.count = Math.max(0, Math.round(n));
    this.redraw();
  }

  addCount(delta) {
    this.setCount(this.count + delta);
  }

  setWeaponLevel(level) {
    this.weaponLevel = clamp(level, 1, 7);
    this.redraw();
  }

  redraw() {
    const tier = weaponTier(this.weaponLevel);
    const { visible, positions } = layoutFormation(this.count, CAP, SPACING);

    while (this.figures.length < visible) {
      const fig = createCharacter({ bodyColor: COLORS3D.armyBody, accentColor: tier.color, pantsColor: COLORS3D.armyPants });
      this.group.add(fig);
      this.figures.push(fig);
    }
    while (this.figures.length > visible) {
      const fig = this.figures.pop();
      this.group.remove(fig);
    }

    this.figures.forEach((fig, i) => {
      fig.position.x = positions[i].x;
      fig.position.z = positions[i].z;
      retint(fig, tier.color);
    });
  }

  setX(targetX) {
    const half = 0.9;
    this.group.position.x = clamp(targetX, -ROAD_HALF + half, ROAD_HALF - half);
  }

  setZ(z) {
    this.group.position.z = z;
  }

  update(dt) {
    this.time += dt;
    this.figures.forEach((fig) => animateWalk(fig, this.time));
  }

  flashHit() {
    // نبضة حمراء بسيطة على كل شخصية عند تلقي ضرر
    this.figures.forEach((fig) => {
      const body = fig.userData.body;
      const original = body.material.color.getHex();
      body.material.color.set(0xff6b6b);
      setTimeout(() => body.material.color.set(original), 120);
    });
  }

  destroy() {
    this.scene.remove(this.group);
  }
}
