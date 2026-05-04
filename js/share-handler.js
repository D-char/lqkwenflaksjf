/**
 * 分享展示模式模块
 * 点击"炫耀一下"进入展示页面，隐藏无关按钮，用户手动截图
 * 点击页面任意位置退出展示模式
 */

const HIDE_ELEMENTS_IN_SHOWCASE = [
  '.header-actions',
  '.btn-share',
  '.prototype-label',
  '.upload-overlay',
  '.upload-progress',
  '.toast'
];

let showcaseModeActive = false;
let originalDisplayStates = new Map();

function enterShowcaseMode(event) {
  if (showcaseModeActive) return;
  
  if (event) {
    event.stopPropagation();
  }
  
  showcaseModeActive = true;
  originalDisplayStates.clear();
  
  HIDE_ELEMENTS_IN_SHOWCASE.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      if (el) {
        originalDisplayStates.set(el, el.style.display);
        el.style.display = 'none';
      }
    });
  });
  
  setTimeout(() => {
    document.addEventListener('click', handleShowcaseClick);
  }, 100);
}

function handleShowcaseClick(event) {
  if (!showcaseModeActive) return;
  exitShowcaseMode();
}

function exitShowcaseMode() {
  if (!showcaseModeActive) return;
  
  showcaseModeActive = false;
  
  document.removeEventListener('click', handleShowcaseClick);
  
  originalDisplayStates.forEach((originalDisplay, el) => {
    if (el) el.style.display = originalDisplay;
  });
  
  originalDisplayStates.clear();
}

window.enterShowcaseMode = enterShowcaseMode;
window.exitShowcaseMode = exitShowcaseMode;