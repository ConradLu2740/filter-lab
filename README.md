# 🎨 FilterLab

> 相机色彩科学逆向还原工具

FilterLab 是一款基于 Electron + React + TypeScript + Python 构建的桌面应用程序，致力于帮助摄影师和色彩工程师逆向分析和还原相机的色彩科学。通过智能化的色彩分析和 LUT 生成引擎，用户可以将相机的独特色彩风格转化为可复用的 3D LUT 文件，应用到任何支持 LUT 的编辑软件中。

[English](README_en.md) | 中文

---

## ✨ 核心特性

### 📊 智能色彩分析

提供三种专业的色彩分析模式：

1. **单张照片分析**
   - 自动提取图像的色彩统计特征
   - 智能匹配经典胶片色彩模式
   - 支持自定义色彩风格预设

2. **原图对比分析**
   - 支持原图与滤镜效果图对比分析
   - 精确计算色彩映射关系
   - 可视化色彩差异分布

3. **色卡参考分析**
   - 自动检测 X-Rite ColorChecker Classic 24 色标准色卡
   - 基于标准色卡构建精确的色彩映射
   - 支持手动校正色块位置

### 🎬 专业 LUT 生成

- **高精度 3D LUT**
  - 生成 33×33×33 的三维查找表
  - 支持平滑插值算法
  - 确保色彩过渡自然流畅

- **多格式导出**
  - 支持导出为 .cube 格式（DaVinci Resolve、Premiere Pro 等软件通用）
  - 兼容 Adobe Premiere、Final Cut Pro、DaVinci Resolve 等主流剪辑软件
  - 可导入达芬奇、剪映等专业调色工具

### 🏞️ 胶片模式库

内置多款经典胶片色彩配置文件：

- Kodak Portra 系列（160、400、800）
- Kodak Ektar 系列
- Fuji Pro 系列
- Fuji Velvia、Astia、Provia
- Ilford HP5、Delta 系列
- 经典电影院胶片风格（LUT、P3、Teal Orange 等）

### 🎛️ 参数调节

实时预览调整各项色彩参数：

- **白平衡调节**：色温和色调微调
- **饱和度控制**：全局和分通道饱和度
- **色彩曲线**：R/G/B 通道独立曲线调节
- **影调控制**：高光、阴影、中间调
- **锐度与噪点**：去噪和锐化参数

### 💾 预设管理

- 保存自定义预设到本地库
- 快速加载和切换预设
- 支持预设导入导出
- 云端预设同步（开发中）

---

## 🛠️ 技术架构

### 技术栈

**前端**
- ⚛️ React 18
- 📘 TypeScript 5
- 🎨 CSS Modules / Styled Components
- 🔄 React Context 状态管理

**桌面框架**
- ⚡ Electron 30
- 🔧 electron-vite 构建工具

**后端引擎**
- 🐍 Python 3.13
- 🖼️ OpenCV 图像处理
- 📐 NumPy 科学计算
- 🔮 SciPy 插值算法
- 📡 JSON-RPC 2.0 通信协议

**测试**
- 🧪 pytest（95+ 测试用例）
- 🎭 Playwright 端到端测试

### 项目结构

