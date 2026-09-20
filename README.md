# RaveLite

A training app that chimes. It spreads small sets of bodyweight work
across your day, asks for water, teaches drills it explains properly, and
keeps a character sheet of what all that has made of you — organised
around five elements.

Android, React Native, no account, no server, no analytics. It is one
person's app, opened up: **beta, no support promised.**

> **For Ravers and Super Heroes** — training to be fit for the rave,
> ready for intensive dancing, able to defend yourself, and of balanced
> and positively energised spirit.

## Why RaveLite exists

RaveLite is **not** a fitness app, a habit tracker, or a notification
scheduler. Those are surface mechanics. The intent is older and more
specific:

> **A ritual companion for the raver as urban shaman — a five-element
> altar that lives in the pocket and reclaims a desk-broken body for
> ecstatic practice.**

Three working principles follow from that, and every design decision in
this repo should be checked against them:

1. **The body is the instrument.** Posture correction (UCS, APT,
   chronic abdominal gripping), PFT preparation, and staff/sword flow
   arts are in service of being a sharper somatic instrument for raving,
   music, and presence. Fitness is means, not end. Ecstatic embodiment
   is the end.
2. **The five elements are a felt vocabulary, not a theme skin.**
   Breath and upper-body openness live in **Air**. Core and pelvic
   rooting live in **Earth**. Flow, fascia and hydration live in
   **Water** (no pool required). Capacity and output live in **Fire**.
   **Heart** conducts. Naming the work in
   element-language teaches the body to *know* what it is doing before
   the mind reads the screen.
3. **Reminders are invocations, not nags.** A pulse every 30 minutes
   that says "Air" is a temporal anchor calling the body back into
   practice — closer to a temple bell or a metronome than to a Slack
   ping. Vibration patterns are *element-specific*: the body learns to
   recognize the call without looking.

When in doubt: choose the option that feels more like a rite and less
like a productivity tool. Choose felt-sense (color, glyph, haptic)
before text. Choose continuous presence (foreground keep-awake, ambient
pulse) over transactional taps.

One amendment from use: the buttons say **Done**, not "seal" or
"ignite". Answering a chime twenty times a day wants a word you don't
have to translate. The ceremony lives in the colours, the glyphs, the
cues and the element language — not in the verbs.

## What it actually does

- **One home screen.** The chime that is due, five element counts, the
  water counter, today's sets, and the day's list. Everything else opens
  from there as a sheet.
- **Chimes across the day.** About twenty on a full day: rounds of small
  sets, water calls, two meal check-ins, a morning intent and an evening
  review. Each one can be answered from the notification — Done, +5,
  Skip — with the app closed.
- **Daily Sets.** Seventeen tracks (push, pull, row, squat, core, hangs,
  posture, breath, mobility, stillness, pelvis, kick range, flow…) each
  prescribing sets at about half your tested max, spread over the day.
  They climb when you keep up, hold when you don't, and back off after a
  break — automatically.
- **A morning block that changes by day.** Kicks and flips on Monday,
  dance basics on Thursday, strikes and stances on Friday, runs on
  Tuesday and Wednesday, a fitness test on Saturday.
- **Practice, counted.** Pick a skill — roundhouse kick, toprock, cloud
  hands — and tap out reps or 8-counts while a clock runs.
- **Goals.** The USAF, Space Force, Marine and MARSOC events graded from
  the passing minimum to the maximum, plus marks of the app's own for
  breath, balance, mobility and stillness. Log a test and it projects
  when you'll reach the target.
- **A character sheet.** Fifteen attributes on a grid of five elements ×
  three modalities, growing from what you actually log: harder as they
  rise, capped at 85 until a test says otherwise, and sliding if you
  neglect them.
- **An info card behind every name.** Tap anything — a drill, a round, a
  track, an attribute, a measurement, a test — and it says what it is,
  how to do it, how much, and what it feeds.
- **Weather that changes the plan.** Sunrise, heat, rain, cold and a bug
  estimate move the run, swap yard work indoors and raise the water
  target — but only for the time you actually spend outside.

## Status

Working and in daily use by its author. Everything above is real. What it
is **not**, yet: usable by someone without a mat, a yard and a porch edge
to hang from — the program leans hard on the author's kit and his day.
Fixing that is the whole of [docs/public-beta.md](docs/public-beta.md),
which is the plan this repo is currently following.

There is no beat-detection visualiser, no light show and no social
anything, whatever older versions of this README promised.

## Try it

The beta goes out through Firebase App Distribution — ask for an invite
and install without a store account. Or build it yourself:

