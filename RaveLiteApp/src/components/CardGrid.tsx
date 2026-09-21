import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useLayout} from '../hooks/useLayout';
import {spacing} from '../theme';

interface Props {
  children: React.ReactNode;
}

/**
 * Responsive grid for ExerciseRow lists.
 *
 *   compact   → 1 column (phones)
 *   medium    → 2 columns (small tablets, phones-landscape)
 *   expanded  → 3 columns (Galaxy Tab A7 landscape)
 *
 * Uses simple CSS-style row/col flex split — no third-party grid lib.
 * Children are evenly distributed across columns in source order.
 */
export const CardGrid: React.FC<Props> = ({children}) => {
  const {columns} = useLayout();
  const items = React.Children.toArray(children);

  if (columns === 1) {
    return <>{children}</>;
  }

  // Distribute round-robin across N columns so each column has near-equal length.
  const cols: React.ReactNode[][] = Array.from({length: columns}, () => []);
  items.forEach((item, i) => cols[i % columns].push(item));

  return (
    <View style={styles.row}>
      {cols.map((col, i) => (
        <View
          key={i}
          style={[styles.col, i < columns - 1 && {marginRight: spacing.md}]}>
          {col}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'flex-start'},
  col: {flex: 1},
});
