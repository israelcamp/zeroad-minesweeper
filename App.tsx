/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  Alert,
  View,
  Pressable,
  TouchableOpacity
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";

import { getScreenSize } from './utils/dimension';
import { generateGrid, GridCell, updateCellsAround, checkVictory, getCellText, GridConfig, getGridConfig } from './utils/array';

const bombColors = {
  0: "#F1F1F1",
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

function App(): React.JSX.Element {

  const { width, height } = getScreenSize();
  const safePadding = 0;
  const columns = 8;
  const frequency = 0.1;

  const gridConfig: GridConfig = getGridConfig(width, height, safePadding, columns, frequency);
  const resetGrid = () => generateGrid(gridConfig);
  const [grid, setGrid] = useState<GridCell[]>(resetGrid());

  const [emoji, setEmoji] = useState<string>(emojis.playing);

  const handleCellPress = (cell: GridCell, index: number) => {
    const updatedCell = { ...cell, pressed: true, text: cell.isBomb ? '💣' : getCellText(cell) };
    const newGrid = grid.map((cell, i) =>
      i === index ? updatedCell : cell
    )
    updateCellsAround(index, newGrid, gridConfig.rows, gridConfig.columns);
    setGrid(newGrid);
    const victory = checkVictory(newGrid);
    if (victory) setEmoji(emojis.victory);
    if (grid[index].isBomb) setEmoji(emojis.defeat);
  };


  const BombIcon = () => <Icon name="bomb" size={28} color="black" />;

  /*
   * To keep the template simple and small we're adding padding to prevent view
   * from rendering under the System UI.
   * For bigger apps the reccomendation is to use `react-native-safe-area-context`:
   * https://github.com/AppAndFlow/react-native-safe-area-context
   *
   * You can read more about it here:
   * https://github.com/react-native-community/discussions-and-proposals/discussions/827
   */

  const header = () => (
    <View style={styles.header}>
      <Text style={{ fontSize: 34 }}>{emoji}</Text>
    </View>
  )

  const gridView = () => (
    <View style={styles.grid}>
      {grid.map((cell, index) => (
        <Pressable
          key={index}
          onPress={() => handleCellPress(cell, index)}
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
            },
          ]}
        >
          <Text style={[styles.cellText, { color: cell.pressed ? "#09090a" : "white" }]}>
            {cell.pressed && cell.isBomb ? <BombIcon /> : <Text style={styles.cellText}>{cell.pressed ? cell.text : ""}</Text>}
          </Text>
        </Pressable>
      ))
      }
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
  header: {
    width: "100%",
    height: "8%",
    borderBottomColor: "black",
    borderBottomWidth: 1,
    backgroundColor: "#505861",
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '3%'
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
    borderWidth: 1,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
