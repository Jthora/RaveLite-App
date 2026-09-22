/**
 * TrainingLogSheet — single-screen Add/Edit modal for the manual log.
 *
 * Layout strategy: NO scrolling on the outer modal. Everything fits the
 * viewport. On a landscape tablet the body splits into two columns
 * side-by-side: exercises on the left, when/value/notes on the right.
 * Portrait falls back to a stacked layout that still fits without
 * scrolling on phone-sized viewports.
 *
 * Date selection: 4 quick chips (Today, Yest, 2d, 3d) + a Pick…
 * button that opens a calendar grid for arbitrary dates.
 *
 * Time entry: NumberPad in compact mode, with HH:MM:SS support — the
 * display auto-promotes from MM:SS to H:MM:SS to HH:MM:SS as the
 * operator types more digits.
 */
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {InfoCardView, useInfoStack} from '../info/InfoSheet';
import {palette, radius, spacing, type as t} from '../../theme';
import {ELEMENTS} from '../../theme/elements';
import {useElementAccent} from '../../theme/elementContext';
import {
  addCustomMetric,
  addEntry,
  deleteEntry,
  deleteMetric,
  getMetric,
  loadArchivedMetrics,
  loadMetrics,
  loadMetricsForElement,
  unarchiveMetric,
  updateEntry,
} from '../../domain/training/repository';
import {
  InputMode,
  MetricCategory,
  MetricKind,
  TrainingLogEntry,
} from '../../domain/training/types';
import type {ElementId} from '../../theme/elements';
import {gradeForRun, formatPace} from '../../domain/training/grading';
import {NumberPad} from './NumberPad';
import {CalendarPicker} from './CalendarPicker';
import {useBackStack} from '../BackStack';
import {SheetLayer, SheetLayerHost, useInSheet} from '../SheetLayer';
import {METERS_PER_MILE, MS_PER_DAY} from '../../lib/constants';
import {showsGrades} from '../../domain/profile/repository';
import {TEST_ONLY_KINDS} from '../../domain/training/builtinMetrics';

const MI_PER_M = 1 / METERS_PER_MILE;

interface Props {
  visible: boolean;
  onClose: () => void;
  /** When set, the sheet edits this entry instead of creating one. */
  editing?: TrainingLogEntry;
  /** When set, scopes the metric picker to this element + 'any',
   *  pre-fills the picker, and tags new entries with this element. */
  defaultElement?: ElementId;
  /** When set, a new entry starts on this metric kind (e.g. a test). */
  defaultKindId?: string;
}