```sh
git clone https://github.com/JordanTrana/RaveLite-App
cd RaveLite-App/RaveLiteApp
yarn install
yarn android          # a connected Android device or an emulator
```

Android 13+ will ask for notification permission on the first visit to
the home screen. On MIUI/HyperOS phones you must also turn **Autostart**
on by hand, or chimes stop when the app is backgrounded; Settings → Stay
alive lists everything this phone needs, with a button for each.

## Chimes, notifications and Daily Sets

Real on-device notifications are implemented via [`@notifee/react-native`](https://notifee.app).
What works today:

- **Element cue sounds** — five bundled cues in
  `RaveLiteApp/android/app/src/main/res/raw/` (Fire: rising beeps, Air:
  bell ding, Earth: low bloop, Water: bubbly bloops, Heart: lub-dub
  chime) on channels `elem.<element>.v3`. Channel settings are immutable
  on Android, so changing a cue or vibration bumps the suffix, and
  superseded channels are deleted. Sound files are native resources: a
  change needs `yarn android`, not just a JS reload.
- **Rolling schedule** — the JS pulse runtime fires the Plan's element
  cadence (`planScheduler`) and the Daily Sets program (`setScheduler`),
  one pulse at a time; the rest queue.
- **Daily Sets** (Heart → Sets) — each movement track prescribes sets at
  about half your tested max, spread across the day. Sets climb weekly,
  every 4th week is a deload + max-test week, and a harder variation
  unlocks once a set size graduates. Push is always balanced by rows and
  pull-ups.
- **Answer from anywhere** — every pulse notification has Done / +5 min /
  Skip buttons that work with the app open or in the background. The
  Always-On card has a −/+ stepper to log the reps actually done.
- **Background service** — during active hours a foreground service keeps
  chimes alive whichever screen is open, or with the app in the background.
- Permission (Android 13+ `POST_NOTIFICATIONS`) is requested in context
  on first Heart-screen visit, not at cold start.
- **Cues that always sound** — a small native module (`RaveLiteDevice`)
  plays the cue on the alarm audio stream, so chimes cut through silent
  mode and Do Not Disturb during active hours. The notification then posts
  on a quiet channel; if the cue can't play, it uses the sounding channel
  instead. Heart › Settings › Chimes: volumes, per-element test, and a
  "Respect Do Not Disturb" toggle.
- **Backup chimes** — the OS also holds an exact-alarm notification ~90 s
  after every upcoming chime. The live app cancels it when the chime comes
  due, so you hear one chime; if the app has been killed, the backup
  still arrives with the same buttons.
- **Stay alive checklist** — Heart › Settings lists what keeps chimes
  firing on this phone (notifications, exact alarms, battery, HyperOS
  Autostart, alarm volume, locked in recents, charger) with a button to
  fix each.

All of the above is verified on the author's Redmi A3, in daily use.

OEM caveat: stock Android (Galaxy Tab A7) is friendly. MIUI/HyperOS on
the Redmi A3 needs Autostart turned on manually in system settings;
battery-optimization exemption alone is not sufficient. The Stay Alive
checklist links to both.

## Screen, night mode and the alive layer

While RaveLite is foregrounded the screen stays on (`FLAG_KEEP_SCREEN_ON`
is set in [`MainActivity.kt`](RaveLiteApp/android/app/src/main/java/com/raveliteapp/MainActivity.kt)),
so keep the phone on its charger. Outside active hours the screen goes to
night mode instead of sleeping: backlight near minimum, a dark veil, no
motion — a tap wakes it for two minutes.

The UI breathes: a faint element-colored glow on one shared, native-driven
clock (`src/lib/aliveClock.ts`), a small swell on touch, and a soft color
wash when a chime fires. Heart › Settings › Alive picks Whisper (default),
Glow or Still; night, a pause, or Android's "Remove animations" make it
rest. The clock's `aliveDriver` is the plug-in point for the beat
recognizer.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Drills and kit substitutions are
the most useful things to send; changes to the home screen's shape are
the least likely to land. The house style, the checks to run and how to
add a drill are all in there.

## License

Licensed under the [Apache License 2.0](LICENSE) — use it, change it, ship
it, commercially or not; keep the notice, and you get an explicit patent
grant with it. See [NOTICE](NOTICE).

Releases before 2026-09-20 were published under CC0 1.0 and stay that way;
everything from then on is Apache-2.0.

**No warranty, and not medical advice.** RaveLite suggests exercise,
hydration targets and heat rules from public guidance and the author's own
training. It does not know your health. Start conservatively, stop if
something hurts, and ask a professional about anything that matters.

## Acknowledgments

We would like to thank the open-source community for their contributions and support in building RaveLite.
