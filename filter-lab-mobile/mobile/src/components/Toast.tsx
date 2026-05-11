import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useAppStore } from '../stores/appStore';

const Toast: React.FC = () => {
  const { toast, hideToast } = useAppStore();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ]).start(() => {
        hideToast();
      });
    }
  }, [toast]);

  if (!toast) return null;

  const backgroundColor = 
    toast.type === 'success' ? '#10B981' :
    toast.type === 'error' ? '#EF4444' : '#3B82F6';

  return (
    <Animated.View 
      style={[
        styles.container,
        { backgroundColor, opacity: fadeAnim }
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500'
  }
});

export default Toast;
