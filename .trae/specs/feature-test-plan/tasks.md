# Tasks

## 阶段一：测试基础设施搭建

- [ ] Task 1: 创建测试数据目录和测试图像
  - [ ] SubTask 1.1: 创建 `tests/data/` 目录结构
  - [ ] SubTask 1.2: 生成标准测试图像（纯色、渐变、含色块的 200x300 JPEG/PNG）
  - [ ] SubTask 1.3: 生成中文路径测试图像（路径含中文字符）
  - [ ] SubTask 1.4: 生成损坏文件样本（空文件、非图像文件）
  - [ ] SubTask 1.5: 创建 `tests/data/generate_test_images.py` 脚本，可一键重新生成所有测试数据

- [ ] Task 2: 配置测试框架
  - [ ] SubTask 2.1: 确认 `pytest` 已在 `python/requirements.txt` 中（或添加）
  - [ ] SubTask 2.2: 创建 `tests/python/conftest.py`，提供共用 fixtures（测试图像路径、临时目录、Python 后端进程等）
  - [ ] SubTask 2.3: 创建 `pytest.ini` 或 `pyproject.toml` 中的 pytest 配置（测试发现路径、标记定义）

## 阶段二：Python 后端 RPC 集成测试

- [ ] Task 3: 编写 JSON-RPC 服务器集成测试 `tests/python/test_rpc_integration.py`
  - [ ] SubTask 3.1: 实现 RPC 客户端 fixture（启动 Python 进程、发送请求、读取响应、自动关闭）
  - [ ] SubTask 3.2: 测试 `ping` 方法 — 正常响应
  - [ ] SubTask 3.3: 测试 `analyze` 方法 — 单张模式正常图像
  - [ ] SubTask 3.4: 测试 `analyze` 方法 — 中文路径图像
  - [ ] SubTask 3.5: 测试 `analyze` 方法 — 不存在文件（错误处理）
  - [ ] SubTask 3.6: 测试 `analyze` 方法 — 配对模式
  - [ ] SubTask 3.7: 测试 `analyze` 方法 — 色卡模式
  - [ ] SubTask 3.8: 测试 `adjust_preview` 方法 — 正常参数
  - [ ] SubTask 3.9: 测试 `adjust_preview` 方法 — 边界参数值
  - [ ] SubTask 3.10: 测试 `export_lut` 方法 — cube 格式
  - [ ] SubTask 3.11: 测试 `export_lut` 方法 — preset 格式
  - [ ] SubTask 3.12: 测试 `batch_analyze` 方法
  - [ ] SubTask 3.13: 测试 `apply_filter` 方法
  - [ ] SubTask 3.14: 测试错误处理 — 未知方法 (-32601)
  - [ ] SubTask 3.15: 测试错误处理 — 畸形请求 (-32600/-32602)

## 阶段三：Python 核心模块单元测试

- [ ] Task 4: 编写 `image_io` 模块测试 `tests/python/test_image_io.py`
  - [ ] SubTask 4.1: 测试 `load_image` — JPEG/PNG/BMP 格式
  - [ ] SubTask 4.2: 测试 `load_image_rgb` — 返回值类型和范围验证
  - [ ] SubTask 4.3: 测试中文路径兼容性
  - [ ] SubTask 4.4: 测试损坏文件/不存在文件错误处理
  - [ ] SubTask 4.5: 测试 `resize_image` — 等比例缩放
  - [ ] SubTask 4.6: 测试 `image_to_base64` — 编码正确性
  - [ ] SubTask 4.7: 测试 `save_image` — 保存后再加载验证一致性

- [ ] Task 5: 编写 `color_analyzer` 模块测试 `tests/python/test_color_analyzer.py`
  - [ ] SubTask 5.1: 测试 `analyze_single` — 返回字典结构验证
  - [ ] SubTask 5.2: 测试 `analyze_single` — 所有返回值可 JSON 序列化（无 numpy.float32 泄漏）
  - [ ] SubTask 5.3: 测试 `analyze_single` — 纯黑/纯白图像的边界情况
  - [ ] SubTask 5.4: 测试 `analyze_pair` — 原图与相同图像（零差异）
  - [ ] SubTask 5.5: 测试 `analyze_colorchart` — 含色卡图像检测

- [ ] Task 6: 编写 `film_profiles` 模块测试 `tests/python/test_film_profiles.py`
  - [ ] SubTask 6.1: 测试 `FilmProfileLibrary` 初始化 — 全部 11 种胶片模式加载
  - [ ] SubTask 6.2: 测试 `match` 方法 — 已知特征返回正确排序
  - [ ] SubTask 6.3: 测试 `match` 方法 — top_k 参数生效

- [ ] Task 7: 补充 `lut_generator` 模块测试 `tests/python/test_lut_generator.py`
  - [ ] SubTask 7.1: 补充三线性插值性能测试（200x300 图像 < 500ms）
  - [ ] SubTask 7.2: 补充 LUT 应用结果数值范围验证 [0, 1]
  - [ ] SubTask 7.3: 补充 .cube 导出格式验证（文件头、LUT_3D_SIZE 行）

## 阶段四：端到端冒烟测试

