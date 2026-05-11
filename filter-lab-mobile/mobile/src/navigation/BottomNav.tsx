import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useAppStore } from '../stores/appStore';
import { COLORS, DIMENSIONS } from '../constants/colors';

/**
 * 导航项配置
 */
interface NavItem {
  key: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'import', label: '导入', icon: '📷' },
  { key: 'analyze', label: '分析', icon: '🔍' },
  { key: 'adjust', label: '调整', icon: '⚡' },
  { key: 'library', label: '预设', icon: '📚' }
];

/**
 * BottomNav - 底部导航栏
 * 提供四个主要功能入口的快速切换
 */
const BottomNav: React.FC = () => {
  const { currentPage, setCurrentPage, currentImage } = useAppStore();

  /**
   * 检查页面是否可访问
   * @param page - 目标页面
   */
  const isPageAccessible = useCallback((page: string): boolean => {
    switch (page) {
      case 'import':
        return true;
      case 'analyze':
        return !!currentImage;
      case 'adjust':
        return !!currentImage;
      case 'library':
        return true;
      default:
        return false;
    }
  }, [currentImage]);

  /**
   * 处理导航项点击
   * @param page - 目标页面
   */
  const handlePress = useCallback((page: string) => {
    if (!isPageAccessible(page)) {
      return;
    }
    setCurrentPage(page);
  }, [isPageAccessible, setCurrentPage]);

  return (
    <View style={styles.container}>
      {NAV_ITEMS.map((item) => {
        const isActive = currentPage === item.key;
        const isAccessible = isPageAccessible(item.key);

        return (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.navItem,
              isActive && styles.navItemActive
            ]}
            onPress={() => handlePress(item.key)}
            disabled={!isAccessible}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.icon,
              isActive && styles.iconActive,
              !isAccessible && styles.iconDisabled
            ]}>
              {item.icon}
            </Text>
            <Text style={[
              styles.label,
              isActive && styles.labelActive,
              !isAccessible && styles.labelDisabled
            ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingBottom: 8,
    paddingTop: 8,
    height: 64
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  navItemActive: {
    // 活跃状态下的额外样式
  },
  icon: {
    fontSize: 20,
    marginBottom: 2
  },
  iconActive: {
    // 活跃图标样式
  },
  iconDisabled: {
    opacity: 0.3
  },
  label: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500'
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: '600'
  },
  labelDisabled: {
    opacity: 0.3
  }
});

export default BottomNav;
