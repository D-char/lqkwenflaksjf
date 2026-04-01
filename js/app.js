/**
 * 地图模块
 * 处理地图初始化、路线绘制等功能
 */

// ============ 地图相关代码 ============

// 北京热门骑行路线数据
const routes = {
  // 已点亮路线 - 戒台寺到潭王路
  lit1: {
    coords: [
      [39.875, 116.085],
      [39.880, 116.090],
      [39.885, 116.095],
      [39.890, 116.100],
      [39.895, 116.105],
      [39.900, 116.110]
    ],
    lit: true
  },
  // 已点亮路线 - 妙峰山
  lit2: {
    coords: [
      [39.970, 116.020],
      [39.975, 116.025],
      [39.980, 116.030],
      [39.985, 116.035],
      [39.990, 116.040]
    ],
    lit: true
  },
  // 未点亮路线 - 十三陵水库
  unlit1: {
    coords: [
      [40.250, 116.220],
      [40.255, 116.230],
      [40.260, 116.240],
      [40.265, 116.250]
    ],
    lit: false
  },
  // 未点亮路线 - 白虎涧
  unlit2: {
    coords: [
      [40.080, 116.100],
      [40.085, 116.110],
      [40.090, 116.120]
    ],
    lit: false
  }
};

/**
 * 初始化地图
 */
function initMap() {
  // 初始化地图
  const map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView([39.920, 116.100], 11);
  
  // 使用深色地图底图
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 18
  }).addTo(map);
  
  // 绘制已点亮路线（金黄色+发光效果）
  Object.values(routes).forEach(route => {
    if (route.lit) {
      // 发光底层
      L.polyline(route.coords, {
        color: '#FFD93D',
        weight: 12,
        opacity: 0.3
      }).addTo(map);
      
      // 主路线
      L.polyline(route.coords, {
        color: '#FFD93D',
        weight: 5,
        opacity: 0.9
      }).addTo(map);
      
      // 起点标记
      L.circleMarker(route.coords[0], {
        radius: 8,
        fillColor: '#FFD93D',
        fillOpacity: 1,
        color: '#fff',
        weight: 2
      }).addTo(map);
      
      // 终点标记
      L.circleMarker(route.coords[route.coords.length - 1], {
        radius: 6,
        fillColor: '#FF6B35',
        fillOpacity: 1,
        color: '#fff',
        weight: 2
      }).addTo(map);
    } else {
      // 未点亮路线（灰色虚线）
      L.polyline(route.coords, {
        color: '#666',
        weight: 4,
        opacity: 0.6,
        dashArray: '10, 10'
      }).addTo(map);
    }
  });
  
  return map;
}

// 导出函数供其他模块使用
window.initMap = initMap;
window.routes = routes;