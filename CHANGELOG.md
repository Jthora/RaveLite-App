# Changelog

What changed, in the order it shipped. Dates are when the work landed,
not when anyone downloaded it.

The format is plain: what somebody using the app would notice, then what
changed underneath. Versions follow the Android `versionCode`, since that
is the number a phone compares.

## 1.0 (versionCode 1) — unreleased

The first version anybody else can install. Everything below is in it.

### The day

- **Daily Sets**: seventeen tracks — push, pull, squat, hinge, the trunk,
  hangs, breath, posture, stillness, mobility, flow and more — spread
  across the day as rounds, sized to the day you actually have.
- **Chimes** that ask for one thing and take three seconds to answer from
  the notification. They bend to the weather, the daylight, the room, the
  noise you can make and what you are carrying.
- **My day**: when chimes may sound, which days they run, and a day that
  can end after midnight.
- **Modes** for the weeks that are not normal weeks: away from home, at a
  festival, hurt somewhere, taking the day off. None of them are read as
  quitting when they end.
- **Blocks**: the Comeback is a four-week ramp-in; Festival Six builds to
  a date you set, with a lighter final week and a recovery day after.

### What you are training

- **Eleven archetypes** to start from, and eight curricula you can turn
  on: dance, dance combat, martial arts, flow props, yoga and tai chi,
  jumps, runs, and military test standards.
- **Practice paths** for every flow prop, dance and dance combat, tiered
  like a rhythm game: pick a tier, pick a chart, pick a move.
- **A character sheet** of fifteen attributes that grow from what you do.
- **Goals**: your push-ups today, the tests you train toward, and a goal
  for each element. Letter grades only with the military tests pack, and
  only once you have said which charts grade you.

### Yours, on your phone

- **No account, no server.** An export you keep, and a restore that puts
  it back exactly — or refuses and leaves what you had.
- **Your places**: what each room has, what it will not allow, and what
  you carry with you.
- **Hurt mode** that skips what loads the part that hurts, and stays on
  underneath other modes.
- **Demo mode** for screenshots, which never touches your own data.

### Underneath

- Chimes survive the app being killed: a foreground service that runs all
  day, backup notifications when it cannot, and a heartbeat that tells you
  honestly when chimes did not sound.
- One APK per phone architecture (about 12 MB) as well as a universal one.
- Release builds are signed with your own key when you have one, and stay
  debug-signed for anyone who clones the repo.
- 143 test files run on every pull request, twice, in two timezones.
