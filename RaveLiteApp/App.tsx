/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
// import type {PropsWithChildren} from 'react';
// import {
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   useColorScheme,
//   View,
// } from 'react-native';

// import {
//   Colors,
//   DebugInstructions,
//   Header,
//   LearnMoreLinks,
//   ReloadInstructions,
// } from 'react-native/Libraries/NewAppScreen';

import {NavigationContainer} from '@react-navigation/native';
//import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';

import FireScreen from './src/screens/FireScreen';
import AirScreen from './src/screens/AirScreen';
import HeartScreen from './src/screens/HeartScreen';
import EarthScreen from './src/screens/EarthScreen';
import WaterScreen from './src/screens/WaterScreen';

const BottomTab = createBottomTabNavigator();

function App(): React.ReactNode {
  return (
    <NavigationContainer>
      <BottomTab.Navigator>
        <BottomTab.Screen name="Fire" component={FireScreen} />
        <BottomTab.Screen name="Air" component={AirScreen} />
        <BottomTab.Screen name="Heart" component={HeartScreen} />
        <BottomTab.Screen name="Earth" component={EarthScreen} />
        <BottomTab.Screen name="Water" component={WaterScreen} />
      </BottomTab.Navigator>
    </NavigationContainer>
  );
}

export default App;
