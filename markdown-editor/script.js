const STORAGE_KEY = "markdown-editor-content";

const SAMPLE_MARKDOWN = `# 欢迎使用 Markdown 在线编辑器

在左侧输入 Markdown，右侧会**实时预览**渲染结果。

## 功能亮点

- 左右分栏布局
- 实时 Markdown 渲染
- 支持代码块语法高亮
- 内置高亮兜底，不依赖单一 CDN
- 一键保存为 .md 文件
- 自动保存本地输入内容

## 代码示例

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}! 欢迎使用 Markdown 编辑器。\`;
}

console.log(greet("Copilot"));
\`\`\`

## 表格示例

| 功能 | 状态 |
| --- | --- |
| Markdown 预览 | 已完成 |
| 语法高亮 | 已完成 |
| 响应式布局 | 已完成 |

> 提示：你可以直接修改左边内容，体验实时预览效果。
`;

const markdownInput = document.querySelector("#markdownInput");
const preview = document.querySelector("#preview");
const sourceMeta = document.querySelector("#sourceMeta");
const renderState = document.querySelector("#renderState");
const saveState = document.querySelector("#saveState");
const saveButton = document.querySelector("#saveButton");
const sampleButton = document.querySelector("#sampleButton");
const clearButton = document.querySelector("#clearButton");

const KEYWORD_PATTERNS = {
  javascript: [
    "async",
    "await",
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "default",
    "delete",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "from",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "let",
    "new",
    "of",
    "return",
    "static",
    "super",
    "switch",
    "this",
    "throw",
    "try",
    "typeof",
    "var",
    "while",
    "yield"
  ],
  bash: [
    "case",
    "do",
    "done",
    "elif",
    "else",
    "esac",
    "export",
    "fi",
    "for",
    "function",
    "if",
    "in",
    "local",
    "readonly",
    "select",
    "then",
    "until",
    "while"
  ],
  css: [
    "absolute",
    "auto",
    "block",
    "center",
    "fixed",
    "flex",
    "grid",
    "inherit",
    "inline",
    "inline-block",
    "none",
    "relative",
    "repeat",
    "solid",
    "space-between",
    "sticky",
    "transparent",
    "unset"
  ]
};

const PROPERTY_PATTERN =
  "\\b(?:align-content|align-items|background(?:-color)?|border(?:-radius)?|box-shadow|color|display|flex(?:-direction)?|font(?:-family|-size|-weight)?|gap|grid-template-columns|height|justify-content|line-height|margin(?:-[a-z]+)?|padding(?:-[a-z]+)?|position|text-align|transform|transition|width|max-width|min-height|overflow(?:-[xy])?)\\b(?=\\s*:)";

