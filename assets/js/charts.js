/**
 * 图表管理器
 * 负责ECharts图表的创建、更新和交互
 */

class ChartManager {
    constructor() {
        this.chart = null;
        this.chartDom = document.getElementById('mainChart');
        this.currentIndicator = 'water_level';
        this.selectedReservoirs = [];
        this.timeRange = '24h';
        this.init();
    }
    
    init() {
        if (!this.chartDom) {
            console.error('Chart container not found');
            return;
        }
        
        // 初始化ECharts实例
        this.chart = echarts.init(this.chartDom);
        
        // 设置默认配置
        this.setDefaultOption();
        
        // 绑定事件
        this.bindEvents();
        
        // 响应窗口大小变化
        window.addEventListener('resize', () => this.resize());
    }
    
    setDefaultOption() {
        const option = {
            backgroundColor: 'transparent',
            animation: true,
            animationDuration: 1000,
            animationEasing: 'cubicOut',
            
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(26, 43, 60, 0.95)',
                borderColor: 'rgba(24, 144, 255, 0.3)',
                borderWidth: 1,
                textStyle: {
                    color: '#ffffff',
                    fontSize: 12
                },
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                }
            },
            
            legend: {
                data: [],
                textStyle: {
                    color: '#8c98a4',
                    fontSize: 12
                },
                top: 10,
                itemWidth: 14,
                itemHeight: 14,
                itemGap: 20
            },
            
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                top: '15%',
                containLabel: true
            },
            
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: [],
                axisLine: {
                    lineStyle: {
                        color: 'rgba(140, 152, 164, 0.3)',
                        width: 1
                    }
                },
                axisLabel: {
                    color: '#8c98a4',
                    fontSize: 11,
                    rotate: 45
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: 'rgba(140, 152, 164, 0.1)',
                        type: 'dashed'
                    }
                }
            },
            
            yAxis: {
                type: 'value',
                axisLine: {
                    lineStyle: {
                        color: 'rgba(140, 152, 164, 0.3)',
                        width: 1
                    }
                },
                axisLabel: {
                    color: '#8c98a4',
                    fontSize: 11,
                    formatter: this.getYAxisFormatter()
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(140, 152, 164, 0.1)',
                        type: 'dashed'
                    }
                }
            },
            
            series: [],
            
            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100,
                    minValueSpan: 10
                },
                {
                    show: true,
                    type: 'slider',
                    top: '90%',
                    start: 0,
                    end: 100,
                    backgroundColor: 'rgba(26, 43, 60, 0.8)',
                    borderColor: 'rgba(140, 152, 164, 0.2)',
                    fillerColor: 'rgba(24, 144, 255, 0.1)',
                    handleStyle: {
                        color: '#1890ff',
                        borderColor: '#1890ff'
                    },
                    textStyle: {
                        color: '#8c98a4'
                    }
                }
            ]
        };
        
        this.chart.setOption(option);
    }
    
    getYAxisFormatter() {
        const indicator = CONFIG.reservoirs.indicators[this.currentIndicator];
        if (!indicator) return '{value}';
        
        return `{value} ${indicator.unit}`;
    }
    
    bindEvents() {
        // 图表点击事件
        this.chart.on('click', (params) => {
            if (params.componentType === 'series') {
                this.onChartClick(params);
            }
        });
        
        // 图例切换事件
        this.chart.on('legendselectchanged', (params) => {
            this.onLegendSelect(params);
        });
        
        // 数据区域缩放事件
        this.chart.on('datazoom', (params) => {
            this.onDataZoom(params);
        });
    }
    
    async updateChart(data, options = {}) {
        if (!this.chart) return;
        
        const {
            indicator = this.currentIndicator,
            reservoirs = this.selectedReservoirs,
            timeRange = this.timeRange
        } = options;
        
        // 更新当前状态
        this.currentIndicator = indicator;
        this.selectedReservoirs = reservoirs;
        this.timeRange = timeRange;
        
        // 显示加载状态
        this.chart.showLoading('default', {
            text: '加载数据中...',
            color: '#1890ff',
            textColor: '#8c98a4',
            maskColor: 'rgba(10, 26, 45, 0.8)'
        });
        
        try {
            // 准备图表数据
            const chartData = this.prepareChartData(data, indicator, reservoirs);
            
            // 更新图表选项
            this.updateChartOption(chartData, indicator);
            
            // 隐藏加载状态
            this.chart.hideLoading();
            
            // 更新图表标题
            this.updateChartTitle(indicator);
            
            console.log(`[ChartManager] Chart updated: ${indicator}, ${reservoirs.length} reservoirs`);
            
        } catch (error) {
            console.error('[ChartManager] Failed to update chart:', error);
            this.chart.hideLoading();
            this.showError('图表更新失败');
        }
    }
    
    prepareChartData(data, indicator, reservoirs) {
        if (!data || !data.data || data.data.length === 0) {
            return { times: [], series: [] };
        }
        
        // 按水库分组数据
        const reservoirGroups = {};
        const timeSet = new Set();
        
        // 初始化分组
        reservoirs.forEach(reservoir => {
            reservoirGroups[reservoir] = {
                name: reservoir,
                data: [],
                color: CONFIG.charts.reservoirColors[reservoir] || CONFIG.charts.colors.primary
            };
        });
        
        // 填充数据
        data.data.forEach(item => {
            if (reservoirs.includes(item.reservoir_name)) {
                const time = this.formatTime(item.timestamp);
                timeSet.add(time);
                
                reservoirGroups[item.reservoir_name].data.push({
                    time: time,
                    value: item[indicator],
                    raw: item
                });
            }
        });
        
        // 转换为时间序列
        const times = Array.from(timeSet).sort();
        const series = [];
        
        Object.values(reservoirGroups).forEach(group => {
            if (group.data.length > 0) {
                // 按时间对齐数据
                const values = times.map(time => {
                    const dataPoint = group.data.find(d => d.time === time);
                    return dataPoint ? dataPoint.value : null;
                });
                
                series.push({
                    name: group.name,
                    type: 'line',
                    smooth: true,
                    lineStyle: {
                        width: 3,
                        color: group.color
                    },
                    symbol: 'circle',
                    symbolSize: 6,
                    itemStyle: {
                        color: group.color,
                        borderColor: '#ffffff',
                        borderWidth: 2
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: this.addAlpha(group.color, 0.3) },
                                { offset: 1, color: this.addAlpha(group.color, 0.05) }
                            ]
                        }
                    },
                    data: values,
                    emphasis: {
                        focus: 'series',
                        itemStyle: {
                            borderWidth: 3,
                            shadowBlur: 10,
                            shadowColor: group.color
                        }
                    }
                });
            }
        });
        
        return { times, series };
    }
    
    updateChartOption(chartData, indicator) {
        const indicatorConfig = CONFIG.reservoirs.indicators[indicator];
        
        const option = {
            xAxis: {
                data: chartData.times
            },
            
            yAxis: {
                name: indicatorConfig ? indicatorConfig.name : '',
                nameTextStyle: {
                    color: '#8c98a4',
                    fontSize: 12
                },
                axisLabel: {
                    formatter: `{value} ${indicatorConfig?.unit || ''}`
                }
            },
            
            legend: {
                data: chartData.series.map(s => s.name)
            },
            
            series: chartData.series
        };
        
        this.chart.setOption(option, true);
    }
    
    updateChartTitle(indicator) {
        const indicatorName = CONFIG.reservoirs.indicators[indicator]?.name || '数据';
        const titleElement = document.getElementById('chartTitle');
        const subtitleElement = document.getElementById('chartSubtitle');
        
        if (titleElement) {
            titleElement.textContent = `${indicatorName}变化趋势分析`;
        }
        
        if (subtitleElement) {
            const reservoirCount = this.selectedReservoirs.length;
            subtitleElement.textContent = reservoirCount > 0 
                ? `${reservoirCount}个水库对比分析` 
                : '请选择要分析的水库';
        }
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        
        switch (this.timeRange) {
            case '24h':
                return date.toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
            case '7d':
                return date.toLocaleDateString('zh-CN', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                });
                
            case '30d':
                return date.toLocaleDateString('zh-CN', { 
                    month: 'short', 
                    day: 'numeric'
                });
                
            default:
                return date.toLocaleDateString('zh-CN');
        }
    }
    
    addAlpha(color, alpha) {
        // 将十六进制颜色转换为rgba
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    // 事件处理
    onChartClick(params) {
        console.log('Chart clicked:', params);
        
        // 显示数据详情
        if (params.data && params.data.raw) {
            this.showDataDetail(params.data.raw);
        }
    }
    
    onLegendSelect(params) {
        console.log('Legend selected:', params);
        
        // 更新选中的水库
        this.selectedReservoirs = Object.keys(params.selected)
            .filter(key => params.selected[key])
            .map(key => key);
        
        // 触发水库选择变化事件
        this.triggerReservoirChange();
    }
    
    onDataZoom(params) {
        console.log('Data zoom:', params);
        
        // 可以在这里添加数据加载逻辑（懒加载）
        if (params.batch && params.batch[0].end === 100) {
            // 用户缩放到全部数据
        }
    }
    
    showDataDetail(data) {
        // 创建数据详情弹窗
        const detailHtml = `
            <div class="data-detail">
                <h3>${data.reservoir_name}</h3>
                <p>时间: ${new Date(data.timestamp).toLocaleString('zh-CN')}</p>
                <p>水位: ${data.water_level || '--'} m</p>
                <p>入库流量: ${data.inflow || '--'} m³/s</p>
                <p>出库流量: ${data.outflow || '--'} m³/s</p>
                <p>蓄水量: ${data.storage || '--'} 万m³</p>
            </div>
        `;
        
        // 显示提示（这里可以替换为更优雅的弹窗）
        alert(detailHtml.replace(/<[^>]*>/g, ''));
    }
    
    triggerReservoirChange() {
        // 触发自定义事件
        const event = new CustomEvent('reservoirSelectionChanged', {
            detail: { reservoirs: this.selectedReservoirs }
        });
        document.dispatchEvent(event);
    }
    
    showError(message) {
        // 在图表上显示错误信息
        this.chart.setOption({
            graphic: {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                    text: message,
                    fontSize: 14,
                    fill: '#ff4d4f'
                }
            }
        }, true);
    }
    
    resize() {
        if (this.chart) {
            this.chart.resize();
        }
    }
    
    clear() {
        if (this.chart) {
            this.chart.clear();
        }
    }
    
    dispose() {
        if (this.chart) {
            this.chart.dispose();
            this.chart = null;
        }
    }
    
    // 导出图表为图片
    exportToImage(filename = 'chart.png') {
        if (!this.chart) return;
        
        const dataURL = this.chart.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#0a1a2d'
        });
        
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.click();
    }
    
    // 切换全屏
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (this.chartDom.requestFullscreen) {
                this.chartDom.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

// 创建全局实例
const chartManager = new ChartManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChartManager;
} else {
    window.chartManager = chartManager;
}