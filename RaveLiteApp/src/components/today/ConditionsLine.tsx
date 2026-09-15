import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MapPin, Sunrise, Sunset} from 'lucide-react-native';

import {Tap} from '../Tap';
import {clockHM, formatTemp} from '../../domain/conditions/format';
import type {WeatherLine} from '../../domain/conditions/weather';
import {palette, spacing, type as t} from '../../theme';

interface Props {
  weather?: WeatherLine;
  onPress: () => void;
}

/**
 * Under the status line: the next sunrise or sunset and, with a forecast,
 * the temperature, rain chance and bug estimate for this hour. Before a
 * place is set it asks for one. Tap for the Weather sheet.
 */
export function ConditionsLine({weather, onPress}: Props) {
  if (!weather) {
    return (
      <Tap
        testID="conditions-open"
        variant="plain"
        color={palette.textDim}
        onPress={onPress}
        accessibilityRole="button"
        style={styles.line}>
        <View style={styles.row}>
          <MapPin size={14} color={palette.textDim} strokeWidth={2} />
          <Text style={styles.text}>
            Set your place for sunrise and weather ›
          </Text>
        </View>
      </Tap>
    );
  }
  const {next, conditions: c, units} = weather;
  const SunIcon = next?.kind === 'sunset' ? Sunset : Sunrise;
  const parts = [
    next
      ? `${next.kind === 'sunset' ? 'Sunset' : 'Sunrise'} ${clockHM(next.at)}`
      : undefined,
    c.known && c.tempC !== undefined ? formatTemp(c.tempC, units) : undefined,
    c.known ? `rain ${c.rainChance ?? 0}%` : undefined,
    c.known || c.bugs === 'high' ? `bugs ${c.bugs}` : undefined,
  ].filter((part): part is string => part !== undefined);
  return (
    <Tap
      testID="conditions-open"
      variant="plain"
      color={palette.textDim}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Weather: ${parts.join(', ')}`}
      style={styles.line}>
      <View style={styles.row}>
        <SunIcon size={14} color={palette.textDim} strokeWidth={2} />
        <Text testID="conditions-text" style={styles.text} numberOfLines={1}>
          {parts.join(' · ')}
        </Text>
        <Text style={styles.text}>›</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  line: {
    minHeight: 44,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    ...t.caption,
    fontSize: 13,
    color: palette.textDim,
    flexShrink: 1,
  },
});
