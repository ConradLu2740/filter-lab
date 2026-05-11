import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = '处理中...'
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  content: {
    backgroundColor: '#1E293B',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 150
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 12
  }
});

export default LoadingOverlay;
