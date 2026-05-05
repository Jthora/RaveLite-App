import React from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {ELEMENTS, ElementId} from '../theme/elements';
import {palette} from '../theme';
import {usePulse} from '../hooks/usePulse';

interface Props {
  /** Today's completion count, keyed by element. */
  counts: Record<ElementId, number>;
  /** How many completions per petal = "full bloom". */
  goalPerPetal?: number;
  /** Diameter in pt. */
  size?: number;
}

/**
 * The mandala — RaveLite's primary stat surface (v2).
 *
 * Visual layers (back → front):
 *   1. Outer chalk-ring     — faint white, the circle that holds
 *                              the four classical elements.
 *   2. Cardinal tick marks  — short bars sitting on the ring at each
 *                              petal anchor; reads as a compass /
 *                              ritual diagram, not a chart.
 *   3. Per-petal halo       — diffuse element-color disc that brightens
 *                              with fill (only renders when fill > 0).
 *   4. Petal disc           — outline-when-empty, saturated-when-full.
 *   5. Petal glyph + count  — element symbol + today's count.
 *   6. Ritual seal         — when ALL five elements have ≥1 completion
 *                              today, faint chartreuse legs connect
 *                              the petals through the centre.
 *   7. Heart at centre      — pulsing magenta with chartreuse ring.
 *
 * Pure View geometry — no react-native-svg.
 */
export const Mandala: React.FC<Props> = ({
  counts,
  goalPerPetal = 6,
  size = 220,
}) => {
  const heartPulse = usePulse(60);
  const heartScale = heartPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });
  // Floor at 0.18 so the glow genuinely recedes between beats (breath out)
  // and crests visibly at 0.62 (beat). The disc behind provides base presence.
  const heartGlow = heartPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.62],
  });

  const cx = size / 2;
  const cy = size / 2;
  const ringR = size * 0.34;
  const petalSize = size * 0.24;
  const heartSize = size * 0.30;

  const petals: {id: ElementId; angleDeg: number}[] = [
    {id: 'air', angleDeg: 270},
    {id: 'fire', angleDeg: 0},
    {id: 'earth', angleDeg: 90},
    {id: 'water', angleDeg: 180},
  ];

  const allAwake =
    (counts.air ?? 0) > 0 &&
    (counts.fire ?? 0) > 0 &&
    (counts.earth ?? 0) > 0 &&
    (counts.water ?? 0) > 0 &&
    (counts.heart ?? 0) > 0;

  return (
    <View style={[styles.wrap, {width: size, height: size}]}>
      {/* 1. Chalk ring — layered: outer hairline + faint inner echo. */}
      <View
        pointerEvents="none"
        style={[
          styles.chalkRingOuter,
          {
            left: cx - ringR,
            top: cy - ringR,
            width: ringR * 2,
            height: ringR * 2,
            borderRadius: ringR,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.chalkRingInner,
          {
            left: cx - (ringR - 4),
            top: cy - (ringR - 4),
            width: (ringR - 4) * 2,
            height: (ringR - 4) * 2,
            borderRadius: ringR - 4,
          },
        ]}
      />

      {/* 2. Cardinal tick marks. */}
      {petals.map(({id, angleDeg}) => {
        const rad = (angleDeg * Math.PI) / 180;
        const inner = ringR + 2;
        const outer = ringR + 8;
        const midR = (inner + outer) / 2;
        const midX = cx + midR * Math.cos(rad);
        const midY = cy + midR * Math.sin(rad);
        const tickLen = outer - inner;
        return (
          <View
            key={`tick-${id}`}
            pointerEvents="none"
            style={[
              styles.tick,
              {
                left: midX - 1,
                top: midY - tickLen / 2,
                height: tickLen,
                transform: [{rotate: `${angleDeg + 90}deg`}],
              },
            ]}
          />
        );
      })}

      {/* 6. Ritual seal — drawn under petals so the discs sit on top.
          Heart is the literal hub: 4 radial spokes terminate beneath it. */}
      {allAwake && (
        <RitualSeal
          cx={cx}
          cy={cy}
          ringR={ringR}
          color={ELEMENTS.heart.accent}
        />
      )}

      {/* 3 & 4 & 5. Petal halo + petal disc + glyph + count. */}
      {petals.map(({id, angleDeg}) => {
        const el = ELEMENTS[id];
        const count = counts[id] ?? 0;
        const fill = Math.min(count / goalPerPetal, 1);
        const rad = (angleDeg * Math.PI) / 180;
        const px = cx + ringR * Math.cos(rad);
        const py = cy + ringR * Math.sin(rad);

        const haloSize = petalSize * 1.9;

        return (
          <React.Fragment key={id}>
            {fill > 0 && (
              <View
                pointerEvents="none"
                style={[
                  styles.halo,
                  {
                    left: px - haloSize / 2,
                    top: py - haloSize / 2,
                    width: haloSize,
                    height: haloSize,
                    borderRadius: haloSize / 2,
                    backgroundColor: el.color,
                    opacity: 0.08 + fill * 0.22,
                  },
                ]}
              />
            )}
            {/* Binary render: hollow ring when no reps logged, solid disc
                once any rep is recorded. The visual jump from outline →
                filled is immediately perceptible at a glance. */}
            <View
              style={[
                styles.petal,
                {
                  left: px - petalSize / 2,
                  top: py - petalSize / 2,
                  width: petalSize,
                  height: petalSize,
                  borderRadius: petalSize / 2,
                  borderColor: el.color,
                  // Hollow ring (fill=0) vs saturated disc (fill>0).
                  backgroundColor: fill === 0 ? 'transparent' : el.color,
                  borderWidth: fill === 0 ? 1.5 : 0,
                  opacity: fill === 0 ? 0.45 : 0.52 + fill * 0.48,
                },
              ]}>
              {/* Text contrast: dark bg for solid disc, el.color on hollow. */}
              <Text style={[styles.glyph, {color: fill === 0 ? el.color : palette.bg}]}>
                {el.glyph}
              </Text>
              <Text style={[styles.count, {color: fill === 0 ? el.color : palette.bg}]}>{count}</Text>
            </View>
          </React.Fragment>
        );
      })}

      {/* 7. Heart at centre. */}
      <Animated.View
        style={[
          styles.heartHalo,
          {
            left: cx - heartSize * 0.75,
            top: cy - heartSize * 0.75,
            width: heartSize * 1.5,
            height: heartSize * 1.5,
            borderRadius: heartSize * 0.75,
            backgroundColor: ELEMENTS.heart.color,
            opacity: heartGlow,
            transform: [{scale: heartScale}],
          },
        ]}
      />
      <View
        style={[
          styles.heart,
          {
            left: cx - heartSize / 2,
            top: cy - heartSize / 2,
            width: heartSize,
            height: heartSize,
            borderRadius: heartSize / 2,
            backgroundColor: ELEMENTS.heart.color,
            borderColor: ELEMENTS.heart.accent,
          },
        ]}>
        <Text style={[styles.heartGlyph, {color: ELEMENTS.heart.accent}]}>
          {counts.heart ?? 0}
        </Text>
      </View>
    </View>
  );
};

