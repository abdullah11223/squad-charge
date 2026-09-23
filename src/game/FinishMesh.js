// خط النهاية — قوس علم يعبر الطريق كامل

import * as THREE from 'three';
import { ROAD_WIDTH, ROAD_HALF } from '../config/GameConfig.js';
import { makeTextSprite } from './SpriteText.js';

export class FinishMesh {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.position.z = -3000;
    scene.add(this.group);

    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const postGeo = new THREE.BoxGeometry(0.16, 2.6, 0.16);
    const postL = new THREE.Mesh(postGeo, postMat);
    postL.position.set(-ROAD_HALF, 1.3, 0);
    const postR = postL.clone();
    postR.position.x = ROAD_HALF;
    this.group.add(postL, postR);

    const bannerCanvas = document.createElement('canvas');
    bannerCanvas.width = 512;
    bannerCanvas.height = 96;
    const ctx = bannerCanvas.getContext('2d');
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#111111' : '#ffffff';
      ctx.fillRect((i * bannerCanvas.width) / 16, 0, bannerCanvas.width / 16, bannerCanvas.height);
    }
    const bannerTex = new THREE.CanvasTexture(bannerCanvas);
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_WIDTH + 0.3, 0.5),
      new THREE.MeshBasicMaterial({ map: bannerTex })
    );
    banner.position.set(0, 2.4, 0);
    this.group.add(banner);

    const label = makeTextSprite('🏁 النهاية 🏁', {
      fontSize: 40,
      color: '#111111',
      bg: 'rgba(255,255,255,0.92)',
      width: 320,
      height: 90,
    });
    label.position.set(0, 3.1, 0);
    label.scale.set(1.5, 0.42, 1);
    this.group.add(label);
  }

  setZ(z) {
    this.group.position.z = z;
  }
}
