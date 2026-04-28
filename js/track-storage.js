/**
 * 轨迹数据 IndexedDB 存储模块
 * 用于持久化运动记录，避免每次页面加载时重新下载解析 FIT 文件
 */

const DB_NAME = 'onelap_tracks_db';
const DB_VERSION = 1;
const STORE_NAME = 'tracks';
const TRACK_CACHE_EXPIRE_DAYS = 30;

/**
 * IndexedDB 数据库管理类
 */
class TrackStorage {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  /**
   * 初始化 IndexedDB
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.isReady && this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('IndexedDB 初始化超时'));
      }, 5000);

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        clearTimeout(timeoutId);
        console.error('IndexedDB 打开失败:', event.target.error);
        reject(new Error('IndexedDB 打开失败'));
      };

      request.onsuccess = (event) => {
        clearTimeout(timeoutId);
        this.db = event.target.result;
        this.isReady = true;
        console.log('IndexedDB 已就绪');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'cache_key' });
          store.createIndex('fit_url', 'fit_url', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('user_id', 'user_id', { unique: false });
        }

        console.log('IndexedDB 结构已创建');
      };

      request.onblocked = () => {
        clearTimeout(timeoutId);
        console.warn('IndexedDB 被其他标签页阻塞');
      };
    });
  }

  /**
   * 生成缓存键
   * @param {string} fitUrl - FIT 文件 URL
   * @param {string} userId - 用户 ID（可选）
   * @returns {string}
   */
  generateCacheKey(fitUrl, userId = null) {
    if (!fitUrl || fitUrl === 'undefined') {
      return null;
    }
    return this.simpleHash(fitUrl);
  }

