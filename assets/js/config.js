/**
 * 水文监测系统配置
 * 版本: 3.0.0
 */

const CONFIG = {
    // 应用信息
    app: {
        name: '水文监测分析系统',
        version: '3.0.0',
        description: '基于真实数据的实时水文监测平台'
    },
    
    // GitHub仓库配置
    github: {
        username: 'karl883', // 已修改为您的GitHub用户名
        repo: 'hydrology-monitoring',
        branch: 'main',
        dataPath: 'data/'
    },
    
    // 数据源配置
    dataSources: {
        // GitHub数据源 (主要)
        github: {
            baseUrl: 'https://raw.githubusercontent.com',
            reservoirs: 'reservoirs.json',
            timeSeries: 'time_series.json',
            summary: 'summary.json',
            config: 'config.json'
        },
        
        // 备用数据源 (如果GitHub访问失败)
        fallback: {
            reservoirs: 'assets/data/fallback/reservoirs.json',
            timeSeries: 'assets/data/fallback/time_series.json'
        }
    },
    
    // 图表配置
    charts: {
        colors: {
            primary: '#1890ff',
            success: '#52c41a',
            warning: '#faad14',
            danger: '#ff4d4f',
            info: '#13c2c2',
            purple: '#722ed1'
        },
        
        reservoirColors: {
            '宝珠寺水库': '#1890ff',
            '紫坪铺水库': '#52c41a',
            '亭子口水库': '#faad14',
            '瀑布沟水库': '#ff4d4f',
            '二滩水库': '#13c2c2',
            '向家坝水库': '#722ed1'
        },
        
        // 图表类型配置
        types: {
            line: {
                smooth: true,
                lineWidth: 3,
                symbolSize: 6,
                showSymbol: true
            },
            area: {
                opacity: 0.3,
                smooth: true
            },
            bar: {
                barWidth: '60%',
                itemStyle: {
                    borderRadius: [2, 2, 0, 0]
                }
            }
        }
    },
    
    // 时间配置
    time: {
        // 时间格式
        formats: {
            display: 'YYYY-MM-DD HH:mm',
            api: 'YYYY-MM-DDTHH:mm:ss',
            short: 'MM-DD HH:mm'
        },
        
        // 默认时间范围
        defaultRanges: {
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '2024': new Date('2024-01-01').getTime(),
            '2025': new Date('2025-01-01').getTime(),
            '2026': new Date('2026-01-01').getTime()
        },
        
        // 更新频率选项 (毫秒)
        updateFrequencies: {
            manual: 0,
            '5min': 5 * 60 * 1000,
            '30min': 30 * 60 * 1000,
            '1hour': 60 * 60 * 1000,
            '6hour': 6 * 60 * 60 * 1000
        }
    },
    
    // 水库配置
    reservoirs: {
        // 默认选中的水库
        defaultSelected: ['宝珠寺水库', '紫坪铺水库', '亭子口水库'],
        
        // 指标配置
        indicators: {
            water_level: {
                name: '水位',
                unit: 'm',
                min: 0,
                max: 2000,
                precision: 1
            },
            inflow: {
                name: '入库流量',
                unit: 'm³/s',
                min: 0,
                max: 10000,
                precision: 1
            },
            outflow: {
                name: '出库流量',
                unit: 'm³/s',
                min: 0,
                max: 10000,
                precision: 1
            },
            storage: {
                name: '蓄水量',
                unit: '万m³',
                min: 0,
                max: 10000000,
                precision: 0
            }
        }
    },
    
    // 表格配置
    table: {
        pageSize: 20,
        maxPages: 10,
        sortable: true,
        exportFormats: ['csv', 'json', 'excel']
    },
    
    // 缓存配置
    cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5分钟
        maxSize: 50 * 1024 * 1024 // 50MB
    },
    
    // 性能配置
    performance: {
        debounceDelay: 300,
        throttleDelay: 1000,
        maxDataPoints: 10000,
        chunkSize: 1000
    },
    
    // 错误处理配置
    errorHandling: {
        maxRetries: 3,
        retryDelay: 1000,
        showUserErrors: true,
        logErrors: true
    },
    
    // 功能开关
    features: {
        realtimeUpdates: true,
        offlineSupport: true,
        exportData: true,
        fullscreenCharts: true,
        keyboardShortcuts: true,
        animations: true
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}