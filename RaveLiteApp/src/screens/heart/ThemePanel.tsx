/**
 * ThemePanel — how Core presents itself: Core, Heart, Æther, Star or
 * Commander, in one row of tiles.
 *
 * Tapping a tile persists the choice and re-applies the live
 * ELEMENTS.heart skin (App.tsx subscribes and re-keys the shell, so every
 * screen redraws with the new name, colors and glyph). Storage keeps using
 * `'heart'`: the theme is presentation only.
 */
import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {ElementGlyph} from '../../components/icons/ElementGlyph';
import {ELEMENTS} from '../../theme/elements';
import {
  HEART_VARIANTS,
  HEART_VARIANT_ORDER,
  getHeartVariant,
  setHeartVariant,
  type HeartVariantId,
} from '../../theme/heartVariants';
import {palette, radius, spacing, type as t} from '../../theme';

export function ThemePanel(): React.JSX.Element {
  const [active, setActive] = useState<HeartVariantId>(() => getHeartVariant());
  const accent = ELEMENTS.heart.accent;

  const choose = (id: HeartVariantId) => {
    if (id === active) {
      return;
    }
    setActive(id);
    setHeartVariant(id);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.eyebrow, {color: accent}]}>▸ THEME</Text>
      <View style={styles.row}>
        {HEART_VARIANT_ORDER.map(id => {
          const v = HEART_VARIANTS[id];
          const selected = id === active;
          return (
            <Pressable
              key={id}
              testID={`theme-${id}`}
              onPress={() => choose(id)}
              accessibilityRole="radio"
              accessibilityState={{selected}}
              accessibilityLabel={v.identity.name}
              style={({pressed}) => [
                styles.tile,
                {
                  borderColor: selected ? v.identity.color : palette.border,
                  backgroundColor: selected ? v.identity.tint : 'transparent',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <ElementGlyph element={v.identity} size={26} />
              <Text
                style={[
                  styles.name,
                  {color: selected ? v.identity.color : palette.textDim},
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
      <Text style={styles.description}>
        {HEART_VARIANTS[active].description}
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
  description: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
});