  /**
   * 简单哈希函数（用于生成 URL 缩短键）
   * @param {string} str
   * @returns {string}
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /**
   * 保存轨迹数据到 IndexedDB
   * @param {Object} trackData - 解析后的轨迹数据
   * @param {string} fitUrl - FIT 文件 URL
   * @param {string} userId - 用户 ID（可选）
   * @returns {Promise<void>}
   */
  async saveTrack(trackData, fitUrl, userId = null) {
    await this.init();

    const cacheKey = this.generateCacheKey(fitUrl, userId);
    
    if (!cacheKey) {
      console.warn('无法生成缓存键，跳过保存:', fitUrl);
      return;
    }
    
    trackData.fit_url = fitUrl;

    const cacheEntry = {
      cache_key: cacheKey,
      fit_url: fitUrl,
      user_id: userId,
      track_data: trackData,
      timestamp: new Date().toISOString(),
      version: 1
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put(cacheEntry);

      request.onsuccess = () => {
        console.log(`轨迹已缓存: ${fitUrl}`);
        resolve();
      };

      request.onerror = (event) => {
        console.error('轨迹缓存失败:', event.target.error);
        reject(new Error('轨迹缓存失败'));
      };
    });
  }

  /**
   * 批量保存轨迹数据
   * @param {Array<{trackData: Object, fitUrl: string}>} tracks
   * @param {string} userId - 用户 ID（可选）
   * @returns {Promise<number>} 成功保存的数量
   */
  async saveTracksBatch(tracks, userId = null) {
    await this.init();

    let savedCount = 0;

    for (const { trackData, fitUrl } of tracks) {
      try {
        await this.saveTrack(trackData, fitUrl, userId);
        savedCount++;
      } catch (error) {
        console.warn(`批量保存失败: ${fitUrl}`, error);
      }
    }

    return savedCount;
  }

  /**
   * 从 IndexedDB 读取轨迹数据
   * @param {string} fitUrl - FIT 文件 URL
   * @param {string} userId - 用户 ID（可选）
   * @returns {Promise<Object|null>} 轨迹数据或 null
   */
  async getTrack(fitUrl, userId = null) {
    await this.init();

    const cacheKey = this.generateCacheKey(fitUrl, userId);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.get(cacheKey);

      request.onsuccess = (event) => {
        const result = event.target.result;

        if (!result) {
          resolve(null);
          return;
        }

        const cacheDate = new Date(result.timestamp);
        const now = new Date();
        const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);

        if (daysDiff > TRACK_CACHE_EXPIRE_DAYS) {
          console.log(`缓存已过期: ${fitUrl}`);
          this.deleteTrack(fitUrl, userId);
          resolve(null);
          return;
        }

        console.log(`从缓存加载: ${fitUrl}`);
        const trackData = result.track_data || {};
        trackData.fit_url = result.fit_url || fitUrl;
        resolve(trackData);
      };

      request.onerror = (event) => {
        console.error('getTrack request error:', event.target.error);
        resolve(null);
      };

      transaction.onerror = (event) => {
        console.error('getTrack transaction error:', event.target.error);
        resolve(null);
      };
    });
  }

  /**
   * 批量读取轨迹数据
   * @param {Array<string>} fitUrls - FIT 文件 URL 数组
   * @param {string} userId - 用户 ID（可选）
   * @returns {Promise<Array<{fitUrl: string, trackData: Object|null}>>}
   */
  async getTracksBatch(fitUrls, userId = null) {
    const results = [];

    for (const fitUrl of fitUrls) {
      try {
        const trackData = await this.getTrack(fitUrl, userId);
        results.push({ fitUrl, trackData });
      } catch (error) {
        console.warn('getTracksBatch error for', fitUrl, error);
        results.push({ fitUrl, trackData: null });
      }
    }

    return results;
  }

  /**
   * 删除单个轨迹缓存
   * @param {string} fitUrl - FIT 文件 URL
   * @param {string} userId - 用户 ID（可选）
   * @returns {Promise<void>}
   */
  async deleteTrack(fitUrl, userId = null) {
    await this.init();

    const cacheKey = this.generateCacheKey(fitUrl, userId);

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.delete(cacheKey);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject(new Error('删除缓存失败'));
      };
    });
  }

  /**
   * 获取所有缓存的轨迹数据（用于当前用户）
   * @param {string} userId - 用户 ID（可选）
   * @returns {Promise<Array<Object>>}
   */
  async getAllTracks(userId = null) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const request = userId
        ? store.index('user_id').getAll(userId)
        : store.getAll();

      request.onsuccess = (event) => {
        const results = event.target.result || [];

        const now = new Date();
        const validTracks = [];
        const seenKeys = new Set();
        
        results.filter(entry => {
          const cacheDate = new Date(entry.timestamp);
          const daysDiff = (now - cacheDate) / (1000 * 60 * 60 * 24);
          return daysDiff <= TRACK_CACHE_EXPIRE_DAYS;
        }).forEach(entry => {
          const key = entry.fit_url || entry.cache_key;
          if (key && !seenKeys.has(key)) {
            seenKeys.add(key);
            const trackData = entry.track_data || {};
            if (entry.fit_url) {
              trackData.fit_url = entry.fit_url;
            }
            validTracks.push(trackData);
          }
        });

        resolve(validTracks);
      };

      request.onerror = (event) => {
        console.error('getAllTracks request error:', event.target.error);
        resolve([]);
      };

      transaction.onerror = (event) => {
        console.error('getAllTracks transaction error:', event.target.error);
        resolve([]);
      };
    });
  }

  /**
   * 清除所有缓存（或指定用户的缓存）
   * @param {string} userId - 用户 ID（可选）
   * @returns {Promise<number>} 清除的数量
   */
  async clearCache(userId = null) {
    await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let request;

      if (userId) {
        // 清除指定用户的缓存
        const index = store.index('user_id');
        request = index.openCursor(IDBKeyRange.only(userId));

        let deletedCount = 0;

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            cursor.continue();
          } else {
            resolve(deletedCount);
          }
        };

        request.onerror = (event) => {
          reject(new Error('清除缓存失败'));
        };
      } else {
        // 清除所有缓存
        request = store.clear();

        request.onsuccess = () => {
          resolve(0); // clear() 不返回数量
        };

        request.onerror = (event) => {
          reject(new Error('清除缓存失败'));
        };
      }
    });
  }

  /**
   * 获取缓存统计信息
   * @param {string} userId - 用户 ID（可选）
   * @returns {Promise<Object>}
   */
  async getCacheStats(userId = null) {
    await this.init();

    const allTracks = await this.getAllTracks(userId);

    const totalDistance = allTracks.reduce((sum, track) => {
      return sum + (track.total_distance_km || 0);
    }, 0);

    const totalPoints = allTracks.reduce((sum, track) => {
      return sum + (track.points_count || 0);
    }, 0);

    return {
      count: allTracks.length,
      totalDistanceKm: totalDistance.toFixed(1),
      totalPoints,
      expireDays: TRACK_CACHE_EXPIRE_DAYS
    };
  }
}

// 创建全局实例
const trackStorage = new TrackStorage();

// 导出全局 API
window.trackStorage = trackStorage;

console.log('轨迹存储模块已加载');