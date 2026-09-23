# Phones this has to work on

Written 23 Sep 2026, before the public beta. RaveLite has run on exactly
one phone. This is what else is out there, what each kind of phone does
to an app like this one, and what to do about it.

Read §1 and §9 if you read nothing else.

---

## 1. What this app asks of a phone

Four things, and every one of them is somewhere Android versions and
phone makers differ:

1. **A foreground service that runs all day and all night** —
   `app.notifee.core.ForegroundService`, declared `specialUse` with the
   subtype `ambient_always_on_training_screen`. This is the thing phone
   makers kill.
2. **Exact alarms**, so a chime still lands when the process is gone.
   The manifest declares `USE_EXACT_ALARM`; the code asks for
   `SET_EXACT_AND_ALLOW_WHILE_IDLE` when it is allowed and falls back to
   `SET_AND_ALLOW_WHILE_IDLE` when it is not.
3. **Notifications with actions** — Done, +5, Skip — on a channel that
   plays on the alarm stream.
4. **Starting itself after a reboot or an update**, without anyone
   opening it (`BootReceiver`).

Plus coarse location once, vibration, a file picker for export and
restore, and the share sheet.

**It needs no Google Play Services.** No GMS, no Firebase inside the
app; the only network call is Open-Meteo. So it also runs on Huawei
without Google, on LineageOS and /e/OS, and on Fire tablets — which is
worth saying out loud, because almost nothing else with chimes does.

## 2. The one phone it has run on

| | |
|---|---|
| Phone | Redmi A3 (2312CRNCCL) |
| OS | Android 16, API 36, HyperOS (`V816.0.5.0.WGRMIXM`) |
| Screen | 720 × 1650 at density 320 → **360 × 825 dp** |
| Memory | 3.8 GB total, ~230 MB free in ordinary use |
| Userspace | **32-bit** (`armeabi-v7a`) on a 64-bit chip |
| Its APK | `app-armeabi-v7a-release.apk`, 11.8 MB |

Measured on it, 23 Sep 2026, on the current build:

| | |
|---|---|
| Cold start to first frame | 569 ms |
| Memory, app open | 191 MB PSS / 303 MB RSS |
| Memory, backgrounded with the service running | 169 MB PSS / 281 MB RSS |
| Tap to Settings open | 0.45 s (1.65 s before the fixes that day) |
| Scheduled alarms held by the OS | 40 |

As a test device this is a gift: low-end chip, small screen, almost no
free memory, and one of the two most aggressive battery managers on the
market, all at once. Nearly everything found in the last week — the
heartbeat, the all-day service, the boot receiver, the render costs —
came from this phone rather than from a test.

What it does **not** cover: Samsung, which is most of the Android phones
in the UK and US; stock Android; big screens; a fast phone; and Android
12 to 14, which together are still about a third of all devices.

## 3. Who the testers will actually have

Android version share, worldwide, StatCounter, August 2026. Google
stopped publishing its own distribution dashboard in November 2025, so
every figure here is third-party panel data and the panels disagree by
up to a factor of two:

| Version | API | Share |
|---|---|---|
| Android 16 | 36 | 25.8% |
| Android 15 | 35 | 16.9% |
| Android 13 | 33 | 14.8% |
| Android 14 | 34 | 13.1% |
| Android 12 | 31–32 | 10.1% |
| Android 11 | 30 | 8.3% |

Android 17 (API 37) shipped 16 June 2026 on Pixel 6 and later.
Cumulative reach by minSdk (apilevels.com, April 2026 data): API 26 =
**96%**, API 29 = 91%, API 30 = 87%, API 33 = 69%.

Phone makers, global shipments, Q2 2026 (IDC): Samsung 22.7%, Apple
20.2%, Xiaomi 11.3%, OPPO 10.5%, vivo 7.7%, **everyone else 27.7%** —
and that last bucket is where Transsion (Tecno, Infinix, itel), Honor,
Motorola, realme, OnePlus, Nothing and Google all hide.

Where that lands depends on who the testers are:

