# Markdown Editor

一个可离线运行的 Markdown 在线编辑器，支持实时预览、自动保存本地草稿、导出 `.md` 文件，以及在高亮库不可用时启用内置代码高亮兜底。

在线版本（GitHub Pages）：

`https://lf739079854-design.github.io/markdown-editor/`

## 功能特性

- 左右分栏的 Markdown 编辑与实时预览
- 本地 `localStorage` 草稿自动保存
- 一键导出当前内容为 `.md`
- 离线可用的本地 `marked` 解析器
- 代码块高亮优先使用外部高亮库，不可用时自动切换到内置高亮
- Windows 一键启动入口，可打包为 `exe`

## 项目结构

```text
markdown-editor/
├── app.py
├── build_exe.ps1
├── index.html
├── requirements-build.txt
├── script.js
├── styles.css
└── vendor/
    └── marked.min.js
```

## 本地使用

直接用浏览器打开 `index.html` 即可使用网页版本。

如果希望通过 Python 启动桌面入口，可以运行：

```powershell
python .\app.py
```

该命令会把网页资源同步到 `%LOCALAPPDATA%\MarkdownEditor`，然后自动用默认浏览器打开编辑器页面。

## 打包为 EXE

先安装打包依赖：

```powershell
pip install -r .\requirements-build.txt
```

然后执行：

```powershell
.\build_exe.ps1
```

成功后会生成：

```text
dist\MarkdownEditor.exe
```

双击 `MarkdownEditor.exe` 后，程序会自动释放最新网页资源到 `%LOCALAPPDATA%\MarkdownEditor` 并打开默认浏览器。

## 说明

- 打包脚本当前基于 `PyInstaller`
- 生成的 `exe` 不依赖在线 CDN 加载 Markdown 解析器
- 建议不要提交 `dist/`、`build/`、`__pycache__/` 等本地产物
