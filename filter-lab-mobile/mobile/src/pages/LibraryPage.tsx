import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { useAppStore } from '../stores/appStore';
import { COLORS, DIMENSIONS } from '../constants/colors';
import { Preset } from '../types';

/**
 * LibraryPage - 预设库页面
 * 浏览、应用和管理保存的色彩预设
 */
const LibraryPage: React.FC = () => {
  const {
    presets,
    removePreset,
    setColorParams,
    setCurrentPage,
    showToast
  } = useAppStore();

  /**
   * 应用预设到当前参数
   * @param preset - 要应用的预设
   */
  const handleApplyPreset = useCallback((preset: Preset) => {
    setColorParams({ ...preset.colorParams });
    showToast(`已应用预设: ${preset.name}`, 'success');
    setCurrentPage('adjust');
  }, [setColorParams, setCurrentPage, showToast]);

  /**
   * 删除预设
   * @param preset - 要删除的预设
   */
  const handleDeletePreset = useCallback((preset: Preset) => {
    Alert.alert(
      '删除预设',
      `确定要删除 "${preset.name}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            removePreset(preset.id);
            showToast('预设已删除', 'info');
          }
        }
      ]
    );
  }, [removePreset, showToast]);

  /**
   * 渲染预设卡片
   */
  const renderPresetItem = useCallback(({ item }: { item: Preset }) => (
    <View style={styles.presetCard}>
      <View style={styles.presetHeader}>
        <View style={styles.presetTitleRow}>
          <View style={[styles.typeBadge, item.type === 'film' && styles.typeBadgeFilm]}>
            <Text style={styles.typeBadgeText}>
              {item.type === 'film' ? '胶片' : '自定义'}
            </Text>
          </View>
          <Text style={styles.presetName} numberOfLines={1}>{item.name}</Text>
        </View>
        <Text style={styles.presetDate}>
          {new Date(item.createdAt).toLocaleDateString('zh-CN')}
        </Text>
      </View>

      <View style={styles.paramsRow}>
        <ParamBadge label="饱和度" value={item.colorParams.saturation} />
        <ParamBadge label="对比度" value={item.colorParams.contrast} />
        <ParamBadge label="色温" value={item.colorParams.temperature} />
        <ParamBadge label="色调" value={item.colorParams.tint} />
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => handleApplyPreset(item)}
        >
          <Text style={styles.applyButtonText}>应用</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeletePreset(item)}
        >
          <Text style={styles.deleteButtonText}>删除</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [handleApplyPreset, handleDeletePreset]);

  return (
    <View style={styles.container}>
      {/* 标题区域 */}
      <View style={styles.header}>
        <Text style={styles.title}>预设库</Text>
        <Text style={styles.subtitle}>管理和应用保存的色彩预设</Text>
      </View>

      {/* 预设列表 */}
      {presets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>暂无预设</Text>
          <Text style={styles.emptySubtitle}>
            在调整页面保存参数后，预设将显示在这里
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setCurrentPage('import')}
          >
            <Text style={styles.emptyButtonText}>去导入图片</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={presets}
          renderItem={renderPresetItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

/**
 * ParamBadge - 参数标签小组件
 * 显示单个参数的缩写和值
 */
const ParamBadge: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.paramBadge}>
    <Text style={styles.paramBadgeLabel}>{label}</Text>
    <Text style={styles.paramBadgeValue}>{value.toFixed(2)}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    padding: DIMENSIONS.padding,
    paddingBottom: 8
  },
  title: {
    fontSize: DIMENSIONS.fontTitle,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.textSecondary
  },
  listContent: {
    padding: DIMENSIONS.padding,
    paddingTop: 8,
    paddingBottom: 40
  },
  presetCard: {
    backgroundColor: COLORS.surface,
    borderRadius: DIMENSIONS.borderRadiusLarge,
    padding: 16,
    marginBottom: 12
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  presetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  typeBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8
  },
  typeBadgeFilm: {
    backgroundColor: COLORS.accent
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontSmall,
    fontWeight: '600'
  },
  presetName: {
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1
  },
  presetDate: {
    fontSize: DIMENSIONS.fontSmall,
    color: COLORS.textMuted
  },
  paramsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  paramBadge: {
    backgroundColor: COLORS.card,
    borderRadius: DIMENSIONS.borderRadius,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 60,
    alignItems: 'center'
  },
  paramBadgeLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2
  },
  paramBadgeValue: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.text,
    fontWeight: '600'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 10,
    alignItems: 'center'
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontNormal,
    fontWeight: '600'
  },
  deleteButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 10,
    alignItems: 'center'
  },
  deleteButtonText: {
    color: COLORS.error,
    fontSize: DIMENSIONS.fontNormal,
    fontWeight: '600'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DIMENSIONS.padding
  },
  emptyTitle: {
    fontSize: DIMENSIONS.fontXLarge,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: DIMENSIONS.fontNormal,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius,
    paddingVertical: 14,
    paddingHorizontal: 32
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: DIMENSIONS.fontLarge,
    fontWeight: '600'
  }
});

export default LibraryPage;
