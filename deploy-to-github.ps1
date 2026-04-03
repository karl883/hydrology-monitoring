# 水文监测系统部署到GitHub - PowerShell版本
# 使用方法: .\deploy-to-github.ps1

Write-Host "🚀 开始部署水文监测系统到GitHub..." -ForegroundColor Green
Write-Host ""

# 配置变量
$GITHUB_USERNAME = "karl883"  # 您的GitHub用户名
$REPO_NAME = "hydrology-monitoring"
$BRANCH = "main"

# 步骤1: 检查Git是否安装
Write-Host "📦 步骤1: 检查环境..." -ForegroundColor Cyan
try {
    $gitVersion = git --version
    Write-Host "✅ Git已安装: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git未安装，请先安装Git" -ForegroundColor Red
    exit 1
}

# 步骤2: 初始化Git仓库
Write-Host "`n🔄 步骤2: 初始化Git仓库..." -ForegroundColor Cyan
$currentDir = Get-Location

if (-not (Test-Path ".git")) {
    git init
    git branch -M $BRANCH
    Write-Host "✅ Git仓库初始化完成" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Git仓库已存在" -ForegroundColor Yellow
}

# 步骤3: 添加文件到仓库
Write-Host "`n📁 步骤3: 添加文件到仓库..." -ForegroundColor Cyan
git add .

# 步骤4: 提交更改
Write-Host "`n💾 步骤4: 提交更改..." -ForegroundColor Cyan
$commitMessage = @"
🚀 部署水文监测系统 v3.0

- 完整的前端应用
- 真实数据集成
- GitHub Actions自动化更新
- 响应式设计
- 数据可视化图表
- 交互式表格

部署时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 提交成功" -ForegroundColor Green
} else {
    Write-Host "⚠️ 没有新的更改需要提交" -ForegroundColor Yellow
}

# 步骤5: 添加远程仓库
Write-Host "`n🔗 步骤5: 配置远程仓库..." -ForegroundColor Cyan
$remoteUrl = "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

$remotes = git remote
if ($remotes -notcontains "origin") {
    git remote add origin $remoteUrl
    Write-Host "✅ 远程仓库已添加: $remoteUrl" -ForegroundColor Green
} else {
    Write-Host "ℹ️ 远程仓库已存在" -ForegroundColor Yellow
    # 更新远程URL
    git remote set-url origin $remoteUrl
    Write-Host "✅ 远程仓库URL已更新" -ForegroundColor Green
}

# 步骤6: 推送到GitHub
Write-Host "`n📤 步骤6: 推送到GitHub..." -ForegroundColor Cyan
Write-Host "仓库地址: https://github.com/$GITHUB_USERNAME/$REPO_NAME" -ForegroundColor White
Write-Host "分支: $BRANCH" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "是否继续推送? (y/n)"
if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host "正在推送..." -ForegroundColor Cyan
    
    # 强制推送（因为是第一次）
    git push -u origin $BRANCH --force
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 推送成功!" -ForegroundColor Green
        Write-Host ""
        Write-Host "下一步操作:" -ForegroundColor Cyan
        Write-Host "1. 访问 https://github.com/$GITHUB_USERNAME/$REPO_NAME" -ForegroundColor White
        Write-Host "2. 进入 Settings → Pages" -ForegroundColor White
        Write-Host "3. 设置 Source 为 'Deploy from a branch'" -ForegroundColor White
        Write-Host "4. 选择 Branch: $BRANCH, Folder: / (root)" -ForegroundColor White
        Write-Host "5. 点击 Save" -ForegroundColor White
        Write-Host ""
        Write-Host "🌐 您的网站将在几分钟后可用:" -ForegroundColor Cyan
        Write-Host "   https://$GITHUB_USERNAME.github.io/$REPO_NAME" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔧 配置GitHub Actions:" -ForegroundColor Cyan
        Write-Host "1. 进入 Actions 标签页" -ForegroundColor White
        Write-Host "2. 启用 workflows" -ForegroundColor White
        Write-Host "3. 第一次运行可能需要手动触发" -ForegroundColor White
    } else {
        Write-Host "`n❌ 推送失败，请检查:" -ForegroundColor Red
        Write-Host "1. 网络连接" -ForegroundColor White
        Write-Host "2. GitHub账号权限" -ForegroundColor White
        Write-Host "3. 仓库是否存在" -ForegroundColor White
    }
} else {
    Write-Host "`n⏸️ 已取消推送" -ForegroundColor Yellow
}

# 步骤7: 显示部署说明
Write-Host "`n📋 部署说明:" -ForegroundColor Cyan
Write-Host "================" -ForegroundColor White
Write-Host "项目结构:" -ForegroundColor Cyan
Write-Host "├── index.html                    # 主页面" -ForegroundColor White
Write-Host "├── assets/                       # 静态资源" -ForegroundColor White
Write-Host "│   ├── css/style.css            # 样式" -ForegroundColor White
Write-Host "│   └── js/                       # JavaScript文件" -ForegroundColor White
Write-Host "├── data/                         # 数据文件 (GitHub Actions生成)" -ForegroundColor White
Write-Host "├── scripts/                      # 数据处理脚本" -ForegroundColor White
Write-Host "├── .github/workflows/            # GitHub Actions配置" -ForegroundColor White
Write-Host "└── README.md                     # 项目说明" -ForegroundColor White
Write-Host ""
Write-Host "✅ 部署脚本执行完成!" -ForegroundColor Green