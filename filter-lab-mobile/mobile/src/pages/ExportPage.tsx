import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
  Alert
} from 'react-native';
import RNFS from 'react-native-fs';
import { useAppStore } from '../stores/appStore';
import { COLORS, DIMENSIONS } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';

/**
 * ExportPage - LUT 导出页面
 * 展示生成的 LUT 信息并提供分享/保存功能
 */
const ExportPage: React.FC = () => {
  const {
    currentImage,
    colorParams,
    setCurrentPage,
    isLoading,
    setIsLoading,
    showToast
  } = useAppStore();

  const [lutData, setLutData] = useState<string | null>(null);

  /**
   * 生成 LUT 文件内容（模拟）
   * 实际应由后端生成并返回下载链接
   */
  const generateLUTContent = useCallback(() => {
    const header = `# FilterLab Generated LUT\n# Size: 33x33x33\n# Generated: ${new Date().toISOString()}\n\n`;
    const params = `# Parameters:\n# Saturation: ${colorParams.saturation.toFixed(3)}\n# Contrast: ${colorParams.contrast.toFixed(3)}\n# Temperature: ${colorParams.temperature.toFixed(0)}\n# Tint: ${colorParams.tint.toFixed(0)}\n# Shadow Boost: ${colorParams.shadow_boost.toFixed(3)}\n# Highlight Rolloff: ${colorParams.highlight_rolloff.toFixed(3)}\n\n`;
    const lutSize = 33;
    let data = '';
    for (let b = 0; b < lutSize; b++) {
      for (let g = 0; g < lutSize; g++) {
        for (let r = 0; r < lutSize; r++) {
          const rf = (r / (lutSize - 1)) * colorParams.contrast + (1 - colorParams.contrast) * 0.5;
          const gf = (g / (lutSize - 1)) * colorParams.saturation;
          const bf = (b / (lutSize - 1)) * colorParams.contrast;
          data += `${rf.toFixed(6)} ${gf.toFixed(6)} ${bf.toFixed(6)}\n`;
        }
      }
    }
    return header + params + data;
  }, [colorParams]);

  /**
   * 保存 LUT 到本地文件
   */
  const handleSaveLUT = useCallback(async () => {
    setIsLoading(true);
    try {
      const content = generateLUTContent();
      const fileName = `FilterLab_LUT_${Date.now()}.cube`;
      const path = Platform.OS === 'ios'
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.DownloadDirectoryPath}/${fileName}`;

      await RNFS.writeFile(path, content, 'utf8');
      setLutData(path);
      showToast(`LUT 已保存: ${fileName}`, 'success');
    } catch (error) {
      showToast('保存 LUT 失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [generateLUTContent, setIsLoading, showToast]);

  /**
   * 分享 LUT 文件
   */
  const handleShareLUT = useCallback(async () => {
    if (!lutData) {
      showToast('请先保存 LUT', 'error');
      return;
    }

    try {
      await Share.share({
        title: 'FilterLab LUT',
        message: '分享我的 FilterLab LUT 预设文件',
        url: Platform.OS === 'ios' ? `file://${lutData}` : lutData
      });
    } catch (error) {
      showToast('分享失败', 'error');
    }
  }, [lutData, showToast]);

  /**
   * 复制参数到剪贴板
   */
  const handleCopyParams = useCallback(() => {
    const paramsText = `饱和度: ${colorParams.saturation.toFixed(2)}\n对比度: ${colorParams.contrast.toFixed(2)}\n色温: ${colorParams.temperature.toFixed(0)}\n色调: ${colorParams.tint.toFixed(0)}\n阴影提升: ${colorParams.shadow_boost.toFixed(2)}\n高光衰减: ${colorParams.highlight_rolloff.toFixed(2)}`;

    // 使用 Share 作为剪贴板替代方案
    Share.share({ message: paramsText });
    showToast('参数已复制', 'success');
  }, [colorParams, showToast]);

  /**
   * 重新开始
   */
  const handleRestart = useCallback(() => {
    Alert.alert(
      '重新开始',
      '确定要返回导入页面重新开始吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => setCurrentPage('import')
        }
      ]
    );
  }, [setCurrentPage]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 标题 */}
        <Text style={styles.title}>导出 LUT</Text>
        <Text style={styles.subtitle}>保存或分享生成的色彩查找表</Text>

        {/* 参数摘要卡片 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>当前参数</Text>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>饱和度</Text>
            <Text style={styles.paramValue}>{colorParams.saturation.toFixed(2)}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>对比度</Text>
            <Text style={styles.paramValue}>{colorParams.contrast.toFixed(2)}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>色温</Text>
            <Text style={styles.paramValue}>{colorParams.temperature.toFixed(0)}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>色调</Text>
            <Text style={styles.paramValue}>{colorParams.tint.toFixed(0)}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>阴影提升</Text>
            <Text style={styles.paramValue}>{colorParams.shadow_boost.toFixed(2)}</Text>
          </View>
          <View style={styles.paramRow}>
            <Text style={styles.paramLabel}>高光衰减</Text>
            <Text style={styles.paramValue}>{colorParams.highlight_rolloff.toFixed(2)}</Text>
          </View>
        </View>

        {/* 文件信息 */}
        <View style={styles.fileCard}>
          <Text style={styles.fileTitle}>LUT 文件信息</Text>
          <View style={styles.fileRow}>
            <Text style={styles.fileLabel}>格式</Text>
            <Text style={styles.fileValue}>3D LUT (.cube)</Text>
          </View>
          <View style={styles.fileRow}>
            <Text style={styles.fileLabel}>尺寸</Text>
            <Text style={styles.fileValue}>33 x 33 x 33</Text>
          </View>
          <View style={styles.fileRow}>
            <Text style={styles.fileLabel}>状态</Text>
            <Text style={[styles.fileValue, lutData ? styles.fileValueSuccess : styles.fileValuePending]}>
              {lutData ? '已生成' : '未生成'}
            </Text>
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveLUT}>
            <Text style={styles.primaryButtonText}>保存 LUT 文件</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, !lutData && styles.secondaryButtonDisabled]}
            onPress={handleShareLUT}
            disabled={!lutData}
          >
            <Text style={[styles.secondaryButtonText, !lutData && styles.secondaryButtonTextDisabled]}>
              分享 LUT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleCopyParams}>
            <Text style={styles.secondaryButtonText}>复制参数</Text>
          </TouchableOpacity>
        </View>

        {/* 底部操作 */}
        <TouchableOpacity style={styles.restartButton} onPress={handleRestart}>
          <Text style={styles.restartButtonText}>← 重新开始</Text>
        </TouchableOpacity>
      </View>

      <LoadingOverlay visible={isLoading} message="正在生成 LUT 文件..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1,
    padding: DIMENSIONS.padding,
    paddingBottom: 40
  },
  title: {
    fontSize: DIMENSIONS.fontTitle,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.textSecondary,
    marginBottom: 24
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    padding: 16,
    marginBottom: 16
  },
  summaryTitle: {
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  paramRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider
  },
  paramLabel: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.textSecondary
  },
  paramValue: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.text,
    fontWeight: '600'
  },
  fileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    padding: 16,
    marginBottom: 24
  },
  fileTitle: {
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider
  },
  fileLabel: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.textSecondary
  },
  fileValue: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.text,
    fontWeight: '600'
  },
  fileValueSuccess: {
    color: COLORS.success
  },
  fileValuePending: {
    color: COLORS.warning
  },
  buttonGroup: {
    gap: 12,
    marginBottom: 16
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 16,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '700'
  },
  secondaryButton: {
    backgroundColor: COLORS.card,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryButtonDisabled: {
    backgroundColor: COLORS.surface,
    opacity: 0.5
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600'
  },
  secondaryButtonTextDisabled: {
    color: COLORS.textMuted
  },
  restartButton: {
    backgroundColor: 'transparent',
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 14,
    alignItems: 'center'
  },
  restartButtonText: {
    color: COLORS.textSecondary,
    fontSize: DIMENSIONS.fontNormal,
    fontWeight: '600'
  }
});

export default ExportPage;
