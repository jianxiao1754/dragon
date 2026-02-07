
// 飞机图标：一个简单的战斗机 SVG
const PLANE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#b0c4de;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4682b4;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#a9a9a9;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#696969;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- 尾翼 -->
  <path d="M50 80 L30 95 L70 95 Z" fill="#696969" stroke="#333" stroke-width="1"/>

  <!-- 主机翼 -->
  <path d="M50 40 L10 80 L50 70 L90 80 Z" fill="url(#wingGrad)" stroke="#333" stroke-width="1"/>

  <!-- 机身 -->
  <path d="M50 5 L35 85 L50 95 L65 85 Z" fill="url(#bodyGrad)" stroke="#333" stroke-width="1"/>
  
  <!-- 驾驶舱 -->
  <ellipse cx="50" cy="40" rx="5" ry="15" fill="#87ceeb" stroke="#333" stroke-width="1"/>
  
  <!-- 引擎火焰 -->
  <path d="M45 95 L50 110 L55 95" fill="orange" opacity="0.8">
    <animate attributeName="d" values="M45 95 L50 110 L55 95;M45 95 L50 105 L55 95;M45 95 L50 110 L55 95" dur="0.2s" repeatCount="indefinite" />
  </path>
</svg>
`;

// 龙头图标：一个简单的恶魔/龙 SVG
const DRAGON_HEAD_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="headGrad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
      <stop offset="0%" style="stop-color:#ff4500;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#8b0000;stop-opacity:1" />
    </radialGradient>
  </defs>
  
  <!-- 角 -->
  <path d="M30 30 L20 5 L40 25 Z" fill="#daa520" stroke="#333" stroke-width="1"/>
  <path d="M70 30 L80 5 L60 25 Z" fill="#daa520" stroke="#333" stroke-width="1"/>
  
  <!-- 头部 -->
  <circle cx="50" cy="50" r="40" fill="url(#headGrad)" stroke="#333" stroke-width="2"/>
  
  <!-- 眼睛 -->
  <ellipse cx="35" cy="45" rx="8" ry="12" fill="yellow" />
  <ellipse cx="65" cy="45" rx="8" ry="12" fill="yellow" />
  <circle cx="35" cy="45" r="3" fill="black" />
  <circle cx="65" cy="45" r="3" fill="black" />
  
  <!-- 鼻子 -->
  <circle cx="45" cy="65" r="3" fill="#333" opacity="0.6"/>
  <circle cx="55" cy="65" r="3" fill="#333" opacity="0.6"/>
  
  <!-- 嘴巴 -->
  <path d="M30 75 Q50 85 70 75" stroke="black" stroke-width="3" fill="none"/>
  
  <!-- 牙齿 -->
  <path d="M35 77 L40 85 L45 78" fill="white"/>
  <path d="M55 78 L60 85 L65 77" fill="white"/>

</svg>
`;

function createImgFromSvg(svgString: string): HTMLImageElement {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    img.src = url;
    return img;
}

export const Assets = {
    PlayerPlane: createImgFromSvg(PLANE_SVG),
    DragonHead: createImgFromSvg(DRAGON_HEAD_SVG),
};
