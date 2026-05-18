# 部署到 Netlify 的脚本
# 使用方法：在浏览器打开 https://app.netlify.com/drop
# 然后把 dist 文件夹拖上去即可

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  网站部署指南" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. 打开浏览器访问: https://app.netlify.com/drop" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. 把以下文件夹拖到网页上：" -ForegroundColor Yellow
Write-Host "   $PWD\dist" -ForegroundColor Green
Write-Host ""
Write-Host "3. 等待几秒钟，Netlify 会生成一个免费的网站链接" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. 你可以：" -ForegroundColor Yellow
Write-Host "   - 在 Netlify 设置中绑定自己的域名" -ForegroundColor White
Write-Host "   - 使用 Netlify 提供的免费子域名" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
