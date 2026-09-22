/**
 * Your data, and the door it leaves by.
 *
 * RaveLite keeps everything on this phone and sends nothing anywhere, which
 * is the point — and also the risk: one phone, one copy. This panel is the
 * copy. Export writes the whole thing to a file you choose; Restore reads
 * one back over the top; Start over throws it away.
 */
import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {
  backupFilename,
  backupSummary,
  buildBackup,
  readBackup,
  restoreBackup,
  type Backup,
} from '../../domain/data/backup';
import {
  readExport,
  restartApp,
  saveExport,
  shareExport,
} from '../../native/raveLiteDevice';
import {store} from '../../storage';
import {KEYS} from '../../storage/keys';
import {flushPersistence} from '../../storage/persistence';
import {Symbol, hueOf} from '../../components/icons/Symbol';
import {
  clearErrors,
  errorSummary,
  readErrors,
} from '../../domain/diagnostics/errorLog';
import {diagnostics} from '../../domain/diagnostics/report';
import {tint} from '../../theme/hues';
import {palette, radius, spacing, type as t} from '../../theme';

type Staged = {backup: Backup; text: string};

const NO_PICKER = 'This phone has no file picker RaveLite can use.';
const DISARM_MS = 6000;
const DAY_MS = 86_400_000;

/** "today", "3 days ago" — how old the newest copy is. */
function sinceExport(at: number | undefined, now: number): string {
  if (at === undefined) {
    return 'Not exported yet.';
  }
  const days = Math.floor((now - at) / DAY_MS);
  return `Last export: ${
    days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`
  }.`;
}

function whenFrom(at: number): string {
  return Number.isFinite(at) && at > 0
    ? new Date(at).toLocaleDateString()
    : 'an unknown day';
}

export function DataPanel() {
  const [note, setNote] = useState<string | undefined>();
  const [staged, setStaged] = useState<Staged | undefined>();
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [showing, setShowing] = useState(false);
  const [lastExport, setLastExport] = useState(() =>
    store.getNumber(KEYS.lastExportAt),
  );
  const recent = showing ? readErrors().slice(-3).reverse() : [];

  // An armed erase disarms itself. Left armed, it waited — days, across
  // closing Settings — one stray tap from wiping everything.
  useEffect(() => {
    if (!confirmWipe) {
      return;
    }
    const timer = setTimeout(() => setConfirmWipe(false), DISARM_MS);
    return () => clearTimeout(timer);
  }, [confirmWipe]);

  const exported = () => {
    const now = Date.now();
    store.set(KEYS.lastExportAt, now);
    setLastExport(now);
  };

  /**
   * Restore and Start over both leave the running app holding old data.
   * Every write lands before the restart: the process used to exit 400 ms
   * after a burst of writes that had not reached the disk.
   */
  const startAgain = async (fallback: string) => {
    await flushPersistence();
    if (!(await restartApp())) {
      setNote(fallback);
    }
  };

  // Nothing here latches on an "in flight" flag. A file picker can be torn
  // down without ever returning, and a button disabled until a promise that
  // never settles is a button that is gone for good. The native side allows
  // one picker at a time and cancels the previous one, so a second tap is
  // always safe.
  const onExport = async () => {
    setNote(undefined);
    const backup = buildBackup();
    const result = await saveExport(backupFilename(), JSON.stringify(backup));
    if (result.ok) {
      exported();
      setNote(`Saved ${result.value} — ${backupSummary(backup)}.`);
    } else if (result.why === 'unsupported') {
      setNote(NO_PICKER);
    } else if (result.why !== 'cancelled') {
      setNote('That file could not be written.');
    }
  };

  const onShare = async () => {
    setNote(undefined);
    const backup = buildBackup();
    const sent = await shareExport(backupFilename(), JSON.stringify(backup));
    if (sent) {
      exported();
    } else {
      setNote('This phone has nothing to share it with.');
    }
  };

  const onPick = async () => {
    setNote(undefined);
    setStaged(undefined);
    const result = await readExport();
    if (!result.ok) {
      if (result.why === 'unsupported') {
        setNote(NO_PICKER);
      } else if (result.why !== 'cancelled') {
        setNote('That file could not be read.');
      }
      return;
    }
    const backup = readBackup(result.value);
    if (!backup) {
      setNote('That file is not a RaveLite export.');
      return;
    }
    setStaged({backup, text: result.value});
  };

  const onReplace = async () => {
    if (!staged) {
      return;
    }
    setStaged(undefined);
    setNote('Restoring. Keep RaveLite open.');
    const result = await restoreBackup(staged.text);
    if (!result.ok) {
      setNote(result.why);
      return;
    }
    setNote('Restored. Starting over from that day…');
    await startAgain('Restored. Close RaveLite and open it again.');
  };

  const onWipe = async () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    setConfirmWipe(false);
    store.clearAll();
    setNote('Everything erased. Starting fresh…');
    await startAgain('Everything erased. Close RaveLite and open it again.');
  };

  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>YOUR DATA</Text>
      <Text style={styles.caption}>
        Everything you log lives on this phone only. Nothing is sent anywhere,
        and there is no account to recover — so the export file is the backup.
        Keep one somewhere the phone isn't.
      </Text>
      <Text testID="data-last-export" style={styles.caption}>
        {sinceExport(lastExport, Date.now())}
      </Text>

      <View style={styles.row}>
        <View style={[styles.badge, {backgroundColor: tint(hueOf('export'))}]}>
          <Symbol name="export" size={20} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, {color: hueOf('export')}]}>
            Export
          </Text>
          <Text style={styles.rowValue}>
            Write it all to a file you pick: journal, streak, levels, tests,
            settings.
          </Text>
        </View>
        <Tap
          testID="data-export"
          variant="ghost"
          color={palette.textDim}
          onPress={onExport}
          accessibilityRole="button"
          accessibilityLabel="Export everything to a file"
          style={styles.rowBtn}>
          <Text style={styles.rowBtnText}>Export</Text>
        </Tap>
      </View>

      <View style={styles.row}>
        <View style={[styles.badge, {backgroundColor: tint(hueOf('learn'))}]}>
          <Symbol name="learn" size={20} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, {color: hueOf('learn')}]}>
            Report a problem
          </Text>
          <Text style={styles.rowValue}>
            Send this file to whoever is looking at it. It is everything the app
            knows, which is usually enough to find the bug.
          </Text>
        </View>
        <Tap
          testID="data-share"
          variant="ghost"
          color={palette.textDim}
          onPress={onShare}
          accessibilityRole="button"
          accessibilityLabel="Share your data to report a problem"
          style={styles.rowBtn}>
          <Text style={styles.rowBtnText}>Send</Text>
        </Tap>
      </View>

      <View style={styles.row}>
        <View style={[styles.badge, {backgroundColor: tint(hueOf('restore'))}]}>
          <Symbol name="restore" size={20} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, {color: hueOf('restore')}]}>
            Restore
          </Text>
          <Text style={styles.rowValue}>
            Read an export back. It replaces what is here — it does not merge.
          </Text>
        </View>
        <Tap
          testID="data-restore"
          variant="ghost"
          color={palette.textDim}
          onPress={onPick}
          accessibilityRole="button"
          accessibilityLabel="Restore from an export file"
          style={styles.rowBtn}>
          <Text style={styles.rowBtnText}>Restore</Text>
        </Tap>
      </View>

      {staged ? (
        <View style={styles.confirm}>
          <Text style={styles.confirmBody}>
            That file holds {backupSummary(staged.backup)}, exported{' '}
            {whenFrom(staged.backup.exportedAt)}. Everything currently in
            RaveLite is replaced by it.
          </Text>
          {/*
            Backing out comes first. The two pills wrap on a narrow screen,
            and this panel sits at the foot of a long scroll, so whichever
            one lands below the fold should be the one that destroys a
            journal — not the one that saves it.
          */}
          <View style={styles.confirmRow}>
            <Tap
              testID="data-cancel"
              variant="ghost"
              color={palette.textDim}
              onPress={() => setStaged(undefined)}
              accessibilityRole="button"
              style={styles.pill}>
              <Text style={styles.rowBtnText}>Keep what I have</Text>
            </Tap>
            <Tap
              testID="data-replace"
              variant="ghost"
              color={palette.danger}
              onPress={onReplace}
              accessibilityRole="button"
              style={styles.pill}>
              <Text style={[styles.rowBtnText, {color: palette.danger}]}>
                Replace everything
              </Text>
            </Tap>
          </View>
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={[styles.badge, {backgroundColor: tint(hueOf('erase'))}]}>
          <Symbol name="erase" size={20} />
        </View>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, {color: hueOf('erase')}]}>
            Start over
          </Text>
          <Text style={styles.rowValue}>
            Erase everything on this phone and begin again. Export first.
          </Text>
        </View>
        <Tap
          testID="data-wipe"
          variant="ghost"
          color={confirmWipe ? palette.danger : palette.textDim}
          onPress={onWipe}
          accessibilityRole="button"
          accessibilityLabel={
            confirmWipe ? 'Tap again to erase everything' : 'Start over'
          }
          style={styles.rowBtn}>
          <Text
            style={[styles.rowBtnText, confirmWipe && {color: palette.danger}]}>
            {confirmWipe ? 'Tap to confirm' : 'Erase'}
          </Text>
        </Tap>
      </View>

      <Tap
        testID="data-diagnostics"
        variant="plain"
        onPress={() => setShowing(s => !s)}
        accessibilityRole="button"
        accessibilityState={{expanded: showing}}
        accessibilityLabel="What state this install is in"
        style={styles.row}>
        <View style={styles.rowInner}>
          <View
            style={[styles.badge, {backgroundColor: tint(hueOf('measure'))}]}>
            <Symbol name="measure" size={20} />
          </View>
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, {color: hueOf('measure')}]}>
              What state this is in
            </Text>
            <Text style={styles.rowValue}>{errorSummary()}</Text>
          </View>
          <Text style={styles.chevron}>{showing ? '−' : '+'}</Text>
        </View>
      </Tap>

      {showing ? (
        <View style={styles.readout}>
          {diagnostics().map(d => (
            <View key={d.label} style={styles.readoutRow}>
              <Text style={styles.readoutLabel}>{d.label}</Text>
              <Text
                style={[
                  styles.readoutValue,
                  d.concern && {color: hueOf('warning')},
                ]}>
                {d.value}
              </Text>
            </View>
          ))}
          {recent.length > 0 ? (
            <>
              <Text style={styles.readoutLabel}>Most recent problems</Text>
              {recent.map(e => (
                <Text key={`${e.at}${e.where}`} style={styles.readoutValue}>
                  {e.where}: {e.what}
                </Text>
              ))}
              <Tap
                testID="data-clear-errors"
                variant="ghost"
                color={palette.textDim}
                onPress={() => {
                  clearErrors();
                  setShowing(false);
                }}
                accessibilityRole="button"
                style={styles.rowBtn}>
                <Text style={styles.rowBtnText}>Forget them</Text>
              </Tap>
            </>
          ) : null}
        </View>
      ) : null}

      {note ? (
        <Text testID="data-note" style={styles.note}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
  },
  caption: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 17,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...t.subtitle,
    color: palette.text,
  },
  rowValue: {
    ...t.caption,
    color: palette.textDim,
    marginTop: 2,
  },
  rowBtn: {
    minWidth: 72,
    minHeight: 48,
    borderRadius: radius.pill,
  },
  rowBtnText: {
    ...t.subtitle,
    color: palette.text,
  },
  confirm: {
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: palette.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: palette.surface,
  },
  confirmBody: {
    ...t.body,
    color: palette.textDim,
    lineHeight: 20,
  },
  confirmRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
  },
  chevron: {...t.subtitle, color: palette.textDim},
  readout: {
    gap: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    padding: spacing.md,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  readoutLabel: {...t.caption, color: palette.textMuted, width: 120},
  readoutValue: {...t.caption, color: palette.textDim, flex: 1},
  note: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 17,
  },
});
