<div align="center">

# 🕰️ 可话时光机 (Kehua Time Machine)

**—— 纯粹、安全、轻量的「可话 (Kehua)」本地动态查看器**

[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)

</div>

可话官方已经停止服务，但我们留在那里的时光和文字不应该吃灰。**可话时光机** 是一款为离线「可话数据导出包」量身打造的静态网页查看器，能够以极高的颜值重现你最初的可话回忆。

✨ **纯前端运行，数据 0 上传！最大限度保护你的日记隐私！**

---

## 🌟 核心特性

- 🔒 **绝对隐私安全**：所有的解析、读取操作全部在你自己的浏览器内存中“瞬间”完成。完全没有后端服务器和数据库，绝不动用你的一分一毫数据。
- 📦 **免解压极速读取 (ZIP)**：由于手机无法直接拖拽上万个文件的文件夹，本项目彻底解决了手机端的访问痛点！不仅支持拖拽传统的*可话导出文件夹*，更支持**直接读取原始的 `.zip` 压缩包**。(推荐手机端 iOS Safari 使用此方式)
- 🖼️ **相册照片瀑布流**：自动收录提取你日记中的所有照片和视频，支持流式渲染和瀑布流视图，寻找美好的瞬间不再需要翻阅枯燥的文本。
- 🚀 **百万字级闪电渲染**：采用虚拟列表技术和多线程读取优化，即使你有 5000 条甚至上万条的动态、海量的数据媒体，滑动依旧丝滑无感。
- 🎨 **可话原味视觉**：复刻原有的可话视觉风格设定，沉浸式白红主色彩、仿 iOS 原生滚轮日期选择器等现代化排版。

## 🚀 在线使用体验

这是一个完全开源且免费的纯静态网页服务。

**[👉 点此立即开始回忆你与可话的时光 (GitHub Pages)](#)** *(部署完成后链接生效)*

> **手机端 (iOS / Android) 使用提示**：
> 请先在手机的【文件 APP】中，长按从可话下载下来的导出文件夹文件夹，点击【压缩】生成 ZIP，然后在网页中选择「导入数据」 -> 「打开 ZIP 压缩包」即可。

## 💻 本地运行与开发指南

如果你希望把代码克隆在自己的电脑上把玩或二次开发，只需三步：

确保你的环境中安装了 `Node.js` (版本 > 18.0)

```bash
# 1. 克隆代码仓库
git clone https://github.com/JackMeds/kehua-time-machine.git

# 2. 进入项目并安装依赖库 (推荐使用 npm)
cd kehua-time-machine
npm install

# 3. 启动本地开发服务器
npm run dev
```

浏览器会自动打开 `http://localhost:5173`。

## 💡 开发相关

- **前端框架**: React 19 + Vite
- **UI & 样式**: 纯 Vanilla CSS (配合 CSS 变量打造的主题系统)
- **底层依赖**: JSZip (处理 ZIP 包解构)

## 📜 开源协议

本项目采用 **MIT 开源协议**。这是一个为用爱发电的项目，源码完全公开。

非常欢迎对此项目提出 Issue，或者发起 Pull Request 提交你在重温旧时光时的灵感。
