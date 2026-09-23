// القائمة الرئيسية

import { SaveManager } from '../systems/SaveManager.js';
import { COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from '../config/GameConfig.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.add.rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS.bg).setOrigin(0);

    this.add
      .text(CANVAS_WIDTH / 2, 130, 'زحف الفرقة', {
        fontSize: '42px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        fontStyle: 'bold',
        rtl: true,
      })
      .setOrigin(0.5);

    this.add
      .text(CANVAS_WIDTH / 2, 178, 'SQUAD CHARGE', {
        fontSize: '15px',
        fontFamily: 'Arial',
        color: COLORS.textDim,
      })
      .setOrigin(0.5);

    this.coinText = this.add
      .text(CANVAS_WIDTH - 20, 24, '', {
        fontSize: '20px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.gold,
        fontStyle: 'bold',
      })
      .setOrigin(1, 0);
    this.refreshCoins();

    this.makeButton(CANVAS_WIDTH / 2, 340, 'ابدأ اللعب', () => {
      const save = SaveManager.get();
      this.scene.start('GameScene', { level: save.unlockedLevel });
    }, COLORS.successNum);

    this.makeButton(CANVAS_WIDTH / 2, 420, 'قائمة المستويات', () => {
      this.scene.start('LevelSelectScene');
    });

    this.makeButton(CANVAS_WIDTH / 2, 500, 'المتجر', () => {
      this.scene.start('ShopScene');
    });

    this.makeButton(CANVAS_WIDTH / 2, 580, 'الإعدادات', () => {
      this.toggleSettingsPanel();
    });

    this.settingsPanel = null;
  }

  refreshCoins() {
    this.coinText.setText(`🪙 ${SaveManager.get().coins}`);
  }

  makeButton(x, y, label, onClick, color = COLORS.panel) {
    const w = 280;
    const h = 64;
    const bg = this.add
      .rectangle(x, y, w, h, color, 1)
      .setStrokeStyle(2, 0xffffff, 0.25)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontSize: '22px',
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
    return bg;
  }

  toggleSettingsPanel() {
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
      return;
    }

    const panel = this.add.container(CANVAS_WIDTH / 2, 690);
    const bg = this.add.rectangle(0, 0, 300, 150, COLORS.panel, 0.98).setStrokeStyle(2, 0xffffff, 0.2);
    panel.add(bg);

    const soundTxt = this.add
      .text(0, -40, this.soundLabel(), {
        fontSize: '17px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        rtl: true,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    soundTxt.on('pointerdown', () => {
      SaveManager.setSetting('sound', !SaveManager.getSetting('sound'));
      soundTxt.setText(this.soundLabel());
    });

    const musicTxt = this.add
      .text(0, 0, this.musicLabel(), {
        fontSize: '17px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.text,
        rtl: true,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    musicTxt.on('pointerdown', () => {
      SaveManager.setSetting('music', !SaveManager.getSetting('music'));
      musicTxt.setText(this.musicLabel());
    });

    const closeTxt = this.add
      .text(0, 50, 'إغلاق', {
        fontSize: '16px',
        fontFamily: 'Tahoma, Arial',
        color: COLORS.textDim,
        rtl: true,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    closeTxt.on('pointerdown', () => {
      panel.destroy();
      this.settingsPanel = null;
    });

    panel.add([soundTxt, musicTxt, closeTxt]);
    this.settingsPanel = panel;
  }

  soundLabel() {
    return `🔊 الصوت: ${SaveManager.getSetting('sound') ? 'مفعل' : 'متوقف'}`;
  }

  musicLabel() {
    return `🎵 الموسيقى: ${SaveManager.getSetting('music') ? 'مفعلة' : 'متوقفة'}`;
  }
}
