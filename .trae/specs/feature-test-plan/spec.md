# FilterLab 功能测试计划 Spec

## Why

FilterLab 当前仅有两个 Python 单元测试文件（覆盖 EXIF 解析器和 LUT 生成器），无任何前端测试。多个关键功能模块缺乏自动化验证，且刚修复了中文路径读取、无限加载循环、三线性插值性能和 JSON 序列化等 bug，需要系统性回归测试以防止复现。本计划旨在建立覆盖 Python 后端、Electron IPC 桥接和前端页面的完整功能测试体系。

## What Changes

- 新增 Python 后端 JSON-RPC 集成测试（覆盖全部 6 个 RPC 方法）
- 新增 Python 核心模块单元测试：`color_analyzer`、`film_profiles`、`image_io`
- 新增前端 IPC 调用集成测试（模拟 Electron IPC 环境）
- 新增端到端关键路径冒烟测试脚本
- 补充测试数据（测试图像、测试色卡）
- **BREAKING**: 无破坏性变更，纯新增测试文件

## Impact

- Affected specs: 全部功能模块（分析、调整、导出、预设管理）
- Affected code:
  - `tests/python/` — 新增和扩充测试文件
  - `tests/e2e/` — 新增端到端测试脚本
  - `tests/data/` — 新增测试数据文件
  - `src/renderer/__tests__/` — 新增前端组件测试（可选）
  - `python/main.py` — 可能需要小调整以支持独立测试（依赖注入）

## ADDED Requirements

### Requirement: Python 后端 RPC 集成测试

系统 SHALL 提供覆盖全部 6 个 JSON-RPC 方法的自动化测试，验证请求/响应格式正确性、错误处理和边界条件。

#### Scenario: ping 健康检查
- **WHEN** 发送 `ping` 请求
- **THEN** 返回 `{ready: true, version: "0.1.0"}`

#### Scenario: analyze 单张分析 - 正常图像
- **WHEN** 发送 `analyze` 请求，mode=single，提供有效 RGB 图像路径
- **THEN** 返回包含 `lut3d`（33x33x33x3 数组）、`params`、`metadata`、`previewBase64`、`qualityScore`、`features` 的结果

#### Scenario: analyze 单张分析 - 中文路径
- **WHEN** 发送 `analyze` 请求，图像路径包含中文字符
- **THEN** 正常读取并返回分析结果（不报 "Cannot read image"）

#### Scenario: analyze 单张分析 - 不存在的文件
- **WHEN** 发送 `analyze` 请求，图像路径不存在
- **THEN** 返回错误码 -32603，消息包含 "Image not found"

#### Scenario: analyze 配对分析
- **WHEN** 发送 `analyze` 请求，mode=pair，提供原图和滤镜图路径
- **THEN** 返回包含色彩差异映射的分析结果

#### Scenario: analyze 色卡分析
- **WHEN** 发送 `analyze` 请求，mode=colorchart，提供含色卡的图像
- **THEN** 返回色卡检测结果和精确色彩映射

#### Scenario: adjust_preview 参数调整预览
- **WHEN** 发送 `adjust_preview` 请求，提供图像路径和调整参数
- **THEN** 返回包含 `previewBase64` 的结果，响应时间 < 2 秒

#### Scenario: adjust_preview 极端参数
- **WHEN** 发送 `adjust_preview` 请求，参数为边界值（如曝光 +5、对比度 -100）
- **THEN** 返回有效预览图像，不崩溃

#### Scenario: export_lut cube 格式
- **WHEN** 发送 `export_lut` 请求，format=cube，提供 LUT 数据
- **THEN** 返回 `outputPath`，文件为合法 .cube 格式

#### Scenario: export_lut preset 格式
- **WHEN** 发送 `export_lut` 请求，format=preset
- **THEN** 返回 JSON 格式预设数据

#### Scenario: batch_analyze 批量分析
- **WHEN** 发送 `batch_analyze` 请求，提供多张图像路径
- **THEN** 返回每张图像的分析结果列表

#### Scenario: apply_filter 应用滤镜
- **WHEN** 发送 `apply_filter` 请求，提供图像和预设参数
- **THEN** 返回处理后的图像 base64

#### Scenario: 未知方法调用
- **WHEN** 发送不存在的 RPC 方法名
- **THEN** 返回错误码 -32601（Method not found）

#### Scenario: 畸形 JSON 请求
- **WHEN** 发送格式错误的 JSON-RPC 请求（缺少 params、类型错误等）
- **THEN** 返回 -32602（Invalid params）而非崩溃

### Requirement: Python 核心模块单元测试

