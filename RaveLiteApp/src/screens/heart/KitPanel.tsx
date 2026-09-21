/**
 * Where you train, what is there, and what you carry.
 *
 * Places first, because that is how people already think about it — the
 * mat, the backyard, the streets — and because a low ceiling is true of
 * a basement, not of a person. Each place opens to its own tiles, only
 * the ones its kind offers, so no list is thirty long. What you carry is
 * claimed once, underneath, since it goes everywhere you do.
 *
 * Every tile still says what claiming it would unlock, because "15 drills
 * and the Pull track" teaches the idea faster than any paragraph.
 */
import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {Tap} from '../../components/Tap';
import {
  CARRIED_GROUPS,
  KIT_LABELS,
  LIMITS,
  PLACE_GROUPS,
  PLACE_KINDS,
  bestNext,
  hangOf,
  limitCost,
  newPlace,
  placeKind,
  placeName,
  toPlaces,
  unlockCount,
  usableDrills,
  withHang,
  withItem,
  withLimit,
  type Facts,
  type Hang,
  type KitItem,
  type LimitId,
  type Noise,
  type PlaceKind,
  type TrainingPlace,
} from '../../domain/profile/kit';
import {baseFacts, loadPacks, setFacts} from '../../domain/profile/repository';
import {Symbol, hueOf, type SymbolName} from '../../components/icons/Symbol';
import {tint} from '../../theme/hues';
import {ELEMENTS} from '../../theme/elements';
import {palette, radius, spacing, type as t} from '../../theme';

const NOISE: readonly {id: Noise; name: string; detail: string}[] = [
  {
    id: 'quiet',
    name: 'Quiet flat',
    detail: 'No jumping, skipping or staff — nothing the floor below hears.',
  },
  {id: 'normal', name: 'Normal', detail: 'Anything but the loudest work.'},
  {
    id: 'free',
    name: 'Free',
    detail: 'Jump, skip and spin a staff as you like.',
  },
];

const HANGS: readonly {id: Hang; name: string}[] = [
  {id: 'none', name: 'No'},
  {id: 'low', name: 'Feet touch'},
  {id: 'high', name: 'I hang clear'},
  {id: 'both', name: 'Both'},
];

/**
 * Kit is physical, so each piece takes the colour of the thing it is —
 * and the symbol name matches the kit id, so there is nothing to keep in
 * step.
 */
const kitSymbol = (item: KitItem): SymbolName => item as SymbolName;

const PLACE_SYMBOL: Readonly<Record<PlaceKind, SymbolName>> = {
  room: 'roomPlace',
  basement: 'basement',
  house: 'housePlace',
  desk: 'deskPlace',
  stairwell: 'stairwell',
  yard: 'yard',
  porch: 'porch',
  park: 'park',
  streets: 'streets',
  beach: 'beach',
};

/** Hanging is asked as a question, and a place's kind is not a tile. */
const NOT_A_TILE: ReadonlySet<KitItem> = new Set<KitItem>([
  'floor',
  'hangLow',
  'hangHigh',
  'yard',
  'streets',
  'park',
  'stairwell',
]);

/** The profile's facts as the panel edits them: places, and nothing a
 *  mode or the pack list stamps on top. */
function editable(): Facts {
  const facts: Facts = {...baseFacts()};
  delete facts.packs;
  delete facts.injured;
  return toPlaces(facts);
}

