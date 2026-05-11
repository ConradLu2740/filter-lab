import { useCallback, useEffect, useState } from 'react';
import {
  initializeFirebase,
  isUserLoggedIn,
  signInAnonymous,
  syncPresetsToCloud,
  fetchPresetsFromCloud,
  saveUserSettings,
  fetchUserSettings
} from '../services/firebase';
import { useAppStore } from '../stores/appStore';

/**
 * useCloudSync Hook
 * 管理 Firebase 云同步状态和行为
 */
export function useCloudSync() {
  const { presets, setPresets, showToast } = useAppStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  /**
   * 初始化 Firebase 和匿名登录
   */
  useEffect(() => {
    const init = async () => {
      const success = initializeFirebase();
      if (success && !isUserLoggedIn()) {
        await signInAnonymous();
      }
      setIsInitialized(success);
    };

    init();
  }, []);

  /**
   * 同步预设到云端
   */
  const uploadPresets = useCallback(async () => {
    if (!isInitialized) {
      showToast('云同步未初始化', 'error');
      return false;
    }

    setIsSyncing(true);
    try {
      const success = await syncPresetsToCloud(presets);
      if (success) {
        setLastSyncTime(new Date());
        showToast('预设已同步到云端', 'success');
      } else {
        showToast('同步失败', 'error');
      }
      return success;
    } finally {
      setIsSyncing(false);
    }
  }, [isInitialized, presets, showToast]);

  /**
   * 从云端下载预设
   */
  const downloadPresets = useCallback(async () => {
    if (!isInitialized) {
      showToast('云同步未初始化', 'error');
      return false;
    }

    setIsSyncing(true);
    try {
      const cloudPresets = await fetchPresetsFromCloud();
      if (cloudPresets.length > 0) {
        // 合并本地和云端预设，以云端为准
        const merged = [...presets];
        cloudPresets.forEach((cloudPreset) => {
          const index = merged.findIndex((p) => p.id === cloudPreset.id);
          if (index >= 0) {
            merged[index] = cloudPreset;
          } else {
            merged.push(cloudPreset);
          }
        });
        setPresets(merged);
        setLastSyncTime(new Date());
        showToast(`已同步 ${cloudPresets.length} 个预设`, 'success');
      } else {
        showToast('云端暂无预设', 'info');
      }
      return true;
    } finally {
      setIsSyncing(false);
    }
  }, [isInitialized, presets, setPresets, showToast]);

  /**
   * 自动同步（上传）
   * 在预设变化时自动触发
   */
  const autoSync = useCallback(async () => {
    if (!isInitialized || presets.length === 0) {
      return;
    }

    // 简单的防抖：每 30 秒最多同步一次
    if (lastSyncTime && Date.now() - lastSyncTime.getTime() < 30000) {
      return;
    }

    await syncPresetsToCloud(presets);
    setLastSyncTime(new Date());
  }, [isInitialized, presets, lastSyncTime]);

  return {
    isInitialized,
    isSyncing,
    lastSyncTime,
    uploadPresets,
    downloadPresets,
    autoSync
  };
}
