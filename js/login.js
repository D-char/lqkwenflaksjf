/**
 * 顽鹿竞技登录模块
 * 处理用户登录、token管理和API调用
 */

const ONELAP_CONFIG = {
  appid: 'wlai_69c0f71a877a0',
  secret: '59461a7550832e4d375d47a66c4865c5',
  loginBaseUrl: 'https://www.onelap.cn',
  apiBaseUrl: ''
};

function redirectToLogin() {
  const currentUrl = window.location.href;
  const encodedUrl = btoa(currentUrl);
  const loginUrl = `${ONELAP_CONFIG.loginBaseUrl}/login.html?url=${encodedUrl}&token=1`;
  window.location.href = loginUrl;
}

function getToken() {
  const urlParams = new URLSearchParams(window.location.search);
  let token = urlParams.get('tk');
  
  if (token) {
    localStorage.setItem('onelap_token', token);
    window.history.replaceState({}, '', window.location.pathname);
    return token;
  }
  
  token = localStorage.getItem('onelap_token');
  return token;
}

function isLoggedIn() {
  return !!getToken();
}

function logout() {
  localStorage.removeItem('onelap_token');
  showLoginScreen();
}

function showLoginScreen() {
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('screen-main').classList.remove('active');
}

function showMainScreen() {
  document.getElementById('screen-login').classList.remove('active');
  document.getElementById('screen-main').classList.add('active');
}

function isTokenExpired(code) {
  return code === 401 || code === 1001;
}

function handleTokenExpired() {
  alert('登录已过期，请重新登录');
  logout();
  redirectToLogin();
}

function generateNonce(len = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateSign(nonce, timestamp, uri, appid, secret) {
  const params = { nonce, timestamp, uri, appid };
  const sortedKeys = Object.keys(params).sort();
  const paramStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
  return md5(paramStr + '&secret=' + secret);
}

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
    page_size: options.page_size || 200
  };
  const queryString = new URLSearchParams(queryParams).toString();
  
  const response = await fetch(
    `${ONELAP_CONFIG.apiBaseUrl}${uri}?${queryString}`,
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
  
  if (isTokenExpired(result.code)) {
    handleTokenExpired();
    throw new Error('token已过期');
  }
  
  if (result.code !== 200) {
    throw new Error(result.message || `API 返回错误: ${result.code}`);
  }
  
  return result;
}

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
    `${ONELAP_CONFIG.apiBaseUrl}${uri}?${queryString}`,
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
  
  if (isTokenExpired(result.code)) {
    handleTokenExpired();
    throw new Error('token已过期');
  }
  
  if (result.code !== 200) {
    throw new Error(result.message || `API 返回错误: ${result.code}`);
  }
  
  return result;
}

/**
 * 优化后的初始化函数 - 并行加载
 * 将串行操作改为并行,大幅提升加载速度
 */
async function initApp() {
  if (!isLoggedIn()) {
    showLoginScreen();
    return;
  }
  
  showMainScreen();
  
  const initPromises = {
    userInfo: getUserInfo().catch(err => {
      console.error('获取用户信息失败:', err);
      return null;
    }),
    cachedTracks: window.trackStorage 
      ? trackStorage.getAllTracks().catch(err => {
          console.warn('缓存加载失败:', err);
          return [];
        })
      : Promise.resolve([])
  };
  
  // 地图初始化不阻塞其他操作
  if (typeof initMap === 'function') {
    initMap();
  }
  
  // 等待关键数据加载完成
  const results = await Promise.all([
    initPromises.userInfo,
    initPromises.cachedTracks
  ]);
  
  const userInfo = results[0];
  const cachedTracks = results[1];
  
  if (userInfo && userInfo.data) {
    const user = userInfo.data;
    const avatarEl = document.getElementById('user-avatar');
    const userNameEl = document.getElementById('user-name');
    const avatarUrl = user.avatar || user.avatar_url || user.headimg || user.head_img || user.profile_image;
    const nickname = user.nickname || user.name || user.username || '骑行爱好者';
    
    if (avatarEl && avatarUrl) {
      const img = new Image();
      img.onload = function() {
        avatarEl.innerHTML = '';
        avatarEl.appendChild(img);
        if (userNameEl) userNameEl.textContent = nickname;
      };
      img.onerror = function() {
        avatarEl.textContent = nickname.charAt(0);
        if (userNameEl) userNameEl.textContent = nickname;
      };
      // 修复混合内容：将 HTTP 转为 HTTPS
      img.src = avatarUrl.replace(/^http:/, 'https:');
      img.alt = '头像';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
    } else if (avatarEl) {
      avatarEl.textContent = nickname.charAt(0);
      if (userNameEl) userNameEl.textContent = nickname;
    }
  } else {
    console.warn('用户信息为空或格式不正确:', userInfo);
  }
  
  // 3. 处理缓存轨迹(立即渲染,不等待API)
  window.uploadedTracks = window.uploadedTracks || [];
  
  if (cachedTracks && cachedTracks.length > 0) {
    window.uploadedTracks.length = 0;
    
    for (const track of cachedTracks) {
      window.uploadedTracks.push(track);
    }
    
    if (typeof renderTrackOnMap === 'function') {
      const renderBatch = (tracks, startIndex = 0, batchSize = 10) => {
        const endIndex = Math.min(startIndex + batchSize, tracks.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          try {
            renderTrackOnMap(tracks[i]);
          } catch (e) {
            console.warn('轨迹渲染失败:', e);
          }
        }
        
        if (endIndex < tracks.length) {
          requestAnimationFrame(() => renderBatch(tracks, endIndex, batchSize));
        }
      };
      
      renderBatch(cachedTracks);
    }
    
    if (typeof updateStats === 'function') {
      updateStats().catch(err => console.warn('统计更新失败:', err));
    }
  }
  
  // 4. 后台获取云端记录(不阻塞页面显示)
  getCyclingRecords()
    .then(records => {
      console.log('骑行记录:', records);
      
      let recordsArray = null;
      if (Array.isArray(records.data)) {
        recordsArray = records.data;
      } else if (records.data && Array.isArray(records.data.list)) {
        recordsArray = records.data.list;
      } else if (records.data && Array.isArray(records.data.records)) {
        recordsArray = records.data.records;
      } else if (records.data && Array.isArray(records.data.activities)) {
        recordsArray = records.data.activities;
      } else if (Array.isArray(records)) {
        recordsArray = records;
      }
      
      if (recordsArray && recordsArray.length > 0) {
        const fitUrls = recordsArray
          .map(record => {
            const url = record.fit_url || record.file_url || record.download_url || record.activity_file || record.fit_file;
            return url;
          })
          .filter(url => {
            if (!url || typeof url !== 'string' || url.trim() === '') {
              return false;
            }
            // 过滤掉 OSS URL（游戏内虚拟骑行，坐标无效）
            if (url.includes('aliyuncs.com')) {
              console.log('[过滤] 跳过虚拟骑行记录(OSS):', url);
              return false;
            }
            return true;
          });
        
        console.log(`[骑行记录] 共 ${recordsArray.length} 条，过滤后 ${fitUrls.length} 条真实码表数据`);
        
        if (fitUrls.length > 0 && typeof uploadFitFilesFromUrlsBatch === 'function') {
          uploadFitFilesFromUrlsBatch(fitUrls).catch(err => {
            console.warn('FIT文件加载失败:', err);
          });
        }
      }
    })
    .catch(recordsError => {
      console.warn('获取骑行记录失败:', recordsError);
    });
}

window.redirectToLogin = redirectToLogin;
window.logout = logout;
window.showLoginScreen = showLoginScreen;
window.showMainScreen = showMainScreen;
window.getToken = getToken;
window.isLoggedIn = isLoggedIn;
window.getCyclingRecords = getCyclingRecords;
window.getUserInfo = getUserInfo;
window.initApp = initApp;

document.addEventListener('DOMContentLoaded', initApp);