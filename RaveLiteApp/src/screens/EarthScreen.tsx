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

const EarthScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Earth Screen</Text>
    </View>
  );
};

export default EarthScreen;