- **UK / US / Europe** — the Android half is Samsung first by a long
  way, then a Motorola tail (Motorola is #3 in the US and the only vendor
  growing there), a small Pixel slice, and Xiaomi in Europe.
- **India** — vivo, Xiaomi, realme, Samsung, OPPO, Motorola, mostly on
  entry hardware.
- **Africa** — Transsion is about 47% of shipments, then Samsung.
  Android versions run older than the world average.

**2026 is a memory-crisis year**, which matters more than it sounds.
Memory is now over 65% of the bill of materials at the low end,
shipments are forecast down 16.7% on the year, and Google said in August
2026 that "new devices are maintaining or even decreasing their physical
memory capacity". The cheap phone is not getting more RAM this year.
Entry hardware in 2026 still means **720×1600, 3–4 GB, often Android
Go** — which is to say, the phone already on the desk.

## 4. What changes between Android versions

The good news first: **at `targetSdk 34`, nothing on Android 12 through
16 forces this app's design to change.** A `specialUse` foreground
service has no time limit on any shipped version, and it is one of the
two service types still allowed to start from `BOOT_COMPLETED` on
Android 15+. The type chosen to dodge a `health` permission problem on
the Redmi turns out to be exactly the right one.

What does apply, by version:

| Version | What it does to this app |
|---|---|
| **12 (31–32)** | Exact alarms need `SCHEDULE_EXACT_ALARM`; `USE_EXACT_ALARM` does not exist until API 33. Declared since 23 Sep, capped at API 32, so these phones get exact backup chimes rather than ones that drift with Doze. |
| **13 (33)** | Notifications are off until asked for — already handled. The **FGS Task Manager** lets anyone stop the app from the notification shade, and that stop is a force-stop (see below). An app in the **"restricted" standby bucket gets no `BOOT_COMPLETED` at all** — the likeliest cause of "it didn't come back after a reboot". |
| **14 (34)** | Service types became mandatory; ours is declared correctly. The **ongoing notification can now be swiped away** by anyone — the service keeps running, the notice does not. |
| **15 (35)** | The 6-hour service cap applies to `dataSync`/`mediaProcessing` only, not to us. **Force-stopping an app now cancels every pending intent it holds** — every scheduled alarm — and no `BOOT_COMPLETED` arrives until someone opens the app again. |
| **16 (36)** | Jobs started from a foreground service now obey standby quotas. A **notification cooldown** dims repeated alerts from one app; alarms are reportedly exempt, which is unverified and worth a test, since we are already on 16. |
| **17 (37)** | Background audio is hardened: audio from a service started at boot can be **silently dropped** unless the app holds exact-alarm permission and plays on `USAGE_ALARM`. RaveLite's cue player already uses `USAGE_ALARM` and `STREAM_ALARM`, so it lands on the right side — worth re-checking before ever targeting 37. |

**Verified here, not taken on trust.** On the Redmi, 23 Sep 2026:
force-stopping the app dropped it from **40 scheduled alarms to 10** and
killed the service; relaunching restored all 40 and three services. So
the recovery path works — but only when someone opens the app. Between
those two moments there are no chimes and nothing says so. Anyone who
taps "stop" on the app in the notification shade lands exactly there.

### What the version pass found (23 Sep 2026)

Every version below was run on an emulator shaped like the reference
phone — 720 × 1600 at 320 dpi, which is 360 dp wide — with the same six
checks each time (`scripts/version-pass.sh`). Android 16 is the phone
itself.

| | 12 (31) | 13 (33) | 14 (34) | 15 (35) | 16 (36) |
|---|---|---|---|---|---|
| Installs, sets up, lays out at 360 dp | ✅ | ✅ | ✅ | ✅ | ✅ |
| Foreground service runs | ✅ | ✅ | ✅ `specialUse` | ✅ | ✅ |
| Exact alarms | ✅ `permission` | ✅ `policy` | ✅ `policy` | ✅ `policy` | ✅ |
| Comes back after a reboot, unopened | ✅ | ✅ | ✅ | ✅ | ✅ |
| Backups return after a force-stop | ✅ | ✅ | ✅ | ✅ | ✅ |

