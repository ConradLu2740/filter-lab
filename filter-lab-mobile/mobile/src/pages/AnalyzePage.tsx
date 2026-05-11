import React, { useState, useCallback } from 'react';
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
import LoadingOverlay from '../components/LoadingOverlay';
import { analyzeImage } from '../services/api';
import { AnalysisResult } from '../types';

/**
 * AnalyzePage - 色彩分析页面
 * 选择分析模式并触发后端分析
 */
const AnalyzePage: React.FC = () => {
  const {
    currentImage,
    setCurrentPage,
    setColorParams,
    isLoading,
    setIsLoading,
    showToast,
    setCurrentImage
  } = useAppStore();

  const [analysisMode, setAnalysisMode] = useState<'single' | 'colorchart'>('single');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  /**
   * 执行色彩分析
   */
  const handleAnalyze = useCallback(async () => {
    if (!currentImage) {
      showToast('请先导入图片', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await analyzeImage({
        imageUri: currentImage.uri,
        mode: analysisMode
      });

      if (response.status === 'success' && response.data) {
        setResult(response.data);
        setColorParams({
          saturation: response.data.saturation,
          contrast: response.data.contrast,
          temperature: response.data.temperature,
          tint: response.data.tint,
          shadow_boost: response.data.shadow_boost,
          highlight_rolloff: response.data.highlight_rolloff
        });
        showToast(
          `分析完成: ${response.data.film_name} (置信度: ${(response.data.confidence * 100).toFixed(1)}%)`,
          'success'
        );
      } else {
        showToast(response.message || '分析失败', 'error');
      }
    } catch (error) {
      showToast('分析请求失败，请检查网络', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentImage, analysisMode, setIsLoading, setColorParams, showToast]);

  /**
   * 跳转到调整页面
   */
  const goToAdjust = useCallback(() => {
    if (!result) {
      showToast('请先完成分析', 'error');
      return;
    }
    setCurrentPage('adjust');
  }, [result, setCurrentPage, showToast]);

  /**
   * 重新导入图片
   */
  const goBack = useCallback(() => {
    setCurrentImage(null);
    setResult(null);
    setCurrentPage('import');
  }, [setCurrentImage, setCurrentPage]);

  if (!currentImage) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>未找到图片，请返回导入</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={goBack}>
          <Text style={styles.primaryButtonText}>返回导入</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 标题 */}
        <Text style={styles.title}>色彩分析</Text>
        <Text style={styles.subtitle}>选择分析模式并获取胶片模拟参数</Text>

        {/* 图片预览 */}
        <View style={styles.previewContainer}>
          <Image source={{ uri: currentImage.uri }} style={styles.previewImage} resizeMode="contain" />
        </View>

        {/* 分析模式选择 */}
        <Text style={styles.sectionTitle}>分析模式</Text>
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, analysisMode === 'single' && styles.modeButtonActive]}
            onPress={() => setAnalysisMode('single')}
          >
            <Text style={[styles.modeButtonText, analysisMode === 'single' && styles.modeButtonTextActive]}>
              单图分析
            </Text>
            <Text style={styles.modeButtonDesc}>分析单张图片的色彩特征</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, analysisMode === 'colorchart' && styles.modeButtonActive]}
            onPress={() => setAnalysisMode('colorchart')}
          >
            <Text style={[styles.modeButtonText, analysisMode === 'colorchart' && styles.modeButtonTextActive]}>
              色卡分析
            </Text>
            <Text style={styles.modeButtonDesc}>使用 ColorChecker 色卡精确分析</Text>
          </TouchableOpacity>
        </View>

        {/* 分析按钮 */}
        <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyze}>
          <Text style={styles.analyzeButtonText}>开始分析</Text>
        </TouchableOpacity>

        {/* 分析结果 */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>分析结果</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>胶片模拟</Text>
              <Text style={styles.resultValue}>{result.film_name}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>置信度</Text>
              <Text style={styles.resultValue}>{(result.confidence * 100).toFixed(1)}%</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>饱和度</Text>
              <Text style={styles.resultValue}>{result.saturation.toFixed(2)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>对比度</Text>
              <Text style={styles.resultValue}>{result.contrast.toFixed(2)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>色温</Text>
              <Text style={styles.resultValue}>{result.temperature > 0 ? '+' : ''}{result.temperature.toFixed(0)}</Text>
            </View>
          </View>
        )}

        {/* 继续按钮 */}
        {result && (
          <TouchableOpacity style={styles.continueButton} onPress={goToAdjust}>
            <Text style={styles.continueButtonText}>调整参数 →</Text>
          </TouchableOpacity>
        )}

        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>← 重新选择图片</Text>
        </TouchableOpacity>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="正在分析图片色彩..." />
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
  sectionTitle: {
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  modeButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: 16,
    borderWidth: 2,
    borderColor: COLORS.border
  },
  modeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.1)'
  },
  modeButtonText: {
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4
  },
  modeButtonTextActive: {
    color: COLORS.primary
  },
  modeButtonDesc: {
    fontSize: DIMENSIONS.fontSmall,
    color: COLORS.textSecondary
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '700'
  },
  resultCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    padding: 16,
    marginBottom: 16
  },
  resultTitle: {
    fontSize: DIMENSIONS.fontXLarge,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider
  },
  resultLabel: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.textSecondary
  },
  resultValue: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.text,
    fontWeight: '600'
  },
  continueButton: {
    backgroundColor: COLORS.success,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '700'
  },
  backButton: {
    backgroundColor: COLORS.card,
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

export default AnalyzePage;
