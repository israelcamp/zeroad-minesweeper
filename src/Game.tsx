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
} from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome6";
import IconMaterial from "react-native-vector-icons/MaterialCommunityIcons";
import { useKeepAwake } from '@sayem314/react-native-keep-awake';

import { getScreenSize } from './utils/dimension';
import {
  generateGrid,
  GridCell,
  updateCellsAround,
  checkVictory,
  GridConfig,
  getGridConfig,
  openBombs,
  backgroundColors
} from './utils/array';
import { Slider, Difficulty } from './components/slider';
import { Header } from './components/header';
import { MessageBubble } from './components/messageBubble';
import { GameStorage } from './utils/storage';

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

function Game({ navigation }: { navigation: any }): React.JSX.Element {
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
      const initialFrequency = await GameStorage.getFrequency();
      if (initialFrequency) {
        setFrequency(initialFrequency);
        setGridConfig({ ...gridConfig, frequency: initialFrequency });
      } else {
        GameStorage.setFrequency(presetFrequency);
      }
    }
    fetchInitialFrequency();
  }, []);

  useEffect(() => {
    GameStorage.setFrequency(frequency);
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
    } else if (elapsedTimeSinceLastPlay >= 10) {
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

    // Save game record if game ended in victory
    if (status === GameStatus.VICTORY) {
      const elapsedTime = getSecondsDiff(getTimestamp(), startTimestamp);
      const bombsFound = state.grid.filter(cell => cell.isBomb).length;

      GameStorage.saveGame({
        timestamp: getTimestamp(),
        bombs: bombsFound,
        difficulty: frequency,
        time: elapsedTime
      });
    }

    setStartTimestamp(-1);

    return {
      ...state,
      status
    }
  };

  const startGameState = (state: GameState, status: GameStatus) => {
    const timestamp = getTimestamp();
    setStartTimestamp(timestamp);
    return {
      ...state,
      status,
      lastPlay: timestamp,
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

    if (cell.isBomb) {
      vibrate(1000);
      openBombs(state.grid);
      cell.backgroundColor = backgroundColors.openBomb;
      const newState = endGameState(state, GameStatus.DEFEAT);
      setState(newState);
      return;
    }

    let newState = { ...state };
    const newGrid = newState.grid;

    updateCellsAround(index, newGrid, gridConfig.rows, gridConfig.columns);

    const victory = checkVictory(newGrid);
    if (victory)
      newState = endGameState(newState, GameStatus.VICTORY);

    if (!didGameStart(newState.status) && !didGameEnd(newState.status))
      newState = startGameState(newState, GameStatus.PLAYING);

    newState.lastPlay = getTimestamp();
    setState(newState);
  };

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

  const messageBubble = () => {
    const message = state.status === GameStatus.VICTORY ? "Congratulations..." : "Better luck next time!";
    return <MessageBubble message={message} />
  }

  const slider = () => (
    <Slider
      currentFrequency={frequency}
      onMinusPress={() => setFrequency(prevFrequency => Math.max(prevFrequency - 0.01, 0.1))}
      onPlusPress={() => setFrequency(prevFrequency => Math.min(prevFrequency + 0.01, 0.3))}
      onValueChange={(value) => setFrequency(value)}
      onCancelPress={() => setShowSlider(false)}
      onApplyPress={() => setGridConfig({ ...gridConfig, frequency })}
      onDifficultyPress={setFrequency}
      step={0.01}
      minimumValue={0.1}
      maximumValue={0.3}
      difficulties={difficulties}
    />
  );

  return (
    <View style={styles.container}>
      <Header
        headerHeight={headerHeight}
        remainingBombs={remainingBombs}
        elapsedTime={elapsedTime}
        emoji={emoji}
        onStatPress={() => navigation.navigate('Stats')}
        onEmojiPress={() => showSlider ? noop() : resetGame()}
        onGearPress={() => setShowSlider(true)}
      />
      {gridView()}
      {didGameEnd(state.status) ? messageBubble() : <></>}
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
  }
});

export default Game;
