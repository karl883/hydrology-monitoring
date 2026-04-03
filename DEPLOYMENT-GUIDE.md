# 水文监测系统部署指南

## 🚀 快速部署

### 方法A：使用部署脚本（推荐）
```bash
# 1. 进入项目目录
cd C:\Users\25185\Desktop\hydrology-monitoring

# 2. 修改部署脚本中的GitHub用户名
# 打开 deploy-to-github.sh，将 your-username 改为您的GitHub用户名

# 3. 运行部署脚本
bash deploy-to-github.sh
```

### 方法B：手动部署
```bash
# 1. 在GitHub创建新仓库
# 仓库名: hydrology-monitoring
# 描述: 水文监测分析系统
# 公开仓库

# 2. 初始化本地仓库
cd C:\Users\25185\Desktop\hydrology-monitoring
git init
git add .
git commit -m "初始提交"

# 3. 添加远程仓库
git remote add origin https://github.com/您的用户名/hydrology-monitoring.git

# 4. 推送代码
git push -u origin main
```

## ⚙️ 配置步骤

### 1. 修改GitHub配置
编辑 `assets/js/config.js`：
```javascript
github: {
    username: '您的GitHub用户名',  // 修改这里
    repo: 'hydrology-monitoring',
    branch: 'main',
    dataPath: 'data/'
}
```

### 2. 启用GitHub Pages
1. 访问 https://github.com/您的用户名/hydrology-monitoring
2. 进入 Settings → Pages
3. 设置 Source 为 "Deploy from a branch"
4. 选择 Branch: `main`, Folder: `/ (root)`
5. 点击 Save

### 3. 启用GitHub Actions
1. 进入 Actions 标签页
2. 点击 "I understand my workflows, go ahead and enable them"
3. 第一次可能需要手动触发工作流

## 📊 数据更新配置

### 自动更新频率
默认每6小时更新一次，如需修改：
编辑 `.github/workflows/update-data.yml`：
```yaml
schedule:
  - cron: '0 */6 * * *'  # 修改这里的cron表达式
```

### 手动触发更新
1. 进入 Actions → Update Hydrological Data
2. 点击 "Run workflow"
3. 选择 "Run workflow"

## 🖥️ 本地开发

### 运行本地服务器
```bash
# 使用Python
python -m http.server 8000

# 使用Node.js
npx serve .

# 访问 http://localhost:8000
```

### 测试数据更新脚本
```bash
cd scripts
pip install -r requirements.txt
python update-data.py
```

## 🔧 故障排除

### 常见问题

#### 1. 页面无法访问
- 检查GitHub Pages是否启用
- 等待几分钟让部署完成
- 检查仓库是否为公开

#### 2. 数据无法加载
- 检查 `config.js` 中的GitHub用户名
- 查看浏览器控制台错误
- 检查网络连接

#### 3. 图表不显示
- 检查ECharts库是否加载
- 查看JavaScript控制台错误
- 检查数据格式

#### 4. GitHub Actions失败
- 检查工作流日志
- 确认Python依赖安装成功
- 检查仓库权限

#### 5. 移动端显示问题
- 检查响应式CSS
- 测试不同屏幕尺寸
- 检查触摸事件

### 调试工具
1. **浏览器开发者工具** (F12)
   - 控制台查看错误
   - 网络面板检查请求
   - 元素面板检查DOM

2. **GitHub Actions日志**
   - 查看工作流运行详情
   - 检查Python脚本输出
   - 查看数据更新状态

3. **本地存储检查**
   - 检查localStorage数据
   - 查看缓存状态
   - 清理缓存测试

## 📈 性能优化

### 前端优化
- 启用浏览器缓存
- 压缩静态资源
- 使用CDN加载库

### 数据优化
- 减少数据点数量
- 启用数据压缩
- 优化缓存策略

### 网络优化
- 启用HTTP/2
- 使用浏览器预加载
- 优化图片资源

## 🔐 安全建议

### 基础安全
- 使用HTTPS（GitHub Pages自动提供）
- 避免敏感数据暴露
- 定期更新依赖

### 数据安全
- 数据文件公开访问
- 避免存储个人信息
- 定期备份数据

### 访问控制
- 公开数据无需认证
- 如需限制访问，考虑私有仓库
- 监控访问日志

## 📱 移动端适配

### 测试设备
- iPhone Safari
- Android Chrome
- iPad Safari
- 响应式设计测试

### 优化建议
- 触摸目标大小 ≥ 44px
- 字体大小可读
- 避免水平滚动
- 优化图片加载

## 🔄 更新维护

### 定期维护任务
1. **每月检查**
   - 更新依赖库版本
   - 检查数据源可用性
   - 备份重要数据

2. **每季度检查**
   - 审查安全设置
   - 优化性能
   - 更新文档

3. **年度检查**
   - 架构审查
   - 技术栈评估
   - 功能规划

### 版本更新
1. 创建新分支
2. 测试更改
3. 更新版本号
4. 更新CHANGELOG
5. 合并到main分支

## 📞 支持资源

### 文档链接
- [GitHub Pages文档](https://docs.github.com/pages)
- [GitHub Actions文档](https://docs.github.com/actions)
- [ECharts文档](https://echarts.apache.org/zh/index.html)

### 社区支持
- [GitHub Issues](https://github.com/您的用户名/hydrology-monitoring/issues)
- [Stack Overflow](https://stackoverflow.com)
- [相关技术论坛]

### 紧急联系
- 系统管理员
- 技术支持
- 开发团队

## 🎯 成功指标

### 技术指标
- 页面加载时间 < 3秒
- 数据更新时间 < 1分钟
- 错误率 < 1%
- 可用性 > 99.9%

### 业务指标
- 每日活跃用户
- 数据查询次数
- 用户满意度
- 功能使用率

### 监控指标
- 服务器响应时间
- 数据更新频率
- 错误日志数量
- 用户反馈数量

---

**最后更新**: 2026年4月4日  
**版本**: 3.0.0  
**状态**: 🟢 生产就绪