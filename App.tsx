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
import { generateGrid, GridCell, updateCellsAround, checkVictory } from './utils/array';

function App(): React.JSX.Element {

  const { width, height } = getScreenSize();
  const safePadding = 3;
  const rows = 6;
  const columns = 4;
  const frequency = 0.5;

  const resetGrid = () => generateGrid(width, height, safePadding, rows, columns, frequency)

  const [grid, setGrid] = useState<GridCell[]>(resetGrid());

  const handleCellPress = (cell: GridCell, index: number) => {
    const updatedCell = { ...cell, pressed: true, text: cell.isBomb ? '💣' : cell.bombsAround.toString() };
    const newGrid = grid.map((cell, i) =>
      i === index ? updatedCell : cell
    )
    updateCellsAround(index, newGrid, rows, columns);
    setGrid(newGrid);
    const victory = checkVictory(newGrid);
    // if (victory) Alert.alert('VICTORY!');
    // if (grid[index].isBomb) Alert.alert('You lost');
  };

  const bombColors = {
    0: "#F1F1F1",
    1: "#A8DADC",
    2: "#2A9D8F",
    3: "#E9C46A",
    4: "#F4A261",  // Orange for '4'
    5: "#E76F51",  // Red-Orange for '5'
    6: "#8A4F7D",  // Purple for '6'
    7: "#264653",  // Dark Blue for '7'
    8: "#1D3557",  // Very Dark Blue for '8'
    default: "#B0BEC5", // Gray for unknown cases
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

  return (
    <View style={styles.container}>
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
            <Text style={[styles.cellText, { color: cell.pressed ? "#1D3557" : "white" }]}>
              {cell.pressed && cell.isBomb ? <BombIcon /> : <Text style={styles.cellText}>{cell.pressed ? cell.text : ""}</Text>}
            </Text>
          </Pressable>
        ))
        }
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={() => setGrid(resetGrid())}>
          <Text style={styles.text}>RESTART</Text>
        </TouchableOpacity>
      </View>
    </View >
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between', // Distributes space between grid and button
    alignItems: 'center',
    paddingVertical: 20, // Adds padding to prevent overlap
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
  buttonContainer: {
    width: '100%',
    alignItems: 'center', // Centers button
    paddingBottom: 20, // Adds space below button
  },
  button: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '50%', // Adjust width if needed
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;
