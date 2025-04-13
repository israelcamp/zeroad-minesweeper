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

enum GameStatus {
  IDLE,
  PLAYING,
  VICTORY,
  DEFEAT
}

type Difficulty = {
  frequency: number;
  backgroundColor: string;
  text: string;
}

type GameState = {
  status: GameStatus,
  grid: GridCell[],
  lastPlay: number,
}

const difficulties: Difficulty[] = [
  { frequency: 0.1, backgroundColor: '#27AE60', text: 'EASY' },
  { frequency: 0.15, backgroundColor: '#E67E22', text: 'MEDIUM' },
  { frequency: 0.2, backgroundColor: '#C0392B', text: 'HARD' }
]

const noop = () => { };
const BombIcon = () => <Icon name="bomb" size={28} color="black" />;
const FlagIcon = () => <IconMaterial name="flag" size={28} color="black" />;
const XIcon = () => <IconMaterial name="flag-remove" size={28} color="black" />;
const getTimestamp = () => new Date().getTime();
const getSecondsDiff = (t1: number, t2: number) => Math.floor((t1 - t2) / 1000);
const vibrate = (duration: number) => Vibration.vibrate(duration);
const didGameStart = (status: GameStatus) => status === GameStatus.PLAYING;
const didGameEnd = (status: GameStatus) => status === GameStatus.DEFEAT || status === GameStatus.VICTORY;

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

  
  const [startTimestamp, setStartTimestamp] = useState<number>(0);
  const [elapsedTimeSinceLastPlay, setElapsedTimeSinceLastPlay] = useState<number>(0);
  const [emoji, setEmoji] = useState<string>(emojis.idle);
  const [interval, setElapsedInterval] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [frequency, setFrequency] = useState<number>(presetFrequency);
  const [gridConfig, setGridConfig] = useState<GridConfig>(presetGridConfig);
  const [showSlider, setShowSlider] = useState<boolean>(false);
  const resetGrid = () => generateGrid(gridConfig);

  const [state, setState] = useState<GameState>({
    status: GameStatus.IDLE,
    grid: resetGrid(),
    lastPlay: getTimestamp(),
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
    const interval_ = setInterval(() => {
      if (didGameStart(state.status)) {
        const timestamp = getTimestamp();
        const elapsedTimeSinceLastPlay = getSecondsDiff(timestamp, state.lastPlay);
        setElapsedTimeSinceLastPlay(elapsedTimeSinceLastPlay); 
      }
    }, 1000);
    return () => clearInterval(interval_);
  }, [state]);

  useEffect(() => {
    if (state.status === GameStatus.VICTORY) {
      setRemainingBombs(0); // Reset remaining bombs when game is won
    } else {
      const { bombs, flags } = state.grid.reduce((acc, cell) => ({
        bombs: acc.bombs + (cell.isBomb ? 1 : 0),
        flags: acc.flags + (cell.hasFlag ? 1 : 0)
      }), { bombs: 0, flags: 0 });
      setRemainingBombs(Math.max(bombs - flags, 0));
    }
  }, [state]);

  useEffect(() => {
    resetGame();
  }, [gridConfig]);

  useEffect(() => {
    if (showSlider) {
      setEmoji(emojis.slider);
    } else if (state.status === GameStatus.DEFEAT) {
      setEmoji(emojis.defeat);
    } else if (state.status === GameStatus.VICTORY) {
      setEmoji(emojis.victory);
    } else if (elapsedTimeSinceLastPlay >= 5) {
      setEmoji(emojis.waiting);
    } else if (didGameStart(state.status)) {
      setEmoji(emojis.playing);
    } else {
      setEmoji(emojis.idle);
    }

  }, [state, showSlider, elapsedTimeSinceLastPlay]);

  useEffect(() => {
    if (startTimestamp > 0) {
      setElapsedInterval(
        setInterval(() => {
          const timestamp = getTimestamp();
          setElapsedTime(getSecondsDiff(timestamp, startTimestamp));
        }, 1000)
      )
    } else if (startTimestamp === 0) {
      setElapsedTime(0);
      clearElapsedInterval();
    } else if (startTimestamp === -1) {
      clearElapsedInterval();
    }
    return clearInterval(interval)
  }, [startTimestamp]);

  const clearElapsedInterval = () => {
    clearInterval(interval);
    setElapsedInterval(null);
  }

  const endGameState = (state: GameState, status: GameStatus) => {
    setStartTimestamp(-1);
    return {
      ...state,
      status
    }
  };

  const startGameState = (state: GameState, status: GameStatus) => {
    setStartTimestamp(getTimestamp());
    return {
      ...state,
      status,
      lastPlay: getTimestamp(),
    }
  };

  const resetGame = () => {
    if (showSlider) {
      setShowSlider(false);
    }

    const updateState = {
      grid: resetGrid(),
      status: GameStatus.IDLE
    };

    setStartTimestamp(0);
    setElapsedTimeSinceLastPlay(0);
    setShowSlider(false);
    setState({ ...state, ...updateState });
  }

  const toogleFlag = (cell: GridCell) => {
    if (didGameEnd(state.status))
      return;

    vibrate(100);

    let newState = { ...state };
    newState.lastPlay = getTimestamp();

    if (!didGameStart(newState.status))
      newState = startGameState(newState, GameStatus.PLAYING);

    if (!cell.pressed)
      newState.grid[cell.index] = { ...cell, hasFlag: !cell.hasFlag };

    setState({ ...newState });
  };

  const handleCellPress = (cell: GridCell, index: number) => {
    if (didGameEnd(state.status) || cell.hasFlag || showSlider)
      return;
    vibrate(50);

    let newState = { ...state };
    newState.lastPlay = getTimestamp();

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
      newState = endGameState(newState, GameStatus.VICTORY);

    if (updatedCell.isBomb) {
      vibrate(1000);
      openBombs(newState.grid);
      updatedCell.backgroundColor = backgroundColors.openBomb;
      newState = endGameState(newState, GameStatus.DEFEAT);
    };

    if (!didGameStart(newState.status) && !didGameEnd(newState.status))
      newState = startGameState(newState, GameStatus.PLAYING);

    setState(newState);
  };

  const setSliderTrue = () => {
    setShowSlider(true);
  }

  const cellText = (cell: GridCell) => {
    if (didGameEnd(state.status) && cell.hasFlag && !cell.isBomb) return <XIcon />;
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
          {difficulties.map((difficulty, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setFrequency(difficulty.frequency)}
              style={[styles.sliderButton, { backgroundColor: difficulty.backgroundColor }]}
          >
              <Text style={styles.sliderButtonText}>
                {difficulty.text}
              </Text>
            </TouchableOpacity>
          ))}
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
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={setSliderTrue}>
          <Icon name="gear" size={28} color="gray" />
        </TouchableOpacity>
      </View>
      <Text style={styles.timer}>{Math.min(elapsedTime, 999)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {header()}
      {gridView()}
      {didGameEnd(state.status) ? messageBubble(state.status === GameStatus.VICTORY ? "Congratulations..." : "Better luck next time!") : <></>}
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
