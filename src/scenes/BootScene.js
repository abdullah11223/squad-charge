// شاشة البداية — تولّد كل الرسومات (ستيك فيقر + جسيمات) بالكود، بدون أي أصول خارجية

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create() {
    this.generateStickFigure('tex_soldier', 1);
    this.generateStickFigure('tex_enemy', 1);
    this.generateStickFigure('tex_boss', 1.6);
    this.generateParticle();

    this.scene.start('MenuScene');
  }

  generateStickFigure(key, scale) {
    const w = Math.ceil(16 * scale);
    const h = Math.ceil(24 * scale);
    const g = this.add.graphics();
    const cx = w / 2;
    const headR = 3.2 * scale;

    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx, headR + 1, headR);

    g.lineStyle(2.4 * scale, 0xffffff, 1);
    g.beginPath();
    // الجذع
    g.moveTo(cx, headR * 2 + 1);
    g.lineTo(cx, h - 8 * scale);
    // الذراعين
    g.moveTo(cx, headR * 2 + 5);
    g.lineTo(cx - 5.5 * scale, headR * 2 + 11);
    g.moveTo(cx, headR * 2 + 5);
    g.lineTo(cx + 5.5 * scale, headR * 2 + 11);
    // الرجلين
    g.moveTo(cx, h - 8 * scale);
    g.lineTo(cx - 4.5 * scale, h - 1);
    g.moveTo(cx, h - 8 * scale);
    g.lineTo(cx + 4.5 * scale, h - 1);
    g.strokePath();

    g.generateTexture(key, w, h);
    g.destroy();
  }

  generateParticle() {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture('tex_particle', 8, 8);
    g.destroy();
  }
}
