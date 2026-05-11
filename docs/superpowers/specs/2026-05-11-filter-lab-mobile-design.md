# FilterLab 移动端应用设计方案

**版本：** 1.0  
**日期：** 2026-05-11  
**作者：** FilterLab Team  
**状态：** 设计阶段 - 待审查

---

## 1. 项目概述

### 1.1 项目背景

FilterLab 是一款桌面端相机色彩科学逆向还原工具，基于 Electron + React + Python 构建。当前桌面版本功能完善，包括智能色彩分析、专业 LUT 生成、胶片预设库等功能。

随着移动摄影的普及，用户需要在移动设备上快速处理照片，因此计划开发 iOS 和 Android 双平台移动应用。

### 1.2 项目目标

- **完整功能移植**：将桌面版所有核心功能移植到移动端
- **性能优先**：强调实时预览和快速处理，确保流畅用户体验
- **用户体验优先**：现代化界面设计，简洁直观的交互流程
- **隐私保护**：数据本地化处理，敏感信息不上传云端

### 1.3 核心功能范围

**包含功能：**
1. 图像导入（相册、相机拍照）
2. 三种色彩分析模式（单图分析、色卡检测、对比分析）
3. 实时参数调整（白平衡、饱和度、色彩曲线、影调控制）
4. 33×33×33 3D LUT 生成与导出
5. 胶片预设库（20+ 经典胶片风格）
6. 预设管理（保存、加载、导入导出）
7. 跨设备同步（可选账户）

---

## 2. 技术选型

### 2.1 移动端框架

**选择：React Native 0.76+ + TypeScript**

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| Flutter | 性能优秀、自绘UI | 需学Dart、生态不如RN | 高度定制UI |
| **React Native** | 代码复用、生态完善、团队熟悉 | 性能略低于Flutter | 双平台通用App ✅ |
| 纯原生开发 | 性能最佳 | 代码复用率低、维护成本高 | 极致性能需求 |

**选择理由：**
- ✅ 桌面版已使用 React，技术栈统一
- ✅ TypeScript 在桌面版已使用，代码复用率高
- ✅ 团队已有 React 经验，学习成本低
- ✅ React Native 0.76+ 性能优化显著

### 2.2 后端架构

**选择：容器化 Python 微服务 + Node.js BFF**

```
┌─────────────────┐
│  React Native   │
│    (iOS/Android) │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│   Node.js BFF   │
│ (Vercel/Netlify) │
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│ Python 微服务    │
│ (Railway 容器)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│ OpenCV│ │ SciPy │
│ NumPy │ │       │
└───────┘ └───────┘
```

**技术栈：**

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| **移动端** | React Native 0.76+ | 双平台、性能优化 |
| **状态管理** | Zustand | 轻量、支持持久化 |
| **本地存储** | react-native-mmkv | 高性能、跨平台 |
| **图像处理** | react-native-image-processing | 本地预处理 |
| **BFF** | Node.js + Express | 轻量、部署便捷 |
| **Python 服务** | FastAPI + Uvicorn | 高性能、异步支持 |
| **容器平台** | Railway | 免费额度充足、支持持久容器 |
| **云端数据库** | Firebase Firestore | 免费、实时同步 |
| **用户认证** | Firebase Auth | 与 Firestore 无缝集成 |

### 2.3 数据存储方案

**本地存储（MMKV）：**
```javascript
// 存储结构
local_presets: JSON.stringify({ presets: [...] })
user_settings: JSON.stringify({ theme, language, ... })
recent_images: JSON.stringify({ paths: [...] })
```

**云端存储（Firestore）：**
```javascript
// 数据库结构
users/{userId}
  ├── presets/{presetId}
  │     ├── name: string
  │     ├── type: 'film' | 'custom'
  │     ├── colorParams: ColorParams
  │     ├── lut3dBase64: string
  │     ├── tags: string[]
  │     ├── createdAt: Timestamp
  │     └── updatedAt: Timestamp
  │
  └── settings
        ├── defaultPreset: string
        └── exportFormat: '.cube' | '.3dl'
```

