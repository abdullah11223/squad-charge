// كيان مجموعة الأعداء — تظهر كحائط من الجنود الحمر (أو زعيم) على مسافة معينة بالطريق

import { CANVAS_WIDTH, COLORS } from '../config/GameConfig.js';

export class EnemyWave {
  constructor(scene, worldY, count, unitDamage, isBoss = false) {
    this.scene = scene;
    this.worldY = worldY;
    this.count = count;
    this.unitDamage = unitDamage;
    this.isBoss = isBoss;
    this.triggered = false;

    this.container = scene.add.container(CANVAS_WIDTH / 2, -2000);
    this.figures = [];
    this.build();
  }

  build() {
    const cap = this.isBoss ? 48 : 24;
    const visible = Math.min(cap, this.count);
    const cols = this.isBoss ? 8 : 6;
    const spacing = this.isBoss ? 15 : 16;
    const rows = Math.max(1, Math.ceil(visible / cols));
    const startX = -((cols - 1) * spacing) / 2;
    const texKey = this.isBoss ? 'tex_boss' : 'tex_enemy';

    for (let i = 0; i < visible; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const fig = this.scene.add.image(startX + col * spacing, -row * (spacing - 1), texKey);
      if (this.isBoss) fig.setScale(1.4);
      this.container.add(fig);
      this.figures.push(fig);
    }

    if (this.count > visible) {
      const extra = this.scene.add
        .text(0, -rows * (spacing - 1) - 18, `×${this.count}`, {
          fontSize: '14px',
          fontFamily: 'Tahoma, Arial',
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 1);
      this.container.add(extra);
    }

    if (this.isBoss) {
      const label = this.scene.add
        .text(0, -rows * (spacing - 1) - 36, 'زعيم!', {
          fontSize: '20px',
          fontFamily: 'Tahoma, Arial',
          color: COLORS.danger,
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 1);
      this.container.add(label);
    }
  }

  setScreenY(y) {
    this.container.y = y;
  }

  playDefeatEffect(onComplete) {
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scale: 1.15,
      duration: 260,
      onComplete: () => {
        this.destroy();
        if (onComplete) onComplete();
      },
    });
  }

  destroy() {
    this.container.destroy();
  }
}
