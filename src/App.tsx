import React from "react";
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Game from "./Game";
import Stats from "./Stats";

const Stack = createNativeStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  return (
    <SafeAreaProvider>
      <StatusBar translucent backgroundColor="transparent" barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="Game"
          screenOptions={{
            headerShown: false
          }}
        >
          <Stack.Screen name="Game" component={Game} />
          <Stack.Screen name="Stats" component={Stats} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