---

## 3. 系统架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        移动端 (React Native)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ ImportPage  │  │AnalyzePage  │  │ AdjustPage  │             │
│  │  (导入)      │  │  (分析)      │  │  (调整)      │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                 │                 │                   │
│         └────────────┬────┴────────────────┘                   │
│                      │                                          │
│              ┌───────┴───────┐                                 │
│              │  AppContext   │                                 │
│              │  (全局状态)    │                                 │
│              └───────┬───────┘                                 │
│                      │                                          │
│         ┌────────────┼────────────┐                            │
│         │            │            │                            │
│  ┌──────┴──────┐ ┌──┴───┐ ┌─────┴─────┐                      │
│  │ ImageEngine │ │Storage│ │ CloudSync │                      │
│  │(本地图像处理)│ │(MMKV) │ │(Firebase) │                      │
│  └─────────────┘ └───────┘ └───────────┘                      │
└─────────────────────────────────────────────────────────────────┘
         │                    │
    ┌────┴────┐          ┌───┴────────┐
    │ API调用  │          │ Firebase   │
    └────┬────┘          └────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                    云端服务                            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────┐     ┌──────────────────┐     │
│  │   Node.js BFF    │────▶│  Python 微服务   │     │
│  │  (Vercel/Netlify)│     │   (Railway)      │     │
│  │                   │     │                  │     │
│  │ - 请求路由         │     │ - 色彩分析       │     │
│  │ - 数据转换         │     │ - LUT 生成       │     │
│  │ - 限流控制         │     │ - 图像处理       │     │
│  │ - 缓存策略         │     │                  │     │
│  └──────────────────┘     └────────┬─────────┘     │
│                                      │               │
│                              ┌───────┴───────┐       │
│                              │  OpenCV       │       │
│                              │  NumPy        │       │
│                              │  SciPy        │       │
│                              │  (复用现有代码)│       │
│                              └───────────────┘       │
└──────────────────────────────────────────────────────┘
```

### 3.2 数据流程设计

#### 场景一：本地色彩分析（离线）

```
用户选择图片
     │
     ▼
本地图像预处理（缩放、降噪）
     │
     ▼
本地色彩分析（简化算法）
     │
     ▼
生成预览 LUT（低分辨率）
     │
     ▼
实时预览（60fps）
     │
     ▼
保存预设到 MMKV
```

#### 场景二：云端 LUT 生成（高性能）

```
用户完成参数调整
     │
     ├──▶ [简单模式] 本地生成 LUT
     │          │
     │          ▼
     │      保存为 .cube 文件
     │
     └──▶ [高质量模式] 云端生成 LUT
               │
               ▼
          上传图片 + 参数到 BFF
               │
               ▼
          BFF 调用 Python 微服务
               │
               ▼
          Python 执行完整 LUT 生成
          (33×33×33 三维插值)
               │
               ▼
          返回 LUT 数据 + 预览图
               │
               ▼
          展示结果 + 保存预设
