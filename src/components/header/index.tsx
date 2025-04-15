import React from 'react';
import { TouchableOpacity } from "react-native";
import { View } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome6";
import IconMaterial from "react-native-vector-icons/MaterialIcons";
import { Text } from "react-native";
import { StyleSheet } from "react-native";

interface HeaderProps {
    headerHeight: number;
    remainingBombs: number | null;
    emoji: string;
    elapsedTime: number;
    onEmojiPress: () => void;
    onGearPress: () => void;
    onStatPress: () => void;
}
  
export const Header: React.FC<HeaderProps> = ({
    headerHeight,
    remainingBombs,
    emoji,
    elapsedTime,
    onEmojiPress,
    onGearPress,
    onStatPress
  }) => (
    <View style={[styles.header, { height: headerHeight }]}>
      <Text style={styles.timer}>{remainingBombs}</Text>
      <View style={styles.emojiButton}>
        <TouchableOpacity onPress={onStatPress}>
          <IconMaterial name="query-stats" size={28} color="#2ECC71" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onEmojiPress}>
          <Text style={styles.emoji}>{emoji}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onGearPress}>
          <Icon name="gear" size={28} color="gray" />
        </TouchableOpacity>
      </View>
      <Text style={styles.timer}>{Math.min(elapsedTime, 999)}</Text>
    </View>
  );

const styles = StyleSheet.create({
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
        marginLeft: 0,
        gap: 30,
        justifyContent: "center", // Centers the emoji vertically
        alignItems: "center", // Centers the emoji horizontally
    },
    emoji: {
        fontSize: 34,
    }
});