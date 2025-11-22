# README

# 🌲 The Woodland (林地)

> “现实的一切在思维之外流动，一切在这里静止。”
> 

**Woodland** 是一个数字化的心理避难所，一个运行在云端的“林地”。它不仅仅是一个 React 网站，更是一段关于孤独、内省与成长的文学记忆的数字化重构。

它以沉浸式的视觉体验、极简主义的设计风格，结合 Google Gemini AI 的智能交互，探索了“技术”与“文学”互文的可能性。

🌐 **Live Demo**: [woodland-mango.click](https://www.google.com/search?q=https://woodland-mango.click)

## ✨ 核心特性 (Features)

### 1. 沉浸式文学体验

- **视觉叙事**：将迷雾、壁炉、湖泊等文学意象转化为响应式的视觉组件。
- **Web Audio 引擎**：程序化生成的环境音效（风声、火声、水声），随页面滚动自动切换，提供听觉沉浸感。
- **字体适配**：针对中文环境优化的字体栈（Noto Serif SC / Songti），确保在所有设备上都能呈现优雅的衬线体文学质感。

### 2. AI 驱动的交互 (Powered by Gemini)

- **🔥 添柴 (Stoke the Fire)**：点击壁炉，AI 会生成一段关于温暖与火焰的短诗。
- **🌊 投掷心事 (Lake Reflection)**：向湖心投掷你的烦恼，AI 化身为冷冽而哲思的湖水，为你反射出一段“倒影”。
- **💻 Woodland OS**：一个隐藏的终端机彩蛋，模拟了一个运行在苔藓与情绪之上的操作系统。

### 3. 极致的性能与优化

- **响应式设计**：Mobile-First 策略，完美适配手机、平板与桌面端。
- **国内访问加速**：
    - **字体**：使用 `loli.net` 国内镜像加速 Google Fonts。
    - **图片**：接入 **腾讯云 COS** (对象存储) 广州节点，实现毫秒级加载。
    - **AI**：通过 Nginx 反向代理服务器中转 Google API 请求，打破网络壁垒，确保国内用户流畅使用。

## 🛠️ 技术栈 (Tech Stack)

- **前端框架**: React 18
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **AI 模型**: Google Gemini Pro (via API)
- **图标库**: Lucide React
- **部署环境**: Linux (Ubuntu) + Nginx
- **云服务**: Vultr (Server) + Tencent Cloud COS (Storage)

## 🚀 本地运行 (Local Development)

1. **克隆仓库**
    
    ```
    git clone [https://github.com/lymangos/woodland-web.git](https://github.com/lymangos/woodland-web.git)
    cd woodland
    ```
    
2. **安装依赖**
    
    ```
    npm install
    ```
    
3. 配置环境变量
    
    在根目录创建 .env 文件，填入你的 Google Gemini API Key：
    
    ```
    VITE_GEMINI_API_KEY=your_api_key_here
    ```
    
4. **启动开发服务器**
    
    ```
    npm run dev
    ```
    
    打开浏览器访问 `http://localhost:5173`，系统会自动判断环境并直连 Google API。
    

## ☁️ 部署架构 (Deployment)

本项目部署在海外 Linux 服务器上，架构如下：

```
graph LR
    User[用户 (Browser)] -->|HTTPS| Nginx[Nginx (Vultr Server)]
    Nginx -->|Static Files| Dist[React Build (dist/)]
    Nginx -->|/api/gemini| Google[Google Gemini API]
    Dist -->|Images| COS[腾讯云 COS (广州)]
    Dist -->|Fonts| CDN[loli.net CDN]
```

### 关键配置 (Nginx)

为了支持 SPA 路由及 AI 接口反向代理，Nginx 配置片段如下：

```
server {
    # ... SSL 配置 ...

    # 静态资源
    location / {
        root /var/www/woodland/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # AI 接口反向代理 (解决跨域与墙的问题)
    location /api/gemini/ {
        rewrite ^/api/gemini/(.*) /$1 break;
        proxy_pass [https://generativelanguage.googleapis.com](https://generativelanguage.googleapis.com);
        proxy_ssl_server_name on;
        # ... 其他头信息配置 ...
    }
}
```

## 📂 目录结构

```
woodland/
├── dist/               # 构建产物 (由 npm run build 生成)
├── public/             # 静态资源
├── src/
│   ├── App.jsx         # 核心单文件组件 (逻辑/UI/AI交互)
│   ├── main.jsx        # 入口文件
│   └── index.css       # Tailwind 引入
├── nginx.conf.backup   # 服务器 Nginx 配置备份
└── README.md           # 项目文档
```

## 📝 版权与许可

The Woodland © 202X. Created by Lymangos.

代码基于 MIT 许可开源。文学内容保留所有权利。

> "我在今年夏天到18岁。我已经存在了17年，有了17年的情感想法，体验经历。"
> 

# 🌲 The Woodland (林地) - 部署与维护手册

> 项目状态: v17.0 (Sentient Build)
> 
> 
> **最后更新**: 2025-11-22
> 
> **部署地址**: [woodland-mango.click](https://www.google.com/search?q=https://woodland-mango.click)
> 

这份文档主要用于**开发者（我）**在未来迁移服务器或重新部署时查阅。它详细记录了环境搭建、特殊配置修改和反向代理的设置细节。

## ⚠️ 核心架构备忘 (Architecture)

为了确保国内用户能顺畅访问且不被墙，本项目采用了以下特殊架构：

1. **前端 (React)**: 部署在海外服务器 (Vultr)。
2. **资源 (COS)**: 图片托管在腾讯云 COS (广州节点)，保证国内加载速度。
3. **AI 链路 (Nginx 反代)**:
    - 前端请求 `/api/gemini/...` (发给自己的服务器)。
    - Nginx 拦截该请求，转发给 `generativelanguage.googleapis.com`。
    - **原因**: 只有海外服务器能连通 Google，国内用户连不通。

## 🛠️ 服务器环境准备 (Prerequisites)

新服务器必须安装以下基础环境：

1. **Git & Nginx**:
    
    ```
    sudo apt update
    sudo apt install git nginx -y
    ```
    
2. **Node.js (使用 nvm 管理, 建议 v18+)**:
    
    ```
    curl -o- [https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh](https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh) | bash
    source ~/.bashrc
    nvm install --lts
    ```
    

## 🚀 首次部署流程 (Deployment Steps)

### 1. 拉取代码

```
cd /var/www
git clone git@github.com:你的用户名/woodland.git
cd woodland
```

### 2. 恢复敏感配置 (.env)

由于 `.env` 被 gitignore 忽略，必须手动创建：

```
nano .env
```

**内容模板**:

```
VITE_GEMINI_API_KEY=你的_AIza_开头的真实_Google_Key
```

### 3. 修改源码适配生产环境 (CRITICAL!)

**这是最容易忘记的一步！** 为了构建通过，代码里可能注释了环境变量。上线前必须改回来。

编辑文件：`nano src/App.jsx` (约第 15 行)

```
// ❌ 开发/预览状态（如果是这样，必须改！）
// const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
// const apiKey = "";

// ✅ 生产/上线状态（改成这样！）
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
// const apiKey = "";
```

### 4. 安装依赖与构建

```
npm install
npm run build
```

*构建成功后应生成 `dist` 目录。*

### 5. Nginx 配置 (核心反代逻辑)

配置文件路径通常为 `/etc/nginx/sites-available/woodland-mango.click`。

**完整配置参考**:

```
server {
    listen 80;
    server_name woodland-mango.click www.woodland-mango.click;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name woodland-mango.click www.woodland-mango.click;

    # SSL 配置 (由 Certbot 自动生成，或手动填入)
    # ssl_certificate ...
    # ssl_certificate_key ...

    # 1. 静态资源托管
    location / {
        root /var/www/woodland/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 2. Gemini API 反向代理 (关键！)
    location /api/gemini/ {
        rewrite ^/api/gemini/(.*) /$1 break;
        proxy_pass [https://generativelanguage.googleapis.com](https://generativelanguage.googleapis.com);
        proxy_ssl_server_name on;
        proxy_set_header Host generativelanguage.googleapis.com;
        proxy_set_header Connection "";
        proxy_hide_header Access-Control-Allow-Origin;

        # CORS 设置
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

### 6. SSL 证书申请 (Certbot)

```
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d woodland-mango.click

```

## 🔄 日常更新流程 (Update Workflow)

当你修改了本地代码并 `git push` 后，服务器更新步骤：

1. **进入目录**: `cd /var/www/woodland`
2. **拉取代码**: `git pull`
3. **重新构建**: `npm run build`
    - *注意: 如果只改了 React 代码，不需要重启 Nginx，刷新浏览器即可。*
    - *注意: 如果改了 Nginx 配置，记得 `sudo systemctl reload nginx`。*

## 🐞 常见问题排查 (Troubleshooting)

- **Q: 点击“添柴”没反应，控制台报 404?**
    - A: 检查 Nginx 配置里的 `location /api/gemini/` 是否生效，或者 `rewrite` 规则是否写错。
- **Q: 点击“添柴”一直转圈最后超时 (502/504)?**
    - A: 服务器连接 Google 失败。检查服务器网络是否正常，或者 Google 是否有临时故障。
- **Q: 页面打开是白屏?**
    - A: 检查 `npm run build` 是否报错。检查 Nginx 的 `root` 是否指向了正确的 `dist` 目录。
- **Q: 字体变成了宋体，但不是思源宋体?**
    - A: 检查 `loli.net` 的 CSS 是否加载成功。

## 📂 资源清单

- **图床**: 腾讯云 COS (Bucket: `woodland-1315027565`, Region: `ap-guangzhou`)
- **域名商**: Namesilo
- **服务器**: Vultr