/**
 * Ritual seal — the cardinal-4 + heart layout's honest geometry.
 * Four perimeter legs connect the petals (diamond) and four radial
 * spokes run from each petal anchor to the centre. The heart disc
 * sits on top of the hub, so the spokes appear to emerge from
 * beneath it — Heart is unambiguously the seal's centre, not just
 * one of five points. Faint chartreuse, underneath the petal discs.
 */
const RitualSeal: React.FC<{
  cx: number;
  cy: number;
  ringR: number;
  color: string;
}> = ({cx, cy, ringR, color}) => {
  const centre = {x: cx, y: cy};
  const pts = {
    top: {x: cx, y: cy - ringR},
    right: {x: cx + ringR, y: cy},
    bottom: {x: cx, y: cy + ringR},
    left: {x: cx - ringR, y: cy},
  };
  // 4 perimeter legs (diamond) + 4 radial spokes (centre → each petal).
  const legs: {
    a: {x: number; y: number};
    b: {x: number; y: number};
    radial?: boolean;
  }[] = [
    // Perimeter — the chalk diamond connecting the four petals.
    {a: pts.top, b: pts.right},
    {a: pts.right, b: pts.bottom},
    {a: pts.bottom, b: pts.left},
    {a: pts.left, b: pts.top},
    // Radial spokes — each terminates at the centre, under the heart.
    {a: centre, b: pts.top, radial: true},
    {a: centre, b: pts.right, radial: true},
    {a: centre, b: pts.bottom, radial: true},
    {a: centre, b: pts.left, radial: true},
  ];
  return (
    <>
      {legs.map(({a, b, radial}, i) => {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: mx - len / 2,
              top: my - 0.5,
              width: len,
              height: 1,
              backgroundColor: color,
              // Radial spokes brighter than perimeter — reinforces the
              // hub-and-spoke read; perimeter is supporting structure.
              opacity: radial ? 0.55 : 0.32,
              transform: [{rotate: `${angle}deg`}],
            }}
          />
        );
      })}
    </>
  );
};

const styles = StyleSheet.create({
  wrap: {alignSelf: 'center'},
  chalkRingOuter: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#ffffff20',
  },
  chalkRingInner: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ffffff10',
  },
  tick: {
    position: 'absolute',
    width: 2,
    backgroundColor: '#ffffff44',
  },
  halo: {position: 'absolute'},
  petal: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {fontSize: 18, lineHeight: 22, fontWeight: '700'},
  count: {fontSize: 11, fontWeight: '800', marginTop: -2},
  heartHalo: {position: 'absolute'},
  heart: {
    position: 'absolute',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartGlyph: {fontSize: 22, fontWeight: '800'},
});
