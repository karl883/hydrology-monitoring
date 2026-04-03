/**
 * 数据加载器
 * 负责从GitHub加载和管理数据
 */

class DataLoader {
    constructor() {
        this.cache = new Map();
        this.loading = false;
        this.lastUpdate = null;
        this.init();
    }
    
    init() {
        // 初始化缓存
        this.loadFromCache();
        
        // 设置缓存清理定时器
        setInterval(() => this.cleanupCache(), CONFIG.cache.ttl);
    }
    
    /**
     * 从本地存储加载缓存
     */
    loadFromCache() {
        try {
            const cached = localStorage.getItem('hydrology_data_cache');
            if (cached) {
                const cacheData = JSON.parse(cached);
                // 恢复缓存数据
                Object.entries(cacheData).forEach(([key, value]) => {
                    this.cache.set(key, value);
                });
                console.log('[DataLoader] 从本地存储加载缓存:', Object.keys(cacheData).length, '项');
            }
        } catch (error) {
            console.warn('[DataLoader] 加载缓存失败:', error);
        }
    }
    
    /**
     * 保存缓存到本地存储
     */
    saveToCache() {
        try {
            const cacheObj = Object.fromEntries(this.cache);
            localStorage.setItem('hydrology_data_cache', JSON.stringify(cacheObj));
        } catch (error) {
            console.warn('[DataLoader] 保存缓存失败:', error);
        }
    }
    