Three things it found, all now fixed:

- **Backup chimes did not come back after a force-stop.** Notifee's
  record of them survives while the alarms do not, and that record is all
  the app can read, so a restarted app believed backups existed and
  scheduled none. Seen first on Android 13; it applies everywhere.
- **The phone called the app "RaveLiteApp"** — the template's name, never
  changed — while every instruction the app gives says RaveLite. Seen in
  the Android 13 notification prompt.
- **Android 12 was getting inexact backup chimes**, since
  `USE_EXACT_ALARM` does not exist before API 33. `exactAllowReason=permission`
  on Android 12 is that fix, proven.

Worth saying what the pass also confirms: the notification permission is
asked for at the right moment (after setup, not before), and denying it
leaves an honest banner — "Notifications are off. Chimes can't show
outside the app" — with the app still working behind it.

**`targetSdk` is not being forced.** Google Play requires API 36 from 31
August 2026, but F-Droid and direct APKs have no floor, so **34 is fine
indefinitely**. That matters, because moving to 35 makes edge-to-edge
mandatory (RN 0.73 does not apply window insets — the always-on screen
would slide under the status bar), and 36 turns on predictive back,
which breaks the `BackHandler` this app's every sheet depends on. Both
are avoidable for now, and both are separate projects when the time
comes.

## 5. What the phone makers do to an app like this

The short version: **a persistent notification protects you from
nothing.** dontkillmyapp.com scores makers on exactly this case — its
benchmark runs a foreground service with a wakelock and an alarm every
eight minutes — and Huawei, Xiaomi, OnePlus and Samsung all score 5 of
5: "foreground services killed by default and the user cannot configure
it otherwise".

Two useful facts sit behind that. **Samsung is the only maker with a
public commitment**: One UI 6.0+ "guarantees" foreground services for
apps targeting Android 14 that follow the service-type rules — which
RaveLite does. And **Samsung is the only maker with a documented deep
link** to its own settings screen; every other intent below is a
reverse-engineered component name that may not exist on a given build.

| Maker | How bad | What the person must turn on |
|---|---|---|
| **Xiaomi / Redmi / POCO** (MIUI, HyperOS) | Worst, with Huawei | Three separate gates, all needed: **Autostart**, per-app battery saver → **No restrictions**, and **lock in recents**. Plus MIUI's own notification switches, which can demote a channel while the app is perfectly alive. Settings can reset after an update. |
| **Samsung** (One UI) | Bad by reputation, best documented | `Battery → Background usage limits` → **Never sleeping apps**; turn off "Put unused apps to sleep". Unused ~3 days → sleeping; ~16 days → deep sleep, where it stops entirely. |
| **Oppo / realme / OnePlus** (ColorOS, OxygenOS) | Bad | Allow auto-launch, foreground and background activity; turn off sleep-standby optimisation; add to the startup manager. realme also needs "display pop-up windows" or alarm-style chimes never surface. |
| **vivo / iQOO** (Funtouch, OriginOS) | Bad, least documented | Autostart, background power consumption, high background power consumption, lock in recents. |
| **Huawei / Honor** (EMUI, MagicOS) | Worst | `Battery → App launch` → manage manually, with auto-launch, secondary launch and run-in-background all on. Huawei's PowerGenie force-stops background apps after about an hour. |
| **Transsion** (Tecno, Infinix, itel) | Explicitly kills foreground services | Battery Lab → disable power-saving management; Phone Master → auto-start; per-app "don't optimise". dontkillmyapp on Tecno is blunt: "timers, services, foreground services, all of them stop working until you return manually to the app". |
| **Motorola** | Worse than its reputation | Turn off "Improve battery while inactive"; set the app to unrestricted. Widely reported to kill background apps hourly regardless of that setting. |
| **Nothing, Sony, Pixel / AOSP** | Mildest | The standard battery-optimisation exemption. Sony adds STAMINA mode, and is the one maker whose flag an app can actually read. |

