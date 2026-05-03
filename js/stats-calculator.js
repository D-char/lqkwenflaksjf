/**
 * 统计计算模块
 * 实现GPS坐标点去重、区域判断、点亮率计算等
 */

// ============ 道路数据配置 ============

let roadData = null;
let currentRegion = '青岛';
let onlineRoadData = null;
let dynamicRegions = {};

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

// ============ 逆地理编码缓存 ============

const GEOCODE_CACHE_KEY = 'onelap_geocode_cache';
const GEOCODE_CACHE_EXPIRE_DAYS = 30;

/**
 * 从localStorage获取缓存的地理编码结果
 */
function getCachedGeocode(lat, lon) {
  try {
    const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
    const cacheStr = localStorage.getItem(GEOCODE_CACHE_KEY);
    if (!cacheStr) return null;
    
    const cache = JSON.parse(cacheStr);
    const cached = cache[cacheKey];
    
    if (!cached) return null;
    
    const cacheDate = new Date(cached.timestamp);
    const now = new Date();
    const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > GEOCODE_CACHE_EXPIRE_DAYS) {
      return null;
    }
    
    return cached.cityName;
  } catch (e) {
    return null;
  }
}

/**
 * 缓存地理编码结果到localStorage
 */
function setCachedGeocode(lat, lon, cityName) {
  try {
    const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`;
    const cacheStr = localStorage.getItem(GEOCODE_CACHE_KEY) || '{}';
    const cache = JSON.parse(cacheStr);
    
    cache[cacheKey] = {
      cityName: cityName,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('地理编码缓存存储失败:', e);
  }
}

/**
 * 使用高德逆地理编码API查询城市
 * 高德API在中国访问更稳定
 */
async function queryCityFromAmap(lat, lon) {
  const AMAP_KEY = 'ab2d12c583618aa0959c3dcbd7709f1d';
  
  if (!AMAP_KEY || AMAP_KEY === 'YOUR_AMAP_KEY_HERE') {
    return null;
  }
  
  try {
    // 高德API坐标格式：lng,lat（经度在前，纬度在后）
    const location = `${lon},${lat}`;
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${location}&output=json&radius=1000&extensions=base`;
    
    const response = await fetch(url);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    if (data.status !== '1') {
      console.warn('高德API返回错误:', data.info);
      return null;
    }
    
    const addressComponent = data.regeocode?.addressComponent;
    if (!addressComponent) return null;
    
    // 直辖市city字段为空，需使用province
    let city = addressComponent.city || addressComponent.province;
    if (city) {
      return city.replace(/市$/, '');
    }
    
    return null;
  } catch (e) {
    console.warn('高德逆地理编码失败:', e);
    return null;
  }
}

/**
 * 使用Nominatim逆地理编码API查询城市（fallback）
 */
async function queryCityFromNominatim(lat, lon) {
  const urls = [
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=zh-CN`,
    `http://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&accept-language=zh-CN`
  ];
  
  for (const url of urls) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'onelapMap/1.0' } });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      if (data.address) {
        const city = data.address.city || data.address.county || data.address.state;
        if (city) {
          return city.replace(/市$/, '');
        }
      }
    } catch (e) {
      console.warn('Nominatim查询失败:', e);
    }
  }
  
  return null;
}

/**
 * 异步城市定位函数 - 使用网络逆地理编码API
 * 优先使用高德API（中国更稳定），Nominatim作为fallback
 * @param {number} lat - 纬度
 * @param {number} lon - 经度
 * @returns {Promise<string|null>} 城市名称
 */
