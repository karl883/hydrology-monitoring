// 本地ECharts备用加载器
class LocalEChartsLoader {
    constructor() {
        this.loaded = false;
        this.version = '5.4.3';
        this.init();
    }
    
    async init() {
        console.log('[LocalEChartsLoader] 初始化...');
        
        // 检查ECharts是否已加载
        if (typeof echarts !== 'undefined') {
            console.log('[LocalEChartsLoader] ECharts已通过CDN加载');
            this.loaded = true;
            return;
        }
        
        // 尝试加载本地ECharts
        await this.loadLocalECharts();
    }
    
    async loadLocalECharts() {
        console.log('[LocalEChartsLoader] 尝试加载本地ECharts...');
        
        try {
            // 这里可以放置本地ECharts代码
            // 由于ECharts文件较大，我们先使用简化版本
            await this.loadSimplifiedECharts();
            
            if (typeof echarts !== 'undefined') {
                console.log('[LocalEChartsLoader] 本地ECharts加载成功');
                this.loaded = true;
                this.notifyLoaded();
            } else {
                throw new Error('ECharts对象未定义');
            }
            
        } catch (error) {
            console.error('[LocalEChartsLoader] 本地ECharts加载失败:', error);
            this.showFallbackUI();
        }
    }
    
    async loadSimplifiedECharts() {
        // 创建一个简化的ECharts对象，至少让图表能显示
        window.echarts = {
            init: function(dom) {
                console.log('[SimplifiedECharts] 初始化图表容器:', dom);
                return {
                    setOption: function(option) {
                        console.log('[SimplifiedECharts] 设置图表选项');
                        // 显示一个简单的替代内容
                        if (dom) {
                            dom.innerHTML = `
                                <div class="simplified-chart">
                                    <div class="chart-message">
                                        <i class="fas fa-chart-line"></i>
                                        <h3>图表预览受限</h3>
                                        <p>由于网络限制，完整图表功能无法加载。</p>
                                        <p>数据表格功能正常可用。</p>
                                        <div class="chart-actions">
                                            <button onclick="document.querySelector('.table-container').scrollIntoView()">
                                                查看数据表格
                                            </button>
                                            <button onclick="location.reload()">
                                                刷新页面
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }
                    },
                    resize: function() {
                        console.log('[SimplifiedECharts] 调整大小');
                    },
                    dispose: function() {
                        console.log('[SimplifiedECharts] 销毁图表');
                    }
                };
            },
            version: '5.4.3 (simplified)'
        };
        
        console.log('[LocalEChartsLoader] 简化版ECharts已创建');
    }
    
    notifyLoaded() {
        // 触发事件通知其他组件
        const event = new CustomEvent('echarts:localLoaded');
        document.dispatchEvent(event);
    }
    
    showFallbackUI() {
        const chartContainer = document.getElementById('mainChart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="echarts-fallback">
                    <div class="fallback-content">
                        <div class="fallback-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3>图表加载失败</h3>
                        <p>无法加载图表库，请检查网络连接或使用以下功能：</p>
                        <div class="fallback-buttons">
                            <button class="btn-primary" onclick="location.reload()">
                                <i class="fas fa-redo"></i> 刷新页面
                            </button>
                            <button class="btn-secondary" onclick="document.querySelector('.table-container').style.display = 'block'">
                                <i class="fas fa-table"></i> 显示数据表格
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    getStatus() {
        return {
            loaded: this.loaded,
            echartsDefined: typeof echarts !== 'undefined',
            version: this.version
        };
    }
}

// 创建全局实例
const localEChartsLoader = new LocalEChartsLoader();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LocalEChartsLoader;
} else {
    window.localEChartsLoader = localEChartsLoader;
}
