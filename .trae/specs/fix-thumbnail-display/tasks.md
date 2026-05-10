# Tasks

- [x] Task 1: 在共享类型中注册 `image:get-thumbnail` IPC 通道
  - 在 `src/shared/types.ts` 的 `IPCChannels` 中添加 `image:get-thumbnail` 类型定义
  - request: `{ filePath: string }`, response: `string`（data URL 或空字符串）

- [x] Task 2: 在主进程中实现 `image:get-thumbnail` IPC 处理器
  - 在 `src/main/ipc-handlers.ts` 中注册 `image:get-thumbnail` handler
  - 使用 `fs.readFileSync` 读取文件，转 base64，拼接 data URL
  - 读取失败时返回空字符串

- [x] Task 3: 移除自定义协议 `filterlab-file://`
  - 从 `src/main/main.ts` 中移除 `protocol.registerSchemesAsPrivileged` 调用
  - 从 `src/main/main.ts` 中移除 `protocol.handle('filterlab-file', ...)` 处理器
  - 移除未使用的 `net` import，保留 `protocol` 如果不再使用则也移除

- [x] Task 4: 改造 ImportPage 缩略图加载方式
  - 新增 `thumbnailUrls` state 存储 `id -> dataURL` 映射
  - 新增 `useEffect` 在 images 变化时通过 IPC 批量获取缩略图
  - 将 `<img src="filterlab-file:///...">` 改为 `<img src={thumbnailUrls[image.id] || ''}>`
  - 保留 emoji 回退占位符

- [x] Task 5: 构建验证
  - 执行 `npm run build` 确认无编译错误
  - 启动 `npm run dev` 确认缩略图正常显示

# Task Dependencies
- Task 1 是 Task 2 的前置
- Task 3 独立于其他任务
- Task 4 依赖 Task 1 和 Task 2
- Task 5 依赖所有前置任务
