/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import type { PropsWithChildren } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  Alert,
  View,
  Pressable
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import { getScreenSize } from './utils/dimension';
import { generateGrid } from './utils/array';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({ children, title }: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const { width, height } = getScreenSize();
  const safePadding = 3;
  const grid = generateGrid(width, height, safePadding, 4);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const handleCellPress = (index: number) => {
    grid[index].pressed = true;
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
          onPress={() => handleCellPress(index)}
          style={() => [
            styles.cell,
            {
              left: cell.x,
              top: cell.y,
              width: cell.width,
              height: cell.height,
              backgroundColor: cell.pressed ? 'lightgray' : 'white', // Visual feedback on press
            },
          ]}
        >
          {cell.isBomb ? <Text>Bomb</Text> : <Text>{cell.bombsAround}</Text>}
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
