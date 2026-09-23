// شاشة المتجر — ترقيات دائمة تُشترى بالعملات (القسم ٧)

import { SaveManager } from '../systems/SaveManager.js';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT, SHOP_UPGRADES, shopUpgradePrice } from '../config/GameConfig.js';

export class ShopScene extends Phaser.Scene {
  constructor() {
    super('ShopScene');
  }

  create() {
    this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS.bg).setOrigin(0);

    this.add
      .text(CANVAS_WIDTH / 2, 42, 'المتجر', {
        fontSize: '26px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5);

    this.coinText = this.add
      .text(CANVAS_WIDTH / 2, 78, '', {
        fontSize: '18px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.gold,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.rows = [];
    let y = 138;
    Object.values(SHOP_UPGRADES).forEach((cfg) => {
      this.buildRow(cfg, y);
      y += 116;
    });

    this.makeBackButton();
    this.refresh();
  }

  buildRow(cfg, y) {
    const w = 432;

    this.add.rectangle(CANVAS_WIDTH / 2, y, w, 98, COLORS.panel, 1).setStrokeStyle(2, 0xffffff, 0.12);

    this.add
      .text(CANVAS_WIDTH / 2 - w / 2 + 16, y - 34, cfg.name, {
        fontSize: '16px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0, 0.5);

    this.add
      .text(CANVAS_WIDTH / 2 - w / 2 + 16, y - 8, cfg.desc, {
        fontSize: '11px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.textDim,
        rtl: true,
        wordWrap: { width: w - 150 },
      })
      .setOrigin(0, 0.5);

    const levelText = this.add
      .text(CANVAS_WIDTH / 2 - w / 2 + 16, y + 26, '', {
        fontSize: '13px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.success,
        rtl: true,
      })
      .setOrigin(0, 0.5);

    const btnBg = this.add
      .rectangle(CANVAS_WIDTH / 2 + w / 2 - 56, y, 92, 46, COLORS.successNum, 1)
      .setInteractive({ useHandCursor: true });
    const btnTxt = this.add
      .text(CANVAS_WIDTH / 2 + w / 2 - 56, y, '', {
        fontSize: '14px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    btnBg.on('pointerdown', () => {
      const curLevel = SaveManager.getShopLevel(cfg.id);
      const price = shopUpgradePrice(cfg.id, curLevel);
      if (price === null) return;
      if (SaveManager.spendCoins(price)) {
        SaveManager.setShopLevel(cfg.id, curLevel + 1);
        this.refresh();
      }
    });

    this.rows.push({ cfg, levelText, btnBg, btnTxt });
  }

  refresh() {
    this.coinText.setText(`🪙 ${SaveManager.get().coins}`);
    this.rows.forEach(({ cfg, levelText, btnBg, btnTxt }) => {
      const curLevel = SaveManager.getShopLevel(cfg.id);
      const price = shopUpgradePrice(cfg.id, curLevel);
      levelText.setText(`المستوى: ${curLevel}/${cfg.maxLevel}`);

      if (price === null) {
        btnTxt.setText('مكتمل');
        btnBg.setFillStyle(0x555566);
      } else {
        const afford = SaveManager.get().coins >= price;
        btnTxt.setText(`${price} 🪙`);
        btnBg.setFillStyle(afford ? COLORS.successNum : 0x555566);
      }
    });
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
