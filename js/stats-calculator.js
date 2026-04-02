/**
 * 统计计算模块
 * 实现GPS坐标点去重、区域判断、点亮率计算等
 */

// ============ 道路数据配置 ============

let roadData = null;
let currentRegion = '青岛市';

/**
 * 加载道路数据
 */
async function loadRoadData() {
  try {
    const response = await fetch('data/road-data.json');
    roadData = await response.json();
    console.log('道路数据已加载:', roadData);
    return roadData;
  } catch (error) {
    console.error('道路数据加载失败:', error);
    // 使用默认数据
    roadData = {
      regions: {
        '青岛市': {
          total_road_km: 18500,
          bounds: { min_lat: 35.5, max_lat: 37.5, min_lon: 119.5, max_lon: 121.5 }
        }
      },
      default_region: '青岛市'
    };
    return roadData;
  }
}

// ============ 区域判断逻辑 ============

/**
 * 判断GPS点是否在指定区域内
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @param {string} regionName - 区域名称
 * @returns {boolean}
 */
function isPointInRegion(lat, lon, regionName) {
  if (!roadData || !roadData.regions[regionName]) {
    return false;
  }
  
  const bounds = roadData.regions[regionName].bounds;
  return lat >= bounds.min_lat && lat <= bounds.max_lat &&
         lon >= bounds.min_lon && lon <= bounds.max_lon;
}

/**
 * 根据GPS坐标判断所在城市
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {string} 城市名称
 */
function detectRegion(lat, lon) {
  if (!roadData || !roadData.regions) {
    return currentRegion;
  }
  
  for (const [regionName, regionData] of Object.entries(roadData.regions)) {
    if (isPointInRegion(lat, lon, regionName)) {
      return regionName;
    }
  }
  
  return currentRegion;
}

// ============ GPS坐标点去重算法 ============

/**
 * GPS坐标点去重
 * @param {Array} allPoints - 所有轨迹点 [{lat, lon, time}, ...]
 * @returns {Set} 去重后的坐标点集合（精度5位小数）
 */
function deduplicatePoints(allPoints) {
  const uniquePoints = new Set();
  
  for (const point of allPoints) {
    // 精度：小数点后5位（约1米精度）
    const normalizedLat = Math.round(point.lat * 100000) / 100000;
    const normalizedLon = Math.round(point.lon * 100000) / 100000;
    uniquePoints.add(`${normalizedLat},${normalizedLon}`);
  }
  
  return uniquePoints;
}

/**
 * 从去重后的坐标点集合转换为坐标数组
 * @param {Set} uniquePointsSet - 去重后的坐标点集合
 * @returns {Array} [{lat, lon}, ...]
 */
function uniquePointsToArray(uniquePointsSet) {
  return Array.from(uniquePointsSet).map(key => {
    const [lat, lon] = key.split(',').map(Number);
    return { lat, lon };
  });
}

// ============ 距离计算 ============

/**
 * 计算去重后的骑行距离（已点亮）
 * @param {Array} tracks - 所有轨迹数据
 * @param {string} regionName - 区域名称
 * @returns {number} 去重后的距离（km）
 */
function calculateUniqueDistance(tracks, regionName) {
  // 1. 提取区域内所有GPS点
  const regionPoints = [];
  
  for (const track of tracks) {
    if (!track.points) continue;
    
    for (const point of track.points) {
      if (isPointInRegion(point.lat, point.lon, regionName)) {
        regionPoints.push({
          lat: point.lat,
          lon: point.lon,
          time: point.time
        });
      }
    }
  }
  
  if (regionPoints.length === 0) {
    return 0;
  }
  
  // 2. 坐标点去重
  const uniquePointsSet = deduplicatePoints(regionPoints);
  const uniquePoints = uniquePointsToArray(uniquePointsSet);
  
  // 3. 按时间排序（如果有的话）
  // 注意：去重后无法保留原始顺序，这里简单按坐标排序
  uniquePoints.sort((a, b) => {
    if (a.lat !== b.lat) return a.lat - b.lat;
    return a.lon - b.lon;
  });
  
  // 4. 计算相邻点之间的距离总和
  // 注意：这不是最优路径，只是一个估算
  // 更精确的方法是使用原始轨迹顺序去重
  let totalDistance = 0;
  
  // 使用Haversine公式计算距离
  for (let i = 0; i < uniquePoints.length - 1; i++) {
    const dist = haversineDistance(
      uniquePoints[i].lat,
      uniquePoints[i].lon,
      uniquePoints[i + 1].lat,
      uniquePoints[i + 1].lon
    );
    totalDistance += dist;
  }
  
  // 返回公里数
  return totalDistance / 1000;
}

/**
 * 更精确的去重距离计算（按轨迹顺序）
 * @param {Array} tracks - 所有轨迹数据
 * @param {string} regionName - 区域名称
 * @returns {number} 去重后的距离（km）
 */
