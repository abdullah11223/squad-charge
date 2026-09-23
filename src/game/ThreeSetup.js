// إعداد المشهد ثلاثي الأبعاد الأساسي: renderer + scene + camera + إضاءة

import * as THREE from 'three';
import { COLORS3D } from '../config/GameConfig.js';

export function createThreeScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS3D.sky);
  scene.fog = new THREE.Fog(COLORS3D.fog, 14, 34);

  const camera = new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.1, 60);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3d5c, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff4e0, 1.15);
  sun.position.set(-6, 12, -8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -8;
  sun.shadow.camera.right = 8;
  sun.shadow.camera.top = 8;
  sun.shadow.camera.bottom = -8;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 30;
  sun.shadow.bias = -0.003;
  scene.add(sun);
  scene.add(sun.target);

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  return { scene, camera, renderer, sun, resize, resizeObserver };
}
