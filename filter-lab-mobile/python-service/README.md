# FilterLab Python 微服务

> FilterLab 移动端后端核心算法服务

本服务提供 FilterLab 移动端应用的色彩分析和 LUT 生成功能。

## 🚀 快速开始

### 环境要求

- Python 3.11+
- Docker（可选）

### 本地开发

```bash
# 1. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
.\venv\Scripts\activate  # Windows

# 2. 安装依赖
pip install -r requirements.txt

# 3. 启动服务
uvicorn app.main:app --reload --port 8000
```

服务运行在 http://localhost:8000

### Docker 部署

```bash
# 构建镜像
docker build -t filterlab-python .

# 运行容器
docker run -p 8000:8000 filterlab-python
```

### Railway 部署

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 初始化项目
railway init

# 部署
railway up
```

## 📡 API 接口

### 健康检查

```bash
GET /health
```

响应：
```json
{
  "status": "healthy",
  "service": "filterlab-python-service"
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
  "color_params": {
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

## 🧪 测试

```bash
# 运行所有测试
pytest

# 运行单个测试文件
pytest tests/test_base64_utils.py -v

# 带覆盖率报告
pytest --cov=app --cov-report=html
```

## 📁 项目结构

```
python-service/
├── app/
│   ├── api/              # API 路由
│   │   ├── health.py     # 健康检查
│   │   ├── analyze.py    # 色彩分析 API
│   │   └── lut.py        # LUT 生成 API
│   │
│   ├── services/         # 业务逻辑
│   │   ├── analyze_service.py
│   │   └── lut_service.py
│   │
│   ├── utils/            # 工具函数
│   │   ├── base64_utils.py
│   │   └── image_utils.py
│   │
│   ├── config.py         # 配置管理
│   └── main.py          # FastAPI 应用入口
│
├── tests/               # 测试文件
├── Dockerfile           # Docker 配置
├── requirements.txt     # Python 依赖
├── railway.toml         # Railway 部署配置
└── .env.example         # 环境变量示例
```

## 🔧 配置

环境变量（详见 `.env.example`）：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| APP_NAME | FilterLab Python Service | 应用名称 |
| DEBUG | false | 调试模式 |
| MAX_IMAGE_SIZE | 4096 | 最大图片尺寸 |
| LUT_SIZE | 33 | LUT 维度大小 |
| MAX_CONCURRENT_TASKS | 5 | 最大并发任务数 |

## 📦 依赖

- **FastAPI**: 高性能 Web 框架
- **Uvicorn**: ASGI 服务器
- **OpenCV**: 图像处理
- **NumPy**: 科学计算
- **SciPy**: 科学计算（插值算法）
- **Pillow**: 图像处理
- **Pydantic**: 数据验证

## 📄 开源协议

MIT License

## 👨‍💻 作者

FilterLab Team
