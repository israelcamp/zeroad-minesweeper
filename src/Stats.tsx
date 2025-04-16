import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from "react-native-vector-icons/FontAwesome6";
import { getScreenSize } from './utils/dimension';
import { GameStorage, GameRecord } from './utils/storage';

const Stats = ({ navigation }: {navigation: any}) => {
  const { width } = getScreenSize();
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    averageBombs: 0,
    bestBombs: 0,
    averageTime: 0,
    bestTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // const history = await GameStorage.getGameHistory();
      const history: GameRecord[] = Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - i * 86400000, // One per day, going backwards
        bombs: Math.floor(Math.random() * 30) + 15, // 1 to 10 bombs
        difficulty: parseFloat((Math.random() * 0.2 + 0.1).toFixed(2)), // 0.10 to 0.30
        time: Math.floor(Math.random() * 120) + 30 // 30s to 150s
      }));

      history.sort((a, b) => a.timestamp - b.timestamp);

      const gameStats = await GameStorage.getStats(history);
      
      setGameHistory(history);
      setStats(gameStats);
    } catch (error) {
      console.error('Error loading game data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Prepare data for time progression chart
  const timeData = {
    labels: gameHistory.map((game, index) => {
      if (index === 0 || index === gameHistory.length - 1) {
        const date = new Date(game.timestamp);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      return '';
    }),
    datasets: [
      {
        data: gameHistory.map(game => game.time),
        color: (opacity = 1) => `rgba(128, 128, 128, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Time to Victory (s)"]
  };

  // Prepare data for bomb count performance chart
  const bombCountData = (() => {
    // Group games by bomb count ranges (bins of 5)
    const bombGroups = gameHistory.reduce((acc, game) => {
      const binStart = Math.floor(game.bombs / 5) * 5;
      const binEnd = binStart + 4;
      const binKey = `${binStart}-${binEnd}`;
      
      if (!acc[binKey]) {
        acc[binKey] = { total: 0, count: 0 };
      }
      acc[binKey].total += game.time;
      acc[binKey].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    // Convert to array and sort by bin start
    const sortedBins = Object.entries(bombGroups)
      .map(([bin, data]) => ({
        bin,
        avgTime: data.total / data.count
      }))
      .sort((a, b) => {
        const aStart = parseInt(a.bin.split('-')[0]);
        const bStart = parseInt(b.bin.split('-')[0]);
        return aStart - bStart;
      });

    return {
      labels: sortedBins.map(item => item.bin),
      datasets: [
        {
          data: sortedBins.map(item => item.avgTime),
          color: (opacity = 1) => `rgba(128, 128, 128, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Average Time to Victory (s)"]
    };
  })();

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(64, 64, 64, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(64, 64, 64, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#808080'
    },
    propsForBackgroundLines: {
      stroke: '#E0E0E0',
      strokeWidth: 1
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#808080" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="xmark" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Game Statistics</Text>
        <Text style={styles.subtitle}>Performance of your last 50 games</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalGames}</Text>
          <Text style={styles.statLabel}>Games</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.averageBombs.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Bombs</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.bestBombs}</Text>
          <Text style={styles.statLabel}>Best</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(stats.bestTime)}</Text>
          <Text style={styles.statLabel}>Best Time</Text>
        </View>
      </View>

      <Text style={styles.chartTitle}>Time to Victory Over Time</Text>
      {gameHistory.length > 0 ? (
        <LineChart
          data={timeData}
          width={width}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No data available</Text>
        </View>
      )}

      <Text style={styles.chartTitle}>Average Time by Bomb Count</Text>
      {gameHistory.length > 0 ? (
        <LineChart
          data={bombCountData}
          width={width}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No data available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chart: {
    marginLeft:-32,
    padding: 0,
    borderRadius: 16,
  },
  emptyState: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 8,
    zIndex: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
});

export default Stats;