export function TrainingLogSheet({
  visible,
  onClose,
  editing,
  defaultElement,
  defaultKindId,
}: Props) {
  const {width, height} = useWindowDimensions();
  const inSheet = useInSheet();
  const backStack = useBackStack();
  const accent = useElementAccent();
  // Use 2-column layout whenever width > height (phone landscape too).
  const isLandscape = width > height;
  // Phone-landscape (short viewport): tighten widths and allow scroll.
  const isCompactLand = isLandscape && Math.min(width, height) < 600;

  const [tick, setTick] = useState(0);
  const refresh = () => setTick(x => x + 1);

  // `tick` is the point: it is not read in here, it is how `refresh()`
  // says the stored metrics changed. And `editing?.id` rather than
  // `editing` so a new object of the same entry does not re-read storage
  // on every render.
  /* eslint-disable react-hooks/exhaustive-deps */
  const metrics = useMemo(
    () =>
      (defaultElement
        ? loadMetricsForElement(defaultElement)
        : loadMetrics()
      ).filter(
        m =>
          !TEST_ONLY_KINDS.has(m.id) ||
          showsGrades() ||
          m.id === editing?.kindId,
      ),
    [tick, defaultElement, editing?.kindId],
  );
  const editingKind = useMemo(
    () => (editing ? getMetric(editing.kindId) : undefined),
    [editing?.id, tick],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const info = useInfoStack();
  const [selectedKindId, setSelectedKindId] = useState<string>(
    editing?.kindId ?? defaultKindId ?? metrics[0]?.id ?? '',
  );
  const selectedKind = useMemo(
    () => metrics.find(m => m.id === selectedKindId) ?? editingKind,
    [metrics, selectedKindId, editingKind],
  );

  const [atEpoch, setAtEpoch] = useState<number>(editing?.at ?? Date.now());
  const [valueSec, setValueSec] = useState<number>(0);
  const [valueReps, setValueReps] = useState<number>(0);
  const [distanceCenti, setDistanceCenti] = useState<number>(0);
  const [notes, setNotes] = useState<string>(editing?.notes ?? '');
  const [showManage, setShowManage] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const closeCalendar = useCallback(() => setShowCalendar(false), []);
  const closeManage = useCallback(() => {
    setShowManage(false);
    refresh();
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }
    if (editing && editingKind) {
      setSelectedKindId(editing.kindId);
      setAtEpoch(editing.at);
      setNotes(editing.notes ?? '');
      switch (editingKind.inputMode) {
        case 'mmss':
          setValueSec(editing.value);
          setValueReps(0);
          setDistanceCenti(0);
          break;
        case 'integer':
          setValueReps(editing.value);
          setValueSec(0);
          setDistanceCenti(0);
          break;
        case 'distance-time':
          setValueSec(editing.value);
          setDistanceCenti(
            editing.distanceMeters
              ? Math.round(editing.distanceMeters * MI_PER_M * 100)
              : 0,
          );
          setValueReps(0);
          break;
        case 'decimal':
          // The pad works in hundredths: 36.5 in is 3650.
          setValueReps(Math.round(editing.value * 100));
          break;
      }
    } else {
      setAtEpoch(Date.now());
      setValueSec(0);
      setValueReps(0);
      setDistanceCenti(0);
      setNotes('');
      if (defaultKindId && metrics.find(m => m.id === defaultKindId)) {
        setSelectedKindId(defaultKindId);
      } else if (!metrics.find(m => m.id === selectedKindId)) {
        setSelectedKindId(metrics[0]?.id ?? '');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editing?.id, defaultKindId]);

  const canSave =
    !!selectedKind &&
    hasValue(selectedKind.inputMode, {
      valueSec,
      valueReps,
      distanceCenti,
      fixedDistance: selectedKind?.defaultDistanceMeters,
    });

  function handleSave() {
    if (!selectedKind || !canSave) {
      return;
    }
    const value =
      selectedKind.inputMode === 'mmss' ||
      selectedKind.inputMode === 'distance-time'
        ? valueSec
        : selectedKind.inputMode === 'decimal'
        ? valueReps / 100
        : valueReps;
    const distanceMeters =
      selectedKind.inputMode !== 'distance-time'
        ? undefined
        : selectedKind.defaultDistanceMeters
        ? selectedKind.defaultDistanceMeters
        : Math.round((distanceCenti / 100) * METERS_PER_MILE);
    const trimmedNotes = notes.trim() || undefined;
    if (editing) {
      updateEntry(editing.id, {
        at: atEpoch,
        kindId: selectedKind.id,
        value,
        distanceMeters,
        notes: trimmedNotes,
      });
    } else {
      addEntry({
        at: atEpoch,
        kindId: selectedKind.id,
        value,
        distanceMeters,
        notes: trimmedNotes,
        element:
          selectedKind.element && selectedKind.element !== 'any'
            ? selectedKind.element
            : defaultElement,
      });
    }
    onClose();
  }

  function handleDelete() {
    if (!editing) {
      return;
    }
    deleteEntry(editing.id);
    onClose();
  }

  // Live grade chip for runs.
  const runDistance = useMemo(() => {
    if (!selectedKind) {
      return undefined;
    }
    if (
      selectedKind.inputMode === 'mmss' &&
      selectedKind.defaultDistanceMeters
    ) {
      return selectedKind.defaultDistanceMeters;
    }
    if (selectedKind.inputMode === 'distance-time') {
      return Math.round((distanceCenti / 100) * METERS_PER_MILE);
    }
    return undefined;
  }, [selectedKind, distanceCenti]);

  // Letter grades come from the military tests' tables: only with that pack.
  const liveGrade = useMemo(
    () =>
      runDistance && valueSec > 0 && showsGrades()
        ? gradeForRun(runDistance, valueSec)
        : undefined,
    [runDistance, valueSec],
  );
  const livePace = useMemo(
    () =>
      runDistance && valueSec > 0
        ? formatPace(runDistance, valueSec)
        : undefined,
    [runDistance, valueSec],
  );

  // Back: a dialog inside first (Manage, a new exercise, the calendar),
  // then an open info card, then the sheet.
  const back = () =>
    backStack.back() ||
    (info.card ? (info.depth > 1 ? info.back() : info.close()) : onClose());

  const inner = (
    <backStack.Provider>
      <SheetLayerHost>
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
            {/* Compact header with inline save/cancel */}
            <View style={styles.header}>
              <Text accessibilityRole="header" style={styles.title}>
                {editing ? 'Edit Entry' : 'New Training Log'}
              </Text>
              {isLandscape && livePace ? (
                <View style={styles.headerGrade}>
                  {liveGrade ? (
                    <Text style={[styles.headerGradeText, {color: accent}]}>
                      {liveGrade.grade}
                    </Text>
                  ) : null}
                  <Text style={styles.headerPaceText}>{livePace}</Text>
                </View>
              ) : null}
              <View style={styles.headerActions}>
                {editing ? (
                  <Pressable
                    onPress={handleDelete}
                    style={[styles.btn, styles.btnDanger]}>
                    <Text style={[styles.btnText, {color: palette.danger}]}>
                      Delete
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={onClose}
                  style={[styles.btn, styles.btnGhost]}>
                  <Text style={styles.btnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={!canSave}
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    {backgroundColor: accent},
                    !canSave && styles.btnDisabled,
                  ]}>
                  <Text style={[styles.btnText, styles.btnTextPrimary]}>
                    {editing ? 'Save' : 'Log Entry'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Body: two-column in landscape, stacked otherwise */}
            <View
              style={isLandscape ? styles.bodyLandscape : styles.bodyPortrait}>
              {/* Left column: exercise picker */}
              <View
                style={[
                  isLandscape ? styles.leftCol : styles.leftColPortrait,
                  isCompactLand && styles.leftColCompact,
                ]}>
                <View style={styles.colHeader}>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>
                    Exercises
                  </Text>
                  {/* What's being logged, even when the list is scrolled away from it. */}
                  {selectedKind ? (
                    <Pressable
                      testID="log-selected-kind"
                      onPress={() =>
                        info.open({kind: 'metric', id: selectedKind.id})
                      }
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`${selectedKind.label}. What is this?`}>
                      <Text
                        style={[styles.selectedKind, {color: accent}]}
                        numberOfLines={1}>
                        {selectedKind.label} ⓘ
                      </Text>
                    </Pressable>
                  ) : null}
                  {/* Opened for one test (from Goals, inside Daily Sets),
                      Manage would be a fourth sheet deep. It lives on
                      + Log instead. */}
                  {defaultKindId ? null : (
                    <Pressable
                      testID="log-manage"
                      onPress={() => setShowManage(true)}
                      hitSlop={8}>
                      <Text style={[styles.sectionAction, {color: accent}]}>
                        Manage
                      </Text>
                    </Pressable>
                  )}
                </View>
                <ScrollView
                  style={styles.exerciseScroll}
                  showsVerticalScrollIndicator={false}>
                  <FlatMetricList
                    metrics={metrics}
                    selectedId={selectedKindId}
                    onSelect={setSelectedKindId}
                    accent={accent}
                  />
                </ScrollView>
              </View>

              {/* Right column: value column + (when + notes) column */}
              <RightCol isLandscape={isLandscape} isCompactLand={isCompactLand}>
                {(() => {
                  const whenSection = (
                    <View style={styles.section}>
                      <Text
                        accessibilityRole="header"
                        style={styles.sectionTitle}>
                        When
                      </Text>
                      <View style={styles.dateRow}>
                        {[0, 1, 2, 3].map(i => {
                          const day = startOfDay(Date.now()) - i * MS_PER_DAY;
                          const isSel = startOfDay(atEpoch) === day;
                          return (
                            <Pressable
                              key={i}
                              onPress={() => setAtEpoch(day)}
                              style={[
                                styles.chip,
                                isSel && styles.chipSel,
                                isSel && {
                                  backgroundColor: accent,
                                  borderColor: accent,
                                },
                              ]}>
                              <Text
                                style={[
                                  styles.chipText,
                                  isSel && styles.chipTextSel,
                                ]}>
                                {dayLabel(day, i)}
                              </Text>
                            </Pressable>
                          );
                        })}
                        <Pressable
                          testID="log-pick-date"
                          onPress={() => setShowCalendar(true)}
                          style={[
                            styles.chip,
                            !isWithinQuickRange(atEpoch) && styles.chipSel,
                            !isWithinQuickRange(atEpoch) && {
                              backgroundColor: accent,
                              borderColor: accent,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.chipText,
                              !isWithinQuickRange(atEpoch) &&
                                styles.chipTextSel,
                            ]}>
                            {isWithinQuickRange(atEpoch)
                              ? '📅 Pick…'
                              : `📅 ${formatPickedDate(atEpoch)}`}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );

                  return (
                    <>
                      {/* Portrait: When sits above Value + Notes column. */}
                      {!isLandscape && whenSection}

                      {/* Value + (When+Notes) side-by-side in landscape */}
                      <View
                        style={
                          isLandscape
                            ? styles.valueNotesRowLand
                            : styles.valueNotesColPort
                        }>
                        {selectedKind ? (
                          <View
                            style={[
                              isLandscape
                                ? styles.valueColLand
                                : styles.valueColPort,
                              isCompactLand && styles.valueColCompact,
                            ]}>
                            <Text
                              accessibilityRole="header"
                              style={styles.sectionTitle}>
                              {inputLabel(selectedKind)}
                            </Text>
                            <ValueInput
                              kind={selectedKind}
                              valueSec={valueSec}
                              valueReps={valueReps}
                              distanceCenti={distanceCenti}
                              onSec={setValueSec}
                              onReps={setValueReps}
                              onDistance={setDistanceCenti}
                              accent={accent}
                            />
                          </View>
                        ) : null}

                        <View
                          style={
                            isLandscape
                              ? styles.notesColLand
                              : styles.notesColPort
                          }>
                          {/* Landscape: When sits above Notes in this column. */}
                          {isLandscape && whenSection}
                          <Text
                            accessibilityRole="header"
                            style={styles.sectionTitle}>
                            Notes
                          </Text>
                          <TextInput
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="How it felt, route, weather…"
                            placeholderTextColor={palette.textFaint}
                            style={[
                              styles.notesInput,
                              isLandscape && styles.notesInputLand,
                            ]}
                            multiline
                          />
                          {!isLandscape && livePace ? (
                            <View style={styles.portraitGradeRow}>
                              <View style={styles.headerGrade}>
                                {liveGrade ? (
                                  <Text
                                    style={[
                                      styles.headerGradeText,
                                      {color: accent},
                                    ]}>
                                    {liveGrade.grade}
                                  </Text>
                                ) : null}
                                <Text style={styles.headerPaceText}>
                                  {livePace}
                                </Text>
                              </View>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </>
                  );
                })()}
              </RightCol>
            </View>

            <ManageMetricsSheet
              visible={showManage}
              metrics={metrics}
              onClose={closeManage}
              onChange={refresh}
              accent={accent}
              defaultElement={defaultElement}
            />

            <CalendarPicker
              visible={showCalendar}
              selected={atEpoch}
              onPick={setAtEpoch}
              onClose={closeCalendar}
              accent={accent}
            />
          </>
        )}
      </SheetLayerHost>
    </backStack.Provider>
  );

  // Inside another sheet the window is already inside the safe area, so
  // the insets are the host's to apply, not this one's.
  const body = inSheet ? (
    <View style={styles.root}>{inner}</View>
  ) : (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {inner}
    </SafeAreaView>
  );

  // Opened from inside another sheet (Goals, in Daily Sets), it is drawn
  // in that sheet's window: a Modal over a Modal loses Back on the phone.
  if (inSheet) {
    return visible ? <SheetLayer onClose={back}>{body}</SheetLayer> : null;
  }
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={back}
      transparent={false}
      statusBarTranslucent>
      {/* The window runs under the status bar: keep the header below it. */}
      {body}
    </Modal>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

function RightCol({
  isLandscape,
  isCompactLand,
  children,
}: {
  isLandscape: boolean;
  isCompactLand: boolean;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        isLandscape ? styles.rightCol : styles.rightColPortrait,
        isCompactLand && styles.rightColCompact,
      ]}>
      {children}
    </View>
  );
}

function FlatMetricList({
  metrics,
  selectedId,
  onSelect,
  accent,
}: {
  metrics: MetricKind[];
  selectedId: string;
  onSelect: (id: string) => void;
  accent: string;
}) {
  return (
    <FlatMetricListInner
      metrics={metrics}
      selectedId={selectedId}
      onSelect={onSelect}
      accent={accent}
    />
  );
}

const FlatMetricListInner = React.memo(function FlatMetricListInner({
  metrics,
  selectedId,
  onSelect,
  accent,
}: {
  metrics: MetricKind[];
  selectedId: string;
  onSelect: (id: string) => void;
  accent: string;
}) {
  const grouped = groupByCategory(metrics);
  const cats: MetricCategory[] = ['run', 'session', 'reps', 'hold', 'custom'];
  return (
    <View>
      {cats.map(cat => {
        const list = grouped[cat];
        if (!list || list.length === 0) {
          return null;
        }
        return (
          <View key={cat} style={{marginBottom: spacing.sm}}>
            <Text style={styles.catHeader}>{categoryLabel(cat)}</Text>
            {list.map(m => (
              <Pressable
                key={m.id}
                onPress={() => onSelect(m.id)}
                style={[
                  styles.metricRow,
                  selectedId === m.id && styles.metricRowSel,
                ]}>
                <Text
                  style={[
                    styles.metricBulletText,
                    selectedId === m.id && {color: accent},
                  ]}>
                  {selectedId === m.id ? '●' : '○'}
                </Text>
                <Text style={styles.metricLabel} numberOfLines={1}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>
        );
      })}
    </View>
  );
});

function ValueInput({
  kind,
  valueSec,
  valueReps,
  distanceCenti,
  onSec,
  onReps,
  onDistance,
  accent,
}: {
  kind: MetricKind;
  valueSec: number;
  valueReps: number;
  distanceCenti: number;
  onSec: (v: number) => void;
  onReps: (v: number) => void;
  onDistance: (v: number) => void;
  accent: string;
}) {
  switch (kind.inputMode) {
    case 'mmss':
      return (
        <NumberPad
          mode="mmss"
          value={valueSec}
          onChange={onSec}
          accent={accent}
          compact
        />
      );
    case 'integer':
      return (
        <NumberPad
          mode="integer"
          value={valueReps}
          onChange={onReps}
          accent={accent}
          max={999}
          compact
        />
      );
    case 'decimal':
      // Hundredths, e.g. a waist of 36.50 in.
      return (
        <NumberPad
          mode="decimal-2dp"
          value={valueReps}
          onChange={onReps}
          accent={accent}
          compact
        />
      );
    case 'distance-time': {
      const hasFixed = !!kind.defaultDistanceMeters;
      return (
        <View>
          {!hasFixed && (
            <View style={{marginBottom: spacing.sm}}>
              <Text style={styles.subLabel}>Distance (mi)</Text>
              <NumberPad
                mode="decimal-2dp"
                value={distanceCenti}
                onChange={onDistance}
                accent={accent}
                compact
              />
            </View>
          )}
          <Text style={styles.subLabel}>Time (HH:MM:SS)</Text>
          <NumberPad
            mode="mmss"
            value={valueSec}
            onChange={onSec}
            accent={accent}
            compact
          />
        </View>
      );
    }
  }
}

function ManageMetricsSheet({
  visible,
  metrics,
  onClose,
  onChange,
  accent,
  defaultElement,
}: {
  visible: boolean;
  metrics: MetricKind[];
  onClose: () => void;
  onChange: () => void;
  accent: string;
  defaultElement?: ElementId;
}) {
  const [showAdd, setShowAdd] = useState(false);
  return visible ? (
    <SheetLayer onClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            Manage Exercises
          </Text>
          <View style={styles.headerActions}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnText}>Done</Text>
            </Pressable>
          </View>
        </View>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: spacing.xxl,
          }}>
          <Pressable
            testID="manage-add"
            onPress={() => setShowAdd(true)}
            style={[
              styles.btn,
              styles.btnPrimary,
              {backgroundColor: accent, marginBottom: spacing.lg},
            ]}>
            <Text style={[styles.btnText, styles.btnTextPrimary]}>
              + Add new exercise
            </Text>
          </Pressable>
          {metrics.map(m => (
            <View key={m.id} style={styles.manageRow}>
              <View style={{flex: 1}}>
                <Text style={styles.metricLabel}>{m.label}</Text>
                <Text style={styles.metricMode}>
                  {inputModeShort(m.inputMode)} ·{' '}
                  {m.builtIn ? 'built-in' : 'custom'}
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  deleteMetric(m.id);
                  onChange();
                }}
                style={styles.iconBtn}>
                <Text style={styles.iconBtnText}>
                  {m.builtIn ? 'Hide' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          ))}
          <Text style={styles.helpText}>
            Hiding a built-in exercise keeps its old log entries. Custom
            exercises with no entries are deleted. Custom exercises with entries
            are archived.
          </Text>
          <ArchivedList onChange={onChange} />
        </ScrollView>
        <AddCustomMetricSheet
          visible={showAdd}
          accent={accent}
          defaultElement={defaultElement}
          onClose={() => {
            setShowAdd(false);
            onChange();
          }}
        />
      </View>
    </SheetLayer>
  ) : null;
}

function ArchivedList({onChange}: {onChange: () => void}) {
  const archived = useMemo(loadArchivedMetrics, []);
  if (archived.length === 0) {
    return null;
  }
  return (
    <View style={{marginTop: spacing.xl}}>
      <Text
        accessibilityRole="header"
        style={[styles.sectionTitle, {marginBottom: spacing.sm}]}>
        Archived
      </Text>
      {archived.map(a => (
        <View key={a.id} style={styles.manageRow}>
          <Text style={[styles.metricLabel, {flex: 1}]}>{a.label}</Text>
          <Pressable
            onPress={() => {
              unarchiveMetric(a.id);
              onChange();
            }}
            style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>Restore</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function AddCustomMetricSheet({
  visible,
  onClose,
  accent,
  defaultElement,
}: {
  visible: boolean;
  onClose: () => void;
  accent: string;
  defaultElement?: ElementId;
}) {
  const [label, setLabel] = useState('');
  const [mode, setMode] = useState<InputMode>('integer');
  const [category, setCategory] = useState<MetricCategory>('custom');

  useEffect(() => {
    if (visible) {
      setLabel('');
      setMode('integer');
      setCategory('custom');
    }
  }, [visible]);

  const canSave = label.trim().length > 0;

  function save() {
    if (!canSave) {
      return;
    }
    addCustomMetric({
      label: label.trim(),
      category,
      unit: mode === 'mmss' ? 'seconds' : mode === 'integer' ? 'reps' : 'misc',
      inputMode: mode,
      element: defaultElement ?? 'any',
    });
    onClose();
  }

  return visible ? (
    <SheetLayer onClose={onClose}>
      <View style={styles.root}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            New Exercise
          </Text>
          <View style={styles.headerActions}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={!canSave}
              style={[
                styles.btn,
                styles.btnPrimary,
                {backgroundColor: accent},
                !canSave && styles.btnDisabled,
              ]}>
              <Text style={[styles.btnText, styles.btnTextPrimary]}>Add</Text>
            </Pressable>
          </View>
        </View>
        <ScrollView contentContainerStyle={{padding: spacing.lg}}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Name
          </Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="e.g. Squats, Brick Press, Shadow Box Round"
            placeholderTextColor={palette.textFaint}
            style={styles.notesInput}
          />
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, {marginTop: spacing.lg}]}>
            Category
          </Text>
          <View style={styles.dateRow}>
            {(['run', 'reps', 'hold', 'custom'] as MetricCategory[]).map(c => (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[
                  styles.chip,
                  category === c && styles.chipSel,
                  category === c && {
                    backgroundColor: accent,
                    borderColor: accent,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    category === c && styles.chipTextSel,
                  ]}>
                  {categoryLabel(c)}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            accessibilityRole="header"
            style={[styles.sectionTitle, {marginTop: spacing.lg}]}>
            Input type
          </Text>
          <View style={styles.dateRow}>
            {(
              [
                ['integer', 'Reps'],
                ['mmss', 'Time'],
                ['distance-time', 'Distance + time'],
              ] as Array<[InputMode, string]>
            ).map(([m, lbl]) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={[
                  styles.chip,
                  mode === m && styles.chipSel,
                  mode === m && {backgroundColor: accent, borderColor: accent},
                ]}>
                <Text
                  style={[styles.chipText, mode === m && styles.chipTextSel]}>
                  {lbl}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
    </SheetLayer>
  ) : null;
}

// ─── Helpers ────────────────────────────────────────────────────────

function startOfDay(epoch: number): number {
  const d = new Date(epoch);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function dayLabel(day: number, i: number): string {
  if (i === 0) {
    return 'Today';
  }
  if (i === 1) {
    return 'Yest';
  }
  return new Date(day).toLocaleDateString(undefined, {weekday: 'short'});
}

function isWithinQuickRange(epoch: number): boolean {
  const today = startOfDay(Date.now());
  const sel = startOfDay(epoch);
  const diff = today - sel;
  return diff >= 0 && diff <= 3 * MS_PER_DAY;
}

function formatPickedDate(epoch: number): string {
  return new Date(epoch).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function categoryLabel(c: MetricCategory): string {
  switch (c) {
    case 'run':
      return 'Cardio / Runs';
    case 'reps':
      return 'Reps';
    case 'hold':
      return 'Holds';
    case 'session':
      return 'Sessions';
    case 'custom':
      return 'Custom';
  }
}

function inputModeShort(m: InputMode): string {
  switch (m) {
    case 'mmss':
      return 'time';
    case 'integer':
      return 'reps';
    case 'distance-time':
      return 'dist + time';
    case 'decimal':
      return 'value';
  }
}

function inputLabel(kind: MetricKind): string {
  switch (kind.inputMode) {
    case 'mmss':
      return 'Time (HH:MM:SS)';
    case 'integer':
      return kind.unit === 'reps' ? 'Reps' : 'Count';
    case 'distance-time':
      return 'Distance + Time';
    case 'decimal':
      return 'Value';
  }
}

function groupByCategory(
  metrics: MetricKind[],
): Partial<Record<MetricCategory, MetricKind[]>> {
  const out: Partial<Record<MetricCategory, MetricKind[]>> = {};
  for (const m of metrics) {
    if (!out[m.category]) {
      out[m.category] = [];
    }
    out[m.category]!.push(m);
  }
  return out;
}

function hasValue(
  mode: InputMode,
  v: {
    valueSec: number;
    valueReps: number;
    distanceCenti: number;
    fixedDistance?: number;
  },
): boolean {
  switch (mode) {
    case 'mmss':
      return v.valueSec > 0;
    case 'integer':
    case 'decimal':
      return v.valueReps > 0;
    case 'distance-time':
      return (
        v.valueSec > 0 && ((v.fixedDistance ?? 0) > 0 || v.distanceCenti > 0)
      );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  // Header — compact, holds inline Save/Cancel/Delete.
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    gap: spacing.md,
  },
  title: {
    ...t.subtitle,
    fontSize: 18,
    color: palette.text,
    flex: 1,
  },
  headerGrade: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
  },
  headerGradeText: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  headerPaceText: {
    ...t.caption,
    color: palette.textDim,
    fontVariant: ['tabular-nums'],
  },
  portraitGradeRow: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  // Body
  bodyLandscape: {
    flex: 1,
    flexDirection: 'row',
  },
  bodyPortrait: {
    flex: 1,
    flexDirection: 'column',
  },
  leftCol: {
    width: 240,
    borderRightWidth: 1,
    borderRightColor: palette.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  leftColCompact: {
    width: 180,
    padding: spacing.sm,
  },
  leftColPortrait: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    // A fixed height: with only a max, the list inside collapsed to nothing.
    height: 150,
  },
  rightCol: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  rightColCompact: {
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rightColScrollContent: {
    padding: spacing.md,
    gap: spacing.md,
  },
  rightColPortrait: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseScroll: {
    flex: 1,
  },
  // Sections
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    ...t.caption,
    color: palette.textDim,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionAction: {
    ...t.caption,
    color: ELEMENTS.heart.color,
  },
  selectedKind: {
    ...t.caption,
    flex: 1,
    fontWeight: '700',
    marginHorizontal: spacing.sm,
  },
  // Exercise list
  catHeader: {
    ...t.caption,
    color: palette.textFaint,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    gap: spacing.sm,
  },
  metricRowSel: {
    backgroundColor: '#1a2030',
  },
  metricBulletText: {
    color: palette.textDim,
    fontSize: 14,
    width: 16,
    textAlign: 'center',
  },
  metricLabel: {
    ...t.body,
    color: palette.text,
    flex: 1,
  },
  metricMode: {
    ...t.caption,
    color: palette.textDim,
  },
  // Date row
  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.pill,
  },
  chipSel: {
    backgroundColor: ELEMENTS.heart.color,
    borderColor: ELEMENTS.heart.color,
  },
  chipText: {
    ...t.body,
    color: palette.text,
  },
  chipTextSel: {
    color: '#000',
    fontWeight: '700',
  },
  // Value + Notes layout
  valueNotesRowLand: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.lg,
  },
  valueNotesColPort: {
    flex: 1,
    flexDirection: 'column',
    gap: spacing.md,
  },
  valueColLand: {
    width: 280,
    gap: spacing.xs,
  },
  valueColCompact: {
    width: 220,
  },
  valueColPort: {
    gap: spacing.xs,
  },
  notesColLand: {
    flex: 1,
    gap: spacing.sm,
  },
  notesColPort: {
    flex: 1,
    gap: spacing.xs,
    minHeight: 100,
  },
  subLabel: {
    ...t.caption,
    color: palette.textDim,
    marginBottom: spacing.xs,
  },
  notesInput: {
    minHeight: 80,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: palette.text,
    textAlignVertical: 'top',
  },
  notesInputLand: {
    flex: 1,
    minHeight: 60,
  },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    alignSelf: 'flex-start',
  },
  gradeText: {
    ...t.title,
    fontSize: 22,
    fontWeight: '700',
  },
  paceText: {
    ...t.caption,
    color: palette.textDim,
    fontVariant: ['tabular-nums'],
  },
  // Buttons
  btn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: ELEMENTS.heart.color,
  },
  btnGhost: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  btnDanger: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.danger,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    ...t.body,
    color: palette.text,
    fontWeight: '600',
  },
  btnTextPrimary: {
    color: '#000',
  },
  // Manage sub-sheet
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    gap: spacing.md,
  },
  iconBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: palette.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: palette.border,
  },
  iconBtnText: {
    ...t.caption,
    color: palette.text,
  },
  helpText: {
    ...t.caption,
    color: palette.textDim,
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});
