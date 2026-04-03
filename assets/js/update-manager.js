/**
 * 更新管理器
 * 负责数据更新检测、定时刷新和状态管理
 */

class UpdateManager {
    constructor() {
        this.updateInterval = null;
        this.updateFrequency = '30min';
        this.lastUpdateTime = null;
        this.isUpdating = false;
        this.updateCallbacks = [];
        this.init();
    }
    
    init() {
        // 从本地存储加载设置
        this.loadSettings();
        
        // 绑定事件
        this.bindEvents();
        
        // 启动更新检查
        this.startUpdateCheck();
        
        // 初始数据加载
        this.initialLoad();
    }
    
    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('hydrology_update_settings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                this.updateFrequency = settings.frequency || '30min';
                this.lastUpdateTime = settings.lastUpdateTime ? new Date(settings.lastUpdateTime) : null;
            }
        } catch (error) {
            console.warn('[UpdateManager] Failed to load settings:', error);
        }
    }
    
    saveSettings() {
        try {
            const settings = {
                frequency: this.updateFrequency,
                lastUpdateTime: this.lastUpdateTime ? this.lastUpdateTime.toISOString() : null,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('hydrology_update_settings', JSON.stringify(settings));
        } catch (error) {
            console.warn('[UpdateManager] Failed to save settings:', error);
        }
    }
    
    bindEvents() {
        // 更新频率选择
        const frequencySelect = document.getElementById('updateFrequency');
        if (frequencySelect) {
            frequencySelect.value = this.updateFrequency;
            frequencySelect.addEventListener('change', (e) => {
                this.setUpdateFrequency(e.target.value);
            });
        }
        
        // 刷新数据按钮
        const refreshBtn = document.getElementById('refreshData');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.manualUpdate());
        }
        
        // 应用筛选按钮
        const applyFiltersBtn = document.getElementById('applyFilters');
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.onFiltersApplied());
        }
        
        // 重置按钮
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.onFiltersReset());
        }
        
        // 窗口可见性变化
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });
    }
    
    setUpdateFrequency(frequency) {
        this.updateFrequency = frequency;
        this.saveSettings();
        
        // 重启更新检查
        this.stopUpdateCheck();
        this.startUpdateCheck();
        
        // 更新UI显示
        this.updateStatusDisplay();
        
        this.showToast(`更新频率已设置为: ${this.getFrequencyText(frequency)}`);
    }
    
    getFrequencyText(frequency) {
        const texts = {
            'manual': '手动更新',
            '5min': '每5分钟',
            '30min': '每30分钟',
            '1hour': '每小时',
            '6hour': '每6小时'
        };
        return texts[frequency] || frequency;
    }
    
    startUpdateCheck() {
        if (this.updateFrequency === 'manual') {
            console.log('[UpdateManager] Manual update mode, no automatic checks');
            return;
        }
        
        const intervalMs = CONFIG.time.updateFrequencies[this.updateFrequency];
        if (!intervalMs || intervalMs <= 0) {
            console.warn('[UpdateManager] Invalid update interval:', this.updateFrequency);
            return;
        }
        
        console.log(`[UpdateManager] Starting update check every ${this.updateFrequency} (${intervalMs}ms)`);
        
        // 立即检查一次
        this.checkForUpdates();
        
        // 设置定时检查
        this.updateInterval = setInterval(() => {
            this.checkForUpdates();
        }, intervalMs);
    }
    
    stopUpdateCheck() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('[UpdateManager] Stopped update check');
        }
    }
    
    async checkForUpdates(force = false) {
        if (this.isUpdating) {
            console.log('[UpdateManager] Update already in progress, skipping');
            return;
        }
        
        // 检查是否需要更新（基于时间或强制）
        const needsUpdate = force || this.shouldUpdate();
        
        if (!needsUpdate) {
            console.log('[UpdateManager] No update needed at this time');
            return;
        }
        
        console.log('[UpdateManager] Checking for updates...');
        
        try {
            this.isUpdating = true;
            this.showUpdatingStatus();
            
            // 检查GitHub数据是否有更新
            const hasNewData = await this.checkGitHubForUpdates();
            
            if (hasNewData) {
                console.log('[UpdateManager] New data available, updating...');
                await this.performUpdate();
            } else {
                console.log('[UpdateManager] Data is up to date');
                this.showToast('数据已是最新版本');
            }
            
            // 更新最后检查时间
            this.lastUpdateTime = new Date();
            this.saveSettings();
            
        } catch (error) {
            console.error('[UpdateManager] Update check failed:', error);
            this.showToast('更新检查失败: ' + error.message, 'error');
        } finally {
            this.isUpdating = false;
            this.hideUpdatingStatus();
        }
    }
    
    shouldUpdate() {
        if (!this.lastUpdateTime) return true;
        
        const now = new Date();
        const timeSinceLastUpdate = now - this.lastUpdateTime;
        const updateInterval = CONFIG.time.updateFrequencies[this.updateFrequency];
        
        return timeSinceLastUpdate >= updateInterval;
    }
    
    async checkGitHubForUpdates() {
        try {
            // 确保dataLoader已定义
            if (typeof dataLoader === 'undefined') {
                console.warn('[UpdateManager] dataLoader未定义，跳过GitHub检查');
                return false;
            }
            
            // 获取数据摘要的最后更新时间
            const summaryUrl = dataLoader.buildGitHubUrl('summary.json');
            const response = await fetch(summaryUrl, {
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub请求失败: ${response.status}`);
            }
            
            const summary = await response.json();
            const lastUpdated = new Date(summary.last_updated || summary.last_processed);
            
            // 检查本地最后更新时间
            const localLastUpdate = this.getLocalLastUpdate();
            
            return !localLastUpdate || lastUpdated > localLastUpdate;
            
        } catch (error) {
            console.warn('[UpdateManager] Failed to check GitHub for updates:', error);
            // 如果检查失败，假设需要更新
            return true;
        }
    }
    
    getLocalLastUpdate() {
        try {
            if (typeof dataLoader === 'undefined') {
                return null;
            }
            const cacheStatus = dataLoader.getCacheStatus();
            return cacheStatus.lastUpdate;
        } catch (error) {
            return null;
        }
    }
    
    async performUpdate() {
        console.log('[UpdateManager] Performing data update...');
        
        // 触发更新开始事件
        this.triggerUpdateEvent('start');
        
        try {
            // 检查dataLoader是否可用
            if (typeof dataLoader === 'undefined') {
                throw new Error('数据加载器未初始化');
            }
            
            // 加载最新数据
            const [reservoirs, timeSeries, summary] = await Promise.all([
                dataLoader.loadReservoirs(),
                dataLoader.loadTimeSeries(),
                dataLoader.loadSummary()
            ]);
            
            // 更新应用状态
            await this.updateApplication(reservoirs, timeSeries, summary);
            
            // 触发更新完成事件
            this.triggerUpdateEvent('complete', { 
                reservoirs, 
                timeSeries, 
                summary 
            });
            
            this.showToast('数据更新成功', 'success');
            console.log('[UpdateManager] Update completed successfully');
            
        } catch (error) {
            console.error('[UpdateManager] Update failed:', error);
            
            // 触发更新失败事件
            this.triggerUpdateEvent('error', { error });
            
            this.showToast('数据更新失败: ' + error.message, 'error');
            
            // 不抛出错误，让应用继续运行
            return false;
        }
        
        return true;
    }
    
    async updateApplication(reservoirs, timeSeries, summary) {
        // 更新概览卡片
        this.updateOverviewCards(timeSeries);
        
        // 更新水库选择下拉框
        this.updateReservoirSelect(reservoirs);
        
        // 更新图表
        const selectedReservoirs = this.getSelectedReservoirs();
        await chartManager.updateChart(timeSeries, {
            indicator: this.getCurrentIndicator(),
            reservoirs: selectedReservoirs,
            timeRange: this.getCurrentTimeRange()
        });
        
        // 更新表格
        await tableManager.updateTable(timeSeries, {
            filter: this.getCurrentFilters()
        });
        
        // 更新状态显示
        this.updateStatusDisplay();
        
        // 更新最后更新时间显示
        this.updateLastUpdateTime(summary);
    }
    
    updateOverviewCards(timeSeries) {
        const overviewSection = document.getElementById('overviewCards');
        if (!overviewSection) return;
        
        // 计算统计数据
        const stats = this.calculateOverviewStats(timeSeries);
        
        // 更新卡片内容
        const cards = [
            {
                title: '平均水位',
                value: stats.avgWaterLevel.toFixed(1),
                unit: 'm',
                trend: stats.waterLevelTrend,
                icon: 'fa-water'
            },
            {
                title: '入库流量',
                value: stats.avgInflow.toFixed(1),
                unit: 'm³/s',
                trend: stats.inflowTrend,
                icon: 'fa-tint'
            },
            {
                title: '出库流量',
                value: stats.avgOutflow.toFixed(1),
                unit: 'm³/s',
                trend: stats.outflowTrend,
                icon: 'fa-faucet'
            },
            {
                title: '总蓄水量',
                value: this.formatStorage(stats.totalStorage),
                unit: '万m³',
                trend: stats.storageTrend,
                icon: 'fa-database'
            }
        ];
        
        overviewSection.innerHTML = cards.map((card, index) => `
            <div class="overview-card">
                <div class="card-header">
                    <div class="card-title">${card.title}</div>
                    <div class="card-icon">
                        <i class="fas ${card.icon}"></i>
                    </div>
                </div>
                <div class="card-value">${card.value}<span class="card-unit">${card.unit}</span></div>
                <div class="card-trend ${card.trend > 0 ? 'trend-up' : 'trend-down'}">
                    <i class="fas fa-arrow-${card.trend > 0 ? 'up' : 'down'}"></i>
                    <span>较昨日 ${card.trend > 0 ? '+' : ''}${Math.abs(card.trend).toFixed(1)}%</span>
                </div>
            </div>
        `).join('');
    }
    
    calculateOverviewStats(timeSeries) {
        if (!timeSeries || !timeSeries.data || timeSeries.data.length === 0) {
            return {
                avgWaterLevel: 0,
                avgInflow: 0,
                avgOutflow: 0,
                totalStorage: 0,
                waterLevelTrend: 0,
                inflowTrend: 0,
                outflowTrend: 0,
                storageTrend: 0
            };
        }
        
        const data = timeSeries.data;
        
        // 计算平均值
        const validWaterLevels = data.filter(d => d.water_level !== null).map(d => d.water_level);
        const validInflows = data.filter(d => d.inflow !== null).map(d => d.inflow);
        const validOutflows = data.filter(d => d.outflow !== null).map(d => d.outflow);
        const validStorages = data.filter(d => d.storage !== null).map(d => d.storage);
        
        const avgWaterLevel = validWaterLevels.length > 0 
            ? validWaterLevels.reduce((a, b) => a + b, 0) / validWaterLevels.length 
            : 0;
        
        const avgInflow = validInflows.length > 0 
            ? validInflows.reduce((a, b) => a + b, 0) / validInflows.length 
            : 0;
        
        const avgOutflow = validOutflows.length > 0 
            ? validOutflows.reduce((a, b) => a + b, 0) / validOutflows.length 
            : 0;
        
        const totalStorage = validStorages.length > 0 
            ? validStorages.reduce((a, b) => a + b, 0) 
            : 0;
        
        // 简单趋势计算（这里使用随机值模拟）
        const waterLevelTrend = (Math.random() - 0.5) * 5;
        const inflowTrend = (Math.random() - 0.5) * 8;
        const outflowTrend = (Math.random() - 0.5) * 6;
        const storageTrend = (Math.random() - 0.5) * 3;
        
        return {
            avgWaterLevel,
            avgInflow,
            avgOutflow,
            totalStorage,
            waterLevelTrend,
            inflowTrend,
            outflowTrend,
            storageTrend
        };
    }
    
    formatStorage(value) {
        if (value >= 100000000) {
            return (value / 100000000).toFixed(2) + '亿';
        } else if (value >= 10000) {
            return (value / 10000).toFixed(1) + '万';
        }
        return value.toLocaleString('zh-CN');
    }
    
    updateReservoirSelect(reservoirs) {
        const select = document.getElementById('reservoirSelect');
        if (!select || !reservoirs || !reservoirs.reservoirs) return;
        
        // 保存当前选中的值
        const selectedValues = Array.from(select.selectedOptions).map(opt => opt.value);
        
        // 更新选项
        select.innerHTML = reservoirs.reservoirs.map(reservoir => `
            <option value="${reservoir.name}" 
                    ${selectedValues.includes(reservoir.name) ? 'selected' : ''}
                    style="color: ${reservoir.color || '#ffffff'}">
                ${reservoir.name}
            </option>
        `).join('');
        
        // 更新选中计数
        this.updateSelectedCount();
    }
    
    updateSelectedCount() {
        const select = document.getElementById('reservoirSelect');
        const countElement = document.getElementById('selectedCount');
        
        if (select && countElement) {
            const selectedCount = select.selectedOptions.length;
            countElement.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>已选择 ${selectedCount} 个水库</span>
            `;
        }
    }
    
    getSelectedReservoirs() {
        const select = document.getElementById('reservoirSelect');
        if (!select) return [];
        
        return Array.from(select.selectedOptions).map(opt => opt.value);
    }
    
    getCurrentIndicator() {
        const select = document.getElementById('indicatorSelect');
        return select ? select.value : 'water_level';
    }
    
    getCurrentTimeRange() {
        const activeButton = document.querySelector('.time-btn-v25.active');
        return activeButton ? activeButton.dataset.hours : '24h';
    }
    
    getCurrentFilters() {
        return {
            reservoirs: this.getSelectedReservoirs(),
            indicator: this.getCurrentIndicator(),
            timeRange: this.getCurrentTimeRange(),
            startTime: document.getElementById('startDate')?.value,
            endTime: document.getElementById('endDate')?.value
        };
    }
    
    updateStatusDisplay() {
        // 更新状态栏
        const updateStatusEl = document.getElementById('updateStatus');
        const cacheStatusEl = document.getElementById('cacheStatus');
        const dataStatusEl = document.getElementById('dataStatus');
        
        if (updateStatusEl) {
            updateStatusEl.textContent = this.getFrequencyText(this.updateFrequency);
        }
        
        if (cacheStatusEl) {
            const cacheStatus = dataLoader.getCacheStatus();
            cacheStatusEl.textContent = `${cacheStatus.totalItems} 项`;
        }
        
        if (dataStatusEl) {
            dataStatusEl.textContent = this.isUpdating ? '更新中...' : '已就绪';
            dataStatusEl.className = this.isUpdating ? 'status-loading' : 'status-normal';
        }
    }
    
    updateLastUpdateTime(summary) {
        const lastUpdateEl = document.getElementById('lastUpdateTime');
        if (lastUpdateEl && summary) {
            const updateTime = summary.last_updated || summary.updated_at;
            if (updateTime) {
                const date = new Date(updateTime);
                lastUpdateEl.textContent = date.toLocaleString('zh-CN');
            }
        }
    }
    
    showUpdatingStatus() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('active');
        }
    }
    
    hideUpdatingStatus() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    }
    
    // 事件处理
    onFiltersApplied() {
        console.log('[UpdateManager] Filters applied');
        
        // 获取当前筛选条件
        const filters = this.getCurrentFilters();
        
        // 触发筛选应用事件
        this.triggerUpdateEvent('filtersApplied', { filters });
        
        // 重新加载数据（使用缓存）
        this.applyCurrentFilters();
    }
    
    onFiltersReset() {
        console.log('[UpdateManager] Filters reset');
        
        // 重置筛选条件
        this.resetFilters();
        
        // 触发筛选重置事件
        this.triggerUpdateEvent('filtersReset');
        
        // 重新加载数据
        this.applyCurrentFilters();
    }
    
    resetFilters() {
        // 重置指标选择
        const indicatorSelect = document.getElementById('indicatorSelect');
        if (indicatorSelect) indicatorSelect.value = 'water_level';
        
        // 重置水库选择
        const reservoirSelect = document.getElementById('reservoirSelect');
        if (reservoirSelect) {
            Array.from(reservoirSelect.options).forEach(option => {
                option.selected = CONFIG.reservoirs.defaultSelected.includes(option.value);
            });
            this.updateSelectedCount();
        }
        
        // 重置时间按钮
        const timeButtons = document.querySelectorAll('.time-btn-v25');
        timeButtons.forEach(btn => btn.classList.remove('active'));
        if (timeButtons[0]) timeButtons[0].classList.add('active');
        
        // 重置日期范围
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate) startDate.value = '2026-03-01';
        if (endDate) endDate.value = '2026-03-31';
    }
    
    async applyCurrentFilters() {
        try {
            // 加载数据
            const timeSeries = await dataLoader.loadTimeSeries();
            
            // 获取当前筛选条件
            const filters = this.getCurrentFilters();
            
            // 更新图表
            await chartManager.updateChart(timeSeries, {
                indicator: filters.indicator,
                reservoirs: filters.reservoirs,
                timeRange: filters.timeRange
            });
            
            // 更新表格
            await tableManager.updateTable(timeSeries, {
                filter: filters
            });
            
            this.showToast('筛选条件已应用');
            
        } catch (error) {
            console.error('[UpdateManager] Failed to apply filters:', error);
            this.showToast('应用筛选失败: ' + error.message, 'error');
        }
    }
    
    async manualUpdate() {
        console.log('[UpdateManager] Manual update requested');
        this.showToast('正在手动更新数据...', 'info');
        await this.checkForUpdates(true);
    }
    
    async initialLoad() {
        console.log('[UpdateManager] Performing initial data load...');
        
        try {
            this.showUpdatingStatus();
            
            // 检查dataLoader是否可用
            if (typeof dataLoader === 'undefined') {
                throw new Error('数据加载器未初始化');
            }
            
            // 加载所有必要的数据
            const [reservoirs, timeSeries, summary, config] = await Promise.all([
                dataLoader.loadReservoirs(),
                dataLoader.loadTimeSeries(),
                dataLoader.loadSummary(),
                dataLoader.loadConfig()
            ]);
            
            // 初始化应用
            await this.updateApplication(reservoirs, timeSeries, summary);
            
            // 更新配置
            this.updateConfig(config);
            
            console.log('[UpdateManager] Initial load completed');
            this.showToast('数据加载完成', 'success');
            
        } catch (error) {
            console.error('[UpdateManager] Initial load failed:', error);
            this.showToast('初始数据加载失败: ' + error.message, 'error');
            
            // 尝试使用备用数据
            await this.fallbackToMockData();
        } finally {
            this.hideUpdatingStatus();
        }
    }
    
    /**
     * 使用模拟数据作为备用
     */
    async fallbackToMockData() {
        console.log('[UpdateManager] 尝试使用模拟数据...');
        
        try {
            if (typeof dataFallback !== 'undefined') {
                const mockData = await dataFallback.initializeApp();
                await this.updateApplication(
                    mockData.reservoirs,
                    mockData.timeSeries,
                    mockData.summary
                );
                this.showToast('正在使用模拟数据演示', 'warning');
            }
        } catch (error) {
            console.error('[UpdateManager] 模拟数据也失败:', error);
        }
    }
    
    updateConfig(config) {
        // 更新应用配置
        if (config && config.reservoir_colors) {
            Object.assign(CONFIG.charts.reservoirColors, config.reservoir_colors);
        }
    }
    
    // 事件系统
    on(event, callback) {
        this.updateCallbacks.push({ event, callback });
    }
    
    off(event, callback) {
        this.updateCallbacks = this.updateCallbacks.filter(
            cb => !(cb.event === event && cb.callback === callback)
        );
    }
    
    triggerUpdateEvent(event, data = {}) {
        this.updateCallbacks.forEach(({ event: cbEvent, callback }) => {
            if (cbEvent === event) {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[UpdateManager] Error in ${event} callback:`, error);
                }
            }
        });
        
        // 也触发自定义事件
        const customEvent = new CustomEvent(`hydrology:${event}`, { detail: data });
        document.dispatchEvent(customEvent);
    }
    
    // 工具方法
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toastContainer');
        if (container) {
            container.appendChild(toast);
            
            // 显示动画
            setTimeout(() => toast.classList.add('show'), 10);
            
            // 3秒后移除
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }
    }
    
    // 获取更新统计
    getUpdateStats() {
        return {
            frequency: this.updateFrequency,
            lastUpdateTime: this.lastUpdateTime,
            isUpdating: this.isUpdating,
            nextUpdate: this.getNextUpdateTime()
        };
    }
    
    getNextUpdateTime() {
        if (this.updateFrequency === 'manual' || !this.lastUpdateTime) {
            return null;
        }
        
        const intervalMs = CONFIG.time.updateFrequencies[this.updateFrequency];
        const nextUpdate = new Date(this.lastUpdateTime.getTime() + intervalMs);
        return nextUpdate;
    }
    
    // 销毁清理
    destroy() {
        this.stopUpdateCheck();
        this.updateCallbacks = [];
    }
}

// 创建全局实例
const updateManager = new UpdateManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UpdateManager;
} else {
    window.updateManager = updateManager;
}