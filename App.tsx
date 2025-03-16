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
  Pressable
} from 'react-native';

import { getScreenSize } from './utils/dimension';
import { generateGrid, GridCell } from './utils/array';

function App(): React.JSX.Element {

  const { width, height } = getScreenSize();
  const safePadding = 3;

  const [grid, setGrid] = useState<GridCell[]>(generateGrid(width, height, safePadding, 4));

  const handleCellPress = (cell: GridCell, index: number) => {
    setGrid(prevGrid =>
      prevGrid.map((cell, i) =>
        i === index ? { ...cell, pressed: true, text: cell.isBomb ? '💣' : cell.bombsAround.toString() } : cell
      )
    );

    if (grid[index].isBomb) Alert.alert('You lost');
  };


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
              backgroundColor: cell.pressed ? 'white' : 'lightgray', // Visual feedback on press
            },
          ]}
        >
          <Text>{cell.pressed ? cell.text : ''}</Text>
        </Pressable>
      ))
      }
    </View >
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%'
  },
  cell: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'black', // Change color if needed
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
});

export default App;
