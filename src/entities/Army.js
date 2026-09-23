// كيان الجيش — يُرسم كشبكة من الجنود (ستيك فيقر) وتتحرك أفقيًا بالسحب

import { ROAD_LEFT, ROAD_RIGHT, WEAPON_TIERS, weaponTier } from '../config/GameConfig.js';

const MAX_VISIBLE_FIGURES = 36;
const COLS = 6;
const SPACING_X = 17;
const SPACING_Y = 15;

export class Army {
  constructor(scene, x, y, count, weaponLevel) {
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.count = count;
    this.weaponLevel = weaponLevel;
    this.figures = [];

    this.extraText = scene.add
      .text(0, 0, '', { fontSize: '14px', fontFamily: 'Tahoma, Arial', color: '#ffd60a', fontStyle: 'bold' })
      .setOrigin(0.5, 1);
    this.container.add(this.extraText);

    this.redraw();
  }

  get damage() {
    return weaponTier(this.weaponLevel).damage;
  }

  get x() {
    return this.container.x;
  }

  get y() {
    return this.container.y;
  }

  setCount(n) {
    this.count = Math.max(0, Math.round(n));
    this.redraw();
  }

  addCount(delta) {
    this.setCount(this.count + delta);
  }

  setWeaponLevel(level) {
    this.weaponLevel = Phaser.Math.Clamp(level, 1, WEAPON_TIERS.length);
    this.redraw();
  }

  redraw() {
    const visible = Math.min(MAX_VISIBLE_FIGURES, this.count);

    while (this.figures.length < visible) {
      const fig = this.scene.add.image(0, 0, 'tex_soldier');
      this.container.addAt(fig, 0);
      this.figures.push(fig);
    }
    while (this.figures.length > visible) {
      const fig = this.figures.pop();
      fig.destroy();
    }

    const tier = weaponTier(this.weaponLevel);
    const cols = Math.min(COLS, Math.max(1, visible));
    const rows = Math.max(1, Math.ceil(visible / cols));
    const startX = -((cols - 1) * SPACING_X) / 2;

    this.figures.forEach((fig, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      fig.x = startX + col * SPACING_X;
      fig.y = -row * SPACING_Y;
      fig.setTint(tier.color);
    });

    if (this.count > visible) {
      this.extraText.setText(`+${this.count - visible}`);
      this.extraText.y = -rows * SPACING_Y - 6;
    } else {
      this.extraText.setText('');
    }
  }

  setX(targetX) {
    const half = 26;
    this.container.x = Phaser.Math.Clamp(targetX, ROAD_LEFT + half, ROAD_RIGHT - half);
  }

  setScreenY(y) {
    this.container.y = y;
  }

  flashHit() {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0.35,
      duration: 90,
      yoyo: true,
      repeat: 1,
    });
  }

  destroy() {
    this.container.destroy();
  }
}
