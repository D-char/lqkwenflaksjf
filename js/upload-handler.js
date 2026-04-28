window.uploadedTracks = window.uploadedTracks || [];

function addTrackUnique(trackData) {
  const existingIndex = window.uploadedTracks.findIndex(t => 
    (t.track_id && t.track_id === trackData.track_id) || 
    (t.fit_url && t.fit_url === trackData.fit_url)
  );
  if (existingIndex === -1) {
    window.uploadedTracks.push(trackData);
    return true;
  }
  return false;
}

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
    addTrackUnique(trackData);
    
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
}

function hideUploadProgress() {
}

function hideUploadOverlay() {
  const overlay = document.getElementById('upload-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

function showToast(message, type = 'success') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  const duration = type === 'info' ? 5000 : 2000;
  setTimeout(() => {
    toast.classList.add('toast-fade');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function renderTrackOnMap(trackData) {
  if (!window.map) {
    console.error('地图未初始化');
    return;
  }

  const coords = trackData.points.map(p => {
    if (typeof wgs84ToGcj02 === 'function') {
      const [gcjLat, gcjLon] = wgs84ToGcj02(p.lat, p.lon);
      return [gcjLon, gcjLat];
    }
    return [p.lon, p.lat];
  });

  if (coords.length < 2) {
    console.warn('轨迹点数不足');
    return;
  }

  new AMap.Polyline({
    path: coords,
    strokeColor: '#FFD93D',
    strokeWeight: 2,
    strokeOpacity: 0.85,
    lineJoin: 'round',
    lineCap: 'round'
  }).setMap(window.map);

  window.map.setFitView(null, false, [50, 50, 50, 50]);
}

async function updateStats() {
  await loadRoadData();
  
  const stats = await calculateAllStats(window.uploadedTracks);
  
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
  
  updateCitySelector(stats.regions);
}

function updateCitySelector(regions) {
  const citySelector = document.getElementById('city-selector');
  const cityList = document.getElementById('city-list');
  const currentCityEl = document.getElementById('current-city');
  
  if (!citySelector || !cityList || !currentCityEl) return;
  
  if (regions && regions.length >= 1) {
    citySelector.style.display = 'block';
    const currentRegion = window.getCurrentRegion();
    if (currentRegion) {
      currentCityEl.textContent = currentRegion;
    } else {
      currentCityEl.textContent = '请选择您所探索过的区域';
    }
    
    cityList.innerHTML = '';
    regions.forEach(region => {
      const item = document.createElement('div');
      item.className = 'city-item' + (region.name === currentRegion ? ' active' : '');
      item.innerHTML = `<span>${region.name}</span>`;
      item.onclick = () => switchCity(region.name);
      cityList.appendChild(item);
    });
  } else {
    citySelector.style.display = 'none';
  }
}

function toggleCityDropdown() {
  const dropdown = document.querySelector('.city-dropdown');
  const cityList = document.getElementById('city-list');
  dropdown.classList.toggle('open');
  cityList.classList.toggle('show');
}

async function switchCity(cityName) {
  window.setCurrentRegion(cityName);
  
  const stats = await calculateAllStats(window.uploadedTracks, cityName);
  
  const lightingRateEl = document.querySelector('.achievement-card .stat-item:nth-child(1) .stat-value');
  const litDistanceEl = document.querySelector('.achievement-card .stat-item:nth-child(2) .stat-value');
  const totalRoadEl = document.querySelector('.achievement-card .stat-item:nth-child(3) .stat-value');
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
  
  if (regionNameEl) {
    regionNameEl.textContent = cityName;
  }
  
  if (progressBarEl) {
    progressBarEl.style.width = `${Math.min(stats.lighting_rate, 100)}%`;
  }
  
  document.getElementById('current-city').textContent = cityName;
  document.querySelector('.city-dropdown').classList.remove('open');
  document.getElementById('city-list').classList.remove('show');
  
  updateCitySelector(stats.regions);
}

window.toggleCityDropdown = toggleCityDropdown;
window.switchCity = switchCity;

async function uploadFitFileFromUrl(url, skipCache = false) {
  if (!url) {
    throw new Error('请提供FIT文件的URL');
  }

  if (!skipCache && window.trackStorage) {
    const cachedTrack = await trackStorage.getTrack(url);
    if (cachedTrack) {
      addTrackUnique(cachedTrack);
      showToast(`从缓存加载：${cachedTrack.total_distance_km.toFixed(2)}km`);
      renderTrackOnMap(cachedTrack);
      updateStats();
      return cachedTrack;
    }
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

    addTrackUnique(trackData);

    if (window.trackStorage) {
      await trackStorage.saveTrack(trackData, url);
    }

    hideUploadProgress();
    showToast(`成功导入轨迹：${trackData.total_distance_km.toFixed(2)}km`);
    
    renderTrackOnMap(trackData);
    updateStats();

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
 * 批量从URL上传FIT文件（单个加载，逐个渲染）
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
  } else {
    showToast(`成功导入 ${results.length} 个轨迹`);
  }

  return { success: results, failed: errors };
}

async function uploadFitFilesFromUrlsBatch(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return { success: [], failed: [] };
  }

  const results = [];
  const errors = [];
  const needsDownload = [];

  for (const url of urls) {
    const exists = window.uploadedTracks.some(t => t.fit_url === url);
    if (!exists) {
      needsDownload.push(url);
    }
  }

  if (needsDownload.length === 0) {
    console.log('所有轨迹已在缓存中');
    await updateStats();
    return { success: [], failed: [] };
  }

  showToast(`正在加载 ${needsDownload.length} 个轨迹...`, 'info');
  
  const CONCURRENT_LIMIT = 4;

  async function downloadSingle(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const trackData = await parseFitFile(buffer);
      trackData.fit_file_name = url.split('/').pop() || 'remote.fit';
      trackData.fit_url = url;
      
      addTrackUnique(trackData);
      results.push(trackData);
      
      if (window.trackStorage) {
        await trackStorage.saveTrack(trackData, url);
      }
      
      return { success: true, trackData };
    } catch (error) {
      errors.push({ url, error: error.message });
      console.warn(`文件加载失败: ${url}`, error);
      return { success: false, url, error };
    }
  }

  const downloadBatches = [];
  for (let i = 0; i < needsDownload.length; i += CONCURRENT_LIMIT) {
    downloadBatches.push(needsDownload.slice(i, i + CONCURRENT_LIMIT));
  }

  for (const batch of downloadBatches) {
    await Promise.all(batch.map(url => downloadSingle(url)));
  }
  
  showToast(`已加载 ${results.length} 个轨迹`, 'success');

  for (const trackData of results) {
    try {
      renderTrackOnMap(trackData);
    } catch (renderError) {
      console.warn('渲染失败:', renderError);
    }
  }

  try {
    await updateStats();
  } catch (e) {
    console.error('更新统计失败:', e);
  }

  return { success: results, failed: errors };
}

window.triggerUpload = triggerUpload;
window.handleFileUpload = handleFileUpload;
window.hideUploadOverlay = hideUploadOverlay;
window.hideUploadProgress = hideUploadProgress;
window.uploadFitFileFromUrl = uploadFitFileFromUrl;
window.uploadFitFilesFromUrls = uploadFitFilesFromUrls;
window.uploadFitFilesFromUrlsBatch = uploadFitFilesFromUrlsBatch;

window.updateStats = updateStats;
window.updateCitySelector = updateCitySelector;
window.toggleCityDropdown = toggleCityDropdown;
window.switchCity = switchCity;
window.showToast = showToast;

window.uploadHandlerReady = true;

if (window.fitParserReady) {
  console.log('所有依赖已就绪');
}