系统 SHALL 对以下核心模块提供单元测试覆盖。

#### Scenario: image_io 模块测试
- **WHEN** 使用 `load_image_rgb` 加载不同格式图像（JPEG/PNG/BMP）
- **THEN** 返回值为 float32 [0,1] 范围的 RGB 数组

#### Scenario: image_io 中文路径兼容性
- **WHEN** 加载路径含中文字符的图像
- **THEN** 正常读取，不抛异常

#### Scenario: image_io 损坏文件处理
- **WHEN** 加载非图像文件或损坏文件
- **THEN** 抛出 ValueError 或 FileNotFoundError

#### Scenario: color_analyzer 单张分析
- **WHEN** 对已知色彩的测试图像调用 `analyze_single`
- **THEN** 返回字典含 mean_rgb、std_rgb、contrast、film_matches 等字段，所有值为 Python 原生类型（可 JSON 序列化）

#### Scenario: color_analyzer 色卡检测
- **WHEN** 对含色卡的图像调用 `analyze_colorchart`
- **THEN** 返回检测到的色块颜色值

#### Scenario: film_profiles 胶片匹配
- **WHEN** 输入特征向量与 PROVIA 胶片特征相似
- **THEN** 匹配结果中 PROVIA 置信度最高

#### Scenario: film_profiles 全部胶片配置文件加载
- **WHEN** 初始化 FilmProfileLibrary
- **THEN** 成功加载全部 11 种胶片模式配置

#### Scenario: LUT 三线性插值性能
- **WHEN** 对 200x300 图像应用 33x33x33 LUT
- **THEN** 处理时间 < 500ms

### Requirement: 端到端冒烟测试

系统 SHALL 提供一个可一键运行的端到端冒烟测试脚本，验证从 Python 后端启动到完整分析流程的端到端连通性。

#### Scenario: 完整分析流程
- **WHEN** 运行端到端冒烟测试
- **THEN** 按顺序验证：后端启动 → ping → 单张分析 → 参数调整预览 → LUT 导出 → 后端关闭，全部通过

#### Scenario: 中文路径端到端
- **WHEN** 使用含中文字符的路径运行完整分析流程
- **THEN** 全部步骤通过

### Requirement: 前端关键路径测试（可选）

系统 SHALL 提供关键前端组件的单元测试，确保核心交互逻辑正确。

#### Scenario: ImageViewer 缩放交互
- **WHIN** 组件挂载后触发滚轮事件
- **THEN** 缩放比例在 0.1x-5x 范围内正确变化

#### Scenario: DropZone 文件过滤
- **WHEN** 拖入非图像文件
- **THEN** 被正确过滤，不触发 onDrop 回调

### Requirement: 用户体验端到端评估

系统 SHALL 提供完整的用户体验评估报告，覆盖每个功能模块的实际操作流程、响应耗时、交互体验和可用性问题。评估以真实用户视角进行，记录每个操作步骤的体验感受。

#### Scenario: 导入页用户体验
- **WHEN** 用户打开应用，进入导入页
- **THEN** 评估：页面加载时间、拖拽上传交互是否直观、文件选择对话框响应速度、已导入照片的展示效果、删除照片操作是否顺畅

#### Scenario: 分析页用户体验
- **WHEN** 用户选择照片后进入分析页，点击"开始分析"
- **THEN** 评估：分析等待时间（需 < 5 秒为良好）、进度反馈是否清晰、分析结果展示是否易懂、胶片匹配结果的可读性、预览图像质量

#### Scenario: 分析页 - 中文路径用户体验
- **WHEN** 用户选择含中文字符路径的照片进行分析
- **THEN** 评估：是否正常工作、错误提示是否友好

#### Scenario: 调整页用户体验
- **WHEN** 用户在调整页拖动参数滑块
- **THEN** 评估：预览更新延迟（需 < 500ms 为良好）、参数调节是否有卡顿、各标签页切换是否流畅、预览图像清晰度

#### Scenario: 滤镜库用户体验
- **WHEN** 用户保存滤镜预设后进入滤镜库
- **THEN** 评估：预设列表加载速度、搜索响应时间、预设详情展示完整性、删除操作确认流程

#### Scenario: 导出页用户体验
- **WHEN** 用户选择导出格式并点击导出
- **THEN** 评估：导出速度、文件保存路径提示、导出成功/失败的反馈、导出文件是否可被 DaVinci Resolve 等软件正确加载

#### Scenario: 侧边栏和导航体验
- **WHEN** 用户在各页面间切换
- **THEN** 评估：导航是否直观、Python 后端状态指示是否清晰、页面切换是否流畅无闪烁
