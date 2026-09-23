// شاشة مشتركة لنهاية المرحلة (فوز) ونهاية المحاولة (خسارة) — القسم ٨

import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, TOTAL_LEVELS } from '../config/GameConfig.js';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    this.runData = data;
  }

  create() {
    this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS.bg).setOrigin(0);
    if (this.runData.result === 'win') this.buildWin();
    else this.buildLose();
  }

  buildWin() {
    const { level, stars, coinsEarned, soldiersLeft } = this.runData;

    this.add
      .text(CANVAS_WIDTH / 2, 160, '🎉 المرحلة اكتملت!', {
        fontSize: '27px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5);

    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    this.add.text(CANVAS_WIDTH / 2, 222, starStr, { fontSize: '40px' }).setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, 288, `الجنود المتبقين: ${soldiersLeft}`, {
        fontSize: '16px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.textDim,
        rtl: true,
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, 320, `🪙 العملات المكتسبة: ${coinsEarned}`, {
        fontSize: '18px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.gold,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5);

    const isLast = level >= TOTAL_LEVELS;
    let y = 420;
    if (!isLast) {
      this.makeButton(CANVAS_WIDTH / 2, y, 'التالي ›', () => this.scene.start('GameScene', { level: level + 1 }), COLORS.successNum);
      y += 76;
    }
    this.makeButton(CANVAS_WIDTH / 2, y, 'إعادة المحاولة', () => this.scene.start('GameScene', { level }));
    y += 76;
    this.makeButton(CANVAS_WIDTH / 2, y, 'القائمة الرئيسية', () => this.scene.start('MenuScene'));
  }

  buildLose() {
    const { level } = this.runData;

    this.add
      .text(CANVAS_WIDTH / 2, 240, '💀 انتهت المحاولة', {
        fontSize: '28px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.danger,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, 288, 'جيشك انهزم بالكامل', {
        fontSize: '16px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.textDim,
        rtl: true,
      })
      .setOrigin(0.5);

    this.makeButton(CANVAS_WIDTH / 2, 390, 'إعادة المحاولة', () => this.scene.start('GameScene', { level }), COLORS.successNum);
    this.makeButton(CANVAS_WIDTH / 2, 466, 'القائمة الرئيسية', () => this.scene.start('MenuScene'));
  }

  makeButton(x, y, label, onClick, color = COLORS.panel) {
    const w = 260;
    const h = 60;
    const bg = this.add
      .rectangle(x, y, w, h, color, 1)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontSize: '20px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5);

    bg.on('pointerdown', () => bg.setScale(0.97));
    bg.on('pointerup', () => {
      bg.setScale(1);
      onClick();
    });
    bg.on('pointerout', () => bg.setScale(1));
  }
}