function calculateUniqueDistanceByOrder(tracks, regionName) {
  const visitedPoints = new Set();
  let totalDistance = 0;
  
  for (const track of tracks) {
    if (!track.points) continue;
    
    let prevPoint = null;
    
    for (const point of track.points) {
      // 只计算区域内的点
      if (!isPointInRegion(point.lat, point.lon, regionName)) {
        prevPoint = null; // 离开区域，重置前一个点
        continue;
      }
      
      // 去重：检查当前点是否已访问过
      const normalizedLat = Math.round(point.lat * 100000) / 100000;
      const normalizedLon = Math.round(point.lon * 100000) / 100000;
      const pointKey = `${normalizedLat},${normalizedLon}`;
      
      if (visitedPoints.has(pointKey)) {
        // 已访问过，跳过
        prevPoint = null;
        continue;
      }
      
      // 新点，标记为已访问
      visitedPoints.add(pointKey);
      
      // 计算与前一个未访问点的距离
      if (prevPoint) {
        const dist = haversineDistance(
          prevPoint.lat,
          prevPoint.lon,
          point.lat,
          point.lon
        );
        totalDistance += dist;
      }
      
      prevPoint = { lat: point.lat, lon: point.lon };
    }
  }
  
  return totalDistance / 1000;
}

// ============ 本周统计 ============

/**
 * 获取本周开始时间（周一00:00）
 * @returns {Date}
 */
function getWeekStartTime() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 周日算6，周一算0
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  
  return monday;
}

/**
 * 统计本周上传的fit文件数
 * @param {Array} tracks - 所有轨迹数据（包含上传时间）
 * @returns {number}
 */
function countThisWeekUploads(tracks) {
  const weekStart = getWeekStartTime();
  
  return tracks.filter(track => {
    // 使用轨迹的开始时间作为上传时间参考
    const trackTime = track.start_time ? new Date(track.start_time) : new Date();
    return trackTime >= weekStart;
  }).length;
}

/**
 * 统计本周新增骑行距离
 * @param {Array} tracks - 所有轨迹数据
 * @returns {number} 本周距离（km）
 */
function calculateThisWeekDistance(tracks) {
  const weekStart = getWeekStartTime();
  
  return tracks.filter(track => {
    const trackTime = track.start_time ? new Date(track.start_time) : new Date();
    return trackTime >= weekStart;
  }).reduce((sum, track) => sum + (track.total_distance_km || 0), 0);
}

// ============ 点亮率计算 ============

/**
 * 获取区域道路总距离
 * @param {string} regionName - 区域名称
 * @returns {number} 道路总距离（km）
 */
function getRegionTotalRoadDistance(regionName) {
  if (!roadData || !roadData.regions[regionName]) {
    return 0;
  }
  return roadData.regions[regionName].total_road_km;
}

/**
 * 计算点亮率
 * @param {number} uniqueDistance - 去重后的骑行距离（km）
 * @param {string} regionName - 区域名称
 * @returns {number} 点亮率百分比
 */
function calculateLightingRate(uniqueDistance, regionName) {
  const totalRoadDistance = getRegionTotalRoadDistance(regionName);
  
  if (totalRoadDistance === 0) {
    return 0;
  }
  
  return (uniqueDistance / totalRoadDistance) * 100;
}

// ============ 综合统计函数 ============

/**
 * 计算所有统计数据
 * @param {Array} tracks - 所有轨迹数据
 * @returns {Object} 统计结果
 */
function calculateAllStats(tracks) {
  // 确保道路数据已加载
  if (!roadData) {
    loadRoadData();
  }
  
  // 确定当前区域（根据轨迹第一个点判断，或使用默认）
  if (tracks.length > 0 && tracks[0].points && tracks[0].points.length > 0) {
    const firstPoint = tracks[0].points[0];
    currentRegion = detectRegion(firstPoint.lat, firstPoint.lon);
  }
  
  // 计算去重距离
  const uniqueDistance = calculateUniqueDistanceByOrder(tracks, currentRegion);
  
  // 获取道路总距离
  const totalRoadDistance = getRegionTotalRoadDistance(currentRegion);
  
  // 计算点亮率
  const lightingRate = calculateLightingRate(uniqueDistance, currentRegion);
  
  // 统计本周数据
  const thisWeekUploads = countThisWeekUploads(tracks);
  const thisWeekDistance = calculateThisWeekDistance(tracks);
  
  return {
    region: currentRegion,
    unique_distance_km: uniqueDistance,          // 已点亮：去重距离
    total_road_km: totalRoadDistance,           // 总路线：道路总距离
    lighting_rate: lightingRate,                 // 点亮率
    this_week_uploads: thisWeekUploads,          // 本周上传数
    this_week_km: thisWeekDistance,              // 本周新增距离
    total_tracks: tracks.length                  // 总轨迹数
  };
}

// ============ 导出函数 ============

window.loadRoadData = loadRoadData;
window.isPointInRegion = isPointInRegion;
window.detectRegion = detectRegion;
window.deduplicatePoints = deduplicatePoints;
window.calculateUniqueDistance = calculateUniqueDistance;
window.calculateUniqueDistanceByOrder = calculateUniqueDistanceByOrder;
window.countThisWeekUploads = countThisWeekUploads;
window.calculateThisWeekDistance = calculateThisWeekDistance;
window.calculateLightingRate = calculateLightingRate;
window.calculateAllStats = calculateAllStats;
window.getRegionTotalRoadDistance = getRegionTotalRoadDistance;
window.getCurrentRegion = () => currentRegion;
window.setCurrentRegion = (region) => currentRegion = region;

console.log('统计计算模块已加载');