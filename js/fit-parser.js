/**
 * FIT文件解析模块
 * 解析Garmin FIT文件，提取GPS轨迹数据
 */

// ============ 坐标转换工具 ============

/**
 * FIT文件中的经纬度是semicircles单位，转换为度
 * @param {number} semicircles - FIT坐标值
 * @returns {number} 度数
 */
function semicirclesToDegrees(semicircles) {
  return semicircles * (180 / Math.pow(2, 31));
}

/**
 * 计算两点间的距离（Haversine公式）
 * @param {number} lat1 - 纬度1
 * @param {number} lon1 - 经度1
 * @param {number} lat2 - 纬度2
 * @param {number} lon2 - 经度2
 * @returns {number} 距离（米）
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半径（米）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 生成唯一轨迹ID
 * @returns {string}
 */
function generateTrackId() {
  return `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============ FIT文件解析 ============

/**
 * 解析FIT文件二进制数据
 * @param {ArrayBuffer} fitBuffer - FIT文件二进制数据
 * @returns {Promise<Object>} 解析后的轨迹数据
 */
function waitForFitParser() {
  return new Promise((resolve) => {
    if (typeof FitParser !== 'undefined') {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (typeof FitParser !== 'undefined') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('FitParser加载超时，请检查CDN连接');
      }, 5000);
    }
  });
}

async function parseFitFile(fitBuffer) {
  await waitForFitParser();
  
  try {
    if (typeof FitParser === 'undefined') {
      throw new Error('FIT解析库未加载，请检查网络连接');
    }

    const fitParser = new FitParser({
      force: true,
      mode: 'both',
      speedUnit: 'km/h',
      lengthUnit: 'm'
    });

    const fitData = await fitParser.parseAsync(fitBuffer);

    const session = fitData.sessions?.[0] || {};
    const deviceInfo = fitData.device_infos?.[0] || {};
    const records = fitData.records || [];
    
    const points = records
      .filter(record => record.position_lat && record.position_long)
      .map(record => ({
        lat: record.position_lat,
        lon: record.position_long,
        time: record.timestamp ? new Date(record.timestamp * 1000).toISOString() : null,
        speed: record.speed || 0,
        altitude: record.altitude || 0,
        heart_rate: record.heart_rate || null,
        power: record.power || null
      }));

    const validPoints = points.filter(p => 
      p.lat !== 0 && p.lon !== 0 &&
      p.lat >= -90 && p.lat <= 90 &&
      p.lon >= -180 && p.lon <= 180
    );

    let totalDistance = session.total_distance ? session.total_distance / 1000 : 0;
    
    if (totalDistance === 0 && validPoints.length > 1) {
      for (let i = 1; i < validPoints.length; i++) {
        totalDistance += haversineDistance(
          validPoints[i - 1].lat,
          validPoints[i - 1].lon,
          validPoints[i].lat,
          validPoints[i].lon
        );
      }
      totalDistance = totalDistance / 1000;
    }

    const trackData = {
      track_id: generateTrackId(),
      fit_file_name: 'uploaded.fit',
      device: deviceInfo.manufacturer || deviceInfo.device_name || 'Unknown',
      start_time: session.start_time || validPoints[0]?.time,
      end_time: session.timestamp || validPoints[validPoints.length - 1]?.time,
      total_distance_km: totalDistance,
      points_count: validPoints.length,
      points: validPoints
    };

    return trackData;

  } catch (error) {
    throw new Error(`FIT文件解析失败: ${error.message}`);
  }
}

// ============ 文件读取 ============

/**
 * 读取用户上传的FIT文件
 * @param {File} file - 用户选择的FIT文件
 * @returns {Promise<Object>} 解析后的轨迹数据
 */
async function readAndParseFitFile(file) {
  // 验证文件类型
  if (!file.name.toLowerCase().endsWith('.fit')) {
    throw new Error('请上传.FIT格式的文件');
  }

  // 验证文件大小（最大50MB）
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('文件过大，请上传小于50MB的FIT文件');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const buffer = e.target.result;
        const trackData = await parseFitFile(buffer);
        trackData.fit_file_name = file.name;
        resolve(trackData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };

    reader.readAsArrayBuffer(file);
  });
}

// ============ 导出函数 ============

window.parseFitFile = parseFitFile;
window.readAndParseFitFile = readAndParseFitFile;
window.semicirclesToDegrees = semicirclesToDegrees;
window.haversineDistance = haversineDistance;
window.generateTrackId = generateTrackId;

console.log('FIT解析模块已加载');