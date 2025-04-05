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
  View,
  Vibration,
  Pressable,
  TouchableOpacity
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";
import IconMaterial from "react-native-vector-icons/MaterialCommunityIcons";
import IconAnt from "react-native-vector-icons/AntDesign";
import Slider from '@react-native-community/slider';
import { MMKVLoader } from 'react-native-mmkv-storage';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';

import { getScreenSize } from './utils/dimension';
import {
  generateGrid,
  GridCell,
  updateCellsAround,
  checkVictory,
  getCellText,
  GridConfig,
  getGridConfig,
  openBombs,
  backgroundColors
} from './utils/array';


const emojis = {
  playing: '🧐',
  idle: '😃',
  victory: '🙄',
  defeat: '😬',
  waiting: '😪',
  slider: '🥸'
}

type GameState = {
  gameStarted: boolean,
  gameEnded: boolean,
  grid: GridCell[],
  start: number,
  lastPlay: number,
  elapsed: number,
  emoji: string,
  elapsedTimeSinceLastPlay: number
}

const noop = () => { };
const BombIcon = () => <Icon name="bomb" size={28} color="black" />;
const FlagIcon = () => <IconMaterial name="flag" size={28} color="black" />;
const XIcon = () => <IconMaterial name="flag-remove" size={28} color="black" />;
const getTimestamp = () => new Date().getTime();
const getSecondsDiff = (t1: number, t2: number) => Math.floor((t1 - t2) / 1000);
const vibrate = (duration: number) => Vibration.vibrate(duration);
const startGameState = (state: GameState) => ({
  ...state,
  gameStarted: true,
  start: getTimestamp(),
  lastPlay: getTimestamp(),
  emoji: emojis.playing,
});
const endGameState = (state: GameState, emoji: string) => ({
  ...state,
  gameStarted: false,
  gameEnded: true,
  emoji,
});

const storage = new MMKVLoader().initialize();

