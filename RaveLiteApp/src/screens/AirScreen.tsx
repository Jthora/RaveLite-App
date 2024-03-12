import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
  },
});

const AirScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Air Screen</Text>
    </View>
  );
};

export default AirScreen;
