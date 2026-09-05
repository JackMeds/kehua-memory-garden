# 可话花园：使用与部署说明

[返回项目首页](../README.md) · [在线站点](https://jackmeds.github.io/kehua-memory-garden/)

## 导出包结构

导入原始的可话导出目录，或将完整目录压缩为 `.zip`。不要只选择某一年中的文本文件，否则媒体路径可能无法关联。

```text
可话-个人动态-示例用户/
└── 我的动态/
    └── 2026年/
        ├── 2026年-动态内容.txt
        └── 图片&视频/
            └── 9月/
                ├── 示例图片.jpg
                └── 示例视频.mp4
```

以上名称与内容仅用于说明目录格式，不是用户数据。每年文本以 `YYYY年MM月DD日 HH:mm:ss` 日期行开始一条动态，媒体标记引用同月目录中的文件；解析规则以 [parser.js](../src/lib/parser.js) 为准。

桌面 Chrome、Edge 可使用文件夹选择；其他浏览器按能力使用文件输入或 ZIP。移动端建议 ZIP。导入时，页面会显示解压、解析动态和索引媒体的进度。

## 常见问题

### 提示找不到“我的动态”

选择 `可话-个人动态-用户名` 文件夹，或包含它的上一层目录。不要选择内部的“图片&视频”目录。检查导出包是否仍保留原来的年份与文本文件名。

### 重新打开后有文字，没有图片

应用缓存文字、媒体文件名和相对路径，不缓存媒体 Blob。支持的浏览器会尝试恢复目录句柄并请求读取授权；未恢复时，需要重新选择文件夹。通过 ZIP 或普通文件输入导入的媒体，需要重新导入才能使用。

### 如何清除导入记录

侧栏“重新导入数据”会清除应用保存的文字与目录句柄、释放当前媒体引用并返回导入页。浏览器自身也可清除该站点数据。两种方式都不会删除你的原始导出文件。

### 大压缩包处理慢或视频无法播放

ZIP 会在浏览器中解压并读取媒体，所需内存与文件体积有关。可在电脑上解压后直接选文件夹。视频是否能够播放取决于设备和浏览器支持的编码；文件扩展名本身不能保证可播放。

### 可以完全离线使用吗

导出内容不需要上传。在线地址首次打开需要下载站点文件，页面目前引用 Google Fonts；应用没有离线安装或 Service Worker 缓存功能。需要稳定的本地入口时，可以按下面的方法运行本地服务，字体网络不可用时使用系统回退字体。

## 本地开发

现有 GitHub Actions 使用 Node.js 20 和 npm。下面的命令从仓库根目录执行：

```bash
npm ci
npm run dev
```

开发服务地址以终端显示为准。生成并检查静态构建：

```bash
npm run build
npm run preview
```

`dist/` 是构建输出，`npm run preview` 用于检查它，不是生产部署服务。

## GitHub Pages 部署

仓库的 [deploy.yml](../.github/workflows/deploy.yml) 在推送 `main` 或手动触发后构建并发布 `dist/`，使用 GitHub Actions Pages 部署。仓库需要在 **Settings → Pages** 中选择 GitHub Actions，并具备相应 Pages 权限。

当前地址为 [jackmeds.github.io/kehua-memory-garden](https://jackmeds.github.io/kehua-memory-garden/)。Vite 使用相对资源路径 `base: './'`。部署到自己的地址时，需同步修改 `index.html` 的 canonical、Open Graph、结构化数据，以及 `public/robots.txt`、`public/sitemap.xml` 中的站点地址。

现有站点地图位于 [sitemap.xml](https://jackmeds.github.io/kehua-memory-garden/sitemap.xml)，可提交到 Google Search Console 或 Bing Webmaster Tools。部署的是应用本身；导入的个人文件不会因为部署应用而自动发布。

## 代码入口

- [App.jsx](../src/App.jsx)：导入、缓存恢复、时间线与相册切换。
- [fileReader.js](../src/lib/fileReader.js)：文件夹、文件输入与 ZIP 读取。
- [parser.js](../src/lib/parser.js)：文本解析、年月索引与统计。
- [storage.js](../src/lib/storage.js)：IndexedDB 文字和目录句柄缓存。
- [components](../src/components/) 与 [index.css](../src/index.css)：现有界面与样式。

提交问题或界面证据时，请使用明确标记的示例数据。原始个人导出包应始终保留在自己的备份中。
