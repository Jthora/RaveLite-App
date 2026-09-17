/**
 * "What is this?" — the card behind every named thing.
 *
 * One view for a drill, a track, an attribute or a whole round: what it
 * is, how to do it, how much, and the pieces it's made of. Every part and
 * every "part of" is a link, so a round opens into its moves and a move
 * opens back out to its track. The card keeps its own history, and Back
 * walks it before it closes.
 *
 * `InfoCardView` is a plain view, meant to sit inside a sheet that is
 * already open; `InfoSheet` is the same card as its own Modal, for Today,
 * which has no sheet of its own. Never open the Modal over another sheet —
 * on Android, Back stops reaching a sheet opened over another once it has
 * been touched.
 */
import React, {useCallback, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ElementGlyph} from '../icons/ElementGlyph';
import {MoveIcon} from '../icons/MoveIcon';
import {Tap} from '../Tap';
import {
  infoFor,
  type InfoCard,
  type InfoLink,
  type InfoRef,
} from '../../domain/info/info';
import type {MoveId} from '../../domain/exercises/moves';
import {ELEMENTS, type ElementId} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

export interface InfoStack {
  card?: InfoCard;
  depth: number;
  /** Open a card, keeping what's open behind it. */
  show: (card: InfoCard) => void;
  open: (ref: InfoRef) => void;
  back: () => void;
  close: () => void;
}

/** The card's own history, held by whichever screen shows it. */
export function useInfoStack(): InfoStack {
  const [stack, setStack] = useState<InfoCard[]>([]);
  const show = useCallback((card: InfoCard) => setStack(s => [...s, card]), []);
  const open = useCallback((ref: InfoRef) => {
    const card = infoFor(ref);
    if (card) {
      setStack(s => [...s, card]);
    }
  }, []);
  return {
    card: stack[stack.length - 1],
    depth: stack.length,
    show,
    open,
    back: useCallback(() => setStack(s => s.slice(0, -1)), []),
    close: useCallback(() => setStack([]), []),
  };
}

/** The pictogram on a soft square of its element's colour. */
function Tile({
  element,
  move,
  size,
}: {
  element: ElementId;
  move?: MoveId;
  size: number;
}) {
  const el = ELEMENTS[element];
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: `${el.color}29`,
        },
      ]}>
      {move ? (
        <MoveIcon move={move} color={el.color} size={size * 0.6} />
      ) : (
        <ElementGlyph element={el} size={size * 0.55} color={el.color} />
      )}
    </View>
  );
}

function Links({
  title,
  links,
  element,
  color,
  onOpen,
}: {
  title: string;
  links: readonly InfoLink[];
  /** The card's own element, for a part that doesn't name one. */
  element: ElementId;
  color: string;
  onOpen: (ref: InfoRef) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{title.toUpperCase()}</Text>
      {links.map((link, i) => {
        const own = link.element ?? element;
        const body = (
          <>
            <Tile element={own} move={link.move} size={34} />
            <View style={styles.linkBody}>
              <Text style={[styles.linkLabel, {color: ELEMENTS[own].color}]}>
                {link.label}
              </Text>
              {link.detail ? (
                <Text style={styles.linkDetail}>{link.detail}</Text>
              ) : null}
            </View>
          </>
        );
        // Tap wraps its children in one view, so the row sits inside it.
        return link.ref ? (
          <Tap
            key={`${link.label}-${i}`}
            testID={`info-part-${i}`}
            variant="plain"
            onPress={() => onOpen(link.ref!)}
            accessibilityRole="button"
            accessibilityLabel={`${link.label}. What is this?`}
            style={styles.link}>
            <View style={styles.linkRow}>
              {body}
              <Text style={[styles.chevron, {color}]}>›</Text>
            </View>
          </Tap>
        ) : (
          <View
            key={`${link.label}-${i}`}
            style={[styles.link, styles.linkRow]}>
            {body}
          </View>
        );
      })}
    </View>
  );
}

export function InfoCardView({
  card,
  canGoBack,
  onOpen,
  onBack,
  onClose,
}: {
  card: InfoCard;
  canGoBack: boolean;
  onOpen: (ref: InfoRef) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const color = ELEMENTS[card.element].color;
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {canGoBack ? (
          <Tap
            testID="info-back"
            variant="plain"
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.headerTap}>
            <Text style={[styles.headerText, {color}]}>‹ Back</Text>
          </Tap>
        ) : (
          <View style={styles.headerTap} />
        )}
        <Tap
          testID="info-close"
          variant="plain"
          onPress={onClose}
          accessibilityRole="button"
          style={styles.headerTap}>
          <Text style={styles.headerText}>Close</Text>
        </Tap>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.titleRow}>
          <Tile element={card.element} move={card.move} size={52} />
          <View style={styles.titleText}>
            <Text style={[styles.title, {color}]}>{card.title}</Text>
            {card.subtitle ? (
              <Text style={styles.subtitle}>{card.subtitle}</Text>
            ) : null}
          </View>
        </View>
        <Text style={styles.what}>{card.what}</Text>
        {card.dose ? (
          <Text style={[styles.dose, {color}]}>{card.dose}</Text>
        ) : null}
        {card.how && card.how.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.eyebrow}>HOW</Text>
            {card.how.map((step, i) => (
              <Text key={step} style={styles.step}>
                {card.how!.length > 1 ? `${i + 1}. ` : ''}
                {step}
              </Text>
            ))}
          </View>
        ) : null}
        {card.parts && card.parts.length > 0 ? (
          <Links
            title={card.partsTitle ?? 'Each part'}
            links={card.parts}
            element={card.element}
            color={color}
            onOpen={onOpen}
          />
        ) : null}
        {card.meta && card.meta.length > 0 ? (
          card.metaLines ? (
            <View style={styles.metaLines}>
              {card.meta.map(line => (
                <Text key={line} style={styles.meta}>
                  {line}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.meta}>{card.meta.join(' · ')}</Text>
          )
        ) : null}
        {card.related && card.related.length > 0 ? (
          <Links
            title={card.relatedTitle ?? 'Part of'}
            links={card.related}
            element={card.element}
            color={color}
            onOpen={onOpen}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

/** The card as its own sheet — only where nothing else is open. */
export function InfoSheet({stack}: {stack: InfoStack}) {
  if (!stack.card) {
    return null;
  }
  return (
    <Modal
      visible
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => (stack.depth > 1 ? stack.back() : stack.close())}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <InfoCardView
          card={stack.card}
          canGoBack={stack.depth > 1}
          onOpen={stack.open}
          onBack={stack.back}
          onClose={stack.close}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  headerTap: {
    minHeight: 48,
    minWidth: 72,
    justifyContent: 'center',
  },
  headerText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  titleText: {
    flex: 1,
    gap: 2,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...t.title,
  },
  subtitle: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  what: {
    ...t.body,
    color: palette.text,
    lineHeight: 22,
    marginTop: spacing.xs,
  },
  dose: {
    ...t.body,
    fontWeight: '700',
  },
  section: {
    marginTop: spacing.sm,
    gap: 6,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textMuted,
    letterSpacing: 1.5,
  },
  step: {
    ...t.body,
    color: palette.textDim,
    lineHeight: 21,
  },
  link: {
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  linkBody: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
  linkLabel: {
    ...t.body,
    color: palette.text,
  },
  linkDetail: {
    ...t.caption,
    color: palette.textDim,
  },
  chevron: {
    ...t.subtitle,
  },
  metaLines: {
    marginTop: spacing.sm,
    gap: 4,
  },
  meta: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 17,
    marginTop: spacing.sm,
  },
});
