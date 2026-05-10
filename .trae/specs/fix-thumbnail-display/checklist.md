# 验收清单

- [x] `src/shared/types.ts` 中 `IPCChannels` 包含 `image:get-thumbnail` 类型定义
- [x] `src/main/ipc-handlers.ts` 中注册了 `image:get-thumbnail` handler，能读取本地文件并返回 data URL
- [x] `src/main/main.ts` 中已移除 `protocol.registerSchemesAsPrivileged` 和 `protocol.handle('filterlab-file', ...)`
- [x] `ImportPage.tsx` 中 `<img src>` 不再使用 `filterlab-file://` 协议
- [x] `ImportPage.tsx` 通过 IPC 获取缩略图 base64 并用 `data:image/...` 显示
- [ ] 选择文件后导入页面缩略图正常显示（非 emoji 回退）
- [ ] 拖拽文件后导入页面缩略图正常显示
- [x] `npm run build` 无编译错误
- [x] 开发服务器启动后无 `net::ERR_FILE_NOT_FOUND` 错误
