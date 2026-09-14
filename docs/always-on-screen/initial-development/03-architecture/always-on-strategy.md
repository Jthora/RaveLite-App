# Always-On / Wake / Sound Strategy

The technical playbook for keeping RaveLite chiming on a desk-mounted
phone all day, making cues that are actually heard, and feeling alive
without becoming a battery-drain villain or a distraction.

> **Rewritten 2026-09-14** to match what was built (branch
> `alive-ui-chimes`, Phases 0–4). The earlier Live / Calm / Idle mode
> design, `react-native-sound` recommendation and quiet-hours window
> were superseded. Nothing here has been verified on a device yet.

## Screen

- **Owner:** `MainActivity.kt` sets `FLAG_KEEP_SCREEN_ON` for the whole
  app. No screen toggles it off; `@sayem314/react-native-keep-awake` is
  no longer used (its `deactivate` cleared the app-wide flag).
- **Night mode** (`src/domain/ambient/screenPolicy.ts`): outside active
  hours the screen stays on but the window backlight drops to 0.02,
  `NightVeil` darkens the UI and motion rests. A tap wakes it for two
  minutes; the veil swallows that tap so nothing underneath is pressed.
  The brightness override is re-applied when the app returns to the
  foreground.
- The phone is expected to be on its charger; plug detection is not
  built.

## Staying alive

- **Foreground service** (`ambientLifecycle.ts` + `foregroundService.ts`):
  runs app-wide whenever paging is allowed (inside active hours, not
  paused), checked every minute. It keeps the JS runtime and its timers
  alive in the background.
- **Backup chimes** (`backupPlanner.ts` + `backupScheduler.ts`): for every
  chime due in the next 14 h (cap 40), the OS holds an exact-alarm
  notification 90 s after it is due, sharing the pulse's id. The live
  runtime cancels a backup the moment its pulse comes due. App alive →
  one chime; app killed → the backup ~90 s late, with the same buttons.
  `USE_EXACT_ALARM` is declared (the app is sideloaded).
- **Stay Alive checklist** (Heart › Settings): notifications, exact
  alarms, battery restrictions, HyperOS Autostart, alarm volume, locked
  in recents, on charger — with a button to the fixing system screen, or
  "Mark done" for what Android can't report.

## Audio cues

### Catalog

One cue per element, ≤ 1.2 s, 16-bit mono WAV at 44.1 kHz with 30 ms of
leading silence (avoids first-play clipping), in
`RaveLiteApp/android/app/src/main/res/raw/cue_<element>.wav`.

| Element | Character                       |
| ------- | ------------------------------- |
| fire    | Three rising staccato beeps     |
| air     | One high bell ding              |
| earth   | Low bloop that drops            |
| water   | Two bubbly rising bloops        |
| heart   | Lub-dub under a two-note chime  |

### Playback

- Native module `RaveLiteDevice` (Kotlin, `android/.../device/`):
  SoundPool on `USAGE_ALARM`, samples preloaded, transient ducking audio
  focus so other audio (e.g. TikTok) dips for the cue.
- Routing (`cueVolume.chooseCueRoute`):
  - **alarm** (default): play in-app on the alarm stream, then post the
    notification on the quiet channel `elem.<el>.quiet.v1`. If playback
    fails, post on the sounding channel `elem.<el>.v3` instead.
  - **channel**: "Respect Do Not Disturb" is on and DND is active — post
    on the sounding channel and let the OS mute it.
  - **silent**: the element's cue is set to Off — quiet channel,
    vibration only.
- Loudness follows alarm volume (the Chimes panel warns at 0).

### Volume model

- Master cue volume in `KEYS.ambientToneVolumeMaster` (0–100, default 75).
- Per-element levels in `KEYS.ambientToneVolumeForElement(el)` (0–100,
  multiplicative on master).
- No quiet-hours window: outside active hours pulses are suppressed.

## Haptic policy

- Each element channel carries its own vibration pattern
  (`VIBRATION_PATTERNS`), so a chime buzzes with its element's signature.
- No haptic for snooze / skip / done resolutions (avoid double-buzz).

## Visual cue policy — the alive layer

- **One clock** (`src/lib/aliveClock.ts`): native-driver Animated values
  every consumer reads, so the UI moves in phase with no per-frame JS.
  Breathing is a linear loop at 10 BPM idle, 24 BPM (0.4 Hz) while a
  pulse is active.
- **Budgets** (`src/lib/aliveMath.ts`): Whisper 2–5 % (default), Glow
  4–9 %, Still (no breathing). Breathing is stepped so Android only
  redraws on an opacity change. Touches add up to +4–6 %. Forced off by
  Android "Remove animations", night mode, or a manual pause.
- **Surfaces:** `AliveAura` behind each screen (static element glow + a
  breathing layer), the focused element's rail bloom, the active chime
  card's border, and `CueWash` — a ≤ 14 % element-colored wash when a
  chime fires (≤ 8 % when motion rests) and a softer one on entering an
  element.
- **Beat recognizer seam:** `aliveDriver` (`onBeat`, `onTempo`). Feed it
  onsets and tempo events; never call it per frame.

## Not built yet

- Plug detection and a low-battery motion fallback.
- A guided first-run flow for the OS settings (the Stay Alive checklist
  covers them for now).

## Device verification

To confirm on the Redmi A3 after `yarn android`: screen stays on after
leaving Always-On; cues audible with the ringer silent and notification
volume 0; DND behavior with and without Respect DND; one chime (not two)
with the app alive and a backup chime after swiping it away; no burst of
stale chimes after a reboot; night dim and tap-to-wake; idle redraw rate
(`dumpsys gfxinfo`) and temperature after hours on the charger.