```

### 3.3 模块划分

#### 移动端模块

| 模块 | 职责 | 依赖关系 |
|------|------|----------|
| **ImportModule** | 图像导入、缩略图生成 | 独立 |
| **AnalysisModule** | 色彩分析触发、结果展示 | ImageModule |
| **AdjustModule** | 参数调整、实时预览 | AnalysisModule |
| **PresetModule** | 预设管理、导入导出 | StorageModule |
| **CloudSyncModule** | 账户管理、云端同步 | StorageModule, AuthModule |
| **StorageModule** | MMKV 本地存储 | 独立 |
| **AuthModule** | Firebase Auth | 独立 |
| **ImageEngine** | 本地图像处理 | 独立 |

#### 云端模块

| 模块 | 职责 | 技术栈 |
|------|------|--------|
| **BFF-API** | 请求路由、数据转换、限流 | Node.js + Express |
| **Python-Service** | 核心算法执行 | Python + FastAPI |
| **Auth-Service** | 用户认证（委托 Firebase） | Firebase SDK |
| **Preset-Service** | 预设 CRUD、分享功能 | Firestore |

---

## 4. 功能模块详细设计

### 4.1 导入模块（ImportPage）

**功能：**
- 相册选择图片
- 相机拍照导入
- 多图批量导入
- 拖放排序
- 缩略图预览

**UI 布局：**
```
┌─────────────────────────────────────┐
│  ← 返回                    导入图片   │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │      [相机] [相册]           │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  近期导入                          │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  │ 📷 │ │ 📷 │ │ 📷 │ │ 📷 │     │
│  └────┘ └────┘ └────┘ └────┘     │
│                                     │
│  已选择: 0 张                       │
└─────────────────────────────────────┘
```

**技术实现：**
- react-native-image-picker：图片选择
- react-native-fast-image：图片缓存和优化
- react-native-mmkv：存储近期导入记录

### 4.2 分析模块（AnalyzePage）

**功能：**
- 三种分析模式选择
- 模式一：单图自动分析（本地）
- 模式二：原图对比分析（云端）
- 模式三：色卡检测分析（云端）
- 分析进度展示
- 分析结果预览

**UI 布局：**
```
┌─────────────────────────────────────┐
│  ← 返回              色彩分析        │
├─────────────────────────────────────┤
│                                     │
│  选择分析模式：                      │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📊 单图分析                  │   │
│  │    自动提取色彩特征           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🔍 原图对比                  │   │
│  │    对比分析色彩映射           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🎨 色卡检测                  │   │
│  │    X-Rite ColorChecker       │   │
│  └─────────────────────────────┘   │
│                                     │
│  [    开始分析    ]                 │
│                                     │
└─────────────────────────────────────┘
```

**技术实现：**
- 本地模式：react-native-image-processing 简化算法
- 云端模式：调用 Python 微服务
- 进度条：react-native-progress

### 4.3 调整模块（AdjustPage）

**功能：**
- 实时参数调整
- 色彩曲线编辑
- 分通道调整
- 前后对比
- 预设应用
- 撤销/重做

**UI 布局：**
```
┌─────────────────────────────────────┐
│  ← 返回              参数调整        │
├─────────────────────────────────────┤
│ ┌───────────────────────────────┐ │
│ │                               │ │
│ │                               │ │
│ │         [图片预览]            │ │
│ │                               │ │
│ │                               │ │
│ │           [👁 对比]           │ │
│ └───────────────────────────────┘ │
├─────────────────────────────────────┤
│  白平衡 │ 饱和度 │ 曲线 │ 影调 │ 预设│
├─────────────────────────────────────┤
│  色温: ──────●──────── [6500K]     │
│                                     │
│  色调: ─────●───────── [-5]       │
│                                     │
│  饱和度: ───────●─────── [0]       │
│                                     │
│  [💾 保存预设]  [📤 导出]          │
└─────────────────────────────────────┘
```

**技术实现：**
- 实时预览：WebGL/OpenGL 着色器
- 参数调整：react-native-gesture-handler + react-native-reanimated
- 对比视图：双层 Image 叠加 + opacity 控制

### 4.4 预设库模块（LibraryPage）

**功能：**
- 预设列表展示
- 分类筛选（胶片风格、自定义）
- 预设搜索
- 预设详情预览
- 应用预设
- 预设导入导出

**UI 布局：**
```
┌─────────────────────────────────────┐
│  ← 返回              预设库          │
├─────────────────────────────────────┤
│  🔍 搜索预设...                      │
├─────────────────────────────────────┤
│  分类: [全部] [胶片] [自定义] [云端]  │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │     │ │     │ │     │          │
│  │ 📷  │ │ 📷  │ │ 📷  │          │
│  │     │ │     │ │     │          │
│  ├─────┤ ├─────┤ ├─────┤          │
│  │Portra│ │Ektar│ │Velvia│         │
│  │ 400 │ │     │ │     │          │
│  └─────┘ └─────┘ └─────┘          │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐          │
│  │     │ │     │ │     │          │
│  │ 📷  │ │ 📷  │ │ 📷  │          │
│  │     │ │     │ │     │          │
│  ├─────┤ ├─────┤ ├─────┤          │
│  │HP5+ │ │Teal │ │Film │          │
│  │     │ │Orange│ │Look │          │
│  └─────┘ └─────┘ └─────┘          │
└─────────────────────────────────────┘
```

### 4.5 导出模块（ExportPage）

**功能：**
- LUT 格式选择
- 导出质量设置
- 本地保存
- 云端分享
- 批量导出

**支持的格式：**
- .cube（DaVinci Resolve, Premiere Pro）
- .3dl（DaVinci Resolve）
- PNG/JPEG（带 LUT 效果预览图）

---

## 5. 性能优化设计

### 5.1 本地图像处理优化

**策略：**
1. **缩放优先**：大图先缩放到合适尺寸再处理
2. **分层处理**：预览用低分辨率 LUT，最终导出用高分辨率
3. **GPU 加速**：使用 Metal（iOS）/ OpenGL ES（Android）进行图像处理
4. **缓存复用**：相同参数的 LUT 缓存复用

**实现方案：**
```javascript
// 本地处理分级
const PROCESSING_LEVELS = {
  PREVIEW: { size: 512, lutSize: 17 },
  STANDARD: { size: 2048, lutSize: 33 },
  HIGH_QUALITY: { size: 4096, lutSize: 65 }
};

