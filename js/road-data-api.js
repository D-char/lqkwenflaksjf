/**
 * 道路数据在线获取模块
 * 使用 OpenStreetMap Overpass API 实时获取城市道路总长度
 * 
 * API 端点: https://overpass-api.de/api/interpreter
 * 文档: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

const ROAD_DATA_CACHE_KEY = 'onelap_road_data_cache';
const CACHE_EXPIRE_DAYS = 30;

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

let currentEndpointIndex = 0;

const cityAreaIdCache = {};

function getCachedRoadData(cityName) {
  try {
    const cache = localStorage.getItem(ROAD_DATA_CACHE_KEY);
    if (!cache) return null;
    
    const data = JSON.parse(cache);
    const cached = data[cityName];
    
    if (!cached) return null;
    
    const cacheDate = new Date(cached.timestamp);
    const now = new Date();
    const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > CACHE_EXPIRE_DAYS) {
      return null;
    }
    
    return cached.data;
  } catch (e) {
    return null;
  }
}

function setCachedRoadData(cityName, data) {
  try {
    const cache = localStorage.getItem(ROAD_DATA_CACHE_KEY) || '{}';
    const cacheObj = JSON.parse(cache);
    
    cacheObj[cityName] = {
      data: data,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(ROAD_DATA_CACHE_KEY, JSON.stringify(cacheObj));
  } catch (e) {
    console.warn('缓存存储失败:', e);
  }
}

async function getCityAreaId(cityName) {
  if (cityAreaIdCache[cityName]) {
    return cityAreaIdCache[cityName];
  }
  
  const searchName = cityName.replace('市', '');
  
  const queries = [
    `area["name:zh"="${cityName}"]["boundary"="administrative"];area out ids;`,
    `area["name"="${searchName}"]["boundary"="administrative"];area out ids;`,
  ];
  
  for (const queryStr of queries) {
    const query = `[out:json][timeout:10];${queryStr}`;
    
    try {
      const endpoint = OVERPASS_ENDPOINTS[currentEndpointIndex];
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`
      });
      
      if (!response.ok) continue;
      
      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const areaId = data.elements[0].id;
        cityAreaIdCache[cityName] = areaId;
        return areaId;
      }
    } catch (e) {
      // 静默处理
    }
  }
  
  return null;
}

function buildRoadLengthQuery(areaId) {
  return `
    [out:json][timeout:90];
    area(${areaId})->.searchArea;
    (
      way["highway"]["highway"!~"^(path|footway|steps|cycleway|elevator|bus_guideway|raceway|bridleway|proposed|construction)$"](area.searchArea);
    );
    make stat number=count(ways), length=sum(length());
    out;
  `;
}

function buildRoadLengthQueryByBbox(minLat, minLon, maxLat, maxLon) {
  return `
    [out:json][timeout:90];
    (
      way["highway"="motorway"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="motorway_link"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="trunk"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="trunk_link"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="primary"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="primary_link"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="secondary"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="secondary_link"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="tertiary"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="tertiary_link"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="unclassified"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="residential"](${minLat},${minLon},${maxLat},${maxLon});
      way["highway"="living_street"](${minLat},${minLon},${maxLat},${maxLon});
    );
    make stat number=count(ways), length=sum(length());
    out;
  `;
}

async function fetchRoadData(query, retryCount = 0) {
  if (retryCount >= OVERPASS_ENDPOINTS.length) {
    throw new Error('所有Overpass API端点都不可用');
  }
  
  const endpoint = OVERPASS_ENDPOINTS[currentEndpointIndex];
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.elements && data.elements.length > 0) {
      return data.elements[0].tags;
    }
    
    return null;
  } catch (error) {
    currentEndpointIndex = (currentEndpointIndex + 1) % OVERPASS_ENDPOINTS.length;
    return fetchRoadData(query, retryCount + 1);
  }
}

async function getCityRoadLength(cityName) {
  const cached = getCachedRoadData(cityName);
  if (cached) return cached;
  
  const areaId = await getCityAreaId(cityName);
  if (!areaId) return null;
  
  const query = buildRoadLengthQuery(areaId);
  const result = await fetchRoadData(query);
  if (!result) return null;
  
  const lengthKm = Math.round(parseFloat(result.length) / 1000);
  const roadData = {
    city: cityName,
    length_km: lengthKm,
    way_count: parseInt(result.number) || 0,
    source: 'OpenStreetMap',
    update_time: new Date().toISOString()
  };
  
  setCachedRoadData(cityName, roadData);
  return roadData;
}

async function getRoadLengthByBbox(minLat, minLon, maxLat, maxLon) {
  const cacheKey = `bbox_${minLat.toFixed(2)}_${minLon.toFixed(2)}_${maxLat.toFixed(2)}_${maxLon.toFixed(2)}`;
  
  const cached = getCachedRoadData(cacheKey);
  if (cached) return cached;
  
  const query = buildRoadLengthQueryByBbox(minLat, minLon, maxLat, maxLon);
  const result = await fetchRoadData(query);
  if (!result) return null;
  
  const lengthKm = Math.round(parseFloat(result.length) / 1000);
  const roadData = {
    length_km: lengthKm,
    way_count: parseInt(result.number) || 0,
    bounds: { minLat, minLon, maxLat, maxLon },
    source: 'OpenStreetMap',
    update_time: new Date().toISOString()
  };
  
  setCachedRoadData(cacheKey, roadData);
  return roadData;
}

async function getRoadLengthForCity(cityName, bounds) {
  if (cityName && cityName !== '未定位') {
    const cityData = await getCityRoadLength(cityName);
    if (cityData) {
      return cityData;
    }
  }
  
  if (bounds) {
    const bboxData = await getRoadLengthByBbox(
      bounds.min_lat,
      bounds.min_lon,
      bounds.max_lat,
      bounds.max_lon
    );
    if (bboxData) {
      return bboxData;
    }
  }
  
  return {
    length_km: 5000,
    source: '默认估算值',
    note: '无法获取实际道路数据，使用默认值'
  };
}

window.roadDataApi = {
  getCityRoadLength,
  getRoadLengthByBbox,
  getRoadLengthForCity,
  getCachedRoadData
};

console.log('道路数据API模块已加载');