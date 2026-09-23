// شاشة اختيار المستويات — شبكة ٥×٥، يبين المقفول والمفتوح والنجوم

import { SaveManager } from '../systems/SaveManager.js';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, TOTAL_LEVELS } from '../config/GameConfig.js';

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super('LevelSelectScene');
  }

  create() {
    this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS.bg).setOrigin(0);

    this.add
      .text(CANVAS_WIDTH / 2, 50, 'اختر المرحلة', {
        fontSize: '26px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5);

    const cols = 5;
    const size = 76;
    const gap = 12;
    const totalW = cols * size + (cols - 1) * gap;
    const startX = (CANVAS_WIDTH - totalW) / 2 + size / 2;
    const startY = 130;

    for (let i = 0; i < TOTAL_LEVELS; i++) {
      const level = i + 1;
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (size + gap);
      const y = startY + row * (size + gap);
      this.makeLevelCell(x, y, size, level);
    }

    this.makeBackButton();
  }

  makeLevelCell(x, y, size, level) {
    const unlocked = SaveManager.isLevelUnlocked(level);
    const stars = SaveManager.getLevelStars(level);
    const color = unlocked ? COLORS.panel : 0x14151f;

    const cell = this.add
      .rectangle(x, y, size, size, color, 1)
      .setStrokeStyle(2, unlocked ? 0xffffff : 0x333344, 0.4);

    if (unlocked) {
      cell.setInteractive({ useHandCursor: true });
      cell.on('pointerdown', () => cell.setScale(0.94));
      cell.on('pointerup', () => {
        cell.setScale(1);
        this.scene.start('GameScene', { level });
      });
      cell.on('pointerout', () => cell.setScale(1));
    }

    this.add
      .text(x, y - 10, unlocked ? String(level) : '🔒', {
        fontSize: unlocked ? '24px' : '20px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (unlocked) {
      const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      this.add.text(x, y + 20, starStr, { fontSize: '11px' }).setOrigin(0.5);
    }
  }

  makeBackButton() {
    const btn = this.add
      .text(24, 40, 'رجوع ›', {
        fontSize: '20px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.textDim,
        fontStyle: 'bold',
      })
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
