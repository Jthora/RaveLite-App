import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Settings} from 'lucide-react-native';

import {ElementGlyph} from '../icons/ElementGlyph';
import {Tap} from '../Tap';
import {DAILY_PAR} from '../../domain/activity/par';
import {ELEMENTS, ELEMENT_ORDER, type ElementId} from '../../theme/elements';
import {palette, radius, spacing} from '../../theme';

interface Props {
  /** Effort points per element today. */
  points: Record<ElementId, number>;
  par?: number;
  /** Per element, points for each of the last 7 days (today last). */
  week?: Record<ElementId, readonly number[]>;
  onElementPress?: (id: ElementId) => void;
  /** The gear at the end of the strip. */
  onSettingsPress?: () => void;
  /** Something in Settings needs attention (notifications off, a warning). */
  settingsAlert?: boolean;
}

/**
 * Today's balance, and the way around the app: each element's effort
 * points with a bar filling toward par, and a dot for each of the last
 * seven days — solid on days it reached par, faint on days it got
 * something. A partner drill or a glass of water counts toward its own
 * element, so Fire work lifts the others too. Tap an element for its page;
 * the gear at the end opens Settings.
 */
export function BalanceStrip({
  points,
  par = DAILY_PAR,
  week,
  onElementPress,
  onSettingsPress,
  settingsAlert = false,
}: Props) {
  return (
    <View style={styles.row}>
      {ELEMENT_ORDER.map(id => {
        const el = ELEMENTS[id];
        const n = points[id] ?? 0;
        const lit = n > 0;
        const atPar = n >= par;
        const days = week?.[id] ?? [];
        const parDays = days.filter(p => p >= par).length;
        return (
          <Tap
            key={id}
            testID={`strip-${id}`}
            variant="plain"
            color={el.color}
            onPress={() => onElementPress?.(id)}
            accessibilityRole="button"
            accessibilityLabel={`${el.name}: ${n} of ${par} points today; par on ${parDays} of the last 7 days. Open`}
            style={[styles.cell, lit && {borderColor: el.color}]}>
            <ElementGlyph
              element={el}
              size={20}
              color={lit ? el.color : palette.textMuted}
              style={styles.glyph}
            />
            <Text
              style={[
                styles.count,
                !lit && styles.countIdle,
                atPar && {color: el.color},
              ]}>
              {n}
            </Text>
            <View style={styles.bar}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.min(1, n / par) * 100}%`,
                    backgroundColor: el.color,
                  },
                ]}
              />
            </View>
            {days.length > 0 ? (
              <View style={styles.dots}>
                {days.map((p, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          p >= par
                            ? el.color
                            : p > 0
                            ? `${el.color}59`
                            : palette.border,
                      },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </Tap>
        );
      })}
      {onSettingsPress ? (
        <Tap
          testID="settings-open"
          variant="plain"
          color={palette.textDim}
          onPress={onSettingsPress}
          accessibilityRole="button"
          accessibilityLabel={
            settingsAlert ? 'Settings, something needs attention' : 'Settings'
          }
          style={styles.gear}>
          <Settings size={20} color={palette.textDim} strokeWidth={2} />
          {settingsAlert ? <View style={styles.alert} /> : null}
        </Tap>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm - 2,
  },
  cell: {
    flex: 1,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  glyph: {
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  count: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  countIdle: {
    color: palette.textMuted,
  },
  // Tap wraps the cell in a view sized to its widest child: the dots row.
  bar: {
    alignSelf: 'stretch',
    height: 3,
    borderRadius: 2,
    marginTop: 3,
    overflow: 'hidden',
    backgroundColor: palette.border,
  },
  fill: {
    height: 3,
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  gear: {
    width: 40,
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
  },
  alert: {
    position: 'absolute',
    top: -3,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD60A',
  },
});