- [ ] Task 8: 编写端到端冒烟测试脚本 `tests/e2e/test_smoke.py`
  - [ ] SubTask 8.1: 实现 Python 后端进程管理（启动、等待就绪、关闭）
  - [ ] SubTask 8.2: 实现 RPC 通信封装（发送请求、等待响应、超时处理）
  - [ ] SubTask 8.3: 编写完整分析流程冒烟测试（ping → analyze → adjust_preview → export_lut）
  - [ ] SubTask 8.4: 编写中文路径端到端冒烟测试
  - [ ] SubTask 8.5: 添加命令行入口，支持 `python -m pytest tests/e2e/` 或直接 `python tests/e2e/test_smoke.py` 运行

## 阶段五：用户体验端到端评估

- [ ] Task 9: 导入页用户体验评估
  - [ ] SubTask 9.1: 启动应用，截图记录初始页面加载状态和耗时
  - [ ] SubTask 9.2: 使用文件选择功能导入一张普通照片，记录操作响应时间
  - [ ] SubTask 9.3: 导入含中文路径的照片，验证是否正常显示
  - [ ] SubTask 9.4: 导入多张照片，检查网格列表展示效果
  - [ ] SubTask 9.5: 删除一张照片，检查操作反馈

- [ ] Task 10: 分析页用户体验评估
  - [ ] SubTask 10.1: 选择一张照片进入分析页，点击"开始分析"，记录分析完成耗时
  - [ ] SubTask 10.2: 检查分析结果展示：LUT 预览、质量评分、胶片匹配、EXIF 信息
  - [ ] SubTask 10.3: 使用中文路径照片分析，记录是否正常和耗时
  - [ ] SubTask 10.4: 测试配对分析模式（原图+滤镜图）的交互流程
  - [ ] SubTask 10.5: 评估错误处理：未选择图片时点击分析的提示

- [ ] Task 11: 调整页用户体验评估
  - [ ] SubTask 11.1: 进入调整页，等待初始预览加载，记录加载耗时
  - [ ] SubTask 11.2: 拖动色温/曝光/对比度滑块，记录预览更新延迟
  - [ ] SubTask 11.3: 切换白平衡/色调/色彩/色相标签页，检查切换流畅度
  - [ ] SubTask 11.4: 设置极端参数值，检查是否有视觉异常或卡顿

- [ ] Task 12: 滤镜库和导出页用户体验评估
  - [ ] SubTask 12.1: 保存一个滤镜预设，进入滤镜库查看
  - [ ] SubTask 12.2: 搜索预设、查看详情、删除预设
  - [ ] SubTask 12.3: 进入导出页，选择 .cube 格式导出，记录导出耗时
  - [ ] SubTask 12.4: 导出 JSON 预设格式，验证文件内容

- [ ] Task 13: 生成用户体验评估报告
  - [ ] SubTask 13.1: 汇总所有模块的操作耗时数据
  - [ ] SubTask 13.2: 记录所有发现的 UX 问题和建议
  - [ ] SubTask 13.3: 整理截图和评估结论

## 阶段六：前端关键路径测试（可选）

- [ ] Task 14: 前端组件测试基础设施
  - [ ] SubTask 14.1: 添加 vitest 和 @testing-library/react 依赖
  - [ ] SubTask 14.2: 创建 vitest 配置文件
  - [ ] SubTask 14.3: 创建 mock Electron IPC 的测试工具函数

- [ ] Task 15: 编写前端关键组件测试
  - [ ] SubTask 15.1: 测试 ImageViewer 缩放逻辑（0.1x-5x 范围限制）
  - [ ] SubTask 15.2: 测试 DropZone 文件过滤逻辑
  - [ ] SubTask 15.3: 测试 Sidebar 导航状态切换

## 阶段七：测试运行和报告

- [ ] Task 16: 创建测试运行脚本和文档
  - [ ] SubTask 16.1: 创建 `run_tests.py` 或 `run_tests.bat`，一键运行全部测试
  - [ ] SubTask 16.2: 配置测试覆盖率报告（pytest-cov）
  - [ ] SubTask 16.3: 验证所有测试在 Windows 环境下通过

# Task Dependencies

- Task 2 (测试框架配置) 依赖 Task 1 (测试数据)
- Task 3 (RPC 集成测试) 依赖 Task 1 + Task 2
- Task 4-7 (单元测试) 依赖 Task 1 + Task 2，彼此之间可并行
- Task 8 (端到端测试) 依赖 Task 3 (复用 RPC 客户端)
- Task 9-12 (用户体验评估) 可独立执行，不依赖其他任务
- Task 13 (UX 评估报告) 依赖 Task 9-12
- Task 14 (前端测试基础设施) 独立，可与 Task 3-8 并行
- Task 15 (前端组件测试) 依赖 Task 14
- Task 16 (运行脚本) 依赖 Task 3-8 全部完成

# 可并行执行的任务

- Task 4, Task 5, Task 6, Task 7 互相独立，可并行
- Task 9, Task 10, Task 11, Task 12 互相独立，可并行
- Task 14 与 Task 3-8 互相独立，可并行
