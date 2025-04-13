import React from 'react';
import IconAnt from "react-native-vector-icons/AntDesign";
import LibSlider from '@react-native-community/slider';
import { TouchableOpacity } from "react-native";
import { View } from "react-native";
import { Text } from "react-native";
import { StyleSheet } from "react-native";


export type Difficulty = {
  frequency: number;
  backgroundColor: string;
  text: string;
}

interface SliderProps {
    currentFrequency: number;
    onMinusPress: () => void;
    onPlusPress: () => void;
    onValueChange: (value: number) => void;
    onCancelPress: () => void;
    onApplyPress: () => void;
    onDifficultyPress: (frequency: number) => void;
    step: number;
    minimumValue: number;
    maximumValue: number;
    difficulties: Difficulty[];
}
  
export const Slider: React.FC<SliderProps> = ({
    currentFrequency,
    onMinusPress,
    onPlusPress,
    onValueChange,
    onCancelPress,
    onApplyPress,
    onDifficultyPress,
    step,
    minimumValue,
    maximumValue,
    difficulties
  }) => (
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
          {(currentFrequency * 100).toFixed(0)}%
        </Text>
        {/* Row container for Slider + Icon */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onMinusPress}>
            <IconAnt
              name="minus"
              size={20}
              color="black"
              style={{ marginLeft: 10, marginBottom: 3 }}
            />
          </TouchableOpacity>
          <LibSlider
            style={{ width: 200, height: 80, padding: 0 }}
            step={step}
            minimumValue={minimumValue}
            maximumValue={maximumValue}
            onValueChange={onValueChange}
            value={currentFrequency}
            minimumTrackTintColor='green'
            maximumTrackTintColor="#000000"

          />
          <TouchableOpacity onPress={onPlusPress}>
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
              onPress={() => onDifficultyPress(difficulty.frequency)}
              style={[styles.sliderButton, { backgroundColor: difficulty.backgroundColor }]}
          >
              <Text style={styles.sliderButtonText}>
                {difficulty.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          onPress={onApplyPress}
          style={[styles.sliderButton, { backgroundColor: '#007AFF' }]}
        >
          <Text style={styles.sliderButtonText}>
            APPLY
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancelPress}
          style={[styles.sliderButton, { backgroundColor: '#FF3B30' }]}
        >
          <Text style={styles.sliderButtonText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

const styles = StyleSheet.create({
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
});