// بناء الطريق: أرضية متحركة الملمس + حواجز جانبية + أعمدة متكررة لإحساس العمق

import * as THREE from 'three';
import { ROAD_WIDTH, ROAD_HALF, COLORS3D } from '../config/GameConfig.js';

function buildWindowTexture(seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#2a3352';
  ctx.fillRect(0, 0, 32, 64);
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let y = 4; y < 60; y += 8) {
    for (let x = 4; x < 28; x += 8) {
      ctx.fillStyle = rand() < 0.55 ? '#ffe9a8' : '#1c2440';
      ctx.fillRect(x, y, 4, 5);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

function buildGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(canvas);
}

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

    // أفق مبانٍ بسيط على جانبي الطريق لإحساس بيئة حقيقية (مدينة بعيدة)
    this.buildingSpacing = 9;
    this.buildings = [];
    const buildingCount = 22;
    for (let i = 0; i < buildingCount; i++) {
      for (const side of [-1, 1]) {
        const width = 2.2 + ((i * 37) % 5) * 0.5;
        const height = 3 + ((i * 53 + (side > 0 ? 17 : 0)) % 9);
        const depth = 2.2 + ((i * 19) % 3) * 0.4;
        const geo = new THREE.BoxGeometry(width, height, depth);
        const mat = new THREE.MeshStandardMaterial({
          map: buildWindowTexture(i * 97 + (side > 0 ? 13 : 1)),
          roughness: 0.9,
        });
        const building = new THREE.Mesh(geo, mat);
        building.position.set(side * (ROAD_HALF + 3.5 + width / 2), height / 2, -i * this.buildingSpacing);
        building.castShadow = false;
        building.receiveShadow = false;
        scene.add(building);
        this.buildings.push(building);
      }
    }

    // شرر/ذرات عائمة خفيفة بامتداد الطريق لإحساس حركة مستمر بالمشهد
    this.motes = [];
    const moteTex = buildGlowTexture();
    const moteMat = new THREE.SpriteMaterial({
      map: moteTex,
      color: 0xffe9a8,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    this.moteSpacing = 3.5;
    const moteCount = 24;
    for (let i = 0; i < moteCount; i++) {
      const sprite = new THREE.Sprite(moteMat);
      const scale = 0.08 + ((i * 13) % 5) * 0.02;
      sprite.scale.set(scale, scale, 1);
      sprite.userData.x = (((i * 71) % 100) / 100 - 0.5) * ROAD_WIDTH * 0.85;
      sprite.userData.baseY = 0.3 + ((i * 37) % 100) / 100 * 2;
      sprite.userData.phase = i * 0.7;
      sprite.position.set(sprite.userData.x, sprite.userData.baseY, -i * this.moteSpacing);
      scene.add(sprite);
      this.motes.push(sprite);
    }
  }

  update(distance) {
    this.texture.offset.y = distance * 0.14;

    const postMod = distance % this.postSpacing;
    const postPairCount = this.posts.length / 2;
    for (let i = 0; i < postPairCount; i++) {
      const z = -(i * this.postSpacing - postMod);
      this.posts[i * 2].position.z = z;
      this.posts[i * 2 + 1].position.z = z;
    }

    const buildingMod = distance % this.buildingSpacing;
    const buildingPairCount = this.buildings.length / 2;
    for (let i = 0; i < buildingPairCount; i++) {
      const z = -(i * this.buildingSpacing - buildingMod);
      this.buildings[i * 2].position.z = z;
      this.buildings[i * 2 + 1].position.z = z;
    }

    const moteMod = distance % this.moteSpacing;
    this.motes.forEach((sprite, i) => {
      sprite.position.z = -(i * this.moteSpacing - moteMod);
      sprite.position.y = sprite.userData.baseY + Math.sin(distance * 0.6 + sprite.userData.phase) * 0.25;
    });
  }
}