**What an app can detect** with standard APIs — the first of these
RaveLite already reads through notifee: the Doze battery-optimisation
exemption, whether the user set it to "Restricted"
(`isBackgroundRestricted()`), the standby bucket, whether exact alarms
are allowed, whether notifications and the channel are on, and whether
battery saver or Doze is active right now.

**What no app can detect**: every maker-specific gate in the table
above. Xiaomi autostart, Samsung's sleeping list, ColorOS startup
manager, vivo autostart, Huawei App launch, Transsion's Phone Master.
There is no API and there never has been.

Which is why **the heartbeat matters more than any of it**. The accepted
practice — and what this app already does — is to measure your own
survival: write a timestamp while alive, notice the gaps, and say what
happened. It is the only maker-agnostic evidence there is, and it means
the warning goes to the people who were actually killed instead of
nagging everyone. Stay alive is already the right shape; it needs the
per-maker instructions behind it.

## 6. Screens, fonts and memory

- **360 dp wide is the floor.** Both the entry tier (720×1600 at density
  2) and the mid tier (1080×2400 at density 3) come out at 360 dp. The
  historical minimum is 320 dp. The reference phone is 360 × 825 dp, so
  the app is built at the floor already — but it has never been seen at
  320 dp, nor on a big screen.
- **Test at 360 dp with the font scale up.** Android's own scaling goes
  to 200% and the display-size setting shrinks effective dp on top. This
  app caps text at 1.35× deliberately (`lib/textScaling.ts`), so the
  question is whether 1.35× still fits at 360 dp — not whether 2× does.
- **Tablets and foldables are about 3% of devices between them.** The
  goal is "does not break", not a second layout. `ScreenScaffold` already
  caps content width.
- **Memory is not a problem today.** 169 MB with the service running,
  against the 1 GB that Google will allow a "user-perceived service" on a
  4 GB phone from February 2027, and against Android 17's new runtime
  memory limits. Comfortable either way.

## 7. What the stack itself can and cannot do

Three findings here, in order of how much they should worry us.