// 云端处理使用完整 33×33×33 LUT
```

### 5.2 实时预览性能目标

| 指标 | 目标值 |
|------|--------|
| 帧率 | ≥ 60 FPS |
| 参数调整响应 | < 16ms |
| 缩略图加载 | < 100ms |
| 预设切换 | < 50ms |

### 5.3 网络优化

**策略：**
1. **图片压缩**：上传前 JPEG 压缩到 80% 质量
2. **增量更新**：只上传参数变化，不重复上传图片
3. **预加载**：根据用户习惯预加载可能使用的预设
4. **断点续传**：大文件上传支持断点续传

---

## 6. 云端服务设计

### 6.1 API 设计

**Base URL：** `https://api.filterlab.app`（示例）

#### 认证接口

```
POST /api/auth/verify-token
  Request: { idToken: string }
  Response: { userId: string, email: string }

POST /api/auth/refresh-token
  Request: { refreshToken: string }
  Response: { idToken: string, refreshToken: string }
```

#### 图像分析接口

```
POST /api/analyze/single
  Request: {
    image: base64,
    mode: 'auto' | 'film',
    options?: { fast?: boolean }
  }
  Response: {
    colorParams: ColorParams,
    suggestedPresets: string[],
    confidence: number
  }

POST /api/analyze/compare
  Request: {
    originalImage: base64,
    filteredImage: base64
  }
  Response: {
    colorParams: ColorParams,
    lutData: base64
  }

POST /api/analyze/colorchart
  Request: {
    image: base64,
    chartType: 'xrite-24'
  }
  Response: {
    colorParams: ColorParams,
    lutData: base64,
    detectedColors: ColorSample[]
  }
```

#### LUT 生成接口

```
POST /api/lut/generate
  Request: {
    colorParams: ColorParams,
    size: 33,
    format: 'cube' | '3dl'
  }
  Response: {
    lutData: base64,
    previewImage: base64
  }

POST /api/lut/export
  Request: {
    presetId: string,
    format: 'cube' | '3dl' | 'image'
  }
  Response: {
    downloadUrl: string,
    expiresIn: number
  }
```

