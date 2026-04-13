/**
 * 地图模块
 * 处理地图初始化、路线绘制等功能
 */

const routes = {};

// ============ 坐标转换工具（WGS-84 转 GCJ-02）===========

/**
 * WGS-84 转 GCJ-02（火星坐标系）
 * 高德地图使用GCJ-02坐标系，GPS数据是WGS-84，需要转换
 */
const PI = 3.14159265358979324;
const A = 6378245.0;
const EE = 0.00669342162296594323;

function outOfChina(lat, lon) {
  if (lon < 72.004 || lon > 137.8347) return true;
  if (lat < 0.8293 || lat > 55.8271) return true;
  return false;
}

function transformLat(x, y) {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(y * PI) + 40.0 * Math.sin(y / 3.0 * PI)) * 2.0 / 3.0;
  ret += (160.0 * Math.sin(y / 12.0 * PI) + 320 * Math.sin(y * PI / 30.0)) * 2.0 / 3.0;
  return ret;
}

function transformLon(x, y) {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += (20.0 * Math.sin(6.0 * x * PI) + 20.0 * Math.sin(2.0 * x * PI)) * 2.0 / 3.0;
  ret += (20.0 * Math.sin(x * PI) + 40.0 * Math.sin(x / 3.0 * PI)) * 2.0 / 3.0;
  ret += (150.0 * Math.sin(x / 12.0 * PI) + 300.0 * Math.sin(x / 30.0 * PI)) * 2.0 / 3.0;
  return ret;
}

function wgs84ToGcj02(lat, lon) {
  if (outOfChina(lat, lon)) {
    return [lat, lon];
  }
  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * PI;
  let magic = Math.sin(radLat);
  magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI);
  const mgLat = lat + dLat;
  const mgLon = lon + dLon;
  return [mgLat, mgLon];
}

/**
 * 根据经纬度获取城市/地区名称（使用高德地图逆地理编码API）
 * 注意：需要申请高德地图API Key，访问 https://lbs.amap.com/
 */
async function getRegionName(lat, lng) {
  // 高德地图API Key - 请替换为你自己的Key
  // 申请地址: https://console.amap.com/dev/key/app
  const AMAP_KEY = 'ab2d12c583618aa0959c3dcbd7709f1d'; // ← 替换为你的高德API Key
  
  if (AMAP_KEY === 'YOUR_AMAP_KEY_HERE') {
    console.warn('⚠️ 请先配置高德地图API Key！访问 https://console.amap.com/dev/key/app 申请');
    return null;
  }
  
  try {
    console.log(`正在调用高德逆地理编码API: lat=${lat}, lng=${lng}`);
    
    // 高德API坐标格式：lng,lat（经度在前，纬度在后）
    const location = `${lng},${lat}`;
    
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${location}&output=json&radius=1000&extensions=base`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('高德API返回完整数据:', JSON.stringify(data, null, 2));
    
    if (data.status !== '1') {
      throw new Error(`API返回错误: ${data.info}`);
    }
    
    const addressComponent = data.regeocode?.addressComponent;
    
    if (!addressComponent) {
      console.warn('API返回数据缺少addressComponent字段');
      return null;
    }
    
    console.log('地址组件详情:', JSON.stringify(addressComponent, null, 2));
    
    // 高德地图地址组件提取优先级：city → province（直辖市无city字段）
    let regionName = null;
    
    // 直辖市（北京、上海、天津、重庆）的city字段为空，需使用province
    if (addressComponent.city && addressComponent.city.length > 0) {
      regionName = addressComponent.city;
    } else if (addressComponent.province) {
      regionName = addressComponent.province;
    }
    
    if (regionName) {
      console.log(`✅ 成功提取城市名称: ${regionName}`);
      return regionName;
    } else {
      console.warn('❌ 无法从addressComponent中提取城市名称');
      return null;
    }
  } catch (error) {
    console.error(`逆地理编码失败: ${error.message}`, error);
    return null;
  }
}

/**
 * 更新页面上的地区名称显示
 */
function updateRegionDisplay(regionName) {
  const regionElement = document.getElementById('region-name');
  if (regionElement) {
    const displayText = regionName || '未定位';
    regionElement.textContent = displayText;
    console.log(`页面显示更新为: ${displayText}`);
  } else {
    console.warn('未找到region-name元素');
  }
}

/**
 * 初始化地图，自动定位到用户当前位置
 */
function initMap() {
  const DEFAULT_LAT = 39.9042;
  const DEFAULT_LNG = 116.4074;
  const DEFAULT_ZOOM = 11;
  const DEFAULT_REGION_DISPLAY = '未定位';
  
  const map = new AMap.Map('map', {
    resizeEnable: true,
    zoom: DEFAULT_ZOOM,
    center: [DEFAULT_LNG, DEFAULT_LAT],
    viewMode: '2D',
    mapStyle: 'amap://styles/normal'
  });
  
  window.map = map;
  
  updateRegionDisplay(DEFAULT_REGION_DISPLAY);
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async function(position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const [gcjLat, gcjLng] = wgs84ToGcj02(userLat, userLng);
        map.setCenter([gcjLng, gcjLat]);
        map.setZoom(DEFAULT_ZOOM);
        
        const regionName = await getRegionName(gcjLat, gcjLng);
        updateRegionDisplay(regionName);
        
        if (regionName && window.roadDataApi) {
          const roadData = await window.roadDataApi.getCityRoadLength(regionName);
          if (roadData) {
            const totalRoadEl = document.querySelector('.achievement-card .stat-item:nth-child(3) .stat-value');
            if (totalRoadEl) {
              totalRoadEl.textContent = `${roadData.length_km}km`;
            }
          }
        }
      },
      function(error) {
        updateRegionDisplay(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    console.warn('浏览器不支持定位功能');
    updateRegionDisplay(DEFAULT_REGION_DISPLAY);
  }
  
  return map;
}

window.initMap = initMap;
window.wgs84ToGcj02 = wgs84ToGcj02;

let currentMapStyle = 'normal';

function toggleStylePanel() {
  const panel = document.getElementById('style-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  }
}

function switchMapStyle(styleName) {
  if (!window.map) return;
  
  const styleUrl = `amap://styles/${styleName}`;
  window.map.setMapStyle(styleUrl);
  currentMapStyle = styleName;
  
  document.querySelectorAll('.style-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.style === styleName);
  });
  
  const panel = document.getElementById('style-panel');
  if (panel) panel.style.display = 'none';
}

window.toggleStylePanel = toggleStylePanel;
window.switchMapStyle = switchMapStyle;