/**
 * 顽鹿竞技登录模块
 * 处理用户登录、token管理和API调用
 */

// ============ 顽鹿登录配置 ============
const ONELAP_CONFIG = {
  appid: 'wlai_69c0f71a877a0',      // 替换为你的 appid
  secret: '59461a7550832e4d375d47a66c4865c5',     // 替换为你的 secret
  loginBaseUrl: 'https://www.onelap.cn',  // 顽鹿官方登录页面
  apiBaseUrl: ''  // API请求通过nginx代理
};

// ============ 登录与 Token 管理 ============

/**
 * 跳转到顽鹿登录页面
 */
function redirectToLogin() {
  const currentUrl = window.location.href;
  const encodedUrl = btoa(currentUrl);
  const loginUrl = `${ONELAP_CONFIG.loginBaseUrl}/login.html?url=${encodedUrl}&token=1`;
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

/**
 * 检查是否为token过期错误
 * @param {number} code - 错误码
 * @returns {boolean}
 */
function isTokenExpired(code) {
  return code === 401 || code === 1001;
}

/**
 * 处理token过期
 */
function handleTokenExpired() {
  alert('登录已过期，请重新登录');
  logout();
  redirectToLogin();
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
  
  // 检查token是否过期
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
  
  // 检查token是否过期
  if (isTokenExpired(result.code)) {
    handleTokenExpired();
    throw new Error('token已过期');
  }
  
  if (result.code !== 200) {
    throw new Error(result.message || `API 返回错误: ${result.code}`);
  }
  
  return result;
}

// ============ 初始化 ============

/**
 * 初始化应用
 */
async function initApp() {
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
    
    // 初始化地图
    if (typeof initMap === 'function') {
      initMap();
    }
    
    // 获取骑行记录
    const records = await getCyclingRecords();
    console.log('骑行记录:', records);
    
    // 批量处理骑行记录中的FIT文件URL，点亮路线
    console.log('检查骑行记录数据结构:', {
      recordsType: typeof records,
      recordsDataType: typeof records.data,
      recordsDataIsArray: Array.isArray(records.data),
      recordsDataLength: records.data ? records.data.length : 'undefined'
    });
    
    // 尝试获取骑行记录数组（支持多种数据结构）
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
      console.log(`找到 ${recordsArray.length} 条骑行记录`);
      console.log('第一条记录示例:', JSON.stringify(recordsArray[0], null, 2));
      
      // 提取FIT文件URL（尝试多种可能的字段名）
      const fitUrls = recordsArray
        .map(record => record.fit_url || record.file_url || record.download_url || record.activity_file || record.fit_file)
        .filter(url => url && typeof url === 'string' && url.trim() !== '');
      
      console.log(`提取到 ${fitUrls.length} 个FIT文件URL`);
      
      if (fitUrls.length > 0) {
        console.log(`开始批量导入 ${fitUrls.length} 个FIT文件...`);
        console.log('URL列表:', fitUrls.slice(0, 3)); // 只显示前3个
        
        // 检查uploadFitFilesFromUrls函数是否可用
        if (typeof uploadFitFilesFromUrls === 'function') {
          try {
            const results = await uploadFitFilesFromUrls(fitUrls);
            console.log('批量导入完成:', results);
          } catch (error) {
            console.error('批量导入过程中出错:', error);
            // 如果批量导入失败，尝试逐个导入
            console.log('尝试逐个导入...');
            let successCount = 0;
            for (const url of fitUrls) {
              try {
                if (typeof uploadFitFileFromUrl === 'function') {
                  await uploadFitFileFromUrl(url);
                  successCount++;
                }
              } catch (err) {
                console.warn(`导入失败: ${url}`, err.message);
              }
            }
            console.log(`逐个导入完成，成功 ${successCount}/${fitUrls.length} 个`);
          }
        } else {
          console.error('uploadFitFilesFromUrls函数未加载');
        }
      } else {
        console.log('未找到FIT文件URL，检查骑行记录中的可用字段:');
        const sampleRecord = recordsArray[0];
        console.log('可用字段:', Object.keys(sampleRecord));
        console.log('完整记录:', sampleRecord);
      }
    } else {
      console.log('暂无骑行记录或数据结构不正确');
      console.log('完整返回数据:', records);
    }
    
  } catch (error) {
    console.error('获取数据失败:', error);
    // token过期已在API函数内部处理，此处处理其他错误
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);