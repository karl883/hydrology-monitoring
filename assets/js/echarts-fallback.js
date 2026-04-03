/**
 * ECharts备用加载方案
 * 确保即使CDN失败也能使用图表功能
 */

class EChartsFallback {
    constructor() {
        this.loaded = false;
        this.attempts = 0;
        this.maxAttempts = 3;
        this.init();
    }
    
    async init() {
        console.log('[EChartsFallback] 初始化ECharts备用方案...');
        
        // 检查ECharts是否已加载
        if (typeof echarts !== 'undefined') {
            console.log('[EChartsFallback] ECharts已通过CDN加载');
            this.loaded = true;
            return;
        }
        
        // 尝试加载备用CDN
        await this.loadFromBackupCDN();
    }
    
    async loadFromBackupCDN() {
        this.attempts++;
        
        if (this.attempts > this.maxAttempts) {
            console.error('[EChartsFallback] 所有CDN尝试都失败');
            this.showFallbackMessage();
            return;
        }
        
        console.log(`[EChartsFallback] 尝试备用CDN (${this.attempts}/${this.maxAttempts})...`);
        
        const cdnUrls = [
            'https://unpkg.com/echarts@5.4.3/dist/echarts.min.js',
            'https://cdn.bootcdn.net/ajax/libs/echarts/5.4.3/echarts.min.js',
            'https://cdn.staticfile.org/echarts/5.4.3/echarts.min.js'
        ];
        
        const currentUrl = cdnUrls[this.attempts - 1];
        
        try {
            await this.loadScript(currentUrl);
            
            if (typeof echarts !== 'undefined') {
                console.log(`[EChartsFallback] 成功从备用CDN加载: ${currentUrl}`);
                this.loaded = true;
                
                // 通知应用ECharts已加载
                this.notifyEChartsLoaded();
            } else {
                throw new Error('ECharts对象未定义');
            }
            
        } catch (error) {
            console.warn(`[EChartsFallback] CDN加载失败: ${error.message}`);
            
            // 尝试下一个CDN
            setTimeout(() => this.loadFromBackupCDN(), 1000);
        }
    }
    
    loadScript(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`加载失败: ${url}`));
            document.head.appendChild(script);
        });
    }
    
    notifyEChartsLoaded() {
        // 触发自定义事件，通知其他模块ECharts已加载
        const event = new CustomEvent('echarts:loaded', {
            detail: { version: '5.4.3', source: 'fallback' }
        });
        document.dispatchEvent(event);
        
        // 如果有图表管理器，重新初始化
        if (window.chartManager && chartManager.chartDom) {
            console.log('[EChartsFallback] 重新初始化图表管理器...');
            setTimeout(() => {
                if (chartManager && typeof chartManager.init === 'function') {
                    chartManager.init();
                }
            }, 500);
        }
    }
    
    showFallbackMessage() {
        // 显示备用信息
        const chartContainer = document.getElementById('mainChart');
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="echarts-fallback">
                    <div class="fallback-icon">📊</div>
                    <div class="fallback-title">图表功能受限</div>
                    <div class="fallback-message">
                        由于网络限制，图表库无法加载。<br>
                        数据表格功能仍然可用。
                    </div>
                    <div class="fallback-actions">
                        <button onclick="location.reload()">重试加载</button>
                        <button onclick="document.querySelector('.table-container').scrollIntoView()">查看数据表格</button>
                    </div>
                </div>
            `;
            
            // 添加样式
            const style = document.createElement('style');
            style.textContent = `
                .echarts-fallback {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    padding: 40px;
                    text-align: center;
                    background: rgba(26, 43, 60, 0.5);
                    border-radius: var(--radius-lg);
                    border: 1px solid rgba(250, 173, 20, 0.3);
                }
                
                .fallback-icon {
                    font-size: 64px;
                    margin-bottom: 20px;
                    opacity: 0.8;
                }
                
                .fallback-title {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-primary);
                    margin-bottom: 12px;
                }
                
                .fallback-message {
                    color: var(--text-secondary);
                    margin-bottom: 24px;
                    line-height: 1.6;
                    max-width: 400px;
                }
                
                .fallback-actions {
                    display: flex;
                    gap: 12px;
                }
                
                .fallback-actions button {
                    padding: 10px 20px;
                    background: rgba(26, 43, 60, 0.8);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-md);
                    color: var(--text-secondary);
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }
                
                .fallback-actions button:hover {
                    background: rgba(26, 43, 60, 0.9);
                    border-color: var(--primary-color);
                    color: var(--primary-color);
                }
                
                .fallback-actions button:last-child {
                    background: rgba(250, 173, 20, 0.1);
                    border-color: rgba(250, 173, 20, 0.3);
                    color: #faad14;
                }
                
                .fallback-actions button:last-child:hover {
                    background: rgba(250, 173, 20, 0.2);
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // 检查ECharts状态
    getStatus() {
        return {
            loaded: this.loaded,
            attempts: this.attempts,
            echartsDefined: typeof echarts !== 'undefined'
        };
    }
}

// 创建全局实例
const echartsFallback = new EChartsFallback();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EChartsFallback;
} else {
    window.echartsFallback = echartsFallback;
}