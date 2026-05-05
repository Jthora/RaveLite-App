# Always-On / Wake / Sound Strategy

The technical playbook for keeping the dashboard responsive on a
desk for hours, while playing element cues, without becoming a
battery-drain villain or fighting the OS.

## Modes

The surface operates in three modes; mode is derived, not toggled.

| Mode      | Trigger                                  | Behavior                                  |
| --------- | ---------------------------------------- | ----------------------------------------- |
| **Live**  | Page foregrounded **and** plugged in     | Wake-lock on, full audio cues, full motion |
| **Calm**  | Page foregrounded, on battery            | OS screen-timeout respected, audio + cues only when screen on |
| **Idle**  | Page backgrounded **or** screen off      | No wake-lock. Notifee handles the cue at OS level. |

Mode transitions are reactive to:

- `AppState` change events.
- `Battery.isCharging` change events (RN-level lib needed).
- Hardware power-button press → screen-off (the OS handles; we just
  don't fight it).

## Wake-lock implementation

- Library: `@sayem314/react-native-keep-awake` or
  `react-native-keep-awake` (pick during implementation; both are
  thin wrappers over `FLAG_KEEP_SCREEN_ON`).
- Engaged: in `useEffect` on the AlwaysOnScreen mount when
  mode === Live.
- Released: on unmount, on AppState→background, on unplug.
- Never engaged when the app is backgrounded.

## Foreground service (Android)

Required if the operator wants the surface to stay alive past
Android's idle/Doze enforcement.

- Channel: `com.raveliteapp.ambient` (separate from existing pulse
  channel).
- Notification text: `"Always-On session active · tap to return"`.
- Started: when entering Live mode.
- Stopped: on leaving Live mode, on screen-lock, on unplug.
- The notification surface is **persistent and dismissible only by
  ending the session**, per Android FGS rules.

## Audio cues

### Catalog

One cue per element, ≤ 1.2 s, mono OGG/WAV at 44.1 kHz / 16-bit.

| Element | Slot              | Suggested character                    |
| ------- | ----------------- | -------------------------------------- |
| air     | `cue_air.ogg`     | High, bright, rising 5th               |
| fire    | `cue_fire.ogg`    | Mid, percussive, sharp                 |
| earth   | `cue_earth.ogg`   | Low, woody, single thunk               |
| water   | `cue_water.ogg`   | Mid, fluid glissando descending        |
| heart   | `cue_heart.ogg`   | Magenta-pink chord, soft envelope      |

Asset bin: `RaveLiteApp/android/app/src/main/res/raw/` and the iOS
equivalent. Cross-platform path resolution handled by
`src/domain/ambient/tones.ts`.

### Playback library

Pick one during implementation:

- `react-native-sound` — battle-tested, Android + iOS, simple API.
- `react-native-track-player` — overkill for ≤ 1.2-s cues.
- Native `SoundPool` via a small native module — best for low
  latency, most work.

Default recommendation: `react-native-sound` for v1.

### Volume model

- Master cue volume per device in
  `KEYS.ambientToneVolume('master')` (0–100).
- Per-element overrides in `KEYS.ambientToneVolume(element)` (0–100,
  multiplicative on master).
- Quiet hours window in `KEYS.ambientQuietHours`. During quiet hours
  master volume is forced to 0, but haptic + visual cue still fire.

## Haptic policy

- All cues fire a **short tap** haptic via the existing tap helper.
- During Quiet hours, the haptic is the *only* non-visual cue.
- No haptic for snooze/skip/done resolutions (avoid double-buzz).

## Visual cue policy

- A pulse arriving fades the now-card from "idle countdown" state
  to "active" state over 250 ms.
- The element accent pulses at ~0.4 Hz while the card is active.
- Idle background luminance ≤ 10% to avoid bleed into peripheral
  vision.

## Battery-aware fallbacks

When `Battery.level < 0.20` and not charging:

- Wake-lock disabled regardless of foreground state.
- Audio cues continue (per quiet-hours rules) but motion is reduced
  (no 0.4 Hz pulse; static element-color border instead).
- A small badge surfaces at the corner of the card: `LOW BATTERY`.

## Plug-detect fallback

If plug-detect lib is unreliable on the operator's specific tablet:

- Allow a manual `Live` lock via a long-press on the page header.
- The lock auto-releases at end of day or on screen-off.
- Document that the operator is responsible for not running this on
  battery for hours.

## OS quirks to document for operator

- **Samsung "Sleeping apps"** list — RaveLite must be excluded.
- **Adaptive battery** — disable for the app on the dev tablet.
- **Do Not Disturb** — DND will mute cue audio but not haptic +
  visual; document this so the operator doesn't think the app is
  broken.
- **Battery saver** — automatically forces Calm mode regardless of
  charging state; surfaced as a small "BATTERY SAVER" pill on the card.
