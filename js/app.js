/**
 * 地图模块
 * 处理地图初始化、路线绘制等功能
 */

const routes = {};

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
    const displayText = regionName || '定位失败';
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
  // 默认位置：济南（定位失败时的备选）
  const DEFAULT_LAT = 36.65;
  const DEFAULT_LNG = 117.12;
  const DEFAULT_ZOOM = 11;
  const DEFAULT_REGION = '济南';
  
  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    center: [DEFAULT_LAT, DEFAULT_LNG],
    zoom: DEFAULT_ZOOM
  });
  
  window.map = map;
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18
  }).addTo(map);
  
  updateRegionDisplay(DEFAULT_REGION);
  
  if (navigator.geolocation) {
    console.log('开始浏览器定位...');
    
    navigator.geolocation.getCurrentPosition(
      async function(position) {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        console.log(`✅ 浏览器定位成功: [${userLat}, ${userLng}]`);
        map.setView([userLat, userLng], DEFAULT_ZOOM);
        
        console.log('开始逆地理编码...');
        const regionName = await getRegionName(userLat, userLng);
        updateRegionDisplay(regionName);
        
        // 可选：在用户位置添加标记
        // L.marker([userLat, userLng]).addTo(map).bindPopup('当前位置');
      },
      function(error) {
        console.error(`❌ 浏览器定位失败: ${error.message} (错误码: ${error.code})`);
        console.warn('使用默认位置: 济南');
        updateRegionDisplay(DEFAULT_REGION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    console.warn('浏览器不支持定位功能');
    updateRegionDisplay(DEFAULT_REGION);
  }
  
  return map;
}

window.initMap = initMap;