export function KitPanel() {
  const [facts, setLocal] = useState<Facts>(editable);
  const places = facts.places ?? [];
  // A lone place — a new install's one room — opens by itself, so the
  // first thing setup shows is tiles, not a list of one.
  const [open, setOpen] = useState<string | undefined>(() =>
    places.length === 1 ? places[0].id : undefined,
  );
  const [adding, setAdding] = useState(false);
  const [everything, setEverything] = useState(false);
  const [removing, setRemoving] = useState<string | undefined>();
  const accent = ELEMENTS.heart.accent;

  // Counted with the packs this person carries, so a tile never promises
  // dance drills to someone who switched dance off.
  const counting = useMemo<Facts>(
    () => ({...facts, packs: loadPacks()}),
    [facts],
  );
  const usable = useMemo(() => usableDrills(counting).length, [counting]);
  const perPlace = useMemo(
    () =>
      new Map(
        places.map(p => [
          p.id,
          usableDrills({...counting, places: [p]}).length,
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counting],
  );
  const best = useMemo(() => bestNext(counting), [counting]);

  const save = (next: Facts) => {
    setFacts(next);
    setLocal(next);
  };

  const toggleItem = (item: KitItem, placeId?: string) => {
    const place = places.find(p => p.id === placeId);
    const has = place ? place.kit.includes(item) : facts.kit.includes(item);
    save(withItem(facts, item, !has, placeId));
  };

  const setHang = (place: TrainingPlace, hang: Hang) =>
    save({
      ...facts,
      places: places.map(p => (p.id === place.id ? withHang(p, hang) : p)),
    });

  const toggleLimit = (place: TrainingPlace, id: LimitId) =>
    save(withLimit(facts, id, !place.limits.includes(id), place.id));

  const addPlace = (kind: PlaceKind) => {
    const place = newPlace(kind, places);
    save({...facts, places: [...places, place]});
    setAdding(false);
    setEverything(false);
    setOpen(place.id);
  };

  const removePlace = (place: TrainingPlace) => {
    if (removing !== place.id) {
      setRemoving(place.id);
      return;
    }
    save({...facts, places: places.filter(p => p.id !== place.id)});
    setRemoving(undefined);
    setOpen(undefined);
  };

  const setNoise = (noise: Noise) => save({...facts, noise});

  const tile = (
    item: KitItem,
    has: boolean,
    unlocks: number,
    onPress: () => void,
  ) => (
    <Tap
      key={item}
      testID={`kit-${item}`}
      variant="plain"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected: has}}
      accessibilityLabel={`${KIT_LABELS[item]}${
        has ? ', you have this' : `, would unlock ${unlocks} drills`
      }`}
      style={[
        styles.tile,
        has && {
          borderColor: hueOf(kitSymbol(item)),
          backgroundColor: tint(hueOf(kitSymbol(item))),
        },
      ]}>
      <View style={styles.tileInner}>
        <Symbol name={kitSymbol(item)} size={18} />
        <View style={styles.tileText}>
          <Text
            style={[styles.tileName, has && {color: hueOf(kitSymbol(item))}]}>
            {KIT_LABELS[item]}
          </Text>
          <Text style={styles.tileNote}>
            {has
              ? 'Yours'
              : unlocks > 0
              ? `+${unlocks} drills`
              : 'Adds nothing new'}
          </Text>
        </View>
      </View>
    </Tap>
  );

  const placeBody = (place: TrainingPlace) => {
    const spec = placeKind(place.kind);
    // What the kind offers, plus anything already here that it doesn't —
    // otherwise a tile ticked under "every tile" could never be unticked.
    const offered = [
      ...new Set([
        ...spec.offers,
        ...place.kit.filter(k => !NOT_A_TILE.has(k)),
      ]),
    ];
    const groups = everything
      ? PLACE_GROUPS.map(g => ({
          title: g.title,
          items: g.items.filter(i => !NOT_A_TILE.has(i)),
        }))
      : [{title: '', items: offered}];
    return (
      <View style={styles.placeBody}>
        {groups.map(group => (
          <View key={group.title || 'offered'} style={styles.group}>
            {group.title ? (
              <Text style={styles.groupTitle}>{group.title.toUpperCase()}</Text>
            ) : null}
            <View style={styles.tiles}>
              {group.items.map(item =>
                tile(
                  item,
                  place.kit.includes(item),
                  place.kit.includes(item)
                    ? 0
                    : unlockCount(item, counting, place.id),
                  () => toggleItem(item, place.id),
                ),
              )}
            </View>
          </View>
        ))}
        <Tap
          testID="kit-everything"
          variant="plain"
          onPress={() => setEverything(e => !e)}
          accessibilityRole="button"
          style={styles.link}>
          <Text style={styles.linkText}>
            {everything ? 'Only what a place like this has' : 'Show every tile'}
          </Text>
        </Tap>

        {spec.hangs || hangOf(place) !== 'none' ? (
          <>
            <Text style={styles.groupTitle}>SOMETHING TO HANG FROM HERE?</Text>
            <Text style={styles.caption}>
              Feet touch: rows and bent-knee hangs. Hang clear: pull-ups and leg
              raises.
            </Text>
            <View style={styles.pills}>
              {HANGS.map(option => {
                const on = hangOf(place) === option.id;
                return (
                  <Tap
                    key={option.id}
                    testID={`hang-${option.id}`}
                    variant={on ? 'solid' : 'ghost'}
                    color={on ? hueOf('hangHigh') : palette.textDim}
                    onPress={() => setHang(place, option.id)}
                    accessibilityRole="button"
                    accessibilityState={{selected: on}}
                    style={styles.pill}>
                    <Text style={[styles.pillText, on && styles.pillOn]}>
                      {option.name}
                    </Text>
                  </Tap>
                );
              })}
            </View>
          </>
        ) : null}

        <Text style={styles.groupTitle}>WHAT IT WON'T ALLOW</Text>
        <View style={styles.tiles}>
          {LIMITS.map(limit => {
            const on = place.limits.includes(limit.id);
            const costs = limitCost(limit.id, counting, place.id);
            return (
              <Tap
                key={limit.id}
                testID={`limit-${limit.id}`}
                variant="plain"
                onPress={() => toggleLimit(place, limit.id)}
                accessibilityRole="button"
                accessibilityState={{selected: on}}
                accessibilityLabel={`${limit.label}. ${limit.note}${
                  on ? '' : `. Would remove ${costs} drills`
                }`}
                style={[
                  styles.tile,
                  on && {
                    borderColor: hueOf('warning'),
                    backgroundColor: tint(hueOf('warning')),
                  },
                ]}>
                <View style={styles.tileInner}>
                  <Symbol name={limit.id} size={18} />
                  <View style={styles.tileText}>
                    <Text
                      style={[
                        styles.tileName,
                        on && {color: hueOf('warning')},
                      ]}>
                      {limit.label}
                    </Text>
                    <Text style={styles.tileNote}>
                      {on ? `−${costs} drills` : limit.note}
                    </Text>
                  </View>
                </View>
              </Tap>
            );
          })}
        </View>

        <Tap
          testID={`place-remove-${place.id}`}
          variant="ghost"
          color={removing === place.id ? palette.danger : palette.textDim}
          onPress={() => removePlace(place)}
          accessibilityRole="button"
          style={styles.remove}>
          <Text
            style={[
              styles.pillText,
              removing === place.id && {color: palette.danger},
            ]}>
            {removing === place.id
              ? 'Tap again to remove it'
              : 'Remove this place'}
          </Text>
        </Tap>
      </View>
    );
  };

  return (
    <View testID="kit-panel" style={styles.root}>
      <Text style={styles.eyebrow}>WHERE YOU TRAIN</Text>
      <Text style={styles.caption}>
        {usable} drills fit your places. A drill needs only one place that
        allows it, and what you carry goes to all of them.
      </Text>
      {best && best.count >= 3 ? (
        <Tap
          testID="kit-best"
          variant="plain"
          onPress={() => best.placeId && setOpen(best.placeId)}
          accessibilityRole="button"
          style={[styles.best, {borderColor: hueOf('idea')}]}>
          <View style={styles.tileInner}>
            <Symbol name="idea" size={18} />
            <Text style={styles.bestText}>
              Most would come from{' '}
              {KIT_LABELS[best.item].replace(/^A /, 'a ').toLowerCase()}
              {best.placeId
                ? ` at ${placeName(
                    places.find(p => p.id === best.placeId)!,
                  ).replace(/^(A|The) /, m => m.toLowerCase())}`
                : ''}
              : +{best.count} drills
            </Text>
          </View>
        </Tap>
      ) : null}

      {places.map(place => {
        const spec = placeKind(place.kind);
        const isOpen = open === place.id;
        const symbol = PLACE_SYMBOL[place.kind] ?? 'roomPlace';
        const holds = place.kit
          .filter(k => !NOT_A_TILE.has(k))
          .map(k => KIT_LABELS[k].replace(/^(A|An) /, '').toLowerCase());
        const hang = hangOf(place);
        if (hang !== 'none') {
          holds.push(hang === 'low' ? 'a low hang' : 'a hang');
        }
        const limits = LIMITS.filter(l => place.limits.includes(l.id)).map(l =>
          l.label.replace(/^A /, '').toLowerCase(),
        );
        return (
          <View
            key={place.id}
            style={[styles.place, isOpen && {borderColor: hueOf(symbol)}]}>
            <Tap
              testID={`place-${place.id}`}
              variant="plain"
              onPress={() => {
                setOpen(isOpen ? undefined : place.id);
                setEverything(false);
                setRemoving(undefined);
              }}
              accessibilityRole="button"
              accessibilityState={{expanded: isOpen}}
              accessibilityLabel={`${placeName(place)}, ${perPlace.get(
                place.id,
              )} drills`}
              style={styles.placeHead}>
              <View style={styles.tileInner}>
                <View
                  style={[
                    styles.badge,
                    {backgroundColor: tint(hueOf(symbol))},
                  ]}>
                  <Symbol name={symbol} size={20} />
                </View>
                <View style={styles.tileText}>
                  <Text style={[styles.placeName, {color: hueOf(symbol)}]}>
                    {placeName(place)}
                  </Text>
                  <Text style={styles.tileNote} numberOfLines={isOpen ? 3 : 1}>
                    {[
                      holds.length > 0
                        ? holds.join(', ')
                        : 'somewhere to stand',
                      ...limits.map(
                        l => `no ${l === 'low ceiling' ? 'height' : l}`,
                      ),
                    ].join(' · ')}
                  </Text>
                </View>
                <Text style={styles.count}>
                  {perPlace.get(place.id)}
                  {'\n'}
                  <Text style={styles.countUnit}>drills</Text>
                </Text>
              </View>
            </Tap>
            {isOpen ? (
              <>
                <Text style={[styles.caption, styles.inset]}>
                  {spec.detail}
                </Text>
                {placeBody(place)}
              </>
            ) : null}
          </View>
        );
      })}

      {adding ? (
        <View style={styles.kinds}>
          <Text style={styles.groupTitle}>WHAT KIND OF PLACE?</Text>
          <View style={styles.tiles}>
            {PLACE_KINDS.map(kind => (
              <Tap
                key={kind.id}
                testID={`kind-${kind.id}`}
                variant="plain"
                onPress={() => addPlace(kind.id)}
                accessibilityRole="button"
                accessibilityLabel={`${kind.name}. ${kind.detail}`}
                style={styles.tile}>
                <View style={styles.tileInner}>
                  <Symbol name={PLACE_SYMBOL[kind.id]} size={18} />
                  <View style={styles.tileText}>
                    <Text style={styles.tileName}>{kind.name}</Text>
                  </View>
                </View>
              </Tap>
            ))}
          </View>
          <Tap
            testID="places-add-cancel"
            variant="plain"
            onPress={() => setAdding(false)}
            accessibilityRole="button"
            style={styles.link}>
            <Text style={styles.linkText}>Not now</Text>
          </Tap>
        </View>
      ) : (
        <Tap
          testID="places-add"
          variant="ghost"
          color={accent}
          onPress={() => {
            setAdding(true);
            setOpen(undefined);
          }}
          accessibilityRole="button"
          style={styles.add}>
          <Text style={[styles.pillText, {color: accent}]}>+ Add a place</Text>
        </Tap>
      )}

      <Text style={styles.eyebrow}>WHAT YOU CARRY</Text>
      <Text style={styles.caption}>
        Things you can take anywhere. Each one counts in every place above.
      </Text>
      {CARRIED_GROUPS.map(group => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title.toUpperCase()}</Text>
          <View style={styles.tiles}>
            {group.items.map(item => {
              const has = facts.kit.includes(item);
              return tile(
                item,
                has,
                has ? 0 : unlockCount(item, counting),
                () => toggleItem(item),
              );
            })}
          </View>
        </View>
      ))}

      <Text style={styles.eyebrow}>HOW LOUD YOU CAN BE</Text>
      <View style={styles.pills}>
        {NOISE.map(option => {
          const on = facts.noise === option.id;
          return (
            <Tap
              key={option.id}
              testID={`noise-${option.id}`}
              variant={on ? 'solid' : 'ghost'}
              color={on ? accent : palette.textDim}
              onPress={() => setNoise(option.id)}
              accessibilityRole="button"
              accessibilityState={{selected: on}}
              style={styles.pill}>
              <Text style={[styles.pillText, on && styles.pillOn]}>
                {option.name}
              </Text>
            </Tap>
          );
        })}
      </View>
      <Text style={styles.caption}>
        {NOISE.find(n => n.id === facts.noise)?.detail}
      </Text>
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
    marginTop: spacing.sm,
  },
  caption: {
    ...t.caption,
    color: palette.textMuted,
    lineHeight: 17,
  },
  inset: {
    paddingHorizontal: spacing.md,
  },
  best: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: palette.surface,
  },
  bestText: {
    ...t.body,
    color: palette.text,
    flex: 1,
  },
  place: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    overflow: 'hidden',
  },
  // A column card, not a row: Tap wraps its children in one inner view,
  // and a row container would shrink that view to nothing.
  placeHead: {
    padding: spacing.md,
    minHeight: 64,
    justifyContent: 'center',
  },
  placeName: {
    ...t.subtitle,
  },
  placeBody: {
    gap: spacing.sm,
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    ...t.subtitle,
    color: palette.text,
    textAlign: 'right',
  },
  countUnit: {
    ...t.caption,
    color: palette.textMuted,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    ...t.caption,
    color: palette.textMuted,
    letterSpacing: 1.5,
    marginTop: spacing.xs,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '47%',
    minHeight: 60,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.bg,
  },
  tileInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  tileText: {
    flex: 1,
  },
  tileName: {
    ...t.body,
    color: palette.text,
  },
  tileNote: {
    ...t.caption,
    color: palette.textMuted,
  },
  kinds: {
    gap: spacing.sm,
  },
  add: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remove: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  link: {
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    ...t.caption,
    color: palette.textDim,
    textDecorationLine: 'underline',
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    ...t.caption,
    color: palette.textDim,
  },
  pillOn: {
    color: palette.bg,
    fontWeight: '700',
  },
});
