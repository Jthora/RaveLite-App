/**
 * DailySetsSheet — Daily Sets in full, opened from Today's set meters:
 * today's tracks with their rounds, max tests, level ups and track on/off,
 * plus Goals and Attributes.
 *
 * Both of those show in this same sheet, not as a sheet over it: on Android,
 * once a sheet opened over another has been touched, Back stops reaching it.
 * Back returns to Daily Sets; Back again closes the sheet.
 */
import React, {useEffect, useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {InfoCardView, useInfoStack} from '../../components/info/InfoSheet';
import {Tap} from '../../components/Tap';
import {ELEMENTS} from '../../theme/elements';
import {palette, spacing, type as t} from '../../theme';
import {Attributes} from './Attributes';
import {DailySetsSection} from './DailySetsSection';
import {Goals} from './Goals';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type View_ = 'sets' | 'goals' | 'attributes';

const TITLES: Record<View_, string> = {
  sets: 'Daily Sets',
  goals: 'Goals',
  attributes: 'Attributes',
};

export function DailySetsSheet({visible, onClose}: Props) {
  const [showing, setShowing] = useState<View_>('sets');
  const info = useInfoStack();
  const accent = ELEMENTS.heart.accent;
  const goals = showing === 'goals';
  const away = showing !== 'sets';

  // Every opening starts on Daily Sets, with no card open.
  useEffect(() => {
    if (!visible) {
      setShowing('sets');
      info.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Back walks the card's own history first, then the view, then out.
  const back = () => {
    if (info.card) {
      return info.depth > 1 ? info.back() : info.close();
    }
    return away ? setShowing('sets') : onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={back}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {info.card ? (
          <InfoCardView
            card={info.card}
            canGoBack={info.depth > 1}
            onOpen={info.open}
            onBack={info.back}
            onClose={info.close}
          />
        ) : (
          <>
            <View style={styles.header}>
              <Text style={[styles.title, {color: accent}]}>
                {TITLES[showing]}
              </Text>
              <View style={styles.actions}>
                {away ? (
                  <Tap
                    testID="sets-back"
                    variant="plain"
                    onPress={() => setShowing('sets')}
                    accessibilityRole="button"
                    accessibilityLabel="Back to Daily Sets"
                    style={styles.close}>
                    <Text style={[styles.closeText, {color: accent}]}>
                      Daily Sets
                    </Text>
                  </Tap>
                ) : (
                  <Tap
                    testID="goals-open"
                    variant="plain"
                    onPress={() => setShowing('goals')}
                    accessibilityRole="button"
                    accessibilityLabel="Goals: push-ups today, the fitness tests and a goal for each element"
                    style={styles.close}>
                    <Text style={[styles.closeText, {color: accent}]}>
                      Goals
                    </Text>
                  </Tap>
                )}
                <Tap
                  variant="plain"
                  onPress={onClose}
                  accessibilityRole="button"
                  style={styles.close}>
                  <Text style={styles.closeText}>Close</Text>
                </Tap>
              </View>
            </View>
            {goals ? (
              <Goals onInfo={info.open} />
            ) : showing === 'attributes' ? (
              <Attributes />
            ) : (
              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}>
                <DailySetsSection
                  onOpenAttributes={() => setShowing('attributes')}
                  onInfo={info.open}
                />
              </ScrollView>
            )}
          </>
        )}
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  title: {
    ...t.title,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  close: {
    minHeight: 48,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...t.subtitle,
    color: palette.textDim,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
