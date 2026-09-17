/**
 * Weather — where you are, today's sun, the next hours, and how the day
 * bends to them. Opened from Today's conditions line or Settings.
 *
 * The place is typed (Open-Meteo's place search) or detected once with
 * coarse location, and stored rounded to about 10 km.
 */
import React, {useEffect, useState} from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {formatHM} from '../../components/ambient/format';
import {Tap} from '../../components/Tap';
import {
  clockHM,
  formatDayLength,
  formatTemp,
} from '../../domain/conditions/format';
import type {PlaceResult} from '../../domain/conditions/location';
import {
  SHORT_DAY_MIN,
  localNoon,
  seasonAt,
  sunTimes,
} from '../../domain/conditions/sun';
import {
  conditionsFor,
  detectPlace,
  getFetchReport,
  type FetchReport,
  getForecast,
  getPlace,
  getWeatherPrefs,
  isBuggyDay,
  refreshForecast,
  searchPlaces,
  setBuggyToday,
  setPlace,
  setWeatherPrefs,
  subscribeWeather,
} from '../../domain/conditions/weather';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const HOUR_MS = 3_600_000;
const NEXT_HOURS = 12;

type Busy = 'search' | 'detect' | 'refresh';

/** "Updated 14:58" — or what stopped it, so a blank screen is never a mystery. */
function fetchLine(
  report: FetchReport | undefined,
  fetchedAt: number | undefined,
): string {
  if (!report && fetchedAt === undefined) {
    return 'No forecast yet — it fetches on its own.';
  }
  if (report && !report.ok) {
    const had = fetchedAt
      ? ` Showing the one from ${formatHM(fetchedAt)}.`
      : '';
    return `Last try ${formatHM(report.at)} failed: ${report.why}.${had}`;
  }
  return `Updated ${formatHM(fetchedAt ?? report!.at)}.`;
}