#### 预设管理接口

```
GET /api/presets
  Query: { page?: number, limit?: number, tags?: string[] }
  Response: { presets: Preset[], total: number }

GET /api/presets/:id
  Response: { preset: Preset }

POST /api/presets
  Request: { preset: Preset }
  Response: { preset: Preset }

PUT /api/presets/:id
  Request: { preset: Partial<Preset> }
  Response: { preset: Preset }

DELETE /api/presets/:id
  Response: { success: boolean }

POST /api/presets/:id/share
  Request: { public?: boolean }
  Response: { shareUrl: string }
```

### 6.2 Python 微服务设计

**框架：** FastAPI + Uvicorn  
**容器：** Docker（部署到 Railway）

#### 核心端点

```python
# /api/v1/analyze/single
async def analyze_single_image(image_base64: str, mode: str):
    """
    单图色彩分析
    - 解码图片
    - 执行色彩分析（复用现有 color_analyzer.py）
    - 返回色彩参数
    """
    pass

# /api/v1/analyze/colorchart
async def analyze_colorchart(image_base64: str, chart_type: str):
    """
    色卡分析
    - 检测色卡位置
    - 提取色块颜色
    - 计算色彩映射（复用现有 color_analyzer.py）
    """
    pass

# /api/v1/lut/generate
async def generate_lut(color_params: dict, size: int):
    """
    LUT 生成
    - 接收色彩参数
    - 执行三维插值（复用现有 lut_generator.py）
    - 生成 33×33×33 LUT
    - 返回 LUT 数据
    """
    pass

# /api/v1/lut/apply
async def apply_lut_to_image(image_base64: str, lut_base64: str):
    """
    应用 LUT 到图片
    - 解码图片和 LUT
    - 应用色彩映射
    - 返回处理后的图片
    """
    pass
```

#### 性能优化

1. **异步处理**：使用 async/await 充分利用 I/O 等待时间
2. **内存优化**：处理完成后及时释放大数组内存
3. **并发控制**：限制同时处理的图片数量，避免内存溢出
4. **结果缓存**：相同参数的 LUT 生成结果缓存复用

### 6.3 容器化部署

**Dockerfile（Python 服务）：**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Railway 配置：**
```toml
# railway.toml
[build]
  builder = "dockerfile"

[deploy]
  healthcheckPath = "/health"
  restartPolicyType = "on-failure"
  restartPolicyMaxRetries = 3
```

---

## 7. 用户体验设计

### 7.1 设计原则

1. **简洁直观**：减少操作步骤，让用户快速完成目标
2. **即时反馈**：每个操作都有视觉反馈，避免用户等待焦虑
3. **容错友好**：误操作可撤销，错误提示清晰易理解
4. **个性化**：支持主题切换、语言选择、保存用户偏好

### 7.2 交互设计

#### 引导流程

```
首次打开 App
    │
    ▼
欢迎页 + 功能介绍（3张引导图）
    │
    ▼
权限请求（相册、相机）
    │
    ▼
示例图片展示
    │
    ▼
进入主页面
```

#### 操作流程优化

**导入 → 分析 → 调整 → 保存（最少 4 步）**

```
步骤 1: 导入图片
        └─▶ 拖放/点击/拍照

步骤 2: 选择分析模式
        └─▶ 自动分析/手动选择

步骤 3: 参数调整（可选）
        └─▶ 微调预设参数

步骤 4: 保存/导出
        └─▶ 本地预设/云端/LUT文件
```

### 7.3 视觉设计

**配色方案：**

| 角色 | 颜色 | 用途 |
|------|------|------|
| Primary | #2563EB | 主按钮、重点元素 |
| Secondary | #64748B | 次要文本 |
| Background | #0F172A | 深色模式背景 |
| Surface | #1E293B | 卡片、面板背景 |
| Accent | #F59E0B | 高亮、强调 |
| Error | #EF4444 | 错误提示 |
| Success | #10B981 | 成功提示 |

