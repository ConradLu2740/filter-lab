# FilterLab BFF

> FilterLab Backend for Frontend - Node.js API 网关

本服务是 FilterLab 移动端应用的后端 API 网关，负责连接移动端和 Python 微服务。

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
# 安装依赖
npm install

# 复制环境变量
cp .env.example .env
```

### 启动

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

服务运行在 http://localhost:3000

## 📡 API 接口

### 健康检查

```bash
GET /health
```

响应：
```json
{
  "status": "healthy"
}
```

### 色彩分析

```bash
POST /api/v1/analyze/single
Content-Type: application/json

{
  "image": "base64编码的图片",
  "mode": "auto"
}
```

### LUT 生成

```bash
POST /api/v1/lut/generate
Content-Type: application/json

{
  "colorParams": {
    "saturation": 1.0,
    "contrast": 1.0,
    "temperature": 0,
    "tint": 0,
    "shadow_boost": 0,
    "highlight_rolloff": 0.1
  },
  "size": 33
}
```

### 预设管理

```bash
# 获取所有预设
GET /api/v1/presets

# 获取单个预设
GET /api/v1/presets/:id

# 创建预设
POST /api/v1/presets
Content-Type: application/json

{
  "name": "我的预设",
  "type": "custom",
  "colorParams": {...}
}

# 删除预设
DELETE /api/v1/presets/:id
```

## 🏗️ 架构

```
移动端 App
    ↓
Node.js BFF (API 网关)
    ├── 认证 (Firebase Auth)
    ├── 限流 (Rate Limiting)
    └── 日志 (Winston)
    ↓
Python 微服务 (色彩分析、LUT 生成)
```

## 📁 项目结构

```
bff/
├── src/
│   ├── routes/              # API 路由
│   │   ├── analyze.ts
│   │   ├── lut.ts
│   │   └── presets.ts
│   │
│   ├── controllers/          # 控制器
│   │   ├── analyzeController.ts
│   │   ├── lutController.ts
│   │   └── presetController.ts
│   │
│   ├── middleware/          # 中间件
│   │   ├── errorHandler.ts
│   │   └── rateLimit.ts
│   │
│   ├── services/            # 服务
│   │   └── pythonService.ts
│   │
│   ├── utils/              # 工具
│   │   └── logger.ts
│   │
│   └── server.ts          # 服务器入口
│
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🔧 配置

环境变量（详见 `.env.example`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| PORT | 3000 | 服务端口 |
| NODE_ENV | development | 运行环境 |
| PYTHON_SERVICE_URL | http://localhost:8000 | Python 服务地址 |
| RATE_LIMIT_WINDOW_MS | 60000 | 限流时间窗口（毫秒） |
| RATE_LIMIT_MAX_REQUESTS | 10 | 时间窗口内最大请求数 |

## 📦 依赖

- **Express**: Web 框架
- **Helmet**: 安全中间件
- **Cors**: 跨域资源共享
- **Axios**: HTTP 客户端
- **Winston**: 日志库
- **Firebase Admin**: Firebase SDK

## 🧪 测试

```bash
# 运行测试
npm test
```

## 🚢 部署

### Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel
```

### Docker

```bash
# 构建镜像
docker build -t filterlab-bff .

# 运行容器
docker run -p 3000:3000 filterlab-bff
```

## 📄 开源协议

MIT License

## 👨‍💻 作者

FilterLab Team
