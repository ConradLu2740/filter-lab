import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  SafeAreaView,
  Platform
} from 'react-native';
import { useAppStore } from './stores/appStore';
import { COLORS } from './constants/colors';
import AppNavigator from './navigation/AppNavigator';
import Toast from './components/Toast';

/**
 * App - 应用根组件
 * 配置全局状态、状态栏和布局
 */
const App: React.FC = () => {
  const { toast, hideToast } = useAppStore();

  /**
   * 应用启动时的初始化逻辑
   */
  useEffect(() => {
    // 配置状态栏
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(COLORS.background);
      StatusBar.setTranslucent(false);
    }

    // 可以在这里添加应用启动时的数据恢复逻辑
    // 例如：从 MMKV 恢复上次的工作状态
  }, []);

  /**
   * Toast 自动隐藏处理
   */
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        hideToast();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [toast, hideToast]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      {/* 主应用导航 */}
      <AppNavigator />

      {/* 全局 Toast 提示 */}
      <Toast
        visible={!!toast}
        message={toast?.message || ''}
        type={toast?.type || 'info'}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  }
});

export default App;