**字体系统：**
- 标题：System Bold 24px
- 副标题：System Semibold 18px
- 正文：System Regular 16px
- 辅助：System Regular 14px
- 标签：System Medium 12px

---

## 8. 安全与隐私设计

### 8.1 数据安全

| 数据类型 | 存储位置 | 加密 | 说明 |
|----------|----------|------|------|
| 原始图片 | 设备本地 | 不加密 | 用户相册 |
| 处理结果 | 设备本地 | 不加密 | 临时缓存 |
| 预设数据 | MMKV | 不加密 | 用户创作 |
| 用户账户 | Firebase | Firebase 加密 | 认证信息 |
| 云端预设 | Firestore | Firebase 加密 | 用户选择上传 |

### 8.2 隐私保护

**原则：**
1. **本地优先**：所有处理优先在本地完成
2. **用户控制**：上传云端需要用户明确授权
3. **数据最小化**：只收集必要的数据
4. **透明性**：明确告知用户数据去向

**实现：**
```javascript
// 数据处理策略
const PROCESSING_STRATEGY = {
  // 本地处理（默认）
  LOCAL: {
    colorAnalysis: true,
    presetApplication: true,
    lutGeneration: false
  },

  // 云端处理（需要用户授权）
  CLOUD: {
    colorAnalysis: false,
    presetApplication: false,
    lutGeneration: true
  }
};
```

**用户授权流程：**
```
用户选择云端处理
    │
    ▼
显示隐私说明弹窗
"此操作将上传图片到云端处理，是否继续？"
    │
    ├──▶ 取消 → 返回本地处理
    │
    └──▶ 确认 → 上传到云端
```

### 8.3 API 安全

- **认证**：Firebase ID Token 验证
- **限流**：每个用户每分钟最多 10 次 API 调用
- **签名**：重要操作需要签名验证
- **日志**：记录异常访问行为

---

## 9. 项目结构

### 9.1 移动端项目结构

```
filter-lab-mobile/
├── src/
│   ├── components/              # 可复用组件
│   │   ├── ImagePreview.tsx
│   │   ├── ColorSlider.tsx
│   │   ├── CurveEditor.tsx
│   │   ├── PresetCard.tsx
│   │   ├── Toast.tsx
│   │   └── LoadingOverlay.tsx
│   │
│   ├── pages/                   # 页面组件
│   │   ├── ImportPage.tsx
│   │   ├── AnalyzePage.tsx
│   │   ├── AdjustPage.tsx
│   │   ├── LibraryPage.tsx
│   │   └── ExportPage.tsx
│   │
│   ├── modules/                 # 功能模块
│   │   ├── ImageEngine/         # 本地图像处理
│   │   ├── AnalysisModule/      # 分析逻辑
│   │   ├── AdjustModule/        # 调整逻辑
│   │   └── PresetModule/        # 预设逻辑
│   │
│   ├── services/               # 服务层
│   │   ├── api.ts              # API 客户端
│   │   ├── storage.ts          # MMKV 封装
│   │   ├── cloudSync.ts        # 云端同步
│   │   └── auth.ts             # 认证服务
│   │
│   ├── stores/                 # 状态管理
│   │   ├── appStore.ts         # 全局状态
│   │   ├── imageStore.ts       # 图像状态
│   │   └── presetStore.ts      # 预设状态
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useImageLoader.ts
│   │   ├── useColorAnalysis.ts
│   │   ├── usePreset.ts
│   │   └── useCloudSync.ts
│   │
│   ├── utils/                  # 工具函数
│   │   ├── imageUtils.ts
│   │   ├── colorUtils.ts
│   │   └── formatUtils.ts
│   │
│   ├── types/                  # TypeScript 类型
│   │   ├── index.ts
│   │   ├── color.ts
│   │   ├── preset.ts
│   │   └── api.ts
│   │
│   ├── constants/               # 常量定义
│   │   ├── colors.ts
│   │   ├── dimensions.ts
│   │   └── filmProfiles.ts
│   │
│   ├── navigation/             # 导航配置
│   │   └── AppNavigator.tsx
│   │
│   ├── App.tsx                # 应用入口
│   └── main.tsx               # React Native 入口
│
├── ios/                       # iOS 原生代码
├── android/                   # Android 原生代码
├── __tests__/                 # 测试文件
├── assets/                    # 静态资源
├── package.json
├── tsconfig.json
└── README.md
```

