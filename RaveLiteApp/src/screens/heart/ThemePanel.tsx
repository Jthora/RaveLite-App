/**
 * ThemePanel — variant picker for the central conductor element.
 *
 * Renders one card per HEART_VARIANTS entry. Tapping a card persists the
 * choice and re-applies the live ELEMENTS.heart skin (App.tsx subscribes
 * and re-keys the shell, so every screen redraws with the new colors,
 * glyph, and verb).
 *
 * The variant ID stays internal — sub-tab slugs, plan storage, journal
 * entries all continue to use `'heart'`. This is purely a presentation
 * skin.
 */
import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {ELEMENTS} from '../../theme/elements';
import {
  HEART_VARIANTS,
  getHeartVariant,
  setHeartVariant,
  type HeartVariantId,
} from '../../theme/heartVariants';
import {palette, radius, spacing, type as t} from '../../theme';

export function ThemePanel(): React.JSX.Element {
  const [active, setActive] = useState<HeartVariantId>(() => getHeartVariant());

  const choose = (id: HeartVariantId) => {
    if (id === active) {
      return;
    }
    setActive(id);
    setHeartVariant(id);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Conductor Theme</Text>
        <Text style={styles.subtitle}>
          The central element’s identity. Choose how the hub presents itself.
        </Text>
      </View>

      <View style={styles.grid}>
        {(Object.keys(HEART_VARIANTS) as HeartVariantId[]).map(id => {
          const v = HEART_VARIANTS[id];
          const sel = id === active;
          return (
            <Pressable
              key={id}
              onPress={() => choose(id)}
              accessibilityRole="radio"
              accessibilityState={{selected: sel}}
              accessibilityLabel={v.identity.name}
              style={({pressed}) => [
                styles.card,
                {
                  backgroundColor: v.identity.tint,
                  borderColor: sel ? v.identity.color : palette.border,
                  borderWidth: sel ? 2 : 1,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              {/* Lit edge along the top — same affordance as element hero cards. */}
              <View
                pointerEvents="none"
                style={[styles.cardEdge, {backgroundColor: v.identity.color}]}
              />

              <View style={styles.cardRow}>
                <View
                  style={[
                    styles.glyphWell,
                    {backgroundColor: v.identity.deep},
                  ]}>
                  <Text style={[styles.glyph, {color: v.identity.color}]}>
                    {v.identity.glyph}
                  </Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardName, {color: v.identity.color}]}>
                    {v.identity.name}
                  </Text>
                  <Text style={styles.cardDomain}>{v.identity.domain}</Text>
                </View>
                {sel && (
                  <View
                    style={[
                      styles.selDot,
                      {backgroundColor: v.identity.color},
                    ]}
                  />
                )}
              </View>

              <Text style={styles.cardDesc}>{v.description}</Text>

              <View style={styles.swatchRow}>
                <Swatch label="primary" color={v.identity.color} />
                <Swatch label="deep" color={v.identity.deep} />
                <Swatch label="accent" color={v.identity.accent} />
                <Text style={[styles.verb, {color: v.identity.accent}]}>
                  {v.identity.verbDone.toUpperCase()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.footnote}>
        Live preview: the rail glyph, sub-tab accents, and{' '}
        <Text style={{color: ELEMENTS.heart.color}}>
          {ELEMENTS.heart.name.toLowerCase()}
        </Text>{' '}
        haptics update immediately.
      </Text>
    </View>
  );
}

function Swatch({label, color}: {label: string; color: string}) {
  return (
    <View style={styles.swatch}>
      <View style={[styles.swatchDot, {backgroundColor: color}]} />
      <Text style={styles.swatchLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {gap: spacing.xs},
  title: {...t.title, color: palette.text},
  subtitle: {...t.body, color: palette.textDim, lineHeight: 20},
  grid: {gap: spacing.md},
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.md,
  },
  cardEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    opacity: 0.7,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  glyphWell: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {fontSize: 32, lineHeight: 40},
  cardText: {flex: 1, gap: 2},
  cardName: {...t.title, letterSpacing: -0.5},
  cardDomain: {
    ...t.caption,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  selDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cardDesc: {
    ...t.body,
    color: palette.text,
    opacity: 0.9,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  swatch: {flexDirection: 'row', alignItems: 'center', gap: spacing.xs},
  swatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  swatchLabel: {
    ...t.caption,
    color: palette.textDim,
  },
  verb: {
    marginLeft: 'auto',
    ...t.caption,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  footnote: {
    ...t.caption,
    color: palette.textMuted,
    fontStyle: 'italic',
  },
});
