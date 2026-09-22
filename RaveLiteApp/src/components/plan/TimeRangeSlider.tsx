/**
 * TimeRangeSlider — dual-thumb 24h slider with 15-minute snap.
 *
 * Pure RN (no extra deps). Touch tracking via PanResponder on each
 * thumb; drag deltas in pixels are converted to minutes against the
 * measured track width and snapped to a 15-minute grid.
 *
 * Values are emitted as "HH:mm" strings (the same format CadenceSlot
 * windows already store) on each snap-step so the parent draft updates
 * smoothly rather than only at touchEnd.
 */
import React, {useRef, useState, useCallback} from 'react';
import {
  PanResponder,
  type LayoutChangeEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {palette, spacing} from '../../theme';

interface Props {
  /** "HH:mm" — must be < end. */
  start: string;
  /** "HH:mm" — must be > start. */
  end: string;
  /** Fires on every snap-step during drag. */
  onChange: (start: string, end: string) => void;
  /** Element accent for the active range. */
  accent: string;
}

const TOTAL_MIN = 24 * 60;
const SNAP_MIN = 15;
const MIN_SEPARATION = SNAP_MIN; // ≥ 15 min between thumbs.
const THUMB = 28;
const TRACK_H = 6;

export function TimeRangeSlider({start, end, onChange, accent}: Props) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  // Live drag values held in refs so PanResponder closures see latest.
  const startMinRef = useRef(parseHM(start));
  const endMinRef = useRef(parseHM(end));
  startMinRef.current = parseHM(start);
  endMinRef.current = parseHM(end);

  // Drag origin captured at touch start.
  const dragOriginRef = useRef(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    widthRef.current = w;
    setWidth(w);
  }, []);

  const minToPx = useCallback(
    (m: number) =>
      widthRef.current === 0 ? 0 : (m / TOTAL_MIN) * widthRef.current,
    [],
  );

  const pxToMin = useCallback(
    (px: number) =>
      widthRef.current === 0 ? 0 : (px / widthRef.current) * TOTAL_MIN,
    [],
  );

  const snap = (m: number) => Math.round(m / SNAP_MIN) * SNAP_MIN;

  const startResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragOriginRef.current = startMinRef.current;
      },
      onPanResponderMove: (_, g) => {
        const deltaMin = pxToMin(g.dx);
        const raw = dragOriginRef.current + deltaMin;
        const snapped = clamp(snap(raw), 0, endMinRef.current - MIN_SEPARATION);
        if (snapped !== startMinRef.current) {
          startMinRef.current = snapped;
          onChange(toHM(snapped), toHM(endMinRef.current));
        }
      },
    }),
  ).current;

  const endResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragOriginRef.current = endMinRef.current;
      },
      onPanResponderMove: (_, g) => {
        const deltaMin = pxToMin(g.dx);
        const raw = dragOriginRef.current + deltaMin;
        const snapped = clamp(
          snap(raw),
          startMinRef.current + MIN_SEPARATION,
          TOTAL_MIN,
        );
        if (snapped !== endMinRef.current) {
          endMinRef.current = snapped;
          onChange(toHM(startMinRef.current), toHM(snapped));
        }
      },
    }),
  ).current;

  const startPx = minToPx(startMinRef.current);
  const endPx = minToPx(endMinRef.current);

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, {color: accent}]}>
          {toHM(startMinRef.current)}
        </Text>
        <Text style={[styles.label, {color: palette.textDim}]}>
          {durationLabel(endMinRef.current - startMinRef.current)}
        </Text>
        <Text style={[styles.label, {color: accent}]}>
          {toHM(endMinRef.current)}
        </Text>
      </View>

      <View style={styles.trackOuter} onLayout={onLayout}>
        {/* Background track */}
        <View style={[styles.track, {backgroundColor: palette.border}]} />

        {/* Active range fill */}
        {width > 0 && (
          <View
            style={[
              styles.track,
              styles.fill,
              {
                backgroundColor: accent,
                left: startPx,
                width: Math.max(0, endPx - startPx),
              },
            ]}
          />
        )}

        {/* Hour ticks at 6/12/18 */}
        {width > 0 &&
          [6, 12, 18].map(h => (
            <View key={h} style={[styles.tick, {left: minToPx(h * 60)}]} />
          ))}

        {/* Start thumb */}
        {width > 0 && (
          <View
            {...startResponder.panHandlers}
            style={[
              styles.thumb,
              {left: startPx - THUMB / 2, borderColor: accent},
            ]}>
            <View style={[styles.thumbInner, {backgroundColor: accent}]} />
          </View>
        )}

        {/* End thumb */}
        {width > 0 && (
          <View
            {...endResponder.panHandlers}
            style={[
              styles.thumb,
              {left: endPx - THUMB / 2, borderColor: accent},
            ]}>
            <View style={[styles.thumbInner, {backgroundColor: accent}]} />
          </View>
        )}
      </View>

      <View style={styles.scaleRow}>
        {['0', '6', '12', '18', '24'].map(h => (
          <Text key={h} style={styles.scaleLabel}>
            {h}
          </Text>
        ))}
      </View>
    </View>
  );
}

function parseHM(hm: string): number {
  const [h, m] = hm.split(':').map(n => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

function toHM(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${pad(h)}:${pad(min)}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function durationLabel(min: number): string {
  if (min <= 0) {
    return '—';
  }
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) {
    return `${m}m`;
  }
  if (m === 0) {
    return `${h}h`;
  }
  return `${h}h ${m}m`;
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    fontVariant: ['tabular-nums'],
  },
  trackOuter: {
    height: THUMB + 4,
    justifyContent: 'center',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
  },
  fill: {
    right: undefined,
  },
  tick: {
    position: 'absolute',
    width: 1,
    height: 12,
    backgroundColor: palette.textMuted,
    top: (THUMB + 4 - 12) / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: palette.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingHorizontal: 0,
  },
  scaleLabel: {
    color: palette.textFaint,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
});
