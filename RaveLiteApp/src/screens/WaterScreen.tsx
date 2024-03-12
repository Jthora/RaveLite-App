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

const WaterScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Water Screen</Text>
    </View>
  );
};

export default WaterScreen;