export function WeatherSheet({visible, onClose}: Props) {
  const [, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[] | undefined>();
  const [busy, setBusy] = useState<Busy | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  useEffect(() => subscribeWeather(() => setVersion(v => v + 1)), []);

  const accent = ELEMENTS.heart.accent;
  const now = Date.now();
  const place = getPlace();
  const prefs = getWeatherPrefs();
  const forecast = getForecast();
  const report = getFetchReport();
  const sun = place
    ? sunTimes(localNoon(now), place.lat, place.lon)
    : undefined;
  const hours = forecast
    ? forecast.hours.filter(h => h.ts + HOUR_MS > now).slice(0, NEXT_HOURS)
    : [];

  const onSearch = async () => {
    setBusy('search');
    setMessage(undefined);
    try {
      const found = await searchPlaces(query);
      setResults(found);
      if (found.length === 0) {
        setMessage(
          `No town called “${query.trim()}”. Try the town name on its own.`,
        );
      }
    } catch {
      setResults(undefined);
      setMessage("Couldn't reach the place search. Check the connection.");
    } finally {
      setBusy(undefined);
    }
  };

  const onPick = (result: PlaceResult) => {
    setPlace({...result, source: 'typed'});
    setResults(undefined);
    setQuery('');
    setMessage(undefined);
  };

  const onDetect = async () => {
    setBusy('detect');
    setMessage(undefined);
    try {
      const out = await detectPlace();
      if (!out.ok) {
        setMessage(
          out.reason === 'denied'
            ? 'Location not allowed. Type a town instead.'
            : out.reason === 'off'
            ? 'Location is switched off on the phone. Turn it on in Settings, or type a town.'
            : "Couldn't get a fix. Try again outside, or type a town.",
        );
      }
    } finally {
      setBusy(undefined);
    }
  };

  const onRefresh = async () => {
    setBusy('refresh');
    const result = await refreshForecast({force: true});
    setBusy(undefined);
    setMessage(
      result === 'failed'
        ? "Couldn't reach the forecast. It tries again every few hours."
        : undefined,
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={[styles.title, {color: accent}]}>Weather</Text>
          <Tap
            variant="plain"
            onPress={onClose}
            accessibilityRole="button"
            style={styles.close}>
            <Text style={styles.closeText}>Close</Text>
          </Tap>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.eyebrow}>YOUR PLACE</Text>
            <Text testID="weather-place" style={styles.cardTitle}>
              {place ? place.name : 'Not set'}
            </Text>
            <Text style={styles.caption}>
              {place
                ? `${place.region ? `${place.region} · ` : ''}${
                    place.source === 'detected' ? 'Detected' : 'Typed'
                  } · rounded to about 10 km`
                : 'Sunrise, rain, heat and bugs all need a rough place.'}
            </Text>
            <View style={styles.searchRow}>
              <TextInput
                testID="weather-search"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={onSearch}
                placeholder="Type a town"
                placeholderTextColor={palette.textMuted}
                returnKeyType="search"
                autoCorrect={false}
                style={styles.input}
              />
              <Tap
                variant="ghost"
                color={accent}
                onPress={onSearch}
                disabled={busy !== undefined || query.trim().length < 2}
                accessibilityRole="button"
                style={styles.button}>
                <Text style={[styles.buttonText, {color: accent}]}>
                  {busy === 'search' ? '…' : 'Search'}
                </Text>
              </Tap>
            </View>
            {results?.map(result => (
              <Tap
                key={`${result.lat},${result.lon}`}
                variant="plain"
                color={accent}
                onPress={() => onPick(result)}
                accessibilityRole="button"
                style={styles.result}>
                <View>
                  <Text style={styles.resultName}>{result.name}</Text>
                  {result.region ? (
                    <Text style={styles.caption}>{result.region}</Text>
                  ) : null}
                </View>
              </Tap>
            ))}
            <Tap
              testID="weather-detect"
              variant="ghost"
              color={palette.textDim}
              onPress={onDetect}
              disabled={busy !== undefined}
              accessibilityRole="button"
              style={styles.button}>
              <Text style={styles.buttonText}>
                {busy === 'detect' ? 'Finding you…' : 'Use my location'}
              </Text>
            </Tap>
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {place ? (
              <Text testID="weather-report" style={styles.caption}>
                {fetchLine(report, forecast?.fetchedAt)}
              </Text>
            ) : null}
          </View>

          {place && sun ? (
            <View style={styles.card}>
              <Text style={styles.eyebrow}>TODAY</Text>
              <View style={styles.facts}>
                <Fact
                  label="First light"
                  value={sun.civilDawn ? clockHM(sun.civilDawn) : '—'}
                />
                <Fact
                  label="Sunrise"
                  value={sun.sunrise ? clockHM(sun.sunrise) : '—'}
                />
                <Fact
                  label="Sunset"
                  value={sun.sunset ? clockHM(sun.sunset) : '—'}
                />
                <Fact
                  label="Daylight"
                  value={formatDayLength(sun.dayLengthMin)}
                />
              </View>
              <Text style={styles.caption}>
                {capitalize(seasonAt(now, place.lat))}
                {sun.dayLengthMin < SHORT_DAY_MIN ? ' · short days' : ''}
                {' · '}
                {forecast
                  ? `forecast from ${clockHM(forecast.fetchedAt)}`
                  : 'no forecast yet'}
              </Text>
              {hours.map(hour => {
                const c = conditionsFor(hour.ts);
                const flags = [
                  c?.dark ? 'dark' : undefined,
                  c?.icy ? 'icy' : undefined,
                  c?.heat === 'danger'
                    ? 'too hot'
                    : c?.heat === 'caution'
                    ? 'hot'
                    : undefined,
                ].filter(Boolean);
                return (
                  <View key={hour.ts} style={styles.hour}>
                    <Text style={styles.hourTime}>{clockHM(hour.ts)}</Text>
                    <Text style={styles.hourTemp}>
                      {formatTemp(hour.tempC, prefs.units)}
                    </Text>
                    <Text
                      style={[
                        styles.hourCell,
                        (c?.rain ?? false) && {color: ELEMENTS.water.color},
                      ]}>
                      rain {hour.rainChance}%
                    </Text>
                    <Text
                      style={[
                        styles.hourCell,
                        c?.bugs === 'high' && {color: ELEMENTS.air.color},
                      ]}>
                      bugs {c?.bugs ?? '—'}
                    </Text>
                    <Text style={styles.hourFlags}>{flags.join(' · ')}</Text>
                  </View>
                );
              })}
              <Tap
                variant="ghost"
                color={palette.textDim}
                onPress={onRefresh}
                disabled={busy !== undefined}
                accessibilityRole="button"
                style={styles.button}>
                <Text style={styles.buttonText}>
                  {busy === 'refresh' ? 'Refreshing…' : 'Refresh forecast'}
                </Text>
              </Tap>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.eyebrow}>HOW THE DAY BENDS</Text>
            <Toggle
              title="Buggy today"
              detail="Treat today as buggy, whatever the estimate says."
              on={isBuggyDay(now)}
              onPress={() => setBuggyToday(!isBuggyDay(now))}
              accent={accent}
            />
            <Toggle
              title="Move yard work inside when buggy"
              detail="Stretches and balance go inside; runs and staff flow stay out, with repellent."
              on={prefs.bugsMoveInside}
              onPress={() =>
                setWeatherPrefs({bugsMoveInside: !prefs.bugsMoveInside})
              }
              accent={accent}
            />
            <Toggle
              title="Run in the dark"
              detail={
                prefs.runInDark
                  ? 'On — dark runs stay, with a headlamp and reflective gear reminder.'
                  : 'Off — before first light, the run becomes indoor Fire work.'
              }
              on={prefs.runInDark}
              onPress={() => setWeatherPrefs({runInDark: !prefs.runInDark})}
              accent={accent}
            />
            <Toggle
              title="Fahrenheit"
              detail={prefs.units === 'F' ? 'Showing °F.' : 'Showing °C.'}
              on={prefs.units === 'F'}
              onPress={() =>
                setWeatherPrefs({units: prefs.units === 'F' ? 'C' : 'F'})
              }
              accent={accent}
            />
          </View>

          <Text style={styles.footnote}>
            Rain, heat and ice move yard work inside or swap it for indoor
            drills that fit a low ceiling; nothing that needs running, hanging,
            jumping or staff flow is sent indoors. Hot days add hourly water
            calls and raise the Drink target. The bug level is an estimate from
            warmth, humidity, wind, recent rain and dawn or dusk. Your place is
            only sent to Open-Meteo, rounded to about 10 km.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const capitalize = (word: string) =>
  word.charAt(0).toUpperCase() + word.slice(1);

function Fact({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.fact}>
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function Toggle({
  title,
  detail,
  on,
  onPress,
  accent,
}: {
  title: string;
  detail: string;
  on: boolean;
  onPress: () => void;
  accent: string;
}) {
  return (
    <Tap
      variant="plain"
      color={accent}
      accessibilityRole="switch"
      accessibilityState={{checked: on}}
      onPress={onPress}
      style={styles.toggle}>
      <View style={styles.toggleRow}>
        <View style={styles.toggleCopy}>
          <Text style={styles.toggleTitle}>{title}</Text>
          <Text style={styles.caption}>{detail}</Text>
        </View>
        <Text
          style={[styles.toggleState, {color: on ? accent : palette.textDim}]}>
          {on ? 'ON' : 'OFF'}
        </Text>
      </View>
    </Tap>
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
    gap: spacing.md,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  eyebrow: {
    ...t.caption,
    color: palette.textDim,
    letterSpacing: 1.5,
  },
  cardTitle: {
    ...t.subtitle,
    color: palette.text,
  },
  caption: {
    ...t.caption,
    color: palette.textDim,
    lineHeight: 17,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 48,
    color: palette.text,
    backgroundColor: palette.bg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  button: {
    minHeight: 48,
    minWidth: 88,
    borderRadius: radius.pill,
  },
  buttonText: {
    ...t.subtitle,
    fontSize: 15,
    color: palette.text,
  },
  result: {
    minHeight: 48,
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
    paddingVertical: spacing.xs,
  },
  resultName: {
    ...t.body,
    color: palette.text,
  },
  message: {
    ...t.caption,
    color: palette.danger,
    lineHeight: 17,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  fact: {
    width: '50%',
  },
  factLabel: {
    ...t.caption,
    color: palette.textDim,
  },
  factValue: {
    ...t.subtitle,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  hour: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  hourTime: {
    ...t.caption,
    width: 44,
    color: palette.textDim,
    fontVariant: ['tabular-nums'],
  },
  hourTemp: {
    ...t.caption,
    width: 34,
    color: palette.text,
    fontVariant: ['tabular-nums'],
  },
  hourCell: {
    ...t.caption,
    width: 64,
    color: palette.textDim,
    fontVariant: ['tabular-nums'],
  },
  hourFlags: {
    ...t.caption,
    flex: 1,
    color: palette.textDim,
    textAlign: 'right',
  },
  toggle: {
    minHeight: 48,
    borderRadius: radius.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleCopy: {
    flex: 1,
  },
  toggleTitle: {
    ...t.body,
    color: palette.text,
  },
  toggleState: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  footnote: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 17,
  },
});
