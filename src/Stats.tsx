import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Icon from "react-native-vector-icons/FontAwesome6";
import { getScreenSize } from './utils/dimension';
import { GameStorage, GameRecord } from './utils/storage';

const Stats = ({ navigation }: { navigation: any }) => {
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
      const history = await GameStorage.getGameHistory();
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
  };

  // Prepare data for bomb count performance chart
  const bombCountData = (() => {
    // Calculate dynamic bin size based on range
    const minBombs = Math.min(...gameHistory.map(g => g.bombs));
    const maxBombs = Math.max(...gameHistory.map(g => g.bombs));
    const range = maxBombs - minBombs;

    // Determine bin size based on range
    let binSize = 5; // default
    if (range <= 10) binSize = 1;
    else if (range <= 20) binSize = 2;
    else if (range <= 30) binSize = 3;
    else if (range <= 40) binSize = 4;
    else if (range <= 50) binSize = 5;
    else binSize = Math.ceil(range / 10); // for very large ranges

    // Group games by bomb count ranges with dynamic bin size
    const bombGroups = gameHistory.reduce((acc, game) => {
      const binStart = Math.floor(game.bombs / binSize) * binSize;
      const binEnd = binStart + binSize - 1;
      const binRange = binEnd - binStart;
      const binKey = binRange > 0 ? `${binStart}-${binEnd}` : `${binStart}`;

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
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          strokeWidth: 2
        }
      ],
    };
  })();

  const chartConfig = {
    backgroundGradientFrom: '#2a2a2a',
    backgroundGradientTo: '#1a1a1a',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#4a9eff'
    },
    propsForBackgroundLines: {
      stroke: '#404040',
      strokeWidth: 1
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4a9eff" />
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
          <Icon name="xmark" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>STATISTICS</Text>
        <Text style={styles.subtitle}>PERFORMANCE OF YOUR LAST 50 VICTORIES</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.averageBombs.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Bombs</Text>
        </View>
        <View style={styles.statItem}>
          <View style={{ flex: 0, flexDirection: "row", gap: 5 }}>
            <Text style={styles.statValue}>{stats.bestBombs}</Text>
            <Icon name="bomb" size={18} color="white" style={{ transform: [{ translateY: 2 }] }} />
          </View>
          <Text style={styles.statLabel}>Hardest Board</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(stats.bestTime)}</Text>
          <Text style={styles.statLabel}>Lowest Time</Text>
        </View>
      </View>

      <Text style={styles.chartTitle}>Time to Victory Over Time</Text>
      {gameHistory.length > 0 ? (
        <LineChart
          yLabelsOffset={30}
          data={timeData}
          width={width - 20}
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
          yLabelsOffset={30}
          data={bombCountData}
          width={width - 20}
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
    backgroundColor: '#1a1a1a',
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    marginTop: 4,
    letterSpacing: 0.5
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: '#2a2a2a',
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
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chart: {
    marginLeft: 0,
    padding: 0,
    borderRadius: 16,
  },
  emptyState: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#999',
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5
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
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
});

export default Stats;