### 9.2 云端项目结构

```
filter-lab-cloud/
├── bff/                       # Node.js BFF
│   ├── src/
│   │   ├── routes/            # 路由
│   │   ├── controllers/       # 控制器
│   │   ├── middleware/        # 中间件
│   │   ├── services/          # 服务
│   │   └── utils/             # 工具
│   ├── package.json
│   └── server.ts
│
├── python-service/            # Python 微服务
│   ├── app/
│   │   ├── api/               # API 路由
│   │   ├── core/              # 核心模块（复用现有代码）
│   │   │   ├── color_analyzer.py
│   │   │   ├── lut_generator.py
│   │   │   └── film_profiles.py
│   │   ├── services/          # 业务逻辑
│   │   └── utils/             # 工具
│   ├── tests/                 # 测试
│   ├── Dockerfile
│   ├── requirements.txt
│   └── main.py
│
├── firebase/                  # Firebase 配置
│   ├── firestore.rules
│   ├── storage.rules
│   └── functions/
│
└── railway.toml               # Railway 部署配置
```

---

## 10. 开发计划

### Phase 1: MVP（2-3 个月）

**目标：** 核心功能可用，验证产品方向

**移动端：**
- [ ] 项目初始化（React Native + TypeScript）
- [ ] 基础 UI 框架搭建
- [ ] 导入页面（图片选择、缩略图）
- [ ] 本地预设管理（MMKV）
- [ ] 简化版参数调整（本地）
- [ ] Firebase 集成（Auth + Firestore）

**云端：**
- [ ] Python 微服务搭建（FastAPI）
- [ ] 核心算法迁移（复用现有代码）
- [ ] Node.js BFF 搭建
- [ ] API 接口实现
- [ ] 容器化部署（Railway）

**功能：**
- [ ] 图像导入
- [ ] 云端色彩分析
- [ ] 云端 LUT 生成
- [ ] 预设保存（本地）
- [ ] 预设同步（云端）
- [ ] LUT 导出

### Phase 2: 增强（2-3 个月）

**目标：** 性能优化，功能完善

**移动端：**
- [ ] 本地图像处理优化
- [ ] 实时预览性能优化
- [ ] 高级参数调整功能
- [ ] 离线模式完善
- [ ] 性能监控集成

**云端：**
- [ ] GPU 加速（可选）
- [ ] 缓存策略优化
- [ ] 批量处理支持
- [ ] 高级预设库

### Phase 3: 扩展（持续迭代）

**目标：** 平台扩展，商业化

- [ ] iPad 专属优化
- [ ] Apple Watch companion App
- [ ] Android 平板适配
- [ ] 社区功能（预设分享）
- [ ] 商业模式探索（订阅/付费预设）

---

## 11. 风险与应对

### 11.1 技术风险

| 风险 | 可能性 | 影响 | 应对策略 |
|------|--------|------|----------|
| React Native 性能不足 | 中 | 高 | 关键路径使用 Native Module，优化渲染 |
| Python 微服务冷启动 | 低 | 中 | Railway 持久容器，Warm-up 机制 |
| Firebase 免费额度超限 | 低 | 中 | 提前监控，优化数据结构 |
| 图像处理内存溢出 | 中 | 高 | 分块处理，限制图片尺寸 |

