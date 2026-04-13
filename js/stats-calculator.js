/**
 * 统计计算模块
 * 实现GPS坐标点去重、区域判断、点亮率计算等
 */

// ============ 道路数据配置 ============

let roadData = null;
let currentRegion = '青岛市';
let onlineRoadData = null;

async function loadRoadData() {
  if (roadData) return roadData;
  
  try {
    const response = await fetch('data/road-data.json');
    roadData = await response.json();
  } catch (e) {
    roadData = {
      regions: {
        '青岛市': { total_road_km: 4500, bounds: { min_lat: 35.5, max_lat: 37.5, min_lon: 119.5, max_lon: 121.5 } }
      },
      default_region: '青岛市'
    };
  }
  return roadData;
}

async function getRegionTotalRoadDistance(regionName) {
  if (regionName === '其他地区') return 10000;
  
  if (onlineRoadData && onlineRoadData[regionName]) {
    return onlineRoadData[regionName].length_km;
  }
  
  if (window.roadDataApi && window.roadDataApi.getCityRoadLength) {
    const data = await window.roadDataApi.getCityRoadLength(regionName);
    if (data && data.length_km) {
      if (!onlineRoadData) onlineRoadData = {};
      onlineRoadData[regionName] = data;
      return data.length_km;
    }
  }
  
  if (!roadData || !roadData.regions[regionName]) return 10000;
  return roadData.regions[regionName].total_road_km;
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
  const inRegion = lat >= bounds.min_lat && lat <= bounds.max_lat &&
                   lon >= bounds.min_lon && lon <= bounds.max_lon;
  return inRegion;
}

/**
 * 根据GPS坐标判断所在城市
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {string} 城市名称
 */
function detectRegion(lat, lon) {
  if (!roadData || !roadData.regions) {
    console.log(`未加载道路数据，使用默认区域: ${currentRegion}`);
    return currentRegion;
  }
  
for (const [regionName, regionData] of Object.entries(roadData.regions)) {
    if (isPointInRegion(lat, lon, regionName)) return regionName;
  }
  
  return '其他地区';
}

// ============ GPS坐标点去重算法 ============

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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
  
  const uniquePointsSet = deduplicatePoints(regionPoints);
  const uniquePoints = uniquePointsToArray(uniquePointsSet);
  
  uniquePoints.sort((a, b) => {
    if (a.lat !== b.lat) return a.lat - b.lat;
    return a.lon - b.lon;
  });
  
  let totalDistance = 0;
  
  for (let i = 0; i < uniquePoints.length - 1; i++) {
    const dist = haversineDistance(
      uniquePoints[i].lat,
      uniquePoints[i].lon,
      uniquePoints[i + 1].lat,
      uniquePoints[i + 1].lon
    );
    totalDistance += dist;
  }
  
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
      const inRegion = isPointInRegion(point.lat, point.lon, regionName);
      
      if (!inRegion) {
        prevPoint = null;
        continue;
      }
      
      const normalizedLat = Math.round(point.lat * 100000) / 100000;
      const normalizedLon = Math.round(point.lon * 100000) / 100000;
      const pointKey = `${normalizedLat},${normalizedLon}`;
      
      if (visitedPoints.has(pointKey)) {
        prevPoint = null;
        continue;
      }
      
      visitedPoints.add(pointKey);
      
      if (prevPoint) {
        const dist = haversineDistance(prevPoint.lat, prevPoint.lon, point.lat, point.lon);
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

async function calculateLightingRate(uniqueDistance, regionName) {
  const totalRoadDistance = await getRegionTotalRoadDistance(regionName);
  
  if (totalRoadDistance === 0) {
    return 0;
  }
  
  return (uniqueDistance / totalRoadDistance) * 100;
}

// ============ 综合统计函数 ============

async function calculateAllStats(tracks) {
  if (!roadData) await loadRoadData();
  
  if (tracks.length > 0 && tracks[0].points && tracks[0].points.length > 0) {
    const firstPoint = tracks[0].points[0];
    currentRegion = detectRegion(firstPoint.lat, firstPoint.lon);
  }
  
  let uniqueDistance = calculateUniqueDistanceByOrder(tracks, currentRegion);
  
  if (uniqueDistance === 0 && tracks.length > 0) {
    uniqueDistance = tracks.reduce((sum, track) => sum + (track.total_distance_km || 0), 0);
  }
  
  const totalRoadDistance = await getRegionTotalRoadDistance(currentRegion);
  const lightingRate = await calculateLightingRate(uniqueDistance, currentRegion);
  const thisWeekUploads = countThisWeekUploads(tracks);
  const thisWeekDistance = calculateThisWeekDistance(tracks);
  
  return {
    region: currentRegion,
    unique_distance_km: uniqueDistance,
    total_road_km: totalRoadDistance,
    lighting_rate: lightingRate,
    this_week_uploads: thisWeekUploads,
    this_week_km: thisWeekDistance,
    total_tracks: tracks.length
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