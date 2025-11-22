# **🌲 The Woodland (林地)**

“现实的一切在思维之外流动，一切在这里静止。”

**Woodland** 是一个数字化的心理避难所，一个运行在云端的“林地”。它不仅仅是一个 React 网站，更是一段关于孤独、内省与成长的文学记忆的数字化重构。

它以沉浸式的视觉体验、极简主义的设计风格，结合 Google Gemini AI 的智能交互，探索了“技术”与“文学”互文的可能性。

🌐 **Live Demo**: [woodland-mango.click](https://www.google.com/search?q=https://woodland-mango.click)

## **✨ 核心特性 (Features)**

### **1\. 沉浸式文学体验**

* **视觉叙事**：将迷雾、壁炉、湖泊等文学意象转化为响应式的视觉组件。  
* **Web Audio 引擎**：程序化生成的环境音效（风声、火声、水声），随页面滚动自动切换，提供听觉沉浸感。  
* **字体适配**：针对中文环境优化的字体栈（Noto Serif SC / Songti），确保在所有设备上都能呈现优雅的衬线体文学质感。

### **2\. AI 驱动的交互 (Powered by Gemini)**

* **🔥 添柴 (Stoke the Fire)**：点击壁炉，AI 会生成一段关于温暖与火焰的短诗。  
* **🌊 投掷心事 (Lake Reflection)**：向湖心投掷你的烦恼，AI 化身为冷冽而哲思的湖水，为你反射出一段“倒影”。  
* **💻 Woodland OS**：一个隐藏的终端机彩蛋，模拟了一个运行在苔藓与情绪之上的操作系统。

### **3\. 极致的性能与优化**

* **响应式设计**：Mobile-First 策略，完美适配手机、平板与桌面端。  
* **国内访问加速**：  
  * **字体**：使用 loli.net 国内镜像加速 Google Fonts。  
  * **图片**：接入 **腾讯云 COS** (对象存储) 广州节点，实现毫秒级加载。  
  * **AI**：通过 Nginx 反向代理服务器中转 Google API 请求，打破网络壁垒，确保国内用户流畅使用。

## **🛠️ 技术栈 (Tech Stack)**

* **前端框架**: React 18  
* **构建工具**: Vite  
* **样式方案**: Tailwind CSS  
* **AI 模型**: Google Gemini Pro (via API)  
* **图标库**: Lucide React  
* **部署环境**: Linux (Ubuntu) \+ Nginx  
* **云服务**: Vultr (Server) \+ Tencent Cloud COS (Storage)

## **🚀 本地运行 (Local Development)**

1. **克隆仓库**  
   git clone https://github.com/lymangos/woodland-web.git  
   cd woodland

2. **安装依赖**  
   npm install

3. 配置环境变量  
   在根目录创建 .env 文件，填入你的 Google Gemini API Key：  
   VITE\_GEMINI\_API\_KEY=your\_api\_key\_here

4. **启动开发服务器**  
   npm run dev

   打开浏览器访问 http://localhost:5173，系统会自动判断环境并直连 Google API。

## **☁️ 部署架构 (Deployment)**

本项目部署在海外 Linux 服务器上，架构如下：

graph LR  
    User\[用户 (Browser)\] \--\>|HTTPS| Nginx\[Nginx (Vultr Server)\]  
    Nginx \--\>|Static Files| Dist\[React Build (dist/)\]  
    Nginx \--\>|/api/gemini| Google\[Google Gemini API\]  
    Dist \--\>|Images| COS\[腾讯云 COS (广州)\]  
    Dist \--\>|Fonts| CDN\[loli.net CDN\]

### **关键配置 (Nginx)**

为了支持 SPA 路由及 AI 接口反向代理，Nginx 配置片段如下：

server {  
    \# ... SSL 配置 ...

    \# 静态资源  
    location / {  
        root /var/www/woodland/dist;  
        index index.html;  
        try\_files $uri $uri/ /index.html;  
    }

    \# AI 接口反向代理 (解决跨域与墙的问题)  
    location /api/gemini/ {  
        rewrite ^/api/gemini/(.\*) /$1 break;  
        proxy\_pass \[https://generativelanguage.googleapis.com\](https://generativelanguage.googleapis.com);  
        proxy\_ssl\_server\_name on;  
        \# ... 其他头信息配置 ...  
    }  
}

## **📂 目录结构**

woodland/  
├── dist/               \# 构建产物 (由 npm run build 生成)  
├── public/             \# 静态资源  
├── src/  
│   ├── App.jsx         \# 核心单文件组件 (逻辑/UI/AI交互)  
│   ├── main.jsx        \# 入口文件  
│   └── index.css       \# Tailwind 引入  
├── nginx.conf.backup   \# 服务器 Nginx 配置备份  
└── README.md           \# 项目文档

## **📝 版权与许可**

The Woodland © 202X. Created by Lymangos.  
代码基于 MIT 许可开源。文学内容保留所有权利。  
"我在今年夏天到18岁。我已经存在了17年，有了17年的情感想法，体验经历。"  