async function detectRegionAsync(lat, lon) {
  const cachedCity = getCachedGeocode(lat, lon);
  if (cachedCity) {
    console.log(`使用缓存的地理编码结果: ${cachedCity}`);
    return cachedCity;
  }
  
  const memCacheKey = `${lat.toFixed(2)}_${lon.toFixed(2)}`;
  if (dynamicRegions[memCacheKey]) {
    return dynamicRegions[memCacheKey];
  }
  
  let cityName = await queryCityFromAmap(lat, lon);
  if (!cityName) {
    cityName = await queryCityFromNominatim(lat, lon);
  }
  
  if (cityName) {
    setCachedGeocode(lat, lon, cityName);
    dynamicRegions[memCacheKey] = cityName;
    
    if (roadData && !roadData.regions[cityName]) {
      roadData.regions[cityName] = {
        total_road_km: 2000,
        bounds: {
          min_lat: lat - 0.5,
          max_lat: lat + 0.5,
          min_lon: lon - 0.5,
          max_lon: lon + 0.5
        },
        isDynamic: true
      };
    }
    
    return cityName;
  }
  
  if (roadData && roadData.regions) {
    let bestMatch = null;
    let smallestArea = Infinity;
    
    for (const [regionName, regionData] of Object.entries(roadData.regions)) {
      if (regionData.bounds) {
        const b = regionData.bounds;
        if (lat >= b.min_lat && lat <= b.max_lat && lon >= b.min_lon && lon <= b.max_lon) {
          const area = (b.max_lat - b.min_lat) * (b.max_lon - b.min_lon);
          if (area < smallestArea) {
            smallestArea = area;
            bestMatch = regionName;
          }
        }
      }
    }
    
    if (bestMatch) {
      console.log(`API查询失败，使用本地矩形匹配: ${bestMatch}`);
      return bestMatch;
    }
  }
  
  return '其他地区';
}

/**
 * 旧版同步函数 - 保留兼容性
 * @deprecated 请使用 detectRegionAsync
 */
async function queryCityFromOSM(lat, lon) {
  // 直接调用新的异步函数
  return await detectRegionAsync(lat, lon);
}