function App(): React.JSX.Element {
  useKeepAwake();

  const { width, height } = getScreenSize();
  const headerHeight = 60;
  const boardHeight = height - headerHeight;
  const safePadding = 0;
  const columns = 11;
  const presetFrequency = 0.1;
  const presetGridConfig = getGridConfig(width, boardHeight, safePadding, columns, presetFrequency);

  const [frequency, setFrequency] = useState<number>(presetFrequency);
  const [gridConfig, setGridConfig] = useState<GridConfig>(presetGridConfig);
  const [showSlider, setShowSlider] = useState<boolean>(false);
  const resetGrid = () => generateGrid(gridConfig);

  const [state, setState] = useState<GameState>({
    gameStarted: false,
    gameEnded: false,
    grid: resetGrid(),
    start: getTimestamp(),
    lastPlay: getTimestamp(),
    elapsed: 0,
    elapsedTimeSinceLastPlay: 0,
    emoji: emojis.idle,
  });
  const [remainingBombs, setRemainingBombs] = useState<number | null>(null);

  useEffect(() => {
    const fetchInitialFrequency = async () => {
      const initialFrequency = await storage.getIntAsync('frequency');
      if (initialFrequency) {
        setFrequency(initialFrequency);
        setGridConfig({ ...gridConfig, frequency: initialFrequency });
      } else {
        storage.setIntAsync('frequency', presetFrequency);
      }
    }
    fetchInitialFrequency();
  }, []);

  useEffect(() => {
    storage.setIntAsync('frequency', frequency);
  }, [gridConfig]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (state.gameStarted) {
        const timestamp = getTimestamp();
        const elapsed = getSecondsDiff(timestamp, state.start);
        const elapsedTimeSinceLastPlay = getSecondsDiff(timestamp, state.lastPlay);

        let emoji = emojis.playing;
        if (showSlider) emoji = emojis.slider;
        else if (elapsedTimeSinceLastPlay > 5) emoji = emojis.waiting;
        setState({ ...state, elapsed, elapsedTimeSinceLastPlay, emoji });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  useEffect(() => {
    const bombs = state.grid.filter((cell) => cell.isBomb).length;
    const flags = state.grid.filter((cell) => cell.hasFlag).length;
    setRemainingBombs(Math.max(bombs - flags, 0));
  }, [state]);

  useEffect(() => {
    resetGame();
  }, [gridConfig]);

  useEffect(() => {
    if (showSlider) {
      setState({ ...state, emoji: emojis.slider });
    } else if (state.gameStarted) {
      setState({ ...state, emoji: emojis.playing });
    }
    else {
      setState({ ...state, emoji: emojis.idle });
    }
  }, [showSlider]);

  const resetGame = () => {
    if (showSlider) {
      setShowSlider(false);
    }

    const updateState = {
      gameStarted: false,
      gameEnded: false,
      grid: resetGrid(),
      start: getTimestamp(),
      elapsed: 0,
      emoji: emojis.idle,
    };
    setShowSlider(false);
    setState({ ...state, ...updateState });
  }

  const toogleFlag = (cell: GridCell) => {
    if (state.gameEnded)
      return;

    vibrate(100);

    let newState = { ...state };
    if (!newState.gameStarted)
      newState = startGameState(newState);

    if (!cell.pressed)
      newState.grid[cell.index] = { ...cell, hasFlag: !cell.hasFlag };

    setState({ ...newState });
  };

  const handleCellPress = (cell: GridCell, index: number) => {
    if (state.gameEnded || cell.hasFlag || showSlider)
      return;
    vibrate(50);

    let newState = { ...state };
    if (!newState.gameStarted)
      newState = startGameState(newState);

    const updatedCell = {
      ...cell,
      pressed: true,
      text: getCellText(cell),
      backgroundColor: backgroundColors.pressed
    };
    const newGrid = newState.grid
    newGrid[index] = updatedCell;

    updateCellsAround(index, newGrid, gridConfig.rows, gridConfig.columns);
    newState.grid = newGrid;
    const victory = checkVictory(newGrid);
    if (victory)
      newState = endGameState(newState, emojis.victory);
    if (updatedCell.isBomb) {
      vibrate(1000);
      openBombs(newState.grid);
      updatedCell.backgroundColor = backgroundColors.openBomb;
      newState = endGameState(newState, emojis.defeat);
    };

    newState.lastPlay = getTimestamp();
    setState(newState);
  };

  const setSliderTrue = () => {
    setShowSlider(true);
  }

  const cellText = (cell: GridCell) => {
    if (state.gameEnded && cell.hasFlag && !cell.isBomb) return <XIcon />;
    if (cell.hasFlag) return <FlagIcon />;
    if (cell.isBomb && cell.pressed) return <BombIcon />;
    return (
      <Text
        style={[styles.cellText, { color: cell.textColor }]}>
        {cell.pressed ? cell.text : ""}
      </Text>
    )
  };

  const displayCell = (cell: GridCell) => (
    <Pressable
      key={cell.index}
      onPress={() => handleCellPress(cell, cell.index)}
      onLongPress={() => toogleFlag(cell)}
      style={() => [
        styles.cell,
        {
          left: cell.x,
          top: cell.y,
          width: cell.width,
          height: cell.height,
          backgroundColor: cell.backgroundColor,
          borderBottomWidth: 1,
          borderRightWidth: 1,
          borderColor: "rgba(0, 0, 0, 0.5)", // Soft contrast
        },
      ]}
    >
      {cellText(cell)}
    </Pressable>
  );

  const gridView = () => (
    <View style={styles.grid}>
      {state.grid.map(cell => displayCell(cell))}
    </View>
  )

  const messageBubble = (message: string) => (
    <View style={styles.messageBubbleContainer}>
      <View style={styles.messageBubbleTriangle} />
      <View style={styles.messageBubbleText}>
        <Text style={{ textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    </View >
  );

  const slider = () => (
    <>
      <View style={{
        padding: 15,
        position: 'absolute',
        top: 80,
        left: '50%',
        transform: [{ translateX: -145 }],
        backgroundColor: 'white',
        borderRadius: 10,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, textAlign: 'center', fontSize: 18 }}>
            Bombs Probability
          </Text>
        </View>
        <Text style={{ textAlign: 'center', fontSize: 18, paddingTop: 10 }}>
          {(frequency * 100).toFixed(0)}%
        </Text>
        {/* Row container for Slider + Icon */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setFrequency(prevFrequency => Math.max(prevFrequency - 0.01, 0.1))}>
            <IconAnt
              name="minus"
              size={20}
              color="black"
              style={{ marginLeft: 10, marginBottom: 3 }}
            />
          </TouchableOpacity>
          <Slider
            style={{ width: 200, height: 80, padding: 0 }}
            step={0.01}
            minimumValue={0.1}
            maximumValue={0.3}
            onValueChange={(value) => setFrequency(value)}
            value={frequency}
            minimumTrackTintColor='green'
            maximumTrackTintColor="#000000"

          />
          <TouchableOpacity onPress={() => setFrequency(prevFrequency => Math.min(prevFrequency + 0.01, 0.3))}>
            <IconAnt
              name="plus"
              size={20}
              color="black"
              style={{ marginLeft: 10, marginBottom: 3 }}
            />
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10 }}>
          <TouchableOpacity
            onPress={() => setFrequency(0.1)}
            style={[styles.sliderButton, { backgroundColor: '#27AE60' }]}
          >
            <Text style={styles.sliderButtonText}>
              EASY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFrequency(0.15)}
            style={[styles.sliderButton, { backgroundColor: '#E67E22' }]}
          >
            <Text style={styles.sliderButtonText}>
              MEDIUM
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setFrequency(0.2)}
            style={[styles.sliderButton, { backgroundColor: '#C0392B' }]}
          >
            <Text style={styles.sliderButtonText}>
              HARD
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => setGridConfig({ ...gridConfig, frequency })}
          style={[styles.sliderButton, { backgroundColor: '#007AFF' }]}
        >
          <Text style={styles.sliderButtonText}>
            APPLY
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setShowSlider(false);
            setFrequency(gridConfig.frequency);
          }}
          style={[styles.sliderButton, { backgroundColor: '#FF3B30' }]}
        >
          <Text style={styles.sliderButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const header = () => (
    <View style={[styles.header, { height: headerHeight }]}>
      <Text style={styles.timer}>{remainingBombs}</Text>
      <View style={styles.emojiButton}>
        <TouchableOpacity onPress={() => showSlider ? noop() : resetGame()}>
          <Text style={styles.emoji}>{state.emoji}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={setSliderTrue}>
          <Icon name="gear" size={28} color="gray" />
        </TouchableOpacity>
      </View>
      <Text style={styles.timer}>{Math.min(state.elapsed, 999)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {header()}
      {gridView()}
      {state.gameEnded ? messageBubble(state.emoji === emojis.victory ? "Congratulations..." : "Better luck next time!") : <></>}
      {showSlider ? slider() : <></>}
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
    paddingTop: '1%',
    paddingRight: '8%',
    paddingLeft: '8%',
    backgroundColor: "#264653",
    borderBottomColor: "black",
    borderBottomWidth: 2
  },
  timer: {
    fontSize: 34,
    color: "white",
    width: '20%', // Ensures equal spacing on both sides
    textAlign: "center",
  },
  emojiButton: {
    flex: 1, // Takes up remaining space
    flexDirection: "row",
    marginLeft: 58,
    gap: 30,
    justifyContent: "center", // Centers the emoji vertically
    alignItems: "center", // Centers the emoji horizontally
  },
  emoji: {
    fontSize: 34,
  },
  sliderButton: {
    paddingVertical: 10,
    marginTop: 5,
    paddingHorizontal: 15,
    borderRadius: 8, // Rounded corners
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // For Android shadow
  },
  sliderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase', // Makes text look cleaner
  },
  messageBubbleContainer: {
    alignItems: 'center',
    position: 'absolute',
    top: 45,
    left: '50%',
    transform: [{ translateX: -75 }]
  },
  messageBubbleTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "white",
    alignSelf: 'center'
  },
  messageBubbleText: {
    width: 150,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  }
});

export default App;
