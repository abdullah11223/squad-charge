// مؤثرات بصرية: ومضات إطلاق، انفجارات، شرر عملات، واهتزاز شاشة — تستخدم GSAP للحركة

import * as THREE from 'three';
import gsap from 'gsap';

let glowTex = null;
function getGlowTexture() {
  if (glowTex) return glowTex;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0.75)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(canvas);
  return glowTex;
}

function glowSprite(color) {
  const mat = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Sprite(mat);
}

export function muzzleFlashTracers(scene, fromPos, toPos, count = 7) {
  for (let i = 0; i < count; i++) {
    const sprite = glowSprite(0xfff07a);
    sprite.scale.set(0.14, 0.14, 1);
    const jitterX = () => (Math.random() - 0.5) * 0.7;
    sprite.position.set(fromPos.x + jitterX(), 0.85 + Math.random() * 0.35, fromPos.z);
    scene.add(sprite);

    const endX = toPos.x + jitterX();
    const delay = Math.random() * 0.08;
    gsap.to(sprite.position, {
      x: endX,
      y: 0.85,
      z: toPos.z,
      duration: 0.16,
      delay,
      ease: 'power1.in',
      onComplete: () => scene.remove(sprite),
    });
    gsap.to(sprite.material, { opacity: 0, duration: 0.16, delay: delay + 0.04 });
  }
}

export function impactBurst(scene, pos, color = 0xffcc55) {
  const sprite = glowSprite(color);
  sprite.position.copy(pos);
  sprite.scale.set(0.1, 0.1, 1);
  scene.add(sprite);
  gsap.to(sprite.scale, { x: 2.4, y: 2.4, duration: 0.35, ease: 'power2.out' });
  gsap.to(sprite.material, {
    opacity: 0,
    duration: 0.35,
    ease: 'power1.in',
    onComplete: () => scene.remove(sprite),
  });
}

export function sparkleBurst(scene, pos, color = 0xffd60a, count = 10) {
  for (let i = 0; i < count; i++) {
    const sprite = glowSprite(color);
    sprite.scale.set(0.09, 0.09, 1);
    sprite.position.copy(pos);
    scene.add(sprite);
    const angle = Math.random() * Math.PI * 2;
    const dist = 0.4 + Math.random() * 0.6;
    gsap.to(sprite.position, {
      x: pos.x + Math.cos(angle) * dist,
      y: pos.y + 0.5 + Math.random() * 0.6,
      z: pos.z + Math.sin(angle) * dist,
      duration: 0.55,
      ease: 'power2.out',
    });
    gsap.to(sprite.material, {
      opacity: 0,
      duration: 0.55,
      delay: 0.1,
      onComplete: () => scene.remove(sprite),
    });
  }
}

export function punchScale(object3d, scaleAmount = 1.3, duration = 0.3) {
  gsap.fromTo(
    object3d.scale,
    { x: scaleAmount, y: scaleAmount, z: scaleAmount },
    { x: 1, y: 1, z: 1, duration, ease: 'elastic.out(1,0.5)' }
  );
}

// اهتزاز شاشة بدون التصادم مع تتبّع الكاميرا — يوفر offset يُضاف لموضع الكاميرا كل فريم
export function createShaker() {
  const state = { x: 0, y: 0 };
  function trigger(intensity = 0.18, duration = 0.3) {
    const proxy = { t: 0 };
    gsap.to(proxy, {
      t: 1,
      duration,
      ease: 'power1.out',
      onUpdate: () => {
        const decay = 1 - proxy.t;
        state.x = (Math.random() - 0.5) * intensity * decay;
        state.y = (Math.random() - 0.5) * intensity * decay;
      },
      onComplete: () => {
        state.x = 0;
        state.y = 0;
      },
    });
  }
  return { state, trigger };
}
