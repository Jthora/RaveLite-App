# Integration Map

How the Always-On surface plugs into the existing app without
rebuilding what's already there.

## What already exists (verified)

| Subsystem        | File                                              | Used by AOS as            |
| ---------------- | ------------------------------------------------- | ------------------------- |
| Plan domain      | `src/domain/reminders/` (`planMutations`, `expandPlan`, `nextFire`) | source of scheduled pulses |
| Notifee scheduler | `src/domain/reminders/notifeeScheduler.ts`        | fires ambient cues        |
| Journal          | `src/domain/journal/journal.ts`                   | sole write log            |
| Stats            | `src/domain/journal/stats.ts`                     | extends with adherence math |
| Circuit chamber  | `src/components/CircuitChamber.tsx`               | launched on certain pulses |
| Custom circuits  | `src/domain/circuit/`                             | optional pulse payload    |
| Element identity | `src/theme/elements.ts`                           | colors, glyphs, sounds    |
| Tap component    | `src/components/Tap.tsx`                          | giant CTA targets         |
| MiniSparkline    | `src/components/MiniSparkline.tsx`                | trend chips on goal panel (removed 2026-09-14) |

## What gets added

### New screen

`src/screens/AlwaysOnScreen.tsx` — top-level. Decision pending on
whether it sits inside Heart's sub-tab strip or earns its own
primary tab in `subTabRegistry.ts`.

> **2026-09-14:** superseded. There is no sub-tab strip or registry; Heart
> is one page (Today). See [../10-today-home.md](../10-today-home.md).

### New domain folders

- `src/domain/ambient/` — ephemeral pulse queue, session control,
  tone map.
- `src/domain/pft/` — standards tables, grading, attempts.

### New components

- `src/components/aos/NowCard.tsx`
- `src/components/aos/UpcomingStrip.tsx`
- `src/components/aos/ActivityLog.tsx`
- `src/components/aos/AdherenceRings.tsx`
- `src/components/aos/PFTGoalPanel.tsx`

### New native-side concerns

- **Wake-lock / keep-awake** while page is foregrounded **and** plugged
  in. Use `react-native-keep-awake` or equivalent; gate on
  `Battery.isCharging`.
- **Audio playback** of element cue tones. Decide between
  `react-native-sound` and the `expo-av` equivalent during
  implementation.
- **Foreground service** notification on Android so the OS does
  not aggressively kill the app while the screen is on but the
  operator hasn't touched it. ⚠ requires manifest changes.

## Wiring diagram (high-level)

```
   PlanPanel ──writes──▶ plan.current ◀──reads── expandPlan
                                              │
                                              ▼
                              ┌─────────  pulseQueue (ambient) ─────────┐
                              │                                          │
                          fireAt    ┌─── notifeeScheduler ──┐  cue play  │
                              │     │                        │           │
                              ▼     ▼                        ▼           │
                        ┌──────────────────────┐         AlwaysOnScreen  │
                        │   journal (append)   │ ◀──── operator taps ────┘
                        └──────────────────────┘
                              │
                              ▼
                            stats.ts (adherence, ttR)
                              │
                              ▼
                        Insights / AOS rings
```

## Cross-talk rules

- **AOS does not own the plan.** Editing happens only in
  `PlanPanel`. AOS reads the same plan and shows the upcoming list
  derived from it.
- **AOS does not own the notification.** It listens for fire events
  and presents the now-card. The notifeeScheduler still posts the
  OS-level notification (so screen-off / app-killed cases still work).
- **AOS is the only writer of `reminder.skipped` / `.snoozed` /
  `.ignored`.** The notifeeScheduler writes `.fired`. The journal
  is append-only; resolution is a *new* entry, not a mutation.
- **The CircuitChamber is invoked, not embedded.** AOS keeps its own
  layout; circuits open as a modal overlay using the existing
  component instance pattern.

## Migration / compatibility

- The journal schema gains four new `kind` values. Existing
  consumers (today's `stats.ts`, `Insights`) ignore unknown kinds
  via the `isCompletion` type guard.
- Adding `pulseId` and `respondedAfterMs` to `CompletionEntry` is
  backward-compatible (both optional).
- No data migration required for the operator's current journal.

## Foreground-service / always-on caveats (Android)

- Vendor "battery optimization" features (Samsung especially) will
  attempt to put the app to sleep. Document the manual whitelisting
  step in the in-app settings panel so the operator's tablet stays
  responsive.
- Plug-in detection should drive the wake-lock; on unplug, fall back
  to OS screen-timeout.
