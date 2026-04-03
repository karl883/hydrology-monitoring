/**
 * 水文监测分析系统 - 主应用文件
 * 负责初始化应用和协调各个模块
 */

class HydrologyApp {
    constructor() {
        this.isInitialized = false;
        this.currentState = {
            reservoirs: [],
            timeSeries: null,
            filters: {},
            viewMode: 'default'
        };
        this.init();
    }
    
    async init() {
        if (this.isInitialized) return;
        
        console.log('🌊 水文监测分析系统初始化...');
        
        try {
            // 1. 初始化UI组件
            this.initUIComponents();
            
            // 2. 绑定全局事件
            this.bindGlobalEvents();
            
            // 3. 检查网络状态
            this.initNetworkMonitor();
            
            // 4. 初始化完成
            this.isInitialized = true;
            
            console.log('✅ 应用初始化完成');
            
            // 5. 触发初始数据加载（通过更新管理器）
            setTimeout(() => {
                updateManager.initialLoad();
            }, 500);
            
        } catch (error) {
            console.error('❌ 应用初始化失败:', error);
            this.showFatalError('应用初始化失败: ' + error.message);
        }
    }
    
    initUIComponents() {
        console.log('🖥️ 初始化UI组件...');
        
        // 初始化时间按钮交互
        this.initTimeButtons();
        
        // 初始化水库多选交互
        this.initReservoirSelect();
        
        // 初始化日期选择器
        this.initDatePickers();
        
        // 初始化操作按钮
        this.initActionButtons();
        
        // 初始化键盘快捷键
        this.initKeyboardShortcuts();
    }
    
    initTimeButtons() {
        const timeButtons = document.querySelectorAll('.time-btn-v25');
        timeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // 移除所有按钮的active类
                timeButtons.forEach(btn => btn.classList.remove('active'));
                
                // 给点击的按钮添加active类
                e.target.classList.add('active');
                
                // 更新日期范围
                this.updateDateRangeForTimeButton(e.target.dataset.hours);
                
                // 触发筛选更新
                updateManager.onFiltersApplied();
            });
        });
    }
    
    updateDateRangeForTimeButton(hours) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - (parseInt(hours) * 60 * 60 * 1000));
        
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput && endDateInput) {
            startDateInput.value = this.formatDateForInput(startDate);
            endDateInput.value = this.formatDateForInput(endDate);
        }
    }
    
    formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    initReservoirSelect() {
        const select = document.getElementById('reservoirSelect');
        if (!select) return;
        
        // 多选交互
        select.addEventListener('change', () => {
            updateManager.updateSelectedCount();
        });
        
        // 添加全选/取消全选功能
        this.addSelectAllOption(select);
    }
    
    addSelectAllOption(select) {
        // 创建控制按钮
        const controlDiv = document.createElement('div');
        controlDiv.className = 'select-controls';
        controlDiv.innerHTML = `
            <button class="select-control-btn" id="selectAll">全选</button>
            <button class="select-control-btn" id="deselectAll">取消全选</button>
        `;
        
        select.parentNode.insertBefore(controlDiv, select.nextSibling);
        
        // 绑定事件
        document.getElementById('selectAll')?.addEventListener('click', () => {
            Array.from(select.options).forEach(option => {
                option.selected = true;
            });
            select.dispatchEvent(new Event('change'));
        });
        
        document.getElementById('deselectAll')?.addEventListener('click', () => {
            Array.from(select.options).forEach(option => {
                option.selected = false;
            });
            select.dispatchEvent(new Event('change'));
        });
    }
    
    initDatePickers() {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate && endDate) {
            // 设置最小/最大日期
            const today = new Date();
            const maxDate = this.formatDateForInput(today);
            const minDate = '2024-01-01'; // 根据数据范围设置
            
            startDate.max = maxDate;
            startDate.min = minDate;
            endDate.max = maxDate;
            endDate.min = minDate;
            
            // 日期变化事件
            const onDateChange = () => {
                // 验证日期范围
                if (new Date(startDate.value) > new Date(endDate.value)) {
                    this.showToast('开始日期不能晚于结束日期', 'error');
                    startDate.value = endDate.value;
                }
                
                // 切换到自定义时间范围
                this.activateCustomTimeRange();
                
                // 触发筛选更新
                updateManager.onFiltersApplied();
            };
            
            startDate.addEventListener('change', onDateChange);
            endDate.addEventListener('change', onDateChange);
        }
    }
    
    activateCustomTimeRange() {
        // 移除所有时间按钮的active类
        document.querySelectorAll('.time-btn-v25').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 添加自定义时间范围标识
        const timeFilter = document.querySelector('.time-filter-v25');
        if (timeFilter) {
            timeFilter.classList.add('custom-range');
        }
    }
    
    initActionButtons() {
        // 全屏按钮
        const fullscreenBtn = document.getElementById('toggleFullscreen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                chartManager.toggleFullscreen();
            });
        }
        
        // 导出图表按钮
        const exportChartBtn = document.getElementById('exportChart');
        if (exportChartBtn) {
            exportChartBtn.addEventListener('click', () => {
                const indicator = document.getElementById('indicatorSelect').value;
                const indicatorName = CONFIG.reservoirs.indicators[indicator]?.name || '图表';
                const filename = `水文监测_${indicatorName}_${new Date().toISOString().slice(0, 10)}.png`;
                chartManager.exportToImage(filename);
            });
        }
        
        // 导出表格按钮（已在table-manager中绑定）
        
        // 重置所有按钮
        const resetAllBtn = document.querySelector('.footer-btn.secondary');
        if (resetAllBtn && resetAllBtn.textContent.includes('重置所有')) {
            resetAllBtn.addEventListener('click', () => {
                if (confirm('确定要重置所有设置和数据吗？')) {
                    this.resetAll();
                }
            });
        }
    }
    
    initKeyboardShortcuts() {
        if (!CONFIG.features.keyboardShortcuts) return;
        
        document.addEventListener('keydown', (e) => {
            // 忽略在输入框中的按键
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }
            
            // Ctrl + R: 刷新数据
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                updateManager.manualUpdate();
            }
            
            // Ctrl + F: 全屏图表
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                chartManager.toggleFullscreen();
            }
            
            // Ctrl + E: 导出数据
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                tableManager.exportData('csv');
            }
            
            // Ctrl + S: 保存配置
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentConfig();
            }
            
            // 方向键: 表格导航
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                this.navigateTable(e.key);
            }
        });
    }
    
    navigateTable(direction) {
        const table = document.querySelector('.table-container table');
        if (!table) return;
        
        const activeRow = table.querySelector('tr.active');
        let nextRow;
        
        if (!activeRow) {
            // 没有活动行，选择第一行
            nextRow = table.querySelector('tbody tr:first-child');
        } else {
            if (direction === 'ArrowUp') {
                nextRow = activeRow.previousElementSibling;
            } else {
                nextRow = activeRow.nextElementSibling;
            }
        }
        
        if (nextRow) {
            // 移除之前的活动行
            table.querySelectorAll('tr.active').forEach(row => {
                row.classList.remove('active');
            });
            
            // 设置新的活动行
            nextRow.classList.add('active');
            
            // 滚动到可见区域
            nextRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    bindGlobalEvents() {
        console.log('🔗 绑定全局事件...');
        
        // 监听数据更新事件
        document.addEventListener('hydrology:complete', (e) => {
            this.onDataUpdated(e.detail);
        });
        
        document.addEventListener('hydrology:error', (e) => {
            this.onDataError(e.detail.error);
        });
        
        // 监听筛选变化
        document.addEventListener('hydrology:filtersApplied', (e) => {
            this.onFiltersUpdated(e.detail.filters);
        });
        
        // 监听窗口大小变化
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.onWindowResize();
            }, 250);
        });
        
        // 监听网络状态变化
        window.addEventListener('online', () => {
            this.onNetworkStatusChange(true);
        });
        
        window.addEventListener('offline', () => {
            this.onNetworkStatusChange(false);
        });
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.onVisibilityChange();
        });
    }
    
    initNetworkMonitor() {
        // 显示初始网络状态
        this.updateNetworkStatus(navigator.onLine);
        
        // 定期检查网络状态
        setInterval(() => {
            this.updateNetworkStatus(navigator.onLine);
        }, 30000);
    }
    
    updateNetworkStatus(isOnline) {
        const statusElement = document.getElementById('alertStatus');
        if (!statusElement) return;
        
        if (isOnline) {
            statusElement.textContent = '在线';
            statusElement.className = 'status-normal';
        } else {
            statusElement.textContent = '离线';
            statusElement.className = 'status-error';
        }
    }
    
    onDataUpdated(data) {
        console.log('📈 数据更新完成:', data);
        
        // 更新当前状态
        this.currentState.timeSeries = data.timeSeries;
        this.currentState.reservoirs = data.reservoirs?.reservoirs || [];
        
        // 更新UI
        this.updateUIAfterDataLoad();
        
        // 显示成功消息
        this.showToast('数据加载完成', 'success');
    }
    
    onDataError(error) {
        console.error('❌ 数据加载错误:', error);
        
        // 显示错误消息
        this.showToast(`数据加载失败: ${error.message}`, 'error');
        
        // 尝试使用备用数据
        this.fallbackToLocalData();
    }
    
    fallbackToLocalData() {
        console.log('🔄 尝试使用本地备用数据...');
        
        // 这里可以加载本地存储的备用数据
        // 或者显示离线模式提示
        this.showToast('正在使用离线数据', 'warning');
    }
    
    onFiltersUpdated(filters) {
        console.log('🎛️ 筛选条件更新:', filters);
        
        // 保存当前筛选条件
        this.currentState.filters = filters;
        
        // 更新URL（可选，用于分享当前视图）
        this.updateURLWithFilters(filters);
        
        // 保存到本地存储
        this.saveFiltersToLocalStorage(filters);
    }
    
    updateURLWithFilters(filters) {
        // 这里可以实现URL更新，用于分享当前视图状态
        // 由于是静态页面，暂时不实现
    }
    
    saveFiltersToLocalStorage(filters) {
        try {
            localStorage.setItem('hydrology_last_filters', JSON.stringify(filters));
        } catch (error) {
            console.warn('Failed to save filters to localStorage:', error);
        }
    }
    
    loadFiltersFromLocalStorage() {
        try {
            const saved = localStorage.getItem('hydrology_last_filters');
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.warn('Failed to load filters from localStorage:', error);
            return null;
        }
    }
    
    onWindowResize() {
        // 重新调整图表大小
        if (chartManager && chartManager.chart) {
            chartManager.resize();
        }
    }
    
    onNetworkStatusChange(isOnline) {
        console.log(isOnline ? '🌐 网络已连接' : '📴 网络已断开');
        
        this.updateNetworkStatus(isOnline);
        
        if (isOnline) {
            this.showToast('网络已恢复连接', 'success');
            // 网络恢复后检查更新
            setTimeout(() => updateManager.checkForUpdates(), 2000);
        } else {
            this.showToast('网络连接已断开，使用离线数据', 'warning');
        }
    }
    
    onVisibilityChange() {
        const isVisible = !document.hidden;
        console.log(isVisible ? '👁️ 页面变为可见' : '👁️‍🗨️ 页面变为隐藏');
        
        if (isVisible) {
            // 页面重新可见时检查更新
            updateManager.checkForUpdates();
        }
    }
    
    updateUIAfterDataLoad() {
        // 更新最后更新时间显示
        this.updateLastUpdateDisplay();
        
        // 更新数据统计
        this.updateDataStats();
        
        // 启用交互元素
        this.enableInteractiveElements();
    }
    
    updateLastUpdateDisplay() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const dateString = now.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
        
        const updateElement = document.querySelector('.update-info span');
        if (updateElement) {
            updateElement.textContent = `最后更新: ${dateString} ${timeString}`;
        }
    }
    
    updateDataStats() {
        const stats = dataLoader.getCacheStatus();
        const cacheElement = document.getElementById('cacheStatus');
        if (cacheElement && stats) {
            cacheElement.textContent = `${stats.totalItems} 项 (${stats.totalSizeKB}KB)`;
        }
    }
    
    enableInteractiveElements() {
        // 启用所有交互元素
        document.querySelectorAll('button, select, input').forEach(element => {
            element.disabled = false;
        });
    }
    
    saveCurrentConfig() {
        const config = {
            filters: this.currentState.filters,
            updateFrequency: updateManager.updateFrequency,
            selectedReservoirs: updateManager.getSelectedReservoirs(),
            savedAt: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('hydrology_user_config', JSON.stringify(config));
            this.showToast('配置已保存', 'success');
        } catch (error) {
            console.error('Failed to save config:', error);
            this.showToast('保存配置失败', 'error');
        }
    }
    
    loadSavedConfig() {
        try {
            const saved = localStorage.getItem('hydrology_user_config');
            if (saved) {
                const config = JSON.parse(saved);
                
                // 应用保存的配置
                if (config.filters) {
                    this.applySavedFilters(config.filters);
                }
                
                if (config.updateFrequency) {
                    const frequencySelect = document.getElementById('updateFrequency');
                    if (frequencySelect) {
                        frequencySelect.value = config.updateFrequency;
                        updateManager.setUpdateFrequency(config.updateFrequency);
                    }
                }
                
                console.log('Loaded saved config:', config);
                this.showToast('已加载保存的配置', 'info');
            }
        } catch (error) {
            console.warn('Failed to load saved config:', error);
        }
    }
    
    applySavedFilters(filters) {
        // 应用保存的筛选条件
        // 这里需要根据实际筛选条件实现
        console.log('Applying saved filters:', filters);
    }
    
    resetAll() {
        if (confirm('确定要重置所有数据、配置和缓存吗？此操作不可撤销。')) {
            try {
                // 清除本地存储
                localStorage.clear();
                
                // 清除数据缓存
                dataLoader.cache.clear();
                
                // 重置UI状态
                this.resetUIState();
                
                // 重新加载页面
                location.reload();
                
            } catch (error) {
                console.error('Failed to reset all:', error);
                this.showToast('重置失败: ' + error.message, 'error');
            }
        }
    }
    
    resetUIState() {
        // 重置所有表单元素
        document.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        document.querySelectorAll('input[type="date"]').forEach(input => {
            input.value = '';
        });
        
        document.querySelectorAll('.time-btn-v25').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 激活第一个时间按钮
        const firstTimeBtn = document.querySelector('.time-btn-v25');
        if (firstTimeBtn) firstTimeBtn.classList.add('active');
    }
    
    showToast(message, type = 'info') {
        updateManager.showToast(message, type);
    }
    
    showFatalError(message) {
        // 显示致命错误界面
        document.body.innerHTML = `
            <div class="fatal-error">
                <div class="error-content">
                    <h1>😔 应用加载失败</h1>
                    <p>${message}</p>
                    <div class="error-actions">
                        <button onclick="location.reload()">重新加载</button>
                        <button onclick="localStorage.clear(); location.reload()">清除数据并重试</button>
                    </div>
                    <div class="error-details">
                        <details>
                            <summary>技术详情</summary>
                            <pre>${message}</pre>
                        </details>
                    </div>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .fatal-error {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #0a1a2d 0%, #1a2b3c 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                z-index: 99999;
            }
            
            .error-content {
                background: rgba(26, 43, 60, 0.95);
                border: 1px solid rgba(255, 77, 79, 0.3);
                border-radius: 16px;
                padding: 40px;
                max-width: 600px;
                width: 100%;
                text-align: center;
                backdrop-filter: blur(10px);
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            .error-content h1 {
                color: #ff4d4f;
                margin-bottom: 20px;
                font-size: 24px;
            }
            
            .error-content p {
                color: #8c98a4;
                margin-bottom: 30px;
                line-height: 1.6;
            }
            
            .error-actions {
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-bottom: 30px;
            }
            
            .error-actions button {
                padding: 12px 24px;
                background: rgba(24, 144, 255, 0.1);
                border: 1px solid rgba(24, 144, 255, 0.3);
                border-radius: 8px;
                color: #1890ff;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .error-actions button:hover {
                background: rgba(24, 144, 255, 0.2);
                transform: translateY(-2px);
            }
            
            .error-actions button:last-child {
                background: rgba(255, 77, 79, 0.1);
                border-color: rgba(255, 77, 79, 0.3);
                color: #ff4d4f;
            }
            
            .error-actions button:last-child:hover {
                background: rgba(255, 77, 79, 0.2);
            }
            
            .error-details {
                margin-top: 20px;
                text-align: left;
            }
            
            .error-details summary {
                color: #8c98a4;
                cursor: pointer;
                padding: 8px 0;
                font-size: 14px;
            }
            
            .error-details pre {
                background: rgba(10, 26, 45, 0.8);
                border: 1px solid rgba(140, 152, 164, 0.2);
                border-radius: 8px;
                padding: 16px;
                color: #8c98a4;
                font-size: 12px;
                overflow: auto;
                max-height: 200px;
                margin-top: 8px;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 性能监控
    startPerformanceMonitor() {
        if (!CONFIG.features.performanceMonitor) return;
        
        // 监控关键性能指标
        this.monitorLoadTime();
        this.monitorMemoryUsage();
        this.monitorNetworkPerformance();
    }
    
    monitorLoadTime() {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        console.log(`📊 页面加载时间: ${loadTime}ms`);
        
        if (loadTime > 3000) {
            console.warn('页面加载时间较长，建议优化');
        }
    }
    
    monitorMemoryUsage() {
        if (performance.memory) {
            const usedMB = performance.memory.usedJSHeapSize / 1024 / 1024;
            const totalMB = performance.memory.totalJSHeapSize / 1024 / 1024;
            
            console.log(`🧠 内存使用: ${usedMB.toFixed(1)}MB / ${totalMB.toFixed(1)}MB`);
            
            if (usedMB / totalMB > 0.8) {
                console.warn('内存使用率较高，建议清理缓存');
            }
        }
    }
    
    monitorNetworkPerformance() {
        // 这里可以监控网络请求性能
        // 使用PerformanceObserver API
    }
    
    // 导出应用状态（用于调试）
    exportAppState() {
        const state = {
            timestamp: new Date().toISOString(),
            config: CONFIG,
            currentState: this.currentState,
            updateStats: updateManager.getUpdateStats(),
            cacheStats: dataLoader.getCacheStatus(),
            performance: {
                loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                memory: performance.memory ? {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize
                } : null
            }
        };
        
        return state;
    }
    
    // 导入应用状态（用于恢复）
    importAppState(state) {
        // 这里可以实现状态恢复功能
        console.log('Importing app state:', state);
    }
    
    // 销毁应用
    destroy() {
        console.log('🧹 清理应用资源...');
        
        // 停止所有定时器
        updateManager.destroy();
        
        // 清理图表
        if (chartManager) {
            chartManager.dispose();
        }
        
        // 清理表格
        if (tableManager) {
            tableManager.clear();
        }
        
        // 移除事件监听器
        this.removeEventListeners();
        
        this.isInitialized = false;
        console.log('✅ 应用资源清理完成');
    }
    
    removeEventListeners() {
        // 这里需要移除所有添加的事件监听器
        // 由于我们使用了事件委托和模块化管理，这里简化处理
    }
}

// 创建全局应用实例
const hydrologyApp = new HydrologyApp();

// 导出到全局
window.hydrologyApp = hydrologyApp;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM加载完成，启动应用...');
    
    // 添加一些CSS样式
    const additionalStyles = `
        /* 表格排序指示器 */
        th.sort-asc::after {
            content: " ↑";
            color: #1890ff;
            font-weight: bold;
        }
        
        th.sort-desc::after {
            content: " ↓";
            color: #1890ff;
            font-weight: bold;
        }
        
        /* 自定义时间范围标识 */
        .time-filter-v25.custom-range {
            border-color: #1890ff;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
        }
        
        /* 选择控制按钮 */
        .select-controls {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        
        .select-control-btn {
            padding: 6px 12px;
            background: rgba(26, 43, 60, 0.8);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .select-control-btn:hover {
            background: rgba(26, 43, 60, 0.9);
            border-color: var(--primary-color);
            color: var(--primary-color);
        }
        
        /* 活动表格行 */
        tbody tr.active {
            background: rgba(24, 144, 255, 0.1) !important;
            border-left: 3px solid var(--primary-color);
        }
        
        /* 模态框样式 */
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(10, 26, 45, 0.8);
            backdrop-filter: blur(5px);
        }
        
        .modal-content {
            position: relative;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-xl);
            padding: var(--spacing-lg);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: var(--shadow-lg);
            z-index: 10001;
        }
        
        .modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: var(--spacing-lg);
            padding-bottom: var(--spacing-md);
            border-bottom: 1px solid var(--border-light);
        }
        
        .modal-header h3 {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .modal-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-sm);
        }
        
        .modal-close:hover {
            background: rgba(140, 152, 164, 0.1);
            color: var(--text-primary);
        }
        
        .modal-body {
            color: var(--text-primary);
        }
        
        /* 数据详情网格 */
        .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: var(--spacing-md);
        }
        
        .detail-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        
        .detail-label {
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .detail-value {
            font-size: 14px;
            font-weight: 500;
            color: var(--text-primary);
        }
    `;
    
    const style = document.createElement('style');
    style.textContent = additionalStyles;
    document.head.appendChild(style);
    
    // 启动性能监控
    setTimeout(() => {
        hydrologyApp.startPerformanceMonitor();
    }, 1000);
    
    // 加载保存的配置
    setTimeout(() => {
        hydrologyApp.loadSavedConfig();
    }, 1500);
});

// 页面卸载前清理
window.addEventListener('beforeunload', () => {
    console.log('🔄 页面即将卸载，保存状态...');
    
    // 保存当前状态
    hydrologyApp.saveCurrentConfig();
    
    // 清理资源（可选）
    // hydrologyApp.destroy();
});

// 错误处理
window.addEventListener('error', (event) => {
    console.error('全局错误:', event.error);
    
    // 显示用户友好的错误消息
    if (event.error && event.error.message) {
        hydrologyApp.showToast(`发生错误: ${event.error.message}`, 'error');
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('未处理的Promise拒绝:', event.reason);
    
    if (event.reason && event.reason.message) {
        hydrologyApp.showToast(`异步错误: ${event.reason.message}`, 'error');
    }
});

// 导出到模块系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HydrologyApp;
}