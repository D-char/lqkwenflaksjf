/**
 * 顽鹿竞技登录模块
 * 处理用户登录、token管理和API调用
 */

// ============ 顽鹿登录配置 ============
const ONELAP_CONFIG = {
  appid: 'YOUR_APP_ID',      // 替换为你的 appid
  secret: 'YOUR_SECRET',     // 替换为你的 secret
  baseUrl: 'https://www.onelap.cn'
};

// ============ 登录与 Token 管理 ============

/**
 * 跳转到顽鹿登录页面
 */
function redirectToLogin() {
  const currentUrl = window.location.href;
  const encodedUrl = btoa(currentUrl);
  const loginUrl = `${ONELAP_CONFIG.baseUrl}/login.html?url=${encodedUrl}&token=1`;
  window.location.href = loginUrl;
}

/**
 * 从 URL 参数或 localStorage 获取 token
 * @returns {string|null}
 */
function getToken() {
  // 1. 优先从 URL 参数获取（登录成功后的回调）
  const urlParams = new URLSearchParams(window.location.search);
  let token = urlParams.get('tk');
  
  if (token) {
    // 保存到 localStorage
    localStorage.setItem('onelap_token', token);
    // 清除 URL 参数
    window.history.replaceState({}, '', window.location.pathname);
    return token;
  }
  
  // 2. 从 localStorage 获取
  token = localStorage.getItem('onelap_token');
  return token;
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  return !!getToken();
}

/**
 * 清除登录状态
 */
function logout() {
  localStorage.removeItem('onelap_token');
  showLoginScreen();
}

// ============ 界面控制 ============

/**
 * 显示登录界面
 */
function showLoginScreen() {
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('screen-main').classList.remove('active');
}

/**
 * 显示主界面
 */
function showMainScreen() {
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-main').classList.add('active');
}

// ============ 工具函数 ============

/**
 * 生成随机字符串（nonce）
 * @param {number} len - 长度，默认 10
 * @returns {string}
 */
function generateNonce(len = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成接口签名
 * @param {string} nonce - 随机字符串
 * @param {string} timestamp - 时间戳（毫秒）
 * @param {string} uri - 接口路径
 * @param {string} appid - 应用 ID
 * @param {string} secret - 应用密钥
 * @returns {string} 签名字符串
 */
function generateSign(nonce, timestamp, uri, appid, secret) {
  const params = { nonce, timestamp, uri, appid };
  const sortedKeys = Object.keys(params).sort();
  const paramStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  return md5(paramStr + '&secret=' + secret);
}

/**
 * 获取用户骑行记录
 * @param {Object} options - 查询参数
 * @returns {Promise<Object>}
 */
async function getCyclingRecords(options = {}) {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }
  
  const uri = '/api/v1/activities';
  const nonce = generateNonce();
  const timestamp = String(Date.now());
  const sign = generateSign(nonce, timestamp, uri, ONELAP_CONFIG.appid, ONELAP_CONFIG.secret);
  
  const queryParams = {
    appid: ONELAP_CONFIG.appid,
    page: options.page || 1,
    page_size: options.page_size || 20
  };
  const queryString = new URLSearchParams(queryParams).toString();
  
  const response = await fetch(
    `${ONELAP_CONFIG.baseUrl}${uri}?${queryString}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'nonce': nonce,
        'timestamp': timestamp,
        'sign': sign
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (result.code !== 200) {
    throw new Error(result.message || `API 返回错误: ${result.code}`);
  }
  
  return result;
}

/**
 * 获取用户信息
 * @returns {Promise<Object>}
 */
async function getUserInfo() {
  const token = getToken();
  if (!token) {
    throw new Error('未登录');
  }
  
  const uri = '/api/v1/user/info';
  const nonce = generateNonce();
  const timestamp = String(Date.now());
  const sign = generateSign(nonce, timestamp, uri, ONELAP_CONFIG.appid, ONELAP_CONFIG.secret);
  
  const queryParams = {
    appid: ONELAP_CONFIG.appid
  };
  const queryString = new URLSearchParams(queryParams).toString();
  
  const response = await fetch(
    `${ONELAP_CONFIG.baseUrl}${uri}?${queryString}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'nonce': nonce,
        'timestamp': timestamp,
        'sign': sign
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status}`);
  }
  
  const result = await response.json();
  
  if (result.code !== 200) {
    throw new Error(result.message || `API 返回错误: ${result.code}`);
  }
  
  return result;
}

// ============ 初始化 ============

/**
 * 初始化应用
 * 注意：登录功能已隐藏，直接显示主界面
 */
async function initApp() {
  // 直接显示主界面（登录功能已隐藏）
  showMainScreen();
  
  // 隐藏用户信息卡片
  document.getElementById('user-info-card').style.display = 'none';
  
  // 初始化地图
  if (typeof initMap === 'function') {
    initMap();
  }
  
  // 以下代码保留，待启用登录功能时使用
  /*
  // 检查登录状态
  if (!isLoggedIn()) {
    showLoginScreen();
    return;
  }
  
  // 已登录，显示主界面
  showMainScreen();
  
  try {
    // 获取用户信息
    const userInfo = await getUserInfo();
    console.log('用户信息:', userInfo);
    
    // 更新用户信息卡片
    if (userInfo.data) {
      const user = userInfo.data;
      document.getElementById('user-name').textContent = user.nickname || '骑行爱好者';
      document.getElementById('user-avatar').textContent = user.nickname ? user.nickname.charAt(0) : '';
      document.getElementById('user-info-card').style.display = 'flex';
    }
    
    // 获取骑行记录
    const records = await getCyclingRecords();
    console.log('骑行记录:', records);
    
    // 这里可以添加更多逻辑，比如更新地图上的路线等
    
  } catch (error) {
    console.error('获取数据失败:', error);
    // 如果 token 过期，重新登录
    if (error.message.includes('token') || error.message.includes('401')) {
      logout();
    }
  }
  */
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);