**1. Notifee is dead upstream.** The repository was archived on 7 April
2026 and is read-only; its last release was 9.1.8 in December 2024, and
this app is on 7.9.0. Chimes are what the app *is*. Nothing breaks
today — the service type, the exact alarms and the channels all work on
Android 16, as this phone proves hourly — but there will be no fix for
Android 17 or 18 from upstream. Known open issues worth knowing: on
Android 14, trigger notifications with `allowWhileIdle` reportedly need
battery optimisation disabled to show at all (notifee #961), which is
exactly the Redmi case. The successor most often named is a community
fork built for the New Architecture, which this app is not on. **No
action for the beta; a decision for after it.**

**2. Nothing we ship is 16 KB aligned.** Measured, not guessed: all 59
native libraries per ABI — 236 across the four APKs — are 4 KB aligned,
and the cause is React Native 0.73.5's own prebuilt libraries, not our
build settings. No third-party library in this app ships native code at
all, so this is one problem with one fix. On a 16 KB-page device (Pixel
8/9 class) Android runs the app in backcompat mode, **shows a "Running
in 16 KB backcompat mode" dialog on launch**, and offers no stability
guarantee. Those devices are rare today and none of our likely testers
have one, but a Pixel tester would see that dialog.

**3. React Native 0.73.5 is 22 months past security end-of-life.** The
upgrade that fixes 16 KB is **0.81.x** — and it is also the ceiling,
because 0.82 makes the New Architecture mandatory and 0.84 deletes the
legacy one. Worth knowing before picking a version: 0.85 reportedly
carries 25–30% more memory at runtime, which is the wrong direction on a
3 GB phone. So: 0.81, keeping `targetSdk 34`, as its own piece of work.

Two free wins while we are here: `react-native-screens` and
`@react-native-community/masked-view` are **both unused** — zero
references in the source — and the second has been deprecated on npm
since 2021. And `minSdkVersion 21` forces AGP into legacy packaging,
which stores the ~12 MB of native libraries twice on disk; raising it
would halve that on a 32 GB phone.

## 8. What to actually test, and how

Nobody is buying eight phones. In order of value for money:

1. **Emulators, for Android versions.** Done for 12, 13, 14 and 15 on
   23 Sep (see above); 16 is the phone. `scripts/version-pass.sh` runs the
   six checks against any of them. One image at a time: each is about
   4 GB, and this laptop has ~20 GB to spare. Android 17 when it matters. On each: the chime fires, its buttons work, an exact
   alarm lands, the app comes back after a reboot, and Stay alive tells
   the truth.
2. **The Redmi A3**, for the worst case and anything needing a real
   battery manager.
3. **Simulated screens on that same phone.** `adb shell wm size 720x1520`
   and `wm density 240` makes it a 320 dp phone for ten minutes;
   `wm size 1600x2560 && wm density 320` makes it a tablet. Free, and the
   only way to see 320 dp without owning one. `wm size reset` afterwards.
4. **Firebase Test Lab**, for breadth across real Samsung, Oppo and vivo
   hardware. The Firebase project already exists for tester distribution.
5. **The testers themselves** — which only works if their reports say
   which phone they came from. See §9.

**The device list, if hardware is ever bought**, in order: a **Samsung
Galaxy A-series** (most Android phones in the UK and US, and the
sleeping-apps behaviour), a **Pixel** (what Android intends, and next
year's behaviour a year early), a **Motorola Moto G** (the US tail, and
a battery manager worse than its reputation). After those, a **Tecno or
Infinix** if the beta reaches Africa or South Asia, and an
**Oppo/realme** if it reaches India or southern Europe.

## 9. What to change before the beta

Ranked by value for effort. Items 1, 2, 4 and 6 were done on 23 Sep 2026
(commits `5760431`, `6caed75`, `bad70cc`, `7d977aa`).

1. ✅ **Put the phone in the diagnostics report.** Today "What state this
   is in" says storage, schema, units, place and forecast — and not one
   word about the phone. In a beta whose whole problem space is device
   variation, a report that doesn't name the phone is nearly useless.
   Add: maker and model, Android version and API level, the skin where it
   can be read, ABI, screen dp and density, font scale, low-RAM flag, and
   the standby bucket. Small, and it turns every tester into a data point.
   Shipped with a **Copy** button on App status, and the bug form now asks
   for what it copies.
2. ✅ **Declare `SCHEDULE_EXACT_ALARM` with `maxSdkVersion="32"`.** One
   line, and Android 12 and 12L stop getting inexact backup chimes.
3. **Say something when the app was force-stopped.** A stop from the
   notification shade wipes every scheduled alarm, silently, until
   someone opens the app — verified on the Redmi. The heartbeat already
   notices the gap afterwards; what is missing is naming this cause,
   since it is the one a person can avoid repeating.
4. ✅ **Give Stay alive the maker's own instructions.** It already detects
   what the standard APIs allow. What it cannot detect is the Xiaomi
   autostart gate, Samsung's sleeping list, and their equivalents — and
   those are exactly what kill it. One screen, chosen by
   `Build.MANUFACTURER`, shown when a gap has actually been recorded.
5. **Check 320 dp and 1.35× text.** Partly done: at the phone's largest
   text setting every row still renders, capped at 1.35× as designed. The
   visual pass — is anything clipped, does anything wrap badly — wants a
   throwaway install in demo mode, so that screenshots are of nobody's
   training. `wm size 720x1520` and `wm density 240` make the same phone a
   320 dp one; `wm size reset` puts it back.
6. ✅ **Delete the two unused dependencies.** Free.
7. **Plan the React Native 0.81 upgrade** — not for the beta, but before
   the next Android version lands. It is the security fix and the 16 KB
   fix in one move, and it is the last version that does not force an
   architecture migration as well.

What explicitly does **not** need doing before the beta: raising
`targetSdk` (34 is fine outside Play, and raising it costs edge-to-edge
and predictive-back work), replacing notifee, and worrying about memory
limits.
