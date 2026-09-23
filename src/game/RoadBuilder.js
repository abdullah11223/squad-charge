// بناء الطريق: أرضية متحركة الملمس + حواجز جانبية + أعمدة متكررة لإحساس العمق

import * as THREE from 'three';
import { ROAD_WIDTH, ROAD_HALF, COLORS3D } from '../config/GameConfig.js';

function buildLaneTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#' + COLORS3D.road.toString(16).padStart(6, '0');
  ctx.fillRect(0, 0, 64, 256);
  ctx.fillStyle = '#' + COLORS3D.roadLine.toString(16).padStart(6, '0');
  ctx.globalAlpha = 0.85;
  for (let y = 0; y < 256; y += 64) {
    ctx.fillRect(28, y, 8, 34);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 60);
  return tex;
}

export class RoadBuilder {
  constructor(scene) {
    this.scene = scene;
    this.texture = buildLaneTexture();

    const roadGeo = new THREE.PlaneGeometry(ROAD_WIDTH, 400);
    const roadMat = new THREE.MeshStandardMaterial({ map: this.texture, roughness: 1 });
    this.roadMesh = new THREE.Mesh(roadGeo, roadMat);
    this.roadMesh.rotation.x = -Math.PI / 2;
    this.roadMesh.position.z = -180;
    this.roadMesh.receiveShadow = true;
    scene.add(this.roadMesh);

    const railGeo = new THREE.BoxGeometry(0.22, 0.5, 400);
    const railMat = new THREE.MeshStandardMaterial({ color: COLORS3D.rail, roughness: 0.6, metalness: 0.3 });
    this.railL = new THREE.Mesh(railGeo, railMat);
    this.railL.position.set(-ROAD_HALF - 0.15, 0.2, -180);
    this.railL.castShadow = true;
    this.railR = this.railL.clone();
    this.railR.position.x = ROAD_HALF + 0.15;
    scene.add(this.railL, this.railR);

    this.postSpacing = 4;
    this.posts = [];
    const postGeo = new THREE.BoxGeometry(0.18, 1.1, 0.18);
    const postMat = new THREE.MeshStandardMaterial({ color: COLORS3D.rail, roughness: 0.5 });
    const postCount = 40;
    for (let i = 0; i < postCount; i++) {
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(side * (ROAD_HALF + 0.15), 0.55, -i * this.postSpacing);
        post.castShadow = true;
        scene.add(post);
        this.posts.push(post);
      }
    }
  }

  update(distance) {
    this.texture.offset.y = distance * 0.14;
    const mod = distance % this.postSpacing;
    const pairCount = this.posts.length / 2;
    for (let i = 0; i < pairCount; i++) {
      const z = -(i * this.postSpacing - mod);
      this.posts[i * 2].position.z = z;
      this.posts[i * 2 + 1].position.z = z;
    }
  }
}