### 11.2 产品风险

| 风险 | 可能性 | 影响 | 应对策略 |
|------|--------|------|----------|
| 用户留存低 | 中 | 高 | 快速迭代，收集用户反馈 |
| 竞品压力 | 高 | 中 | 差异化：专业色彩分析、胶片预设 |
| 隐私争议 | 低 | 高 | 透明化数据处理，用户自主控制 |

### 11.3 运营风险

| 风险 | 可能性 | 影响 | 应对策略 |
|------|--------|------|----------|
| 云服务成本超预算 | 中 | 中 | 优化算法，缓存策略，按需扩展 |
| 服务器稳定性 | 低 | 高 | 选择可靠云服务商，监控告警 |

---

## 12. 成本估算

### 12.1 初期成本（Phase 1）

| 服务 | 方案 | 月成本 |
|------|------|--------|
| **移动开发** | 自研（团队已有 React 经验） | $0 |
| **Python 微服务** | Railway 免费版（500小时） | $0 |
| **BFF** | Vercel Hobby（免费） | $0 |
| **Firebase Auth** | Spark 免费版 | $0 |
| **Firestore** | Spark 免费额度 | $0 |
| **域名** | filterlab.app（可选） | $10-20/年 |
| **总计** | | **$0-20/月** |

### 12.2 扩展成本（用户增长后）

| 预期用户 | 月成本 | 说明 |
|----------|--------|------|
| 100 用户 | $0-20 | 仍在免费额度内 |
| 1,000 用户 | $20-50 | Firestore 开始计费 |
| 10,000 用户 | $100-200 | 需要优化架构 |
| 100,000 用户 | $500+ | 需要企业级方案 |

---

## 13. 成功指标

### 13.1 技术指标

| 指标 | 目标值 |
|------|--------|
| App 启动时间 | < 2 秒 |
| 图像导入响应 | < 500ms |
| 云端 LUT 生成 | < 5 秒 |
| 实时预览帧率 | ≥ 60 FPS |
| 安装包大小 | < 50MB |
| Crash Rate | < 1% |

### 13.2 产品指标

| 指标 | Phase 1 目标 | Phase 2 目标 |
|------|--------------|--------------|
| 用户注册率 | > 30% | > 50% |
| 7 日留存 | > 30% | > 50% |
| 预设创建数/人 | > 5 | > 10 |
| LUT 导出次数/天 | > 100 | > 1000 |
| NPS 评分 | > 40 | > 60 |

---

## 14. 附录

### 14.1 技术文档参考

- [React Native 官方文档](https://reactnative.dev/)
- [Firebase 官方文档](https://firebase.google.com/docs)
- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [Railway 部署指南](https://docs.railway.app/)

### 14.2 现有代码复用

**可复用的 Python 模块：**
- `python/core/color_analyzer.py` - 色彩分析核心算法
- `python/core/lut_generator.py` - LUT 生成算法
- `python/core/film_profiles.py` - 胶片预设数据
- `python/core/exif_parser.py` - EXIF 解析

**可复用的 TypeScript 代码：**
- `src/shared/types.ts` - 共享类型定义
- `src/renderer/contexts/AppContext.tsx` - 状态管理思路
- `src/renderer/pages/*.tsx` - 页面组件设计思路

### 14.3 术语表

| 术语 | 说明 |
|------|------|
| LUT | Look-Up Table，三维查找表，用于色彩映射 |
| BFF | Backend for Frontend，专为前端设计的后端服务 |
| MMKV | 腾讯开源的高性能 key-value 存储 |
| Firestore | Google 的 NoSQL 云数据库 |
| X-Rite ColorChecker | 标准的 24 色色卡 |
| 色彩科学 | 研究色彩感知和复现的学科 |

---

**文档版本历史：**
- v1.0 (2026-05-11): 初始版本

---

*本文档由 AI 辅助生成，待用户审查后生效。*