const TOKEN_PATTERNS = {
  javascript: new RegExp(
    [
      "(?<comment>\\/\\*[\\s\\S]*?\\*\\/|\\/\\/.*$)",
      "(?<string>`(?:\\\\.|[^`])*`|\"(?:\\\\.|[^\"])*\"|'(?:\\\\.|[^'])*')",
      `(?<keyword>\\b(?:${KEYWORD_PATTERNS.javascript.join("|")})\\b)`,
      "(?<boolean>\\b(?:true|false|null|undefined)\\b)",
      "(?<number>\\b\\d+(?:\\.\\d+)?\\b)"
    ].join("|"),
    "gm"
  ),
  css: new RegExp(
    [
      "(?<comment>\\/\\*[\\s\\S]*?\\*\\/)",
      "(?<string>\"(?:\\\\.|[^\"])*\"|'(?:\\\\.|[^'])*')",
      `(?<property>${PROPERTY_PATTERN})`,
      "(?<selector>[.#]?[a-zA-Z_][\\w-]*(?=\\s*\\{))",
      "(?<number>#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})\\b|\\b\\d+(?:\\.\\d+)?(?:px|rem|em|vh|vw|%|s|ms)?\\b)",
      `(?<keyword>\\b(?:${KEYWORD_PATTERNS.css.join("|")})\\b)`
    ].join("|"),
    "gm"
  ),
  markup: /(?<comment><!--[\s\S]*?-->)|(?<tag><\/?[a-zA-Z][^>]*?>)|(?<entity>&[a-zA-Z0-9#]+;)/gm,
  json: /(?<property>"(?:\\.|[^"])*"(?=\s*:))|(?<string>"(?:\\.|[^"])*")|(?<boolean>\b(?:true|false|null)\b)|(?<number>-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b)/gim,
  bash: new RegExp(
    [
      "(?<comment>#.*$)",
      "(?<string>\"(?:\\\\.|[^\"])*\"|'(?:\\\\.|[^'])*')",
      "(?<variable>\\$[A-Za-z_][\\w]*)",
      `(?<keyword>\\b(?:${KEYWORD_PATTERNS.bash.join("|")})\\b)`,
      "(?<command>\\b(?:npm|node|git|pnpm|yarn|python|pip|bash|sh|ls|cd|cat|mkdir|rm|cp|mv|curl)\\b)"
    ].join("|"),
    "gm"
  ),
  generic: /(?<comment>\/\*[\s\S]*?\*\/|\/\/.*$|#.*$)|(?<string>`(?:\\.|[^`])*`|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')|(?<boolean>\b(?:true|false|null|undefined)\b)|(?<number>\b\d+(?:\.\d+)?\b)/gm
};

function hasMarked() {
  return typeof window.marked !== "undefined" && typeof window.marked.parse === "function";
}

function hasHighlightJs() {
  return typeof window.hljs !== "undefined" && typeof window.hljs.highlightElement === "function";
}

function updateMeta() {
  sourceMeta.textContent = `${markdownInput.value.length} 字符`;
}

function updateSaveState(message) {
  saveState.textContent = message;
}

function showStatus(message, isError = false) {
  preview.innerHTML = `<div class="status-message${isError ? " error" : ""}">${message}</div>`;
  renderState.textContent = isError ? "渲染失败" : "等待资源";
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeLanguage(className) {
  const languageClass = className
    .split(/\s+/)
    .find((name) => name.startsWith("language-"));

  if (!languageClass) {
    return "generic";
  }

  const language = languageClass.slice("language-".length).toLowerCase();
  const aliases = {
    js: "javascript",
    jsx: "javascript",
    ts: "javascript",
    tsx: "javascript",
    html: "markup",
    xml: "markup",
    svg: "markup",
    yaml: "generic",
    yml: "generic",
    sh: "bash",
    shell: "bash",
    zsh: "bash"
  };

  return aliases[language] || language;
}

function highlightWithPattern(source, pattern) {
  let highlighted = "";
  let lastIndex = 0;

  pattern.lastIndex = 0;

  for (const match of source.matchAll(pattern)) {
    const token = match[0];
    const tokenIndex = match.index ?? 0;
    const tokenType =
      Object.entries(match.groups || {}).find(([, value]) => value !== undefined)?.[0] || "plain";

    highlighted += escapeHtml(source.slice(lastIndex, tokenIndex));
    highlighted += `<span class="token ${tokenType}">${escapeHtml(token)}</span>`;
    lastIndex = tokenIndex + token.length;
  }

  highlighted += escapeHtml(source.slice(lastIndex));
  return highlighted;
}

function applyFallbackHighlight(block) {
  const language = normalizeLanguage(block.className);
  const pattern = TOKEN_PATTERNS[language] || TOKEN_PATTERNS.generic;

  block.classList.add("basic-highlight");
  block.innerHTML = highlightWithPattern(block.textContent, pattern);
}

function applyCodeHighlighting() {
  const codeBlocks = preview.querySelectorAll("pre code");

  if (!codeBlocks.length) {
    renderState.textContent = "实时预览中";
    return;
  }

  if (hasHighlightJs()) {
    codeBlocks.forEach((block) => {
      window.hljs.highlightElement(block);
    });
    renderState.textContent = "实时预览中";
    return;
  }

  codeBlocks.forEach(applyFallbackHighlight);
  renderState.textContent = "实时预览中（内置高亮）";
}

function deriveFileName() {
  const firstMeaningfulLine =
    markdownInput.value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line) || "markdown-note";

  const normalizedTitle = firstMeaningfulLine.replace(/^#+\s*/, "");
  const safeTitle = normalizedTitle
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return `${safeTitle || "markdown-note"}.md`;
}

function saveMarkdownFile() {
  const fileName = deriveFileName();
  const blob = new Blob([markdownInput.value], {
    type: "text/markdown;charset=utf-8"
  });
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = fileName;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 0);

  updateSaveState(`已下载 ${fileName}`);
}

function renderMarkdown() {
  updateMeta();
  localStorage.setItem(STORAGE_KEY, markdownInput.value);
  updateSaveState("草稿已自动保存到本地");

  if (!hasMarked()) {
    showStatus("Markdown 渲染依赖未加载成功，请检查网络后刷新页面。", true);
    return;
  }

  try {
    preview.innerHTML = window.marked.parse(markdownInput.value, {
      breaks: true,
      gfm: true
    });
  } catch (error) {
    showStatus(`Markdown 解析失败：${error.message}`, true);
    return;
  }

  applyCodeHighlighting();
}

function loadInitialContent() {
  const savedContent = localStorage.getItem(STORAGE_KEY);
  markdownInput.value = savedContent && savedContent.trim() ? savedContent : SAMPLE_MARKDOWN;
  renderMarkdown();
}

sampleButton.addEventListener("click", () => {
  markdownInput.value = SAMPLE_MARKDOWN;
  renderMarkdown();
});

saveButton.addEventListener("click", saveMarkdownFile);

clearButton.addEventListener("click", () => {
  markdownInput.value = "";
  renderMarkdown();
  markdownInput.focus();
});

markdownInput.addEventListener("input", renderMarkdown);

loadInitialContent();
