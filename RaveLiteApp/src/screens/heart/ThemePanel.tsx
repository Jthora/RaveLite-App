/**
 * ThemePanel — how Core presents itself: a mark (Core, Heart, Æther, Star
 * or Starcom) and a color (orange, magenta, violet, cyan or white).
 *
 * Both preview here as you tap. The rest of the app redraws once, when
 * this panel closes with Settings (App.tsx re-keys the shell on
 * `flushHeartTheme`). Storage keeps using `'heart'`: the theme is
 * presentation only.
 */
import React, {useEffect, useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {ElementGlyph} from '../../components/icons/ElementGlyph';
import {ELEMENTS} from '../../theme/elements';
import {
  HEART_COLORS,
  HEART_COLOR_ORDER,
  HEART_VARIANTS,
  HEART_VARIANT_ORDER,
  flushHeartTheme,
  getHeartColor,
  getHeartVariant,
  setHeartColor,
  setHeartVariant,
  type HeartColorId,
  type HeartVariantId,
} from '../../theme/heartVariants';
import {palette, radius, spacing, type as t} from '../../theme';

export function ThemePanel(): React.JSX.Element {
  const [variant, setVariant] = useState<HeartVariantId>(() =>
    getHeartVariant(),
  );
  const [colorId, setColorId] = useState<HeartColorId>(() => getHeartColor());
  const accent = ELEMENTS.heart.accent;
  const color = HEART_COLORS[colorId];

  // Redraw the app with the new look once Settings closes.
  useEffect(() => () => flushHeartTheme(), []);

  const chooseVariant = (id: HeartVariantId) => {
    if (id === variant) {
      return;
    }
    setHeartVariant(id);
    setVariant(id);
    // Without a chosen color, the mark brings its own.
    setColorId(getHeartColor());
  };

  const chooseColor = (id: HeartColorId) => {
    if (id === colorId) {
      return;
    }
    setHeartColor(id);
    setColorId(id);
  };

  return (
    <View style={styles.container}>
      <Text
        accessibilityRole="header"
        style={[styles.eyebrow, {color: accent}]}>
        ▸ THEME
      </Text>
      <Text style={styles.description}>
        The mark and colour RaveLite uses everywhere. Nothing else changes.
      </Text>
      <View style={styles.row}>
        {HEART_VARIANT_ORDER.map(id => {
          const v = HEART_VARIANTS[id];
          const selected = id === variant;
          return (
            <Pressable
              key={id}
              testID={`theme-${id}`}
              onPress={() => chooseVariant(id)}
              accessibilityRole="radio"
              accessibilityState={{selected}}
              accessibilityLabel={v.identity.name}
              style={({pressed}) => [
                styles.tile,
                {
                  borderColor: selected ? color.color : palette.border,
                  backgroundColor: selected ? color.tint : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <ElementGlyph
                element={{...v.identity, color: color.color}}
                size={26}
              />
              <Text
                style={[
                  styles.name,
                  {color: selected ? color.color : palette.textDim},
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}>
                {v.identity.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.row}>
        {HEART_COLOR_ORDER.map(id => {
          const c = HEART_COLORS[id];
          const selected = id === colorId;
          return (
            <Pressable
              key={id}
              testID={`color-${id}`}
              onPress={() => chooseColor(id)}
              accessibilityRole="radio"
              accessibilityState={{selected}}
              accessibilityLabel={c.name}
              style={({pressed}) => [
                styles.swatchTap,
                {opacity: pressed ? 0.8 : 1},
              ]}>
              <View
                style={[
                  styles.ring,
                  {borderColor: selected ? c.color : 'transparent'},
                ]}>
                <View style={[styles.swatch, {backgroundColor: c.color}]} />
              </View>
              <Text
                style={[
                  styles.name,
                  {color: selected ? c.color : palette.textDim},
                ]}
                numberOfLines={1}>
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.description}>
        {HEART_VARIANTS[variant].description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  eyebrow: {
    ...t.caption,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tile: {
    flex: 1,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 2,
  },
  name: {
    ...t.caption,
    fontSize: 11,
    letterSpacing: 0,
  },
  swatchTap: {
    flex: 1,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ring: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  description: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
});
