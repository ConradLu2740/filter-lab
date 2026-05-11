import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert
} from 'react-native';
import { launchImageLibrary, launchCamera, ImagePickerResponse } from 'react-native-image-picker';
import { useAppStore } from '../stores/appStore';
import { COLORS, DIMENSIONS } from '../constants/colors';
import LoadingOverlay from '../components/LoadingOverlay';

/**
 * ImportPage - 图片导入页面
 * 支持从相册选择或拍照导入图片
 */
const ImportPage: React.FC = () => {
  const { currentImage, setCurrentImage, setCurrentPage, isLoading, setIsLoading, showToast } = useAppStore();

  /**
   * 处理图片选择结果
   * @param response - 图片选择器响应
   */
  const handleImageResponse = useCallback((response: ImagePickerResponse) => {
    setIsLoading(false);

    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      showToast(`选择图片失败: ${response.errorMessage}`, 'error');
      return;
    }

    const asset = response.assets?.[0];
    if (!asset) {
      showToast('未获取到图片', 'error');
      return;
    }

    setCurrentImage({
      id: Date.now().toString(),
      uri: asset.uri || '',
      width: asset.width || 0,
      height: asset.height || 0,
      name: asset.fileName || '未命名',
      createdAt: new Date().toISOString()
    });

    showToast('图片导入成功', 'success');
  }, [setCurrentImage, setIsLoading, showToast]);

  /**
   * 从相册选择图片
   */
  const pickFromGallery = useCallback(() => {
    setIsLoading(true);
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.9,
        selectionLimit: 1
      },
      handleImageResponse
    );
  }, [setIsLoading, handleImageResponse]);

  /**
   * 拍照获取图片
   */
  const takePhoto = useCallback(() => {
    setIsLoading(true);
    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.9,
        saveToPhotos: true
      },
      handleImageResponse
    );
  }, [setIsLoading, handleImageResponse]);

  /**
   * 继续到分析页面
   */
  const goToAnalyze = useCallback(() => {
    if (!currentImage) {
      showToast('请先导入图片', 'error');
      return;
    }
    setCurrentPage('analyze');
  }, [currentImage, setCurrentPage, showToast]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 标题 */}
        <Text style={styles.title}>导入图片</Text>
        <Text style={styles.subtitle}>选择一张图片开始色彩分析</Text>

        {/* 图片预览区域 */}
        <View style={styles.previewContainer}>
          {currentImage ? (
            <Image source={{ uri: currentImage.uri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>未选择图片</Text>
              <Text style={styles.placeholderSubtext}>点击下方按钮导入</Text>
            </View>
          )}
        </View>

        {/* 图片信息 */}
        {currentImage && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>文件名: {currentImage.name}</Text>
            <Text style={styles.infoText}>
              尺寸: {currentImage.width} x {currentImage.height}
            </Text>
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.primaryButton} onPress={pickFromGallery}>
            <Text style={styles.primaryButtonText}>从相册选择</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
            <Text style={styles.secondaryButtonText}>拍照</Text>
          </TouchableOpacity>
        </View>

        {/* 继续按钮 */}
        {currentImage && (
          <TouchableOpacity style={styles.continueButton} onPress={goToAnalyze}>
            <Text style={styles.continueButtonText}>开始分析 →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="正在加载图片..." />
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
    marginBottom: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  previewImage: {
    width: '100%',
    height: '100%'
  },
  placeholder: {
    alignItems: 'center'
  },
  placeholderText: {
    fontSize: DIMENSIONS.fontLarge,
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  placeholderSubtext: {
    fontSize: DIMENSIONS.fontSmall,
    color: COLORS.textMuted
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadius,
    padding: 12,
    marginBottom: 16
  },
  infoText: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.textSecondary,
    marginBottom: 4
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  primaryButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 14,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600'
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
  continueButton: {
    backgroundColor: COLORS.success,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '700'
  }
});

export default ImportPage;