    /**
     * 清理过期缓存
     */
    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > CONFIG.cache.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`[DataLoader] 清理了 ${cleaned} 个过期缓存项`);
            this.saveToCache();
        }
    }
    
    /**
     * 构建GitHub数据URL
     */
    buildGitHubUrl(filename) {
        const { username, repo, branch, dataPath } = CONFIG.github;
        return `${CONFIG.dataSources.github.baseUrl}/${username}/${repo}/${branch}/${dataPath}${filename}`;
    }
    
    /**
     * 加载水库数据
     */
    async loadReservoirs() {
        return this.loadData('reservoirs', 'reservoirs.json');
    }
    
    /**
     * 加载时间序列数据
     */
    async loadTimeSeries() {
        return this.loadData('timeSeries', 'time_series.json');
    }
    
    /**
     * 加载数据摘要
     */
    async loadSummary() {
        return this.loadData('summary', 'summary.json');
    }
    
    /**
     * 加载配置
     */
    async loadConfig() {
        return this.loadData('config', 'config.json');
    }
    
    /**
     * 通用数据加载方法
     */
    async loadData(cacheKey, filename) {
        // 检查缓存
        if (CONFIG.cache.enabled) {
            const cached = this.getFromCache(cacheKey);
            if (cached && !this.isCacheExpired(cacheKey)) {
                console.log(`[DataLoader] Using cached data: ${cacheKey}`);
                return cached;
            }
        }
        
        // 显示加载状态
        this.showLoading();
        
        try {
            // 尝试从GitHub加载
            const data = await this.fetchFromGitHub(filename);
            
            // 保存到缓存
            if (CONFIG.cache.enabled) {
                this.saveToCache(cacheKey, data);
            }
            
            // 更新最后更新时间
            this.lastUpdate = new Date();
            
            console.log(`[DataLoader] Successfully loaded: ${cacheKey}`);
            return data;
            
        } catch (error) {
            console.error(`[DataLoader] Failed to load ${cacheKey}:`, error);
            
            // 尝试使用备用数据
            try {
                const fallbackData = await this.loadFallbackData(filename);
                console.log(`[DataLoader] Using fallback data for: ${cacheKey}`);
                return fallbackData;
            } catch (fallbackError) {
                console.error(`[DataLoader] Fallback also failed for ${cacheKey}:`, fallbackError);
                throw new Error(`无法加载数据: ${cacheKey}`);
            }
        } finally {
            this.hideLoading();
        }
    }
    
    /**
     * 从GitHub获取数据
     */
    async fetchFromGitHub(filename) {
        const url = this.buildGitHubUrl(filename);
        
        console.log(`[DataLoader] Fetching from GitHub: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error(`GitHub请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 添加元数据
        data._metadata = {
            source: 'github',
            fetchedAt: new Date().toISOString(),
            filename: filename
        };
        
        return data;
    }
    
    /**
     * 加载备用数据
     */
    async loadFallbackData(filename) {
        const fallbackPath = CONFIG.dataSources.fallback[filename.split('.')[0]];
        
        if (!fallbackPath) {
            throw new Error(`没有找到备用数据: ${filename}`);
        }
        
        const response = await fetch(fallbackPath);
        
        if (!response.ok) {
            throw new Error(`备用数据请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        
        // 添加元数据
        data._metadata = {
            source: 'fallback',
            fetchedAt: new Date().toISOString(),
            filename: filename
        };
        
        return data;
    }
    
    /**
     * 缓存管理
     */
    saveToCache(key, data) {
        const cacheItem = {
            data: data,
            timestamp: Date.now(),
            size: JSON.stringify(data).length
        };
        
        this.cache.set(key, cacheItem);
        this.saveToLocalStorage(key, cacheItem);
    }
    
    getFromCache(key) {
        // 先检查内存缓存
        if (this.cache.has(key)) {
            return this.cache.get(key).data;
        }
        
        // 然后检查本地存储
        const cached = this.loadFromLocalStorage(key);
        if (cached) {
            this.cache.set(key, cached);
            return cached.data;
        }
        
        return null;
    }
    
    isCacheExpired(key) {
        const cached = this.cache.get(key);
        if (!cached) return true;
        
        const age = Date.now() - cached.timestamp;
        return age > CONFIG.cache.ttl;
    }
    
    cleanupCache() {
        const now = Date.now();
        let totalSize = 0;
        
        for (const [key, item] of this.cache.entries()) {
            const age = now - item.timestamp;
            
            // 删除过期缓存
            if (age > CONFIG.cache.ttl) {
                this.cache.delete(key);
                localStorage.removeItem(`cache_${key}`);
                console.log(`[DataLoader] Cleared expired cache: ${key}`);
                continue;
            }
            
            totalSize += item.size;
        }
        
        // 如果缓存太大，删除最旧的项目
        if (totalSize > CONFIG.cache.maxSize) {
            this.clearOldestCache();
        }
    }
    
    clearOldestCache() {
        let oldestKey = null;
        let oldestTime = Date.now();
        
        for (const [key, item] of this.cache.entries()) {
            if (item.timestamp < oldestTime) {
                oldestTime = item.timestamp;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            localStorage.removeItem(`cache_${oldestKey}`);
            console.log(`[DataLoader] Cleared oldest cache: ${oldestKey}`);
        }
    }
    
    /**
     * 本地存储管理
     */
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(`cache_${key}`, JSON.stringify(data));
        } catch (error) {
            console.warn(`[DataLoader] Failed to save to localStorage:`, error);
            // 如果存储空间不足，清理一些缓存
            this.clearOldestCache();
        }
    }
    
    loadFromLocalStorage(key) {
        try {
            const item = localStorage.getItem(`cache_${key}`);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.warn(`[DataLoader] Failed to load from localStorage:`, error);
            return null;
        }
    }
    
    /**
     * 加载状态管理
     */
    showLoading() {
        this.loading = true;
        document.getElementById('loadingOverlay')?.classList.add('active');
        document.getElementById('dataStatus')?.classList.add('status-loading');
        document.getElementById('dataStatus').textContent = '加载中...';
    }
    
    hideLoading() {
        this.loading = false;
        document.getElementById('loadingOverlay')?.classList.remove('active');
        document.getElementById('dataStatus')?.classList.remove('status-loading');
        document.getElementById('dataStatus').textContent = '已加载';
    }
    
    /**
     * 数据过滤和查询
     */
    filterTimeSeries(data, options = {}) {
        const {
            reservoirIds = [],
            startTime = null,
            endTime = null,
            indicator = 'water_level',
            limit = CONFIG.performance.maxDataPoints
        } = options;
        
        if (!data || !data.data) {
            return [];
        }
        
        let filtered = data.data;
        
        // 按水库过滤
        if (reservoirIds.length > 0) {
            filtered = filtered.filter(item => 
                reservoirIds.includes(item.reservoir_id) || 
                reservoirIds.includes(item.reservoir_name)
            );
        }
        
        // 按时间范围过滤
        if (startTime) {
            filtered = filtered.filter(item => 
                new Date(item.timestamp) >= new Date(startTime)
            );
        }
        
        if (endTime) {
            filtered = filtered.filter(item => 
                new Date(item.timestamp) <= new Date(endTime)
            );
        }
        
        // 限制数据量
        if (filtered.length > limit) {
            // 均匀采样
            const step = Math.ceil(filtered.length / limit);
            filtered = filtered.filter((_, index) => index % step === 0);
        }
        
        return filtered;
    }
    
    /**
     * 获取水库统计数据
     */
    getReservoirStats(data, reservoirId) {
        const reservoirData = data.data?.filter(item => 
            item.reservoir_id === reservoirId || item.reservoir_name === reservoirId
        );
        
        if (!reservoirData || reservoirData.length === 0) {
            return null;
        }
        
        const stats = {
            count: reservoirData.length,
            water_level: this.calculateStats(reservoirData, 'water_level'),
            inflow: this.calculateStats(reservoirData, 'inflow'),
            outflow: this.calculateStats(reservoirData, 'outflow'),
            storage: this.calculateStats(reservoirData, 'storage'),
            latest: reservoirData[reservoirData.length - 1]
        };
        
        return stats;
    }
    
    calculateStats(data, field) {
        const values = data
            .map(item => item[field])
            .filter(value => value !== null && value !== undefined);
        
        if (values.length === 0) {
            return { min: null, max: null, avg: null, latest: null };
        }
        
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const latest = values[values.length - 1];
        
        return { min, max, avg, latest };
    }
    
    /**
     * 获取最后更新时间
     */
    getLastUpdateTime() {
        return this.lastUpdate ? this.lastUpdate.toLocaleString('zh-CN') : '从未更新';
    }
    
    /**
     * 获取缓存状态
     */
    getCacheStatus() {
        let totalItems = 0;
        let totalSize = 0;
        
        for (const item of this.cache.values()) {
            totalItems++;
            totalSize += item.size;
        }
        
        return {
            totalItems,
            totalSizeKB: Math.round(totalSize / 1024),
            lastUpdate: this.lastUpdate
        };
    }
}

// 创建全局实例
const dataLoader = new DataLoader();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
} else {
    window.dataLoader = dataLoader;
}