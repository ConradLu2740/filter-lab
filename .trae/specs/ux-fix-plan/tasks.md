# Tasks

## Phase 1: 基础设施（全局状态 + Toast）

- [x] Task 1: 创建 AppContext 全局状态管理
  - [x] SubTask 1.1: 新建 `src/renderer/contexts/AppContext.tsx`，定义 AppContextType 接口（currentPage/setCurrentPage, analysisResult/setAnalysisResult, currentImagePath/setCurrentImagePath, filterParams/setFilterParams, lut3d/setLut3d, showSuccess/showError）
  - [x] SubTask 1.2: 实现 AppProvider 组件，包含所有状态和 Toast 队列管理
  - [x] SubTask 1.3: 导出 useApp() hook 供子组件消费

- [x] Task 2: 创建 Toast 通知组件
  - [x] SubTask 2.1: 新建 `src/renderer/components/Toast.tsx`，支持 success/error/info 三种类型
  - [x] SubTask 2.2: 实现自动消失（3秒）和手动关闭
  - [x] SubTask 2.3: 支持多个 Toast 堆叠显示（右上角固定定位）

- [x] Task 3: 重构 App.tsx 接入 Context
  - [x] SubTask 3.1: 用 AppProvider 包裹应用根节点
  - [x] SubTask 3.2: 将 currentPage/pythonReady 状态迁移到 AppContext
  - [x] SubTask 3.3: 将 Sidebar 的 onPageChange 改为消费 AppContext
  - [x] SubTask 3.4: 页面 switch 改为从 AppContext 读取 currentPage

## Phase 2: 导入页面修复

- [x] Task 4: 实现导入页面缩略图
  - [x] SubTask 4.1: 将 ImportPage 卡片中的 emoji 占位符替换为 `<img>` 标签
  - [x] SubTask 4.2: 使用 `file://${image.path}` 作为 img src（Electron 环境下 file:// 协议可直接访问本地文件）
  - [x] SubTask 4.3: 添加 `object-fit: cover` 样式，处理加载失败时的 fallback 占位

- [x] Task 5: 导入页面错误提示 + 非图片过滤提示
  - [x] SubTask 5.1: handleSelectFiles catch 块改为调用 AppContext.showError()
  - [x] SubTask 5.2: handleFilesDrop 中统计被过滤的非图片文件数量，通过 Toast 提示

## Phase 3: 分析页面按钮绑定

- [x] Task 6: 绑定「保存为滤镜」按钮
  - [x] SubTask 6.1: 点击时弹出 prompt() 或自定义输入框获取预设名称
  - [x] SubTask 6.2: 构造 FilterPreset 对象（name, params, lut3dData, version, camera, filmMode, thumbnail 等从分析结果获取）
  - [x] SubTask 6.3: 调用 window.electronAPI.preset.save() 保存
  - [x] SubTask 6.4: 成功后 showSuccess，失败后 showError

- [x] Task 7: 绑定「参数微调」按钮
  - [x] SubTask 7.1: 通过 AppContext.setCurrentImagePath() 设置图片路径
  - [x] SubTask 7.2: 通过 AppContext.setFilterParams() 设置分析结果中的 params
  - [x] SubTask 7.3: 通过 AppContext.setCurrentPage('adjust') 跳转到调整页面

- [x] Task 8: 绑定「导出 LUT」按钮
  - [x] SubTask 8.1: 通过 AppContext.setLut3d() 设置分析结果中的 lut3d
  - [x] SubTask 8.2: 通过 AppContext.setCurrentPage('export') 跳转到导出页面

## Phase 4: 调整页面修复

- [x] Task 9: 实现「保存为预设」功能
  - [x] SubTask 9.1: 点击时弹出 prompt() 获取预设名称
  - [x] SubTask 9.2: 构造 FilterPreset 对象（使用当前 params，lut3dData 使用空数组或从 AppContext 获取）
  - [x] SubTask 9.3: 调用 preset.save() 保存，成功/失败 Toast 反馈

- [x] Task 10: 预览加载状态视觉反馈
  - [x] SubTask 10.1: 在预览容器上叠加半透明遮罩 + spinner（当 isLoading 为 true 时）
  - [x] SubTask 10.2: 遮罩使用 absolute 定位覆盖 ImageViewer 区域

- [x] Task 11: 从 AppContext 接收外部传入的图片路径和参数
  - [x] SubTask 11.1: 组件挂载时检查 AppContext.currentImagePath，非空则自动设置
  - [x] SubTask 11.2: 组件挂载时检查 AppContext.filterParams，非空则自动设置

## Phase 5: 导出页面修复

- [x] Task 12: 从 AppContext 接收分析 LUT 数据
  - [x] SubTask 12.1: 组件挂载时检查 AppContext.lut3d，非空则跳过 generateIdentityLUT，直接使用
  - [x] SubTask 12.2: 无 LUT 数据时仍使用 generateIdentityLUT 作为 fallback

## Phase 6: 滤镜库页面修复

- [x] Task 13: 绑定「应用」和「应用此滤镜」按钮
  - [x] SubTask 13.1: 通过 AppContext.setFilterParams() 设置预设参数
  - [x] SubTask 13.2: 通过 AppContext.setCurrentPage('adjust') 跳转到调整页面
  - [x] SubTask 13.3: 错误提示改为 showError() 而非 console.error

## Phase 7: DropZone 修复

- [x] Task 14: 非图片文件拖入提示
  - [x] SubTask 14.1: DropZone 组件新增 onFilteredCount 回调 prop
  - [x] SubTask 14.2: handleDrop 中计算被过滤的文件数，调用 onFilteredCount 回调
  - [x] SubTask 14.3: ImportPage 接收 onFilteredCount 并通过 Toast 显示提示

## Phase 8: 验证

- [x] Task 15: 端到端流程验证
  - [x] SubTask 15.1: 验证导入→分析→保存预设→跳转调整→跳转导出 完整流程
  - [x] SubTask 15.2: 验证滤镜库应用预设→跳转调整页面
  - [x] SubTask 15.3: 验证错误场景 Toast 提示正常显示
  - [x] SubTask 15.4: 运行 `npm run build` 确保编译无错误
  - [x] SubTask 15.5: 运行 `python -m pytest tests/ -v` 确保后端测试不受影响

# Task Dependencies
- Task 1 和 Task 2 可并行
- Task 3 依赖 Task 1 + Task 2
- Task 4-14 均依赖 Task 3
- Task 4 和 Task 5 可并行
- Task 6, 7, 8 可并行
- Task 9, 10, 11 可并行
- Task 12 依赖 Task 3
- Task 13 依赖 Task 3
- Task 14 依赖 Task 2
- Task 15 依赖 Task 4-14 全部完成
