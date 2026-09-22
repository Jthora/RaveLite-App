/**
 * What a desk did to you, and what is undoing it.
 *
 * These three have steered the program since long before this screen
 * existed — they were `Facts.corrections`, three strings with no UI at
 * all. The work was happening; nobody was ever told why.
 *
 * The panel measures **work, not posture**. It counts the drills that
 * address each flaw and says when enough has been done to be worth
 * checking — but it never clears one by itself, because it cannot see
 * you. Each flaw carries a tell you can check in a mirror, and the
 * clearing is yours to do.
 */
import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {Symbol, hueOf} from '../../components/icons/Symbol';
import {activityInRange} from '../../domain/activity/activity';
import {windowStart} from '../../domain/activity/stats';
import {
  FLAWS,
  drillsForFlaw,
  flawProgress,
  type FlawId,
} from '../../domain/profile/flaws';
import {baseFacts, setFacts} from '../../domain/profile/repository';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

export function FlawsPanel() {
  const [mine, setMine] = useState<FlawId[]>(() => baseFacts().corrections);
  const [asking, setAsking] = useState<FlawId | undefined>();

  /** Sessions of each flaw's work inside its window. */
  const sessions = useMemo(() => {
    const out = new Map<FlawId, number>();
    const now = new Date();
    for (const flaw of FLAWS) {
      const ids = new Set(drillsForFlaw(flaw));
      const items = activityInRange(windowStart(flaw.withinDays, now), now);
      out.set(
        flaw.id,
        items.filter(i => i.exerciseId && ids.has(i.exerciseId)).length,
      );
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mine]);

  const toggle = (id: FlawId) => {
    const next = mine.includes(id) ? mine.filter(f => f !== id) : [...mine, id];
    // The real facts, never the mode's: saving loadFacts() while away
    // from home would write the hotel room over the kit.
    setFacts({...baseFacts(), corrections: next});
    setMine(next);
    setAsking(undefined);
  };

  return (
    <View style={styles.root}>
      <Text accessibilityRole="header" style={styles.eyebrow}>
        WHAT YOU'RE FIXING
      </Text>
      <Text style={styles.caption}>
        Three common effects of sitting at a desk. Mark the ones you have. The
        program then gives you more work to fix them.
      </Text>
      {FLAWS.map(flaw => {
        const on = mine.includes(flaw.id);
        const el = ELEMENTS[flaw.element];
        const progress = flawProgress(flaw, sessions.get(flaw.id) ?? 0);
        const open = asking === flaw.id;
        return (
          <View key={flaw.id}>
            <Tap
              testID={`flaw-${flaw.id}`}
              variant="plain"
              onPress={() =>
                on ? setAsking(open ? undefined : flaw.id) : toggle(flaw.id)
              }
              accessibilityRole="button"
              accessibilityState={{selected: on}}
              accessibilityLabel={`${flaw.name}, ${flaw.proper}. ${
                on
                  ? `${progress.done} of ${progress.needed} sessions`
                  : 'not marked'
              }. ${flaw.what}`}
              style={[
                styles.row,
                on && {borderColor: el.color, backgroundColor: `${el.color}14`},
              ]}>
              <View style={styles.rowInner}>
                <View
                  style={[styles.badge, {backgroundColor: `${el.color}29`}]}>
                  <Symbol name="body" size={20} color={el.color} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowName, on && {color: el.color}]}>
                    {flaw.name}
                  </Text>
                  <Text style={styles.rowProper}>{flaw.proper}</Text>
                  <Text style={styles.rowDetail}>{flaw.what}</Text>
                  {on ? (
                    <>
                      <View style={styles.bar}>
                        <View
                          style={[
                            styles.fill,
                            {
                              width: `${progress.at * 100}%`,
                              backgroundColor: el.color,
                            },
                          ]}
                        />
                      </View>
                      <Text
                        testID={`flaw-progress-${flaw.id}`}
                        style={styles.rowDetail}>
                        {progress.ready
                          ? `${progress.done} sessions in ${flaw.withinDays} days. Time to check.`
                          : `${progress.done} of ${progress.needed} sessions in the last ${flaw.withinDays} days.`}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.tell, {color: hueOf('idea')}]}>
                      {flaw.tell}
                    </Text>
                  )}
                </View>
              </View>
            </Tap>
            {open ? (
              <View style={[styles.confirm, {borderColor: el.color}]}>
                <Text style={styles.rowDetail}>
                  {progress.ready
                    ? 'You have done the work. The app cannot see your posture. Do the check below, and clear it if the problem has gone.'
                    : 'You can clear it any time the problem has gone. The count is only a guide.'}
                </Text>
                <Text style={[styles.tell, {color: hueOf('idea')}]}>
                  {flaw.tell}
                </Text>
                <View style={styles.confirmRow}>
                  <Tap
                    testID={`flaw-keep-${flaw.id}`}
                    variant="ghost"
                    color={palette.textDim}
                    onPress={() => setAsking(undefined)}
                    accessibilityRole="button"
                    style={styles.pill}>
                    <Text style={styles.pillText}>Still there</Text>
                  </Tap>
                  <Tap
                    testID={`flaw-clear-${flaw.id}`}
                    variant="ghost"
                    color={el.color}
                    onPress={() => toggle(flaw.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Clear ${flaw.name}`}
                    style={styles.pill}>
                    <Text style={[styles.pillText, {color: el.color}]}>
                      It has gone
                    </Text>
                  </Tap>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {gap: spacing.sm, marginTop: spacing.lg},
  eyebrow: {...t.caption, color: palette.textDim, letterSpacing: 1.5},
  caption: {...t.caption, color: palette.textFaint, lineHeight: 17},
  row: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    width: '100%',
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  rowText: {flex: 1, paddingVertical: spacing.md, gap: 3},
  rowName: {...t.subtitle, color: palette.text},
  rowProper: {...t.caption, color: palette.textFaint, fontStyle: 'italic'},
  rowDetail: {...t.caption, color: palette.textDim, lineHeight: 17},
  tell: {...t.caption, lineHeight: 17},
  bar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: palette.border,
    overflow: 'hidden',
    marginTop: 4,
  },
  fill: {height: '100%'},
  confirm: {
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: palette.surface,
  },
  confirmRow: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
  pill: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  pillText: {...t.caption, color: palette.text},
});
