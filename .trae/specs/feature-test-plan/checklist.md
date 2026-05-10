# Checklist

## 测试基础设施
- [ ] 测试数据目录 `tests/data/` 存在且包含必要的测试图像
- [ ] 测试图像生成脚本可独立运行并成功生成全部测试数据
- [ ] `conftest.py` 提供的 fixtures 正确工作（临时目录清理、进程管理）
- [ ] pytest 配置正确，`pytest tests/python/` 可发现并运行全部测试
- [ ] 中文路径测试图像可被正确创建和读取

## Python RPC 集成测试
- [ ] RPC 客户端 fixture 正确启动和关闭 Python 进程
- [ ] `ping` 方法返回 `{ready: true, version: "0.1.0"}`
- [ ] `analyze` (single) 正常图像返回完整结果结构（含 lut3d、params、previewBase64）
- [ ] `analyze` (single) 中文路径图像正常分析，不报 "Cannot read image"
- [ ] `analyze` (single) 不存在文件返回 -32603 错误
- [ ] `analyze` (pair) 返回配对分析结果
- [ ] `analyze` (colorchart) 返回色卡检测结果
- [ ] `adjust_preview` 正常参数返回预览图像，响应时间 < 2 秒
- [ ] `adjust_preview` 边界参数不崩溃，返回有效预览
- [ ] `export_lut` (cube) 生成合法 .cube 文件
- [ ] `export_lut` (preset) 返回 JSON 格式预设
- [ ] `batch_analyze` 返回多张图像结果列表
- [ ] `apply_filter` 返回处理后图像
- [ ] 未知方法返回 -32601 错误
- [ ] 畸形请求返回 -32600/-32602 错误而非进程崩溃

## Python 单元测试
- [ ] `image_io`: JPEG/PNG/BMP 格式加载正常
- [ ] `image_io`: `load_image_rgb` 返回 float32 [0,1] RGB 数组
- [ ] `image_io`: 中文路径兼容性通过
- [ ] `image_io`: 损坏文件正确抛出异常
- [ ] `image_io`: `resize_image` 等比例缩放正确
- [ ] `image_io`: `image_to_base64` 编码后可解码还原
- [ ] `image_io`: `save_image` 保存后重新加载一致
- [ ] `color_analyzer`: `analyze_single` 返回字典结构正确
- [ ] `color_analyzer`: 所有返回值可 JSON 序列化（`json.dumps` 不抛异常）
- [ ] `color_analyzer`: 纯黑/纯白图像边界情况不崩溃
- [ ] `color_analyzer`: `analyze_pair` 零差异图像返回零变化
- [ ] `color_analyzer`: `analyze_colorchart` 检测到色块
- [ ] `film_profiles`: 全部 11 种胶片模式加载成功
- [ ] `film_profiles`: 已知特征匹配返回正确排序
- [ ] `film_profiles`: `top_k` 参数正确限制返回数量
- [ ] `lut_generator`: 三线性插值性能 < 500ms（200x300 图像）
- [ ] `lut_generator`: LUT 应用结果数值范围 [0, 1]
- [ ] `lut_generator`: .cube 导出文件格式合法

## 端到端冒烟测试
- [ ] 冒烟测试脚本可独立运行（`python tests/e2e/test_smoke.py`）
- [ ] 完整流程：ping → analyze → adjust_preview → export_lut 全部通过
- [ ] 中文路径端到端流程全部通过
- [ ] 进程异常退出时正确清理资源

## 前端测试（可选）
- [ ] vitest 配置正确，可发现并运行测试
- [ ] Electron IPC mock 工具函数可用
- [ ] ImageViewer 缩放范围限制正确（0.1x-5x）
- [ ] DropZone 过滤非图像文件
- [ ] Sidebar 导航状态切换正确

## 用户体验评估
- [ ] 导入页：页面加载时间 < 2 秒
- [ ] 导入页：文件选择对话框正常弹出和返回结果
- [ ] 导入页：中文路径照片可正常导入和显示缩略图
- [ ] 导入页：多张照片网格列表展示正常
- [ ] 导入页：删除照片操作有明确反馈
- [ ] 分析页：单张分析完成耗时 < 5 秒
- [ ] 分析页：分析结果展示完整（LUT 预览、质量评分、胶片匹配、EXIF）
- [ ] 分析页：中文路径照片分析正常
- [ ] 分析页：配对分析模式交互流程顺畅
- [ ] 分析页：未选图片时有清晰的错误提示
- [ ] 调整页：初始预览加载时间 < 3 秒
- [ ] 调整页：参数滑块调整后预览更新延迟 < 500ms
- [ ] 调整页：标签页切换流畅无闪烁
- [ ] 调整页：极端参数值不导致崩溃或长时间卡顿
- [ ] 滤镜库：预设列表加载正常
- [ ] 滤镜库：搜索功能响应迅速
- [ ] 滤镜库：预设详情展示完整
- [ ] 导出页：.cube 格式导出耗时 < 3 秒
- [ ] 导出页：导出成功后有明确提示
- [ ] 导出页：导出文件内容格式正确
- [ ] 侧边栏：Python 后端状态指示灯正常
- [ ] 侧边栏：页面切换导航流畅
- [ ] 整体：无 JS 控制台报错
- [ ] 整体：关键操作有加载状态反馈（非空白等待）

## 整体验证
- [ ] `pytest tests/` 一键运行全部 Python 测试且全部通过
- [ ] 无测试间副作用（测试顺序不影响结果）
- [ ] 测试运行时间合理（全部 < 120 秒）
- [ ] Windows 环境下全部测试通过
