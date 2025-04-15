import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getScreenSize } from './utils/dimension';

interface GameStats {
  timestamp: number;
  bombs: number;
}

const Stats = () => {
  const { width } = getScreenSize();

  const data = {
    labels: ["January", "February", "March", "April", "May", "June"],
    datasets: [
      {
        data: [20, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(128, 128, 128, ${opacity})`, // Medium gray
        strokeWidth: 2
      }
    ],
    legend: ["Rainy Days"]
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(64, 64, 64, ${opacity})`, // Dark gray for text
    labelColor: (opacity = 1) => `rgba(64, 64, 64, ${opacity})`, // Dark gray for labels
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#808080' // Medium gray for dots
    },
    propsForBackgroundLines: {
      stroke: '#E0E0E0', // Light gray for grid lines
      strokeWidth: 1
    }
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={data}
        width={width - 16}
        height={220}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default Stats;
