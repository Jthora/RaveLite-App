# RaveLite

RaveLite is an Android mobile app built using React Native. It is a personal training + rave-companion tool — fitness reminders, posture-correction drills, flow-arts practice, and music attunement, organized around the five classical elements. iOS support is deferred; the `ios/` folder is preserved but not currently built.

> **Target devices:** Samsung Galaxy A7 Tablet, Redmi A3 phone (Android only).

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
pulse) over transactional taps. Choose ceremonial language ("ignite",
"root", "flow", "seal") over generic verbs ("done", "complete", "log").

## Overview

RaveLite is designed to complement the rave experience by offering features for analog communication and mesmerizing visualizations. Whether you're at a rave, festival, or party, RaveLite adds an extra layer of excitement and engagement.

## Key Features

- **Analog Communication**: Use analog-style tools such as light signals, hand gestures, and sound to communicate with fellow ravers.
- **Visualizations**: Enjoy stunning visualizations and effects synced with the music, creating an immersive atmosphere.
- **Customization**: Personalize your experience with customizable visual themes, colors, and effects.
- **Party Tools**: Access a range of party tools, including a flashlight, strobe light, and countdown timer.
- **Social Integration**: Share your experiences and connect with other users through social media integration.

## Installation

To install RaveLite on your device, follow these steps:

1. Clone this repository to your local machine.
2. `cd RaveLiteApp`
3. Run `yarn install` (or `npm install`) to install dependencies.
4. Connect an Android device (USB debugging enabled) or start an emulator.
5. Run `yarn android` to build and install the app.

## Usage

1. Open RaveLite on your device.
2. Explore the different features and tools available.
3. Use analog communication methods and enjoy the visualizations synced with the music.
4. Have fun and enhance your rave experience with RaveLite!

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

Not yet verified on a device.

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

We welcome contributions from the community to improve RaveLite. If you'd like to contribute, please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and ensure the codebase is properly tested.
4. Submit a pull request with a detailed description of your changes.

## Feedback

We value feedback from our users! If you have any suggestions, questions, or issues, please don't hesitate to reach out to us.

## License

This project is licensed under the [Creative Commons Zero (CC0) license](https://creativecommons.org/publicdomain/zero/1.0/), allowing you to copy, modify, distribute, and use the software for any purpose, without asking for permission.

## Acknowledgments

We would like to thank the open-source community for their contributions and support in building RaveLite.
