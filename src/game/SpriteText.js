// نصوص/أيقونات عائمة تواجه الكاميرا دايمًا (billboard sprites) — لأرقام البوابات والعوائق والتنبيهات

import * as THREE from 'three';

export function makeTextSprite(text, { fontSize = 64, color = '#ffffff', bg = null, bold = true, width = 256, height = 96 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (bg) {
    ctx.fillStyle = bg;
    const r = height / 2;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, r);
    ctx.fill();
  }

  ctx.font = `${bold ? 'bold ' : ''}${fontSize}px Tahoma, Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2 + fontSize * 0.04);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  const aspect = width / height;
  sprite.scale.set(aspect * 0.8, 0.8, 1);
  return sprite;
}

export function updateTextSprite(sprite, text, opts) {
  const fresh = makeTextSprite(text, opts);
  sprite.material.map.dispose();
  sprite.material.map = fresh.material.map;
  sprite.material.needsUpdate = true;
}
