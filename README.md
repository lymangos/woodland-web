# 🌲 The Woodland (林地)

> “现实的一切在思维之外流动，一切在这里静止。”

[![Deploy Status](https://img.shields.io/github/actions/workflow/status/lymangos/woodland-web/deploy.yml?label=Deploy&logo=github)](https://github.com/lymangos/woodland-web/actions)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-4.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![WAF Protected](https://img.shields.io/badge/Security-SafeLine-00A971)](https://waf-ce.chaitin.cn/)

**Woodland** 是一个数字化的心理避难所，一个运行在云端的“林地”。它不仅仅是一个 React 网站，更是一段关于孤独、内省与成长的文学记忆的数字化重构。

它以沉浸式的视觉体验、极简主义的设计风格，结合 **Google Gemini AI** 的智能交互，探索了“技术”与“文学”互文的可能性。

🌐 **Live Demo**: [https://woodland-mango.click](https://woodland-mango.click)

---

## ✨ 核心特性 (Features)

### 1. 沉浸式文学体验
* **视觉叙事**：将迷雾、壁炉、湖泊等文学意象转化为响应式的视觉组件。
* **Web Audio 引擎**：程序化生成的环境音效（风声、火声、水声），随页面滚动自动切换，提供听觉沉浸感。
* **字体适配**：针对中文环境优化的字体栈（Noto Serif SC / Songti），确保在所有设备上都能呈现优雅的衬线体文学质感。

### 2. AI 驱动的交互 (Powered by Gemini)
* 🔥 **添柴 (Stoke the Fire)**：点击壁炉，AI 会生成一段关于温暖与火焰的短诗。
* 🌊 **投掷心事 (Lake Reflection)**：向湖心投掷你的烦恼，AI 化身为冷冽而哲思的湖水，为你反射出一段“倒影”。
* 💻 **Woodland OS**：一个隐藏的终端机彩蛋，模拟了一个运行在苔藓与情绪之上的操作系统。

### 3. 企业级的高可用架构
* **全球加速**：通过 Cloudflare DNS 优化解析，结合腾讯云 COS (广州) 实现图片毫秒级加载。
* **安全防御**：部署 **雷池 (SafeLine) WAF**，实现全站流量清洗与恶意攻击拦截。
* **数据洞察**：集成 **Umami** 隐私友好型统计，实时监测真实访客行为。
* **全链路加密**：全站强制 HTTPS (TLS 1.3) + Brotli 压缩传输。

---

## 🏗️ 技术架构 (Architecture)

本项目采用现代化的 DevOps 流程与分层安全架构。

```mermaid
graph TD
    User(用户 User) --> CF[Cloudflare DNS]
    CF --> WAF[雷池 SafeLine WAF]
    WAF -- 流量清洗 --> Nginx[Nginx Web Server]
    
    subgraph Server_Internal [Vultr Linux Server]
        Nginx --> Static[静态资源 (Dist)]
        Nginx -- 反向代理 --> Gemini[Google Gemini API]
        WAF --> Umami[Umami 统计服务]
    end
    
    Static -.-> COS[腾讯云 COS (图片存储)]
    Github[GitHub Actions] -- CI/CD 自动部署 --> Static