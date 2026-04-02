/**
 * 骑行记录模块
 * 处理骑行记录的获取和展示
 */

/**
 * 格式化日期
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string}
 */
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  return `${month}月${day}日 ${hours}:${String(minutes).padStart(2, '0')}`;
}

/**
 * 格式化时长
 * @param {number} seconds - 秒数
 * @returns {string}
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

/**
 * 格式化距离
 * @param {number} meters - 米
 * @returns {string}
 */
function formatDistance(meters) {
  const km = meters / 1000;
  return km.toFixed(1);
}

/**
 * 渲染骑行记录列表
 * @param {Array} records - 骑行记录数组
 */
function renderRecords(records) {
  const listEl = document.getElementById('records-list');
  
  if (!records || records.length === 0) {
    listEl.innerHTML = '<div class="empty-message">暂无骑行记录</div>';
    return;
  }
  
  listEl.innerHTML = records.map(record => `
    <div class="record-item">
      <div class="record-icon">🚴</div>
      <div class="record-info">
        <div class="record-date">${formatDate(record.startRidingTime)}</div>
        <div class="record-details">
          <span class="record-distance">${formatDistance(record.totalDistance)} km</span>
          <span class="record-divider">|</span>
          <span class="record-duration">${formatDuration(record.totalTime)}</span>
        </div>
      </div>
      <div class="record-stats">
        <div class="record-cal">${Math.round(record.cal)} 卡</div>
        <div class="record-speed">${record.avgSpeed ? record.avgSpeed.toFixed(1) : '--'} km/h</div>
      </div>
    </div>
  `).join('');
}

/**
 * 更新统计数据
 * @param {Array} records - 骑行记录数组
 */
function updateStats(records) {
  if (!records || records.length === 0) {
    document.getElementById('record-count').textContent = '0 条记录';
    document.getElementById('total-distance').textContent = '0';
    document.getElementById('total-time').textContent = '0';
    document.getElementById('total-calories').textContent = '0';
    return;
  }
  
  // 计算总里程（米转公里）
  const totalDistance = records.reduce((sum, r) => sum + (r.totalDistance || 0), 0);
  // 计算总时长（秒转小时）
  const totalTime = records.reduce((sum, r) => sum + (r.totalTime || 0), 0);
  // 计算总卡路里
  const totalCalories = records.reduce((sum, r) => sum + (r.cal || 0), 0);
  
  document.getElementById('record-count').textContent = `${records.length} 条记录`;
  document.getElementById('total-distance').textContent = formatDistance(totalDistance);
  document.getElementById('total-time').textContent = (totalTime / 3600).toFixed(1);
  document.getElementById('total-calories').textContent = Math.round(totalCalories);
}

/**
 * 更新用户信息
 * @param {Object} userInfo - 用户信息
 */
function updateUserInfo(userInfo) {
  if (userInfo && userInfo.data) {
    const user = userInfo.data;
    document.getElementById('user-name').textContent = user.nickname || '骑行爱好者';
    document.getElementById('user-avatar').textContent = user.nickname ? user.nickname.charAt(0) : '';
  }
}

/**
 * 加载骑行记录
 */
async function loadRecords() {
  const listEl = document.getElementById('records-list');
  listEl.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    // 检查登录状态
    if (!isLoggedIn()) {
      alert('请先登录');
      window.location.href = 'index.html';
      return;
    }
    
    // 获取用户信息
    const userInfo = await getUserInfo();
    updateUserInfo(userInfo);
    
    // 获取骑行记录
    const result = await getCyclingRecords({ page: 1, page_size: 50 });
    
    if (result.data && result.data.activities) {
      const records = result.data.activities;
      renderRecords(records);
      updateStats(records);
    } else {
      renderRecords([]);
      updateStats([]);
    }
    
  } catch (error) {
    console.error('加载骑行记录失败:', error);
    listEl.innerHTML = `<div class="error-message">加载失败: ${error.message}</div>`;
  }
}

/**
 * 页面初始化
 */
function initRecordsPage() {
  // 检查登录状态
  if (!isLoggedIn()) {
    alert('请先登录');
    window.location.href = 'index.html';
    return;
  }
  
  // 加载骑行记录
  loadRecords();
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initRecordsPage);