```
filter-lab/
├── src/
│   ├── main/                  # Electron 主进程
│   │   ├── main.ts            # 主进程入口
│   │   ├── ipc-handlers.ts    # IPC 通信处理
│   │   ├── python-bridge.ts   # Python 通信桥接
│   │   └── preset-store.ts    # 预设存储管理
│   │
│   ├── preload/               # 预加载脚本
│   │   └── index.ts           # 安全上下文桥接
│   │
│   ├── renderer/              # React 渲染进程
│   │   ├── components/        # UI 组件
│   │   │   ├── DropZone.tsx       # 拖放上传
│   │   │   ├── ImageViewer.tsx    # 图像预览
│   │   │   ├── NamePrompt.tsx     # 名称输入弹窗
│   │   │   ├── Sidebar.tsx        # 侧边导航
│   │   │   └── Toast.tsx          # 通知提示
│   │   │
│   │   ├── contexts/          # React 上下文
│   │   │   └── AppContext.tsx     # 全局状态管理
│   │   │
│   │   ├── pages/             # 页面组件
│   │   │   ├── ImportPage.tsx     # 导入页面
│   │   │   ├── AnalyzePage.tsx    # 分析页面
│   │   │   ├── AdjustPage.tsx     # 调整页面
│   │   │   ├── LibraryPage.tsx    # 预设库页面
│   │   │   └── ExportPage.tsx     # 导出页面
│   │   │
│   │   ├── styles/            # 样式文件
│   │   │   └── global.css     # 全局样式
│   │   │
│   │   ├── types/             # TypeScript 类型定义
│   │   │   └── index.ts
│   │   │
│   │   ├── App.tsx            # React 根组件
│   │   └── main.tsx           # 渲染进程入口
│   │
│   └── shared/                 # 共享代码
│       └── types.ts           # 共享类型定义
│
├── python/                    # Python 后端
│   ├── core/                  # 核心模块
│   │   ├── color_analyzer.py  # 色彩分析引擎
│   │   ├── lut_generator.py   # 3D LUT 生成器
│   │   ├── film_profiles.py   # 胶片配置文件
│   │   └── exif_parser.py     # EXIF 元数据解析
│   │
│   ├── utils/                 # 工具函数
│   │   └── image_io.py        # 图像 I/O 处理
│   │
│   ├── models/                # 数据模型
│   │   └── __init__.py
│   │
│   └── main.py                # Python 服务入口
│
├── tests/                     # 测试目录
│   ├── python/                 # Python 单元测试
│   │   ├── test_color_analyzer.py
│   │   ├── test_lut_generator.py
│   │   └── ...
│   │
│   └── e2e/                   # 端到端测试
│       └── test_smoke.py
│
├── docs/                      # 文档目录
│   └── specs/                  # 设计规范文档
│
└── scripts/                   # 脚本目录
    └── run_tests.bat          # 测试运行脚本
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: 18.x 或更高版本
- **Python**: 3.10 或更高版本
- **npm** 或 **yarn**
- **Git**

### 安装步骤

1. **克隆项目**

   ```bash
   git clone https://github.com/ConradLu2740/filter-lab.git
   cd filter-lab
   ```

2. **安装前端依赖**

   ```bash
   npm install
   # 或使用 yarn
   # yarn install
   ```

3. **安装 Python 依赖**

   ```bash
   # 进入 python 目录
   cd python

   # 创建虚拟环境（推荐）
   python -m venv venv

   # 激活虚拟环境
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   # source venv/bin/activate

   # 安装依赖
   pip install -r requirements.txt
   ```

4. **运行开发服务器**

   ```bash
   # 返回项目根目录
   cd ..

   # 启动开发模式
   npm run dev
   ```

5. **运行测试**

   ```bash
   # 运行所有测试
   pytest

   # 或使用脚本
   ./scripts/run_tests.bat
   ```

### 构建应用

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

构建完成后，可在 `out/` 目录中找到可执行文件。

---

## 📖 使用指南

### 1. 导入图像

启动应用后，在导入页面：

- **拖放上传**：直接将图像文件拖入上传区域
- **点击选择**：点击上传按钮选择本地图像
- 支持格式：JPG、JPEG、PNG、BMP、TIFF、WebP

### 2. 色彩分析

进入分析页面，选择分析模式：

- **自动模式**：系统自动选择最佳分析方式
- **色卡模式**：拍摄包含 X-Rite ColorChecker 的照片
- **对比模式**：同时导入原图和滤镜效果图

### 3. 调整参数

在调整页面：

- 使用滑块调节各项色彩参数
- 实时预览调整效果
- 可切换原图/效果图对比视图

### 4. 保存预设

调整完成后：

1. 点击"保存预设"按钮
2. 输入预设名称
3. 选择保存位置（本地库/导出）

### 5. 生成 LUT

在导出页面：

1. 选择要导出的预设
2. 选择输出格式（.cube）
3. 点击"生成 LUT"按钮
4. 选择保存路径

生成的 .cube 文件可直接导入到 DaVinci Resolve、Premiere Pro、Final Cut Pro 等软件中使用。

---

## 🎯 性能优化

FilterLab 在开发过程中进行了多项性能优化：

- **LUT 应用优化**：处理速度从 4 秒降低到 0.027 秒（提升约 150 倍）
- **缩略图加载**：采用 IPC base64 方案，确保安全性的同时保证加载速度
- **内存管理**：优化图像处理流程，减少内存占用

---

## 🧪 测试覆盖

项目包含全面的测试用例：

- **95+ 单元测试**：覆盖色彩分析、LUT 生成、图像 I/O 等核心模块
- **端到端测试**：验证完整工作流程
- **集成测试**：确保前后端通信正常

运行测试：

```bash
pytest tests/
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 遵循 ESLint 配置
- 使用 TypeScript 严格模式
- 所有函数添加中文注释
- 提交前运行测试确保通过

---

## 📄 开源协议

本项目采用 MIT 开源协议。

---

## 🙏 致谢

- [electron-vite](https://github.com/alex8088/electron-vite) - Electron + Vite 集成工具
- [OpenCV](https://opencv.org/) - 开源计算机视觉库
- [SciPy](https://scipy.org/) - 科学计算库
- [X-Rite ColorChecker](https://www.xrite.com/colorchecker) - 标准色卡参考

---

## 📬 联系方式

- **项目地址**: https://github.com/ConradLu2740/filter-lab
- **问题反馈**: https://github.com/ConradLu2740/filter-lab/issues

---

<div align="center">

Made with ❤️ by ConradLu

</div>
