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

const HeartScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Heart Screen</Text>
    </View>
  );
};

export default HeartScreen;
