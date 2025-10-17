import { MMKV } from 'react-native-mmkv';

export interface GameRecord {
  timestamp: number;
  bombs: number;
  difficulty: number;
  time: number; // Time taken in seconds
}

const MAX_GAMES = 50;
const storage = new MMKV();

export const GameStorage = {

  getFrequency: (): number | undefined => {
    try {
      const frequency = storage.getNumber('frequency');
      return frequency;
    } catch (error) {
      console.error('Error getting frequency:', error);
      return undefined; // Default frequency if error occurs
    }
  },
  setFrequency: (frequency: number): void => {
    try {
      storage.set('frequency', frequency);
    } catch (error) {
      console.error('Error setting frequency:', error);
    }
  },
  /**
   * Save a new game record and maintain only the most recent MAX_GAMES
   */
  saveGame: (record: GameRecord): void => {
    try {
      // Get current history
      const history = GameStorage.getGameHistory();

      // Add new record to the beginning (most recent first)
      const updatedHistory = [record, ...history].slice(0, MAX_GAMES);

      // Save updated history
      storage.set('gameHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving game record:', error);
    }
  },

  /**
   * Get the game history (up to MAX_GAMES)
   */
  getGameHistory: (): GameRecord[] => {
    try {
      const historyJson = storage.getString('gameHistory');
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error getting game history:', error);
      return [];
    }
  },

  /**
   * Clear all game history
   */
  clearHistory: (): void => {
    try {
      storage.delete('gameHistory');
    } catch (error) {
      console.error('Error clearing game history:', error);
    }
  },

  /**
   * Get summary statistics
   */
  getStats: (history: GameRecord[]): {
    totalGames: number;
    averageBombs: number;
    bestBombs: number;
    averageTime: number;
    bestTime: number;
  } => {

    if (history.length === 0) {
      return {
        totalGames: 0,
        averageBombs: 0,
        bestBombs: 0,
        averageTime: 0,
        bestTime: 0
      };
    }

    const totalBombs = history.reduce((sum, game) => sum + game.bombs, 0);
    const totalTime = history.reduce((sum, game) => sum + game.time, 0);
    const bestBombs = Math.max(...history.map(game => game.bombs));
    const bestTime = Math.min(...history.map(game => game.time));

    return {
      totalGames: history.length,
      averageBombs: totalBombs / history.length,
      bestBombs,
      averageTime: totalTime / history.length,
      bestTime
    };
  }
}; 