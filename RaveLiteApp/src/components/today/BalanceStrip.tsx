import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {ElementGlyph} from '../icons/ElementGlyph';
import {Tap} from '../Tap';
import {dailyPar} from '../../domain/profile/repository';
import {ELEMENTS, ELEMENT_ORDER, type ElementId} from '../../theme/elements';
import {palette, radius, spacing} from '../../theme';

interface Props {
  /** Effort points per element today. */
  points: Record<ElementId, number>;
  par?: number;
  /** Per element, points for each of the last 7 days (today last). */
  week?: Record<ElementId, readonly number[]>;
  onElementPress?: (id: ElementId) => void;
  /** Each tile's name under it: for somebody new, who has not learnt the marks. */
  showNames?: boolean;
}

/**
 * Today's balance, and the way to each element's page: each element's
 * effort points with a bar filling toward par, and a dot for each of the
 * last seven days — solid on days it reached par, faint on days it got
 * something. A partner drill or a glass of water counts toward its own
 * element, so Fire work lifts the others too. Five tiles and nothing else,
 * so the row stays balanced.
 */
function BalanceStripInner({
  points,
  par = dailyPar(),
  week,
  onElementPress,
  showNames = false,
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
            accessibilityLabel={`${el.name}: ${n} of ${par} points today; reached the goal on ${parDays} of the last 7 days. Open`}
            style={[styles.cell, lit && {borderColor: el.color}]}>
            {/* Tap's inner view stretches its children; center the mark. */}
            <View style={styles.mark}>
              <ElementGlyph
                element={el}
                size={20}
                color={lit ? el.color : palette.textMuted}
                style={styles.glyph}
              />
            </View>
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
            {showNames ? (
              <Text
                style={[styles.name, lit && {color: el.color}]}
                numberOfLines={1}>
                {el.name}
              </Text>
            ) : null}
          </Tap>
        );
      })}
    </View>
  );
}

/** Memoised for the same reason as the day list: five cells of glyphs and
 *  dots that a sheet opening cannot change. */
export const BalanceStrip = React.memo(BalanceStripInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  mark: {
    alignSelf: 'center',
    height: 24,
    justifyContent: 'center',
  },
  count: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.text,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  countIdle: {
    color: palette.textFaint,
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
  name: {
    fontSize: 11,
    color: palette.textDim,
    textAlign: 'center',
    marginTop: 3,
  },
});
