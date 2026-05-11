# FilterLab 移动端项目

> FilterLab 相机色彩科学逆向还原工具 - 移动端应用

本项目包含 FilterLab 的移动端应用及其后端服务。

## 📁 项目结构

```
filter-lab-mobile/
├── python-service/    # Python 微服务（色彩分析、LUT 生成）
├── bff/              # Node.js BFF（API 网关）
└── mobile/           # React Native 移动端应用
```

## 🚀 快速开始

### 1. Python 微服务

```bash
cd python-service

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn app.main:app --reload --port 8000

# 运行测试
pytest
```

### 2. Node.js BFF

```bash
cd bff

# 安装依赖
npm install

# 启动服务
npm run dev

# 构建
npm run build
```

### 3. React Native 移动端

```bash
cd mobile

# 安装依赖
npm install

# 启动开发服务器
npm start

# 运行 iOS
npm run ios

# 运行 Android
npm run android
```

## 🐳 Docker 部署

### Python 微服务

```bash
cd python-service
docker build -t filterlab-python .
docker run -p 8000:8000 filterlab-python
```

### 完整开发环境

```bash
docker-compose up --build
```

## ☁️ 云端部署

### Railway (Python 微服务)

```bash
cd python-service
railway login
railway init
railway up
```

### Vercel (Node.js BFF)

```bash
cd bff
vercel
```

## 📡 API 文档

服务启动后访问：
- Python 服务：http://localhost:8000/docs
- BFF：http://localhost:3000

## 🧪 测试

```bash
# Python 服务测试
cd python-service
pytest

# BFF 测试
cd bff
npm test
```

## 📦 技术栈

### 后端
- **Python 微服务**：FastAPI + Uvicorn + OpenCV + NumPy + SciPy
- **BFF**：Node.js + Express + TypeScript
- **数据库**：Firebase Firestore
- **认证**：Firebase Auth

### 移动端
- **框架**：React Native 0.76+
- **语言**：TypeScript
- **状态管理**：Zustand
- **本地存储**：react-native-mmkv
- **导航**：React Navigation

### 部署
- **容器**：Docker
- **Python 服务**：Railway
- **BFF**：Vercel
- **数据库**：Firebase

## 👨‍💻 开发指南

### 分支管理

- `master`：稳定版本
- `feature/mobile-phase1`：Phase 1 开发分支

### 提交规范

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
chore: 构建/工具更新
refactor: 代码重构
test: 测试相关
```

## 📄 开源协议

MIT License

## 👥 团队

FilterLab Team

## 🔗 相关链接

- [桌面版 GitHub 仓库](https://github.com/ConradLu2740/filter-lab)
- [设计文档](./docs/superpowers/specs/2026-05-11-filter-lab-mobile-design.md)
- [实现计划](./docs/superpowers/plans/2026-05-11-filter-lab-mobile-implementation-plan.md)
