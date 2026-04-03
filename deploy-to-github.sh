#!/bin/bash

# 水文监测系统部署到GitHub脚本
# 使用方法: bash deploy-to-github.sh

set -e  # 遇到错误时退出

echo "🚀 开始部署水文监测系统到GitHub..."

# 配置变量
GITHUB_USERNAME="karl883"  # 已修改为您的GitHub用户名
REPO_NAME="hydrology-monitoring"
BRANCH="main"

# 步骤1: 检查Git是否安装
echo "📦 步骤1: 检查环境..."
if ! command -v git &> /dev/null; then
    echo "❌ Git未安装，请先安装Git"
    exit 1
fi

# 步骤2: 初始化Git仓库
echo "🔄 步骤2: 初始化Git仓库..."
cd "$(dirname "$0")"

if [ ! -d ".git" ]; then
    git init
    git branch -M $BRANCH
    echo "✅ Git仓库初始化完成"
else
    echo "ℹ️ Git仓库已存在"
fi

# 步骤3: 添加文件到仓库
echo "📁 步骤3: 添加文件到仓库..."
git add .

# 步骤4: 提交更改
echo "💾 步骤4: 提交更改..."
git commit -m "🚀 部署水文监测系统 v3.0

- 完整的前端应用
- 真实数据集成
- GitHub Actions自动化更新
- 响应式设计
- 数据可视化图表
- 交互式表格

部署时间: $(date '+%Y-%m-%d %H:%M:%S')" || {
    echo "⚠️ 没有新的更改需要提交"
}

# 步骤5: 添加远程仓库
echo "🔗 步骤5: 配置远程仓库..."
if ! git remote | grep -q "origin"; then
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "✅ 远程仓库已添加"
else
    echo "ℹ️ 远程仓库已存在"
fi

# 步骤6: 推送到GitHub
echo "📤 步骤6: 推送到GitHub..."
echo "仓库地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo "分支: $BRANCH"
echo ""
read -p "是否继续推送? (y/n): " confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    echo "正在推送..."
    git push -u origin $BRANCH --force
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 推送成功!"
        echo ""
        echo "下一步:"
        echo "1. 访问 https://github.com/$GITHUB_USERNAME/$REPO_NAME"
        echo "2. 进入 Settings → Pages"
        echo "3. 设置 Source 为 'Deploy from a branch'"
        echo "4. 选择 Branch: $BRANCH, Folder: / (root)"
        echo "5. 点击 Save"
        echo ""
        echo "🌐 您的网站将在几分钟后可用:"
        echo "   https://$GITHUB_USERNAME.github.io/$REPO_NAME"
        echo ""
        echo "🔧 配置GitHub Actions:"
        echo "1. 进入 Actions 标签页"
        echo "2. 启用 workflows"
        echo "3. 第一次运行可能需要手动触发"
    else
        echo "❌ 推送失败，请检查网络连接和权限"
    fi
else
    echo "⏸️ 已取消推送"
fi

# 步骤7: 生成部署说明
echo ""
echo "📋 部署说明:"
echo "================"
echo "项目结构:"
echo "├── index.html                    # 主页面"
echo "├── assets/                       # 静态资源"
echo "│   ├── css/style.css            # 样式"
echo "│   └── js/                       # JavaScript文件"
echo "├── data/                         # 数据文件 (GitHub Actions生成)"
echo "├── scripts/                      # 数据处理脚本"
echo "├── .github/workflows/            # GitHub Actions配置"
echo "└── README.md                     # 项目说明"
echo ""
echo "🔧 需要修改的配置:"
echo "1. 修改 assets/js/config.js 中的GitHub用户名"
echo "2. 确保 scripts/requirements.txt 中的依赖可用"
echo "3. 检查 .github/workflows/update-data.yml 的定时设置"
echo ""
echo "🔄 自动化更新:"
echo "- GitHub Actions每6小时自动更新数据"
echo "- 前端每30分钟检查更新"
echo "- 支持手动触发更新"
echo ""
echo "🚨 故障排除:"
echo "1. 如果页面无法加载，检查GitHub Pages设置"
echo "2. 如果数据无法加载，检查GitHub用户名配置"
echo "3. 如果图表不显示，检查浏览器控制台"
echo "4. 如果更新不工作，检查GitHub Actions日志"
echo ""
echo "📞 支持:"
echo "- 查看 README.md 获取详细文档"
echo "- 检查控制台错误信息"
echo "- 查看GitHub Issues"
echo ""
echo "✅ 部署脚本执行完成!"