/**
 * 数据备用方案
 * 确保即使GitHub数据加载失败，页面也能正常显示
 */

class DataFallback {
    constructor() {
        this.mockData = this.generateMockData();
    }
    
    /**
     * 生成完整的模拟数据
     */
    generateMockData() {
        console.log('[DataFallback] 生成模拟数据...');
        
        const reservoirs = {
            reservoirs: [
                {
                    id: 'res_001',
                    name: '宝珠寺水库',
                    code: 'BZS001',
                    basin: '嘉陵江流域',
                    location: { lat: 32.1234, lng: 105.6789 },
                    capacity: 256000,
                    status: 'normal',
                    color: '#1890ff',
                    description: '嘉陵江上游重要控制性水库'
                },
                {
                    id: 'res_002',
                    name: '紫坪铺水库',
                    code: 'ZPP002',
                    basin: '岷江流域',
                    location: { lat: 31.2345, lng: 103.7890 },
                    capacity: 112400,
                    status: 'normal',
                    color: '#52c41a',
                    description: '岷江上游骨干水利工程'
                },
                {
                    id: 'res_003',
                    name: '亭子口水库',
                    code: 'TZK003',
                    basin: '嘉陵江流域',
                    location: { lat: 32.3456, lng: 106.8901 },
                    capacity: 412000,
                    status: 'normal',
                    color: '#faad14',
                    description: '嘉陵江中游控制性水利枢纽'
                },
                {
                    id: 'res_004',
                    name: '瀑布沟水库',
                    code: 'PBG004',
                    basin: '大渡河流域',
                    location: { lat: 29.4567, lng: 102.9012 },
                    capacity: 532000,
                    status: 'normal',
                    color: '#ff4d4f',
                    description: '大渡河干流重要梯级电站'
                },
                {
                    id: 'res_005',
                    name: '二滩水库',
                    code: 'ET005',
                    basin: '雅砻江流域',
                    location: { lat: 26.5678, lng: 101.0123 },
                    capacity: 5800000,
                    status: 'normal',
                    color: '#13c2c2',
                    description: '雅砻江下游巨型水电站'
                },
                {
                    id: 'res_006',
                    name: '向家坝水库',
                    code: 'XJB006',
                    basin: '金沙江流域',
                    location: { lat: 28.6789, lng: 104.1234 },
                    capacity: 5100000,
                    status: 'normal',
                    color: '#722ed1',
                    description: '金沙江下游重要水利枢纽'
                }
            ],
            count: 6,
            updated_at: new Date().toISOString(),
            _source: 'mock'
        };
        
        // 生成时间序列数据
        const timeSeriesData = [];
        const now = new Date();
        const reservoirsList = reservoirs.reservoirs;
        
        for (let i = 0; i < 168; i++) { // 7天 * 24小时 = 168个数据点
            const time = new Date(now.getTime() - i * 3600000);
            
            reservoirsList.forEach(reservoir => {
                timeSeriesData.push({
                    time: time.toISOString(),
                    reservoir: reservoir.name,
                    water_level: 500 + Math.random() * 100,
                    inflow: 100 + Math.random() * 50,
                    outflow: 80 + Math.random() * 40,
                    storage: reservoir.capacity * 0.7 + Math.random() * (reservoir.capacity * 0.1),
                    basin: reservoir.basin,
                    color: reservoir.color
                });
            });
        }
        
        const timeSeries = {
            data: timeSeriesData,
            count: timeSeriesData.length,
            start_time: timeSeriesData[timeSeriesData.length - 1].time,
            end_time: timeSeriesData[0].time,
            updated_at: new Date().toISOString(),
            _source: 'mock'
        };
        
        const summary = {
            total_reservoirs: 6,
            total_data_points: timeSeriesData.length,
            last_updated: new Date().toISOString(),
            data_range: {
                start: timeSeries.start_time,
                end: timeSeries.end_time
            },
            statistics: {
                avg_water_level: 550.3,
                avg_inflow: 125.7,
                avg_outflow: 100.2,
                total_storage: 12345678
            },
            _source: 'mock'
        };
        
        return {
            reservoirs,
            timeSeries,
            summary
        };
    }
    
    /**
     * 获取模拟数据
     */
    getMockData(type) {
        if (type === 'reservoirs') {
            return this.mockData.reservoirs;
        } else if (type === 'timeSeries') {
            return this.mockData.timeSeries;
        } else if (type === 'summary') {
            return this.mockData.summary;
        }
        return this.mockData;
    }
    
    /**
     * 检查GitHub数据是否可用
     */
    async checkGitHubData() {
        try {
            const testUrl = 'https://raw.githubusercontent.com/karl883/hydrology-monitoring/main/data/reservoirs.json';
            const response = await fetch(testUrl, { 
                headers: { 'Cache-Control': 'no-cache' },
                timeout: 5000 
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    available: true,
                    data: data,
                    message: 'GitHub数据可用'
                };
            }
            
            return {
                available: false,
                message: `GitHub请求失败: ${response.status}`
            };
            
        } catch (error) {
            return {
                available: false,
                message: `GitHub检查失败: ${error.message}`
            };
        }
    }
    
    /**
     * 初始化应用（使用模拟数据）
     */
    async initializeApp() {
        console.log('[DataFallback] 使用模拟数据初始化应用...');
        
        // 显示状态消息
        this.showStatusMessage('正在使用模拟数据演示...', 'info');
        
        // 获取模拟数据
        const reservoirs = this.getMockData('reservoirs');
        const timeSeries = this.getMockData('timeSeries');
        const summary = this.getMockData('summary');
        
        // 检查GitHub数据
        const githubStatus = await this.checkGitHubData();
        
        if (githubStatus.available) {
            this.showStatusMessage('检测到GitHub数据，正在切换...', 'success');
            
            // 可以在这里切换到真实数据
            setTimeout(() => {
                this.showStatusMessage('已切换到真实数据', 'success');
            }, 2000);
        } else {
            this.showStatusMessage(`使用模拟数据演示 (${githubStatus.message})`, 'warning');
        }
        
        return { reservoirs, timeSeries, summary };
    }
    
    /**
     * 显示状态消息
     */
    showStatusMessage(message, type = 'info') {
        console.log(`[DataFallback] ${type}: ${message}`);
        
        // 创建状态提示
        const statusEl = document.getElementById('dataStatus');
        if (statusEl) {
            statusEl.textContent = message;
            statusEl.className = `status-${type}`;
        }
        
        // 显示Toast通知
        if (window.updateManager && updateManager.showToast) {
            updateManager.showToast(message, type);
        }
    }
}

// 创建全局实例
const dataFallback = new DataFallback();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataFallback;
} else {
    window.dataFallback = dataFallback;
}