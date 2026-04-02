let uploadedTracks = [];

function triggerUpload() {
  const input = document.getElementById('fit-file-input');
  input.click();
}

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  showUploadProgress();

  try {
    const trackData = await readAndParseFitFile(file);
    uploadedTracks.push(trackData);
    
    hideUploadProgress();
    showToast(`成功导入轨迹：${trackData.total_distance_km.toFixed(2)}km`);
    
    renderTrackOnMap(trackData);
    updateStats();
    
  } catch (error) {
    hideUploadProgress();
    showToast(`解析失败：${error.message}`, 'error');
  }

  event.target.value = '';
}

function showUploadProgress() {
  const progress = document.getElementById('upload-progress');
  const progressText = document.getElementById('progress-text');
  progress.style.display = 'flex';
  progressText.textContent = '正在解析FIT文件...';
}

function hideUploadProgress() {
  document.getElementById('upload-progress').style.display = 'none';
}

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function renderTrackOnMap(trackData) {
  if (!window.map) {
    console.error('地图未初始化');
    return;
  }

  const coords = trackData.points.map(p => [p.lat, p.lon]);

  if (coords.length < 2) {
    console.warn('轨迹点数不足');
    return;
  }

  L.polyline(coords, {
    color: '#FFD93D',
    weight: 12,
    opacity: 0.3
  }).addTo(window.map);

  L.polyline(coords, {
    color: '#FFD93D',
    weight: 5,
    opacity: 0.9
  }).addTo(window.map);

  window.map.fitBounds(coords, { padding: [50, 50] });
}

async function updateStats() {
  await loadRoadData();
  
  const stats = calculateAllStats(uploadedTracks);
  
  const lightingRateEl = document.querySelector('.achievement-card .stat-item:nth-child(1) .stat-value');
  const litDistanceEl = document.querySelector('.achievement-card .stat-item:nth-child(2) .stat-value');
  const totalRoadEl = document.querySelector('.achievement-card .stat-item:nth-child(3) .stat-value');
  const weeklyBadgeEl = document.querySelector('.achievement-card .card-badge');
  const regionNameEl = document.getElementById('region-name');
  const progressBarEl = document.querySelector('.achievement-card .progress-fill');
  
  if (lightingRateEl) {
    lightingRateEl.textContent = `${stats.lighting_rate.toFixed(1)}%`;
  }
  
  if (litDistanceEl) {
    litDistanceEl.textContent = `${stats.unique_distance_km.toFixed(1)}km`;
  }
  
  if (totalRoadEl) {
    totalRoadEl.textContent = `${stats.total_road_km}km`;
  }
  
  if (weeklyBadgeEl) {
    weeklyBadgeEl.textContent = `本周+${stats.this_week_uploads}`;
  }
  
  if (regionNameEl) {
    regionNameEl.textContent = stats.region;
  }
  
  if (progressBarEl) {
    progressBarEl.style.width = `${Math.min(stats.lighting_rate, 100)}%`;
  }
  
  console.log('统计数据已更新:', stats);
}

/**
 * 从URL加载并上传FIT文件
 * @param {string} url - FIT文件的URL地址
 * @returns {Promise<Object>} 解析后的轨迹数据
 */
async function uploadFitFileFromUrl(url) {
  if (!url) {
    throw new Error('请提供FIT文件的URL');
  }

  showUploadProgress();
  const progressText = document.getElementById('progress-text');
  progressText.textContent = '正在下载FIT文件...';

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`下载失败: HTTP ${response.status}`);
    }

    progressText.textContent = '正在解析FIT文件...';
    const buffer = await response.arrayBuffer();

    const trackData = await parseFitFile(buffer);
    trackData.fit_file_name = url.split('/').pop() || 'remote.fit';
    trackData.fit_url = url;

    uploadedTracks.push(trackData);

    hideUploadProgress();
    showToast(`成功导入轨迹：${trackData.total_distance_km.toFixed(2)}km`);
    
    renderTrackOnMap(trackData);
    updateStats();

    console.log('✅ 从URL上传成功:', {
      url: url,
      track_id: trackData.track_id,
      distance_km: trackData.total_distance_km
    });

    return trackData;

  } catch (error) {
    hideUploadProgress();
    
    let errorMessage = error.message;
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMessage = '网络错误或跨域限制，请检查URL是否可访问';
    } else if (error.message.includes('HTTP')) {
      errorMessage = `文件下载失败: ${error.message}`;
    } else if (error.message.includes('解析失败')) {
      errorMessage = `FIT文件解析失败: ${error.message}`;
    }
    
    showToast(errorMessage, 'error');
    throw new Error(errorMessage);
  }
}

/**
 * 批量从URL上传FIT文件
 * @param {Array<string>} urls - FIT文件URL数组
 * @returns {Promise<Array<Object>>} 所有解析后的轨迹数据
 */
async function uploadFitFilesFromUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('请提供FIT文件URL数组');
  }

  showUploadProgress();
  const progressText = document.getElementById('progress-text');
  
  const results = [];
  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    progressText.textContent = `正在处理第 ${i + 1}/${urls.length} 个文件...`;

    try {
      const trackData = await uploadFitFileFromUrl(url);
      results.push(trackData);
    } catch (error) {
      errors.push({ url, error: error.message });
      console.warn(`文件上传失败: ${url}`, error);
    }
  }

  hideUploadProgress();

  if (errors.length > 0) {
    showToast(`成功 ${results.length} 个，失败 ${errors.length} 个`, results.length > 0 ? 'success' : 'error');
    console.warn('上传失败的文件:', errors);
  } else {
    showToast(`成功导入 ${results.length} 个轨迹`);
  }

  return { success: results, failed: errors };
}



window.triggerUpload = triggerUpload;
window.handleFileUpload = handleFileUpload;
window.uploadFitFileFromUrl = uploadFitFileFromUrl;
window.uploadFitFilesFromUrls = uploadFitFilesFromUrls;
window.uploadedTracks = uploadedTracks;

window.uploadHandlerReady = true;

if (window.fitParserReady) {
  console.log('所有依赖已就绪');
}