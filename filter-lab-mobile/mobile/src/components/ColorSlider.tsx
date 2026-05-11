import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface ColorSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

const ColorSlider: React.FC<ColorSliderProps> = ({
  label,
  value,
  min,
  max,
  step = 0.1,
  unit = '',
  onChange
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>
          {value.toFixed(step < 1 ? 1 : 0)}{unit}
        </Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#2563EB"
        maximumTrackTintColor="#475569"
        thumbTintColor="#2563EB"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  label: {
    color: '#94A3B8',
    fontSize: 14
  },
  value: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500'
  },
  slider: {
    width: '100%',
    height: 40
  }
});

export default ColorSlider;
