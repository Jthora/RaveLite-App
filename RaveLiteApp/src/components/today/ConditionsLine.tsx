import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MapPin, Sunrise, Sunset} from 'lucide-react-native';

import {Tap} from '../Tap';
import {clockHM, formatTemp} from '../../domain/conditions/format';
import type {WeatherLine} from '../../domain/conditions/weather';
import {palette, spacing, type as t} from '../../theme';

/** A TalkBack shortcut to somewhere at the bottom of Today. */
export interface QuickAction {
  name: string;
  label: string;
  run: () => void;
}

interface Props {
  weather?: WeatherLine;
  onPress: () => void;
  /**
   * TalkBack actions on the first thing on Today, so Settings, Practice
   * and logging are not reachable only after every row of the day.
   */
  quickActions?: readonly QuickAction[];
}

/**
 * Under the status line: the next sunrise or sunset and, with a forecast,
 * the temperature, rain chance and bug estimate for this hour. Before a
 * place is set it asks for one. Tap for the Weather sheet.
 */
export function ConditionsLine({weather, onPress, quickActions = []}: Props) {
  const a11y = {
    accessibilityActions: quickActions.map(a => ({
      name: a.name,
      label: a.label,
    })),
    onAccessibilityAction: (e: {nativeEvent: {actionName: string}}) =>
      quickActions.find(a => a.name === e.nativeEvent.actionName)?.run(),
  };
  if (!weather) {
    return (
      <Tap
        {...a11y}
        testID="conditions-open"
        variant="plain"
        color={palette.textDim}
        onPress={onPress}
        accessibilityRole="button"
        style={styles.line}>
        <View style={styles.row}>
          <MapPin size={14} color={palette.textDim} strokeWidth={2} />
          <Text
            style={styles.text}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}>
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
    // Without a forecast for this hour, rain, storm and heat checks are
    // off too: say so, instead of the weather quietly going missing.
    c.known
      ? undefined
      : weather.hadForecast
      ? 'forecast out of date'
      : 'no forecast yet',
  ].filter((part): part is string => part !== undefined);
  return (
    <Tap
      {...a11y}
      testID="conditions-open"
      variant="plain"
      color={palette.textDim}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Weather: ${parts.join(', ')}`}
      style={styles.line}>
      <View style={styles.row}>
        <SunIcon size={14} color={palette.textDim} strokeWidth={2} />
        <Text
          testID="conditions-text"
          style={styles.text}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {parts.join(' · ')}
        </Text>
        <Text style={styles.text}>›</Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  line: {
    minHeight: 22,
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
