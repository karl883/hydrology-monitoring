# 水文监测分析系统

基于真实数据的实时水文监测平台，部署在GitHub Pages上，支持自动化数据更新。

## 🌐 在线演示

访问地址：https://your-username.github.io/hydrology-monitoring

## ✨ 功能特性

### 📊 数据可视化
- 实时水位、流量、蓄水量监测
- 多水库对比分析
- 时间序列趋势图表
- 交互式数据筛选

### 🔄 自动化更新
- GitHub Actions定时数据更新
- 前端自动检测新数据
- 增量数据加载
- 离线缓存支持

### 📱 响应式设计
- 桌面端优化界面
- 移动端适配
- 触摸屏支持
- 打印友好

### 🔧 技术特性
- 纯前端实现，无需后端服务器
- GitHub Pages免费托管
- 本地数据缓存
- 实时数据更新
- 错误恢复机制

## 🚀 快速开始

### 1. 克隆仓库
```bash
git clone https://github.com/your-username/hydrology-monitoring.git
cd hydrology-monitoring
```

### 2. 本地运行
直接打开 `index.html` 文件，或使用本地服务器：
```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx serve .
```

### 3. 部署到GitHub Pages
1. 创建新的GitHub仓库
2. 推送代码到仓库
3. 在仓库设置中启用GitHub Pages
4. 选择 `main` 分支作为源

## 📁 项目结构

```
hydrology-monitoring/
├── index.html                    # 主页面
├── assets/                       # 静态资源
│   ├── css/
│   │   └── style.css            # 样式文件
│   ├── js/
│   │   ├── config.js            # 配置文件
│   │   ├── data-loader.js       # 数据加载器
│   │   ├── charts.js            # 图表组件
│   │   ├── table-manager.js     # 表格管理
│   │   ├── update-manager.js    # 更新管理
│   │   └── app.js               # 主应用
│   └── data/                    # 备用数据
│       └── fallback/
├── data/                        # 数据文件（自动生成）
│   ├── reservoirs.json          # 水库信息
│   ├── time_series.json         # 时间序列数据
│   ├── summary.json             # 数据摘要
│   └── config.json              # 数据配置
├── scripts/                     # 数据处理脚本
│   ├── update-data.py           # 数据更新脚本
│   └── requirements.txt         # Python依赖
├── .github/                     # GitHub配置
│   └── workflows/
│       └── update-data.yml      # 自动化工作流
└── README.md                    # 项目说明
```

## 🔄 数据更新机制

### 自动化更新流程
1. **GitHub Actions定时触发**（每6小时）
2. **数据抓取与处理**（Python脚本）
3. **数据验证与转换**
4. **自动提交更新**
5. **GitHub Pages自动部署**

### 手动触发更新
在GitHub仓库的Actions标签页，可以手动运行数据更新工作流。

### 前端更新检测
- 每5分钟检查数据更新
- 增量加载新数据
- 本地缓存管理
- 错误重试机制

## ⚙️ 配置说明

### GitHub配置
修改 `assets/js/config.js` 中的GitHub设置：
```javascript
github: {
    username: 'your-username',  // 修改为您的GitHub用户名
    repo: 'hydrology-monitoring',
    branch: 'main',
    dataPath: 'data/'
}
```

### 数据源配置
支持多种数据源：
1. **GitHub数据源**（主要）
2. **本地备用数据**（备用）
3. **外部API**（可扩展）

### 更新频率配置
```javascript
updateFrequencies: {
    manual: 0,           // 手动更新
    '5min': 300000,      // 每5分钟
    '30min': 1800000,    // 每30分钟
    '1hour': 3600000,    // 每小时
    '6hour': 21600000    // 每6小时
}
```

## 📊 数据格式

### 水库数据格式
```json
{
    "reservoirs": [
        {
            "id": "res_001",
            "name": "宝珠寺水库",
            "code": "BZS001",
            "basin": "嘉陵江流域",
            "location": {"lat": 32.1234, "lng": 105.6789},
            "capacity": 256000,
            "status": "normal",
            "color": "#1890ff"
        }
    ]
}
```

### 时间序列数据格式
```json
{
    "data": [
        {
            "timestamp": "2026-03-01T00:00:00",
            "reservoir_id": "res_001",
            "reservoir_name": "宝珠寺水库",
            "water_level": 580.5,
            "inflow": 280.3,
            "outflow": 390.2,
            "storage": 1950000
        }
    ]
}
```

## 🛠️ 开发指南

### 环境设置
```bash
# 安装Python依赖
pip install -r scripts/requirements.txt

# 测试数据更新脚本
python scripts/update-data.py
```

### 添加新数据源
1. 在 `scripts/update-data.py` 中添加数据抓取逻辑
2. 更新数据转换逻辑
3. 修改前端数据加载器

### 自定义样式
修改 `assets/css/style.css` 文件：
- 颜色主题
- 布局样式
- 响应式断点
- 动画效果

## 🔧 故障排除

### 常见问题

#### 1. 数据无法加载
- 检查GitHub用户名配置
- 确认仓库权限
- 查看浏览器控制台错误

#### 2. 图表不显示
- 检查ECharts库加载
- 验证数据格式
- 查看JavaScript错误

#### 3. 更新不工作
- 检查GitHub Actions状态
- 验证Python脚本权限
- 查看工作流日志

#### 4. 移动端显示问题
- 检查响应式CSS
- 测试触摸事件
- 验证视口设置

### 调试工具
- 浏览器开发者工具
- GitHub Actions日志
- 控制台输出
- 网络请求监控

## 📈 性能优化

### 前端优化
- 数据分页加载
- 图表数据采样
- 本地缓存策略
- 懒加载资源

### 数据优化
- 增量数据更新
- 数据压缩
- 智能缓存
- 错误重试

### 网络优化
- CDN资源加速
- 请求合并
- 缓存头设置
- 预加载策略

## 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [ECharts](https://echarts.apache.org/) - 强大的图表库
- [Font Awesome](https://fontawesome.com/) - 图标库
- [GitHub Pages](https://pages.github.com/) - 免费静态网站托管
- [GitHub Actions](https://github.com/features/actions) - 自动化工作流

## 📞 支持

如有问题或建议，请：
1. 查看 [Issues](https://github.com/your-username/hydrology-monitoring/issues)
2. 提交新的 Issue
3. 或通过邮件联系

---

**最后更新**: 2026年4月4日  
**版本**: 3.0.0  
**状态**: 🟢 运行中