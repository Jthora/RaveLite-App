import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {palette, radius, spacing, type as typeTokens} from '../../theme';

/**
 * Touch-first number entry. Keyboard-free. Three modes:
 *
 *   - `mmss`        : right-shift digit accumulator. Display "MM:SS".
 *                     Caps at 99:59 (5994 s, more than enough for an
 *                     ultra-marathon plank).
 *   - `integer`     : non-negative integer. Caps at 999 by default.
 *   - `decimal-2dp` : non-negative decimal up to 2 fractional digits.
 *                     Used for distance in miles. Caps at 99.99.
 *
 * Layout:
 *   ┌─ display ──────────────────┐
 *   │     21:00                   │
 *   ├──────┬──────┬──────────────┤
 *   │  1   │  2   │  3           │
 *   ├──────┼──────┼──────────────┤
 *   │  4   │  5   │  6           │
 *   ├──────┼──────┼──────────────┤
 *   │  7   │  8   │  9           │
 *   ├──────┼──────┼──────────────┤
 *   │ clr  │  0   │ ⌫            │
 *   └──────┴──────┴──────────────┘
 */

export type NumberPadMode = 'mmss' | 'integer' | 'decimal-2dp';

export interface NumberPadProps {
  mode: NumberPadMode;
  /**
   * Encoded value matching the mode:
   *   mmss        → seconds (integer)
   *   integer     → integer
   *   decimal-2dp → centi-units (e.g. 2.50 → 250). Caller divides by 100.
   *
   * Internally the pad always works on a digit string; this prop is the
   * canonical numeric form. The pad reads it on mount and on each external
   * change.
   */
  value: number;
  onChange: (value: number) => void;
  /** Optional accent color for the display text + key press. */
  accent?: string;
  /** Optional cap (in the same encoding as value). */
  max?: number;
  /** When true, render with smaller display + keys (for use inside dense modals). */
  compact?: boolean;
}

export function NumberPad({mode, value, onChange, accent, max, compact}: NumberPadProps) {
  const accentColor = accent ?? palette.text;

  const digits = encodeToDigits(mode, value);
  const display = formatDigits(mode, digits);

  const push = (d: string) => {
    let next = digits + d;
    // Strip leading zeros for integer / decimal modes.
    if (mode === 'integer') {
      next = next.replace(/^0+/, '') || '0';
    }
    if (mode === 'decimal-2dp') {
      next = next.slice(0, 4); // 4 digits = X.XX (max 99.99)
    }
    if (mode === 'mmss') {
      next = next.slice(-6); // H H M M S S
    }
    if (mode === 'integer') {
      next = next.slice(-3); // up to 3 digits → 999
    }
    const numeric = decodeFromDigits(mode, next);
    if (max !== undefined && numeric > max) return;
    onChange(numeric);
  };

  const back = () => {
    const next = digits.slice(0, -1);
    onChange(decodeFromDigits(mode, next));
  };

  const clear = () => onChange(0);

  return (
    <View style={styles.wrap}>
      <View style={[styles.display, compact && styles.displayCompact]}>
        <Text
          style={[
            styles.displayText,
            compact && styles.displayTextCompact,
            {color: accentColor},
          ]}
          numberOfLines={1}>
          {display}
        </Text>
      </View>
      <View style={styles.grid}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
        ].map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map(d => (
              <Key key={d} label={d} onPress={() => push(d)} compact={compact} />
            ))}
          </View>
        ))}
        <View style={styles.row}>
          <Key label="CLR" onPress={clear} muted compact={compact} />
          <Key label="0" onPress={() => push('0')} compact={compact} />
          <Key label="⌫" onPress={back} muted compact={compact} />
        </View>
      </View>
    </View>
  );
}

function Key({
  label,
  onPress,
  muted,
  compact,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      android_ripple={{color: '#ffffff20'}}
      onPress={onPress}
      style={({pressed}) => [
        styles.key,
        compact && styles.keyCompact,
        muted && styles.keyMuted,
        pressed && styles.keyPressed,
      ]}>
      <Text style={[styles.keyText, muted && styles.keyTextMuted]}>{label}</Text>
    </Pressable>
  );
}

// ─── Encoding helpers ──────────────────────────────────────────────────────

function encodeToDigits(mode: NumberPadMode, value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  switch (mode) {
    case 'mmss': {
      const total = Math.max(0, Math.round(value));
      const hh = Math.min(99, Math.floor(total / 3600));
      const mm = Math.floor((total - hh * 3600) / 60);
      const ss = total - hh * 3600 - mm * 60;
      const padded = `${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}${String(ss).padStart(2, '0')}`;
      // Strip leading zeros so the display starts compact.
      return padded.replace(/^0+/, '');
    }
    case 'integer':
      return String(Math.max(0, Math.round(value)));
    case 'decimal-2dp':
      return String(Math.max(0, Math.round(value)));
  }
}

function decodeFromDigits(mode: NumberPadMode, digits: string): number {
  if (digits === '') return 0;
  switch (mode) {
    case 'mmss': {
      const padded = digits.padStart(6, '0');
      const hh = parseInt(padded.slice(0, 2), 10);
      const mm = Math.min(59, parseInt(padded.slice(2, 4), 10));
      const ss = Math.min(59, parseInt(padded.slice(4, 6), 10));
      return hh * 3600 + mm * 60 + ss;
    }
    case 'integer':
      return parseInt(digits, 10);
    case 'decimal-2dp':
      return parseInt(digits, 10);
  }
}

function formatDigits(mode: NumberPadMode, digits: string): string {
  switch (mode) {
    case 'mmss': {
      const padded = digits.padStart(6, '0');
      const hh = padded.slice(0, 2);
      const mm = padded.slice(2, 4);
      const ss = padded.slice(4, 6);
      // Promote display only as wide as the entered digits warrant.
      if (digits.length > 4) {
        return `${parseInt(hh, 10)}:${mm}:${ss}`;
      }
      return `${mm}:${ss}`;
    }
    case 'integer':
      return digits === '' ? '0' : digits;
    case 'decimal-2dp': {
      const padded = digits.padStart(3, '0');
      const whole = padded.slice(0, padded.length - 2);
      const frac = padded.slice(padded.length - 2);
      return `${parseInt(whole, 10)}.${frac}`;
    }
  }
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
  },
  display: {
    height: 64,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  displayCompact: {
    height: 52,
    marginBottom: spacing.xs,
  },
  displayText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  displayTextCompact: {
    fontSize: 28,
  },
  grid: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  key: {
    flex: 1,
    height: 48,
    backgroundColor: palette.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyCompact: {
    height: 42,
  },
  keyMuted: {
    backgroundColor: '#0A0C12',
  },
  keyPressed: {
    backgroundColor: '#1A2030',
  },
  keyText: {
    ...typeTokens.subtitle,
    color: palette.text,
    fontSize: 18,
  },
  keyTextMuted: {
    color: palette.textDim,
    fontSize: 14,
    letterSpacing: 1,
  },
});
