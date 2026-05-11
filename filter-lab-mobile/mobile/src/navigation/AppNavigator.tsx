import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from '../stores/appStore';
import { COLORS } from '../constants/colors';

// 页面组件
import ImportPage from '../pages/ImportPage';
import AnalyzePage from '../pages/AnalyzePage';
import AdjustPage from '../pages/AdjustPage';
import LibraryPage from '../pages/LibraryPage';
import ExportPage from '../pages/ExportPage';

// 底部导航栏组件
import BottomNav from './BottomNav';

/**
 * AppNavigator - 应用导航器
 * 基于 Zustand 状态管理的简单页面切换导航
 * 不使用 react-navigation，减少依赖复杂度
 */
const AppNavigator: React.FC = () => {
  const { currentPage } = useAppStore();

  /**
   * 根据当前页面状态渲染对应组件
   */
  const renderPage = () => {
    switch (currentPage) {
      case 'import':
        return <ImportPage />;
      case 'analyze':
        return <AnalyzePage />;
      case 'adjust':
        return <AdjustPage />;
      case 'library':
        return <LibraryPage />;
      case 'export':
        return <ExportPage />;
      default:
        return <ImportPage />;
    }
  };

  return (
    <View style={styles.container}>
      {/* 主内容区域 */}
      <View style={styles.content}>
        {renderPage()}
      </View>

      {/* 底部导航栏 - 在导出页面隐藏 */}
      {currentPage !== 'export' && <BottomNav />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1
  }
});

export default AppNavigator;
