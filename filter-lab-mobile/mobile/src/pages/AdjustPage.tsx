import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import { useAppStore } from '../stores/appStore';
import { COLORS, DIMENSIONS } from '../constants/colors';
import ColorSlider from '../components/ColorSlider';
import LoadingOverlay from '../components/LoadingOverlay';
import { generateLUT } from '../services/api';

/**
 * AdjustPage - 参数调整页面
 * 使用滑块实时调整色彩参数，并生成 LUT 文件
 */
const AdjustPage: React.FC = () => {
  const {
    currentImage,
    colorParams,
    setColorParams,
    setCurrentPage,
    isLoading,
    setIsLoading,
    showToast,
    addPreset,
    presets
  } = useAppStore();

  /**
   * 重置所有参数到默认值
   */
  const handleReset = useCallback(() => {
    setColorParams({
      saturation: 1.0,
      contrast: 1.0,
      temperature: 0,
      tint: 0,
      shadow_boost: 0,
      highlight_rolloff: 0.1
    });
    showToast('参数已重置', 'info');
  }, [setColorParams, showToast]);

  /**
   * 保存当前参数为预设
   */
  const handleSavePreset = useCallback(() => {
    const newPreset = {
      id: Date.now().toString(),
      name: `自定义预设 ${presets.length + 1}`,
      type: 'custom' as const,
      colorParams: { ...colorParams },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addPreset(newPreset);
    showToast('预设已保存', 'success');
  }, [colorParams, presets.length, addPreset, showToast]);

  /**
   * 生成 LUT 文件
   */
  const handleGenerateLUT = useCallback(async () => {
    if (!currentImage) {
      showToast('未找到图片', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await generateLUT({
        imageUri: currentImage.uri,
        colorParams
      });

      if (response.status === 'success') {
        showToast('LUT 生成成功', 'success');
        setCurrentPage('export');
      } else {
        showToast(response.message || 'LUT 生成失败', 'error');
      }
    } catch (error) {
      showToast('LUT 生成请求失败', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, colorParams, setIsLoading, showToast, setCurrentPage]);

  /**
   * 返回分析页面
   */
  const goBack = useCallback(() => {
    setCurrentPage('analyze');
  }, [setCurrentPage]);

  if (!currentImage) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>未找到图片</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={goBack}>
          <Text style={styles.primaryButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 标题 */}
        <Text style={styles.title}>参数调整</Text>
        <Text style={styles.subtitle}>微调色彩参数以达到理想效果</Text>

        {/* 图片预览 */}
        <View style={styles.previewContainer}>
          <Image source={{ uri: currentImage.uri }} style={styles.previewImage} resizeMode="contain" />
        </View>

        {/* 参数滑块组 */}
        <View style={styles.slidersCard}>
          <Text style={styles.sectionTitle}>基础调整</Text>

          <ColorSlider
            label="饱和度"
            value={colorParams.saturation}
            min={0}
            max={2}
            step={0.01}
            onChange={(v) => setColorParams({ saturation: v })}
          />

          <ColorSlider
            label="对比度"
            value={colorParams.contrast}
            min={0.5}
            max={2}
            step={0.01}
            onChange={(v) => setColorParams({ contrast: v })}
          />

          <ColorSlider
            label="色温"
            value={colorParams.temperature}
            min={-100}
            max={100}
            step={1}
            onChange={(v) => setColorParams({ temperature: v })}
          />

          <ColorSlider
            label="色调"
            value={colorParams.tint}
            min={-50}
            max={50}
            step={1}
            onChange={(v) => setColorParams({ tint: v })}
          />

          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>高级调整</Text>

          <ColorSlider
            label="阴影提升"
            value={colorParams.shadow_boost}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setColorParams({ shadow_boost: v })}
          />

          <ColorSlider
            label="高光衰减"
            value={colorParams.highlight_rolloff}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => setColorParams({ highlight_rolloff: v })}
          />
        </View>

        {/* 操作按钮组 */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleReset}>
            <Text style={styles.secondaryButtonText}>重置</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleSavePreset}>
            <Text style={styles.secondaryButtonText}>保存预设</Text>
          </TouchableOpacity>
        </View>

        {/* 生成 LUT 按钮 */}
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerateLUT}>
          <Text style={styles.generateButtonText}>生成 LUT 文件</Text>
        </TouchableOpacity>

        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>← 返回分析</Text>
        </TouchableOpacity>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="正在生成 LUT..." />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  scrollContent: {
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
  previewContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    overflow: 'hidden',
    marginBottom: 24
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  slidersCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    padding: 16,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 14,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: COLORS.text,
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600'
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '700'
  },
  backButton: {
    backgroundColor: 'transparent',
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 14,
    alignItems: 'center'
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: DIMENSIONS.fontNormal,
    fontWeight: '600'
  },
  errorText: {
    fontSize: DIMENSIONS.fontLarge,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 16
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: DIMENSIONS.margin
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600'
  }
});

export default AdjustPage;
