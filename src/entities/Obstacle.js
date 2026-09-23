// كيان العائق (برميل) — يحتاج عدد جنود أدنى عشان يُكسر (القسم ٥)

import { CANVAS_WIDTH, COLORS } from '../config/GameConfig.js';

export class Obstacle {
  constructor(scene, worldY, threshold) {
    this.scene = scene;
    this.worldY = worldY;
    this.threshold = threshold;
    this.triggered = false;

    this.container = scene.add.container(CANVAS_WIDTH / 2, -2000);

    const barrel = scene.add.graphics();
    barrel.fillStyle(COLORS.obstacle, 1);
    barrel.fillRoundedRect(-46, -56, 92, 112, 16);
    barrel.lineStyle(4, 0x2b1a0a, 1);
    barrel.strokeRoundedRect(-46, -56, 92, 112, 16);
    barrel.fillStyle(0x2b1a0a, 0.7);
    barrel.fillRect(-46, -20, 92, 7);
    barrel.fillRect(-46, 14, 92, 7);

    const warn = scene.add.text(0, -84, '⚠️', { fontSize: '26px' }).setOrigin(0.5);
    const label = scene.add
      .text(0, 2, `${threshold}+`, {
        fontSize: '22px',
        fontFamily: 'Tahoma, Arial',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.container.add([barrel, warn, label]);
  }

  setScreenY(y) {
    this.container.y = y;
  }

  playResolveEffect(broken) {
    if (broken) {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        scale: 1.3,
        duration: 260,
        onComplete: () => this.destroy(),
      });
    } else {
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        scaleX: 0.6,
        duration: 200,
        onComplete: () => this.destroy(),
      });
    }
  }

  destroy() {
    this.container.destroy();
  }
}