async function getRegionTotalRoadDistance(regionName) {
  if (regionName === '其他地区') return 10000;
  
  if (roadData && roadData.regions[regionName] && roadData.regions[regionName].total_road_km) {
    return roadData.regions[regionName].total_road_km;
  }
  
  if (onlineRoadData && onlineRoadData[regionName]) {
    return onlineRoadData[regionName].length_km;
  }
  
  if (window.roadDataApi && window.roadDataApi.getCityRoadLength) {
    try {
      const data = await window.roadDataApi.getCityRoadLength(regionName);
      if (data && data.length_km) {
        if (!onlineRoadData) onlineRoadData = {};
        onlineRoadData[regionName] = data;
        return data.length_km;
      }
    } catch (e) {
      console.warn('获取在线路网数据失败，使用默认值:', e);
    }
  }
  
  return 10000;
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

function detectRegion(lat, lon) {
  if (!roadData || !roadData.regions) {
    console.log(`未加载道路数据，使用默认区域: ${currentRegion}`);
    return currentRegion;
  }
  
  let bestMatch = null;
  let smallestArea = Infinity;
  
  for (const [regionName, regionData] of Object.entries(roadData.regions)) {
    if (isPointInRegion(lat, lon, regionName)) {
      const bounds = regionData.bounds;
      const area = (bounds.max_lat - bounds.min_lat) * (bounds.max_lon - bounds.min_lon);
      if (area < smallestArea) {
        smallestArea = area;
        bestMatch = regionName;
      }
    }
  }
  
  if (bestMatch) return bestMatch;
  
  queryCityFromOSM(lat, lon);
  return '其他地区';
}

async function detectAllRegions(tracks) {
  const regionDistances = {};
  const pendingPoints = [];

  for (const track of tracks) {
    if (!track.points || track.points.length === 0 || !track.total_distance_km) continue;

    const startPoint = track.points[0];
    
    const cachedCity = getCachedGeocode(startPoint.lat, startPoint.lon);
    if (cachedCity && cachedCity !== '其他地区') {
      if (!regionDistances[cachedCity]) {
        regionDistances[cachedCity] = { totalDistance: 0, trackCount: 0 };
      }
      regionDistances[cachedCity].totalDistance += track.total_distance_km;
      regionDistances[cachedCity].trackCount++;
    } else {
      pendingPoints.push({ lat: startPoint.lat, lon: startPoint.lon, track });
    }
  }

  if (pendingPoints.length > 0) {
    const batchSize = 5;
    for (let i = 0; i < pendingPoints.length; i += batchSize) {
      const batch = pendingPoints.slice(i, i + batchSize);
      
      for (const item of batch) {
        const cityName = await detectRegionAsync(item.lat, item.lon);
        if (cityName && cityName !== '其他地区') {
          if (!regionDistances[cityName]) {
            regionDistances[cityName] = { totalDistance: 0, trackCount: 0 };
          }
          regionDistances[cityName].totalDistance += item.track.total_distance_km;
          regionDistances[cityName].trackCount++;
        }
      }
      
      if (i + batchSize < pendingPoints.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  const result = [];
  for (const [regionName, info] of Object.entries(regionDistances)) {
    if (info.trackCount > 0) {
      result.push({
        name: regionName,
        distance: info.totalDistance,
        trackCount: info.trackCount
      });
    }
  }

  result.sort((a, b) => b.distance - a.distance);

  return result.length > 0 ? result : [{ name: currentRegion, distance: 0 }];
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

// 去重距离阈值（米）：小于此距离的点被认为是GPS漂移或静止，不计入距离
const DISTANCE_THRESHOLD_METERS = 2;

/**
 * 精准去重距离计算（基于距离阈值）
 * 使用距离阈值替代固定精度，避免GPS漂移导致距离偏差
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
      
      // 使用距离阈值判断是否需要计入距离
      if (prevPoint) {
        const dist = haversineDistance(prevPoint.lat, prevPoint.lon, point.lat, point.lon);
        
        // 只有距离大于阈值才计入，避免GPS漂移
        if (dist > DISTANCE_THRESHOLD_METERS) {
          // 进一步检查：当前点是否与已访问过的点足够接近（避免重复绕路）
          const normalizedLat = Math.round(point.lat * 100000) / 100000;
          const normalizedLon = Math.round(point.lon * 100000) / 100000;
          const pointKey = `${normalizedLat},${normalizedLon}`;
          
          if (!visitedPoints.has(pointKey)) {
            visitedPoints.add(pointKey);
            totalDistance += dist;
          }
        }
      } else {
        // 第一个有效点，加入已访问集合
        const normalizedLat = Math.round(point.lat * 100000) / 100000;
        const normalizedLon = Math.round(point.lon * 100000) / 100000;
        const pointKey = `${normalizedLat},${normalizedLon}`;
        visitedPoints.add(pointKey);
      }
      
      prevPoint = { lat: point.lat, lon: point.lon };
    }
  }
  
  return totalDistance / 1000;
}

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
    // 仅当 track.start_time 有效时才判断是否属于本周
    if (!track.start_time) return false;
    
    const trackTime = new Date(track.start_time);
    // 检查日期是否有效
    if (isNaN(trackTime.getTime())) return false;
    
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
    // 仅当 track.start_time 有效时才判断是否属于本周
    if (!track.start_time) return false;
    
    const trackTime = new Date(track.start_time);
    // 检查日期是否有效
    if (isNaN(trackTime.getTime())) return false;
    
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

async function calculateAllStats(tracks, targetRegion = null) {
  if (!roadData) await loadRoadData();
  
  const allRegions = await detectAllRegions(tracks);
  
  for (const region of allRegions) {
    region.total_road_km = await getRegionTotalRoadDistance(region.name);
  }
  
  const primaryRegion = allRegions[0]?.name || currentRegion;
  const activeRegion = targetRegion || primaryRegion;
  currentRegion = activeRegion;
  
  let uniqueDistance = calculateUniqueDistanceByOrder(tracks, activeRegion);
  
  if (uniqueDistance === 0 && tracks.length > 0) {
    uniqueDistance = tracks.reduce((sum, track) => sum + (track.total_distance_km || 0), 0);
  }
  
  const totalRoadDistance = await getRegionTotalRoadDistance(activeRegion);
  const lightingRate = await calculateLightingRate(uniqueDistance, activeRegion);
  const thisWeekUploads = countThisWeekUploads(tracks);
  const thisWeekDistance = calculateThisWeekDistance(tracks);
  
  return {
    region: activeRegion,
    regions: allRegions,
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
window.detectRegionAsync = detectRegionAsync;
window.detectAllRegions = detectAllRegions;
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