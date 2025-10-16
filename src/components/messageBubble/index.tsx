import React from 'react';
import { View } from "react-native";
import { Text } from "react-native";
import { StyleSheet } from "react-native";

interface MessageBubbleProps {
    message: string;
}
  
export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
  }) => (
    <View style={styles.messageBubbleContainer}>
      <View style={styles.messageBubbleTriangle} />
      <View style={styles.messageBubbleText}>
        <Text style={{ textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    </View >
  );

const styles = StyleSheet.create({
    messageBubbleContainer: {
        alignItems: 'center',
        position: 'absolute',
        top: 68,
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
