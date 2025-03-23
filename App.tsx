/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  Alert,
  View,
  Pressable,
  TouchableOpacity
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";
import { trigger } from "react-native-haptic-feedback";

import { getScreenSize } from './utils/dimension';
import { generateGrid, GridCell, updateCellsAround, checkVictory, getCellText, GridConfig, getGridConfig, openBombs } from './utils/array';

// Optional configuration
const options = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

const bombColors = {
  0: "#e3dcdc",
  1: "#346beb",
  2: "#2A9D8F",
  3: "#E9C46A",
  4: "#8d07a8",  // Orange for '4'
  5: "#82625a",  // Red-Orange for '5'
  6: "#556d87",  // Purple for '6'
  default: "#B0BEC5", // Gray for unknown cases
};

const emojis = {
  playing: '😃',
  victory: '😎',
  defeat: '😵'
}

type GameState = {
  gameStarted: boolean,
  gameEnded: boolean,
  grid: GridCell[],
  start: number,
  elapsed: number,
  emoji: string,
}

const BombIcon = () => <Icon name="bomb" size={28} color="black" />;
const getTimestamp = () => new Date().getTime();
const getSecondsDiff = (t1: number, t2: number) => Math.floor((t1 - t2) / 1000);

function App(): React.JSX.Element {

  const { width, height } = getScreenSize();
  const safePadding = 0;
  const columns = 8;
  const frequency = 0.1;

  const gridConfig: GridConfig = getGridConfig(width, height, safePadding, columns, frequency);
  const resetGrid = () => generateGrid(gridConfig);

  const [state, setState] = useState<GameState>({
    gameStarted: false,
    gameEnded: false,
    grid: resetGrid(),
    start: getTimestamp(),
    elapsed: 0,
    emoji: emojis.playing,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (state.gameStarted) {
        const elapsed = getSecondsDiff(getTimestamp(), state.start);
        setState({ ...state, elapsed });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  const resetGame = () => {
    const updateState = {
      gameStarted: false,
      gameEnded: false,
      grid: resetGrid(),
      start: getTimestamp(),
      elapsed: 0,
      emoji: emojis.playing,
    };
    setState({ ...state, ...updateState });
  }

  const startGameState = (state: GameState) => {
    return {
      ...state,
      gameStarted: true,
      start: getTimestamp(),
    };
  };

  const endGameState = (state: GameState, emoji: string) => {
    return {
      ...state,
      gameStarted: false,
      gameEnded: true,
      emoji,
    };
  };

  const handleCellPress = (cell: GridCell, index: number) => {
    trigger("impactLight", options);
    if (state.gameEnded) {
      return;
    }

    let newState = { ...state };
    if (!newState.gameStarted) {
      newState = startGameState(newState);
    }
    const updatedCell = { ...cell, pressed: true, text: cell.isBomb ? '💣' : getCellText(cell) };
    const newGrid = newState.grid.map((cell, i) =>
      i === index ? updatedCell : cell
    )
    updateCellsAround(index, newGrid, gridConfig.rows, gridConfig.columns);
    newState.grid = newGrid;
    const victory = checkVictory(newGrid);
    if (victory) {
      newState = endGameState(newState, emojis.victory);
    };
    if (cell.isBomb) {
      openBombs(newState.grid);
      newState = endGameState(newState, emojis.defeat);
    };
    setState(newState);
  };

  const gridNotBomb = state.grid.filter((cell) => !cell.isBomb);
  const gridBomb = state.grid.filter((cell) => cell.isBomb);

  const header = () => (
    <View style={styles.header}>
      <Text style={styles.timer}>{state.elapsed}</Text>
      <TouchableOpacity onPress={resetGame} style={styles.emojiButton}>
        <Text style={styles.emoji}>{state.emoji}</Text>
      </TouchableOpacity>
      <Text style={styles.timer}>{state.elapsed}</Text>
    </View>
  );

  const displayCell = (cell: GridCell) => (
    <Pressable
      key={cell.index}
      onPress={() => handleCellPress(cell, cell.index)}
      style={() => [
        styles.cell,
        {
          left: cell.x,
          top: cell.y,
          width: cell.width,
          height: cell.height,
          backgroundColor: cell.pressed
            ? cell.isBomb
              ? "#E63946" // Red for bombs
              : bombColors[cell.bombsAround] || bombColors.default // Use mapped color or default
            : "#B0BEC5", // Gray for unopened cells
          borderWidth: cell.pressed ? 0 : 0.5
        },
      ]}
    >
      <Text style={[styles.cellText, { color: cell.pressed ? "#09090a" : "white" }]}>
        {cell.pressed && cell.isBomb ? <BombIcon /> : <Text style={styles.cellText}>{cell.pressed ? cell.text : ""}</Text>}
      </Text>
    </Pressable>
  )

  const gridView = () => (
    <View style={styles.grid}>
      {gridNotBomb.map(cell => displayCell(cell))}
      {gridBomb.map(cell => displayCell(cell))}
    </View>
  )

  return (
    <View style={styles.container}>
      {header()}
      {gridView()}
    </View >
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between', // Distributes space between grid and button
    alignItems: 'center',
    paddingVertical: 0, // Adds padding to prevent overlap
  },
  grid: {
    flex: 1, // Takes up remaining space
    width: '100%',
    justifyContent: 'center', // Centers content vertically
    alignItems: 'center', // Centers content horizontally
  },
  cellText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
  },
  cell: {
    position: 'absolute',
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between", // Keeps the two timers apart
    alignItems: "center",
    paddingTop: '5%',
    paddingRight: '8%',
    paddingLeft: '8%',
    paddingBottom: '1%',
    backgroundColor: "#264653",
    borderBottomColor: "black",
    borderBottomWidth: 2,
  },
  timer: {
    fontSize: 34,
    color: "white",
    width: 60, // Ensures equal spacing on both sides
    textAlign: "center",
  },
  emojiButton: {
    flex: 1, // Takes up remaining space
    alignItems: "center", // Centers the emoji horizontally
  },
  emoji: {
    fontSize: 34,
  },
});

export default App;
