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

async function initApp() {
  if (!isLoggedIn()) {
    showLoginScreen();
    return;
  }
  
  showMainScreen();
  
  try {
    if (typeof initMap === 'function') {
      initMap();
    }

    const userInfoPromise = getUserInfo();
    
    window.uploadedTracks = window.uploadedTracks || [];
    
    if (window.trackStorage) {
      try {
        const cachedTracks = await trackStorage.getAllTracks();
        
        if (cachedTracks && cachedTracks.length > 0) {
          console.log('[DEBUG] 从缓存加载 ' + cachedTracks.length + ' 条轨迹');
          cachedTracks.forEach(function(t, i) {
            console.log('[DEBUG] 缓存轨迹[' + i + '] fit_url:', t.fit_url, 'start_time:', t.start_time);
          });
          
          window.uploadedTracks.length = 0;
          
          for (const track of cachedTracks) {
            window.uploadedTracks.push(track);
            if (typeof renderTrackOnMap === 'function') {
              renderTrackOnMap(track);
            }
          }
          
          console.log('[DEBUG] 缓存加载后 uploadedTracks 数量:', window.uploadedTracks.length);
          
          if (typeof updateStats === 'function') {
            await updateStats();
          }
        }
      } catch (e) {
        console.warn('缓存加载失败:', e);
      }
    }

    try {
      const userInfo = await userInfoPromise;
      console.log('用户信息:', userInfo);
      
      if (userInfo.data) {
        const user = userInfo.data;
        document.getElementById('user-name').textContent = user.nickname || '骑行爱好者';
        
        // 设置头像：优先使用API返回的头像URL，否则显示昵称首字
        const avatarEl = document.getElementById('user-avatar');
        const avatarUrl = user.avatar || user.avatar_url || user.headimg || user.head_img || user.profile_image;
        if (avatarUrl) {
          const img = document.createElement('img');
          img.src = avatarUrl;
          img.alt = '头像';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.onerror = function() {
            avatarEl.textContent = user.nickname ? user.nickname.charAt(0) : '骑';
          };
          avatarEl.innerHTML = '';
          avatarEl.appendChild(img);
        } else {
          avatarEl.textContent = user.nickname ? user.nickname.charAt(0) : '骑';
        }
        
        document.getElementById('user-info-card').style.display = 'flex';
        
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
          settingsBtn.style.display = 'none';
        }
      }
    } catch (userInfoError) {
      console.warn('获取用户信息失败:', userInfoError);
    }

    try {
      const records = await getCyclingRecords();
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
      console.log(`API 返回 ${recordsArray.length} 条记录`);
      
      const fitUrls = recordsArray
        .map(record => record.fit_url || record.file_url || record.download_url || record.activity_file || record.fit_file)
        .filter(url => url && typeof url === 'string' && url.trim() !== '');
      
      console.log(`提取到 ${fitUrls.length} 个FIT文件URL`);
      
      if (fitUrls.length > 0 && typeof uploadFitFilesFromUrlsBatch === 'function') {
        await uploadFitFilesFromUrlsBatch(fitUrls);
      }
    }
    } catch (recordsError) {
      console.warn('获取骑行记录失败:', recordsError);
    }
    
  } catch (error) {
    console.error('初始化失败:', error);
  }
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