$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

python -m PyInstaller `
  --noconfirm `
  --clean `
  --onefile `
  --windowed `
  --name MarkdownEditor `
  --add-data "index.html;." `
  --add-data "styles.css;." `
  --add-data "script.js;." `
  --add-data "vendor;vendor" `
  .\app.py

Write-Host ""
Write-Host "打包完成：$PSScriptRoot\dist\MarkdownEditor.exe"
