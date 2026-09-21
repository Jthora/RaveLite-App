/**
 * Guard — a wall around one screen.
 *
 * React unmounts the **entire tree** when a render throws and nothing
 * catches it. In this app that meant a bad journal entry took Today down
 * with it, and Today is the app: the chime, the water counter, the day's
 * list, all gone because one attribute cell could not read one number.
 *
 * So the boundary goes around each screen rather than around the app. A
 * crash in the character sheet costs the character sheet. Today keeps
 * chiming.
 *
 * It says what broke rather than apologising, records it where the export
 * will carry it, and offers to try again — because most of these are a
 * single bad row, and remounting past it is often enough to keep somebody
 * training while the real fix is written.
 */
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from './Tap';
import {logError} from '../domain/diagnostics/errorLog';
import {palette, radius, spacing, type as t} from '../theme';

interface Props {
  /** Named in the log and on screen: 'Today', 'Character sheet'. */
  name: string;
  children: React.ReactNode;
}

interface State {
  failed?: {what: string};
  /** Bumped to remount the children after a retry. */
  attempt: number;
}

export class Guard extends React.Component<Props, State> {
  state: State = {attempt: 0};

  static getDerivedStateFromError(error: unknown): Partial<State> {
    const what =
      error instanceof Error ? error.message : String(error ?? 'unknown');
    return {failed: {what}};
  }

  componentDidCatch(error: unknown) {
    logError(`render:${this.props.name}`, error);
  }

  private retry = () => {
    this.setState(s => ({failed: undefined, attempt: s.attempt + 1}));
  };

  render() {
    const {failed, attempt} = this.state;
    if (!failed) {
      return (
        <React.Fragment key={attempt}>{this.props.children}</React.Fragment>
      );
    }
    return (
      <View testID={`guard-${this.props.name}`} style={styles.root}>
        <Text style={styles.title}>{this.props.name} stopped</Text>
        <Text style={styles.body}>
          Something in here could not be drawn. The rest of the app is fine, and
          nothing you have logged is affected.
        </Text>
        <Text style={styles.what} numberOfLines={3}>
          {failed.what}
        </Text>
        <Text style={styles.body}>
          It has been written down. Settings → Your data → Report a problem
          sends it with everything needed to find it.
        </Text>
        <Tap
          testID={`guard-retry-${this.props.name}`}
          variant="ghost"
          color={palette.textDim}
          onPress={this.retry}
          accessibilityRole="button"
          accessibilityLabel={`Try ${this.props.name} again`}
          style={styles.btn}>
          <Text style={styles.btnText}>Try again</Text>
        </Tap>
      </View>
    );
  }
}
const styles = StyleSheet.create({
  root: {
    margin: spacing.lg,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.danger,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
  },
  title: {...t.subtitle, color: palette.danger, fontWeight: '700'},
  body: {...t.caption, color: palette.textDim, lineHeight: 18},
  what: {
    ...t.caption,
    color: palette.textMuted,
    fontVariant: ['tabular-nums'],
  },
  btn: {
    minHeight: 44,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  btnText: {...t.caption, color: palette.text},
});
