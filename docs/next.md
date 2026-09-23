# What happens next

Rewritten 23 Sep 2026, for the open beta. The app is built; the work now
is getting it onto other people's phones, finding out what it does there,
and keeping the runtime under it from going stale.

Four things are true and shape everything below:

- **The app is ready and nobody has it.** 962 tests, no typecheck errors
  anywhere, six audit phases and five hardening passes done — and about
  200 commits that exist only on one laptop.
- **Release builds are still debug-signed.** Fixing that costs an
  uninstall, which is why export and restore exist.
- **It has run on one phone.** A Redmi A3: low-end, 32-bit, Android 16,
  and one of the two most aggressive battery managers there is. Half of
  all Android phones are on versions it has never seen. See
  [devices.md](devices.md).
- **The remaining blockers are accounts, not code.**

Three tracks. A is yours and gates everything; B and C are mine and run
alongside it.

---

## Track A — into someone else's hands (yours, about a day)

Nothing here needs building. It needs somebody with the passwords.

1. **Push.** About 200 commits, and the public repo still shows stale
   `main`. `git push origin today-home:main`, or open a PR first. This is
   also the first time CI has ever run — typecheck, lint, tests, then
   tests again in another timezone. All four pass here.
2. **Set the repo description and topics.** Command in
   [releasing.md](releasing.md).
3. **Make the signing key** — `scripts/make-keystore.sh`. **Export your
   own data first.** The first signed build cannot install over the
   debug-signed one on your phone: it is export, uninstall, install,
   restore, in that order, and it is the one irreversible step in this
   document.
4. **Take the screenshots.** `scripts/screenshots.py` runs the app in
   demo mode, so nothing of yours is photographed. The good ones go in
   `fastlane/metadata/android/en-US/images/phoneScreenshots/` and the
   README.
5. **Invite the first testers** through Firebase App Distribution; the
   scripts handle the build and the upload.

**Done when:** somebody who is not you has it on their phone.

---

## Track B — knowing it works on phones we do not have (mine)

The beta's real risk is not a crash. It is chimes that quietly stop on a
phone nobody here owns, on an Android version nobody here has run.

6. **The version pass: Android 12, 13, 14 and 15 on emulators.** Half of
   all phones are there and none of it has ever been run. On each: a
   chime fires with its buttons, an exact alarm lands, the app comes back
   after a reboot, and Stay alive tells the truth. Needs the emulator and
   about 2 GB per system image on this laptop — **say the word and I will
   set it up**.
7. **The small-screen and large-text pass.** 320 dp and 1.35× text, on a
   throwaway install running demo data so no screenshot is of your
   training. `wm size` and `wm density` make the same phone both.
8. **A first-24-hours checklist** a tester can actually run: does a chime
   land, does it survive a night, does it come back after a reboot, does
   Stay alive say anything. Short enough that people do it.
9. **A Test Lab run per release**, for real Samsung, Oppo and vivo
   hardware. The Firebase project already exists.

**Done when:** a chime has landed on every Android version from 12 to 17,
and on hardware from more than one maker.

---

## Track C — the stack's clock (starts during the beta)

None of this is urgent this week. All of it is overdue by next year.

10. **React Native 0.73.5 → 0.81.** It is 22 months past security
    end-of-life, and every native library it ships is 4 KB aligned, so on
    a Pixel 8/9-class phone Android shows a "16 KB backcompat mode" dialog
    at launch. 0.81 fixes both and is the last version before the New
    Architecture becomes mandatory. Keep `targetSdk 34` through it; that
    is a separate change.
11. **Decide about notifee.** Archived April 2026, last release December
    2024, and chimes are what this app *is*. It works today and there is
    no upgrade that keeps things as they are — so this is a decision to
    make deliberately, after the beta has said how much the chime layer
    still needs to change.
12. **`targetSdk` 35 or 36 — only if Play.** Outside Play there is no
    floor. Raising it forces edge-to-edge (React Native 0.73 does not
    apply window insets) and predictive back (which breaks the Back
    handling every sheet relies on). Two real projects, neither needed
    for F-Droid or direct APKs.

---

## What the beta has to answer

Worth writing down before it starts, so the reports get read for the
right things:

- **Does the service survive a night on a phone that is not a Redmi?**
  Samsung sleeps unused apps after three days; Transsion stops foreground
  services outright. Stay alive records the gaps; the gaps are the answer.
- **Do the maker instructions work?** They are written from documentation
  and crowd reports, not from those phones. If a Samsung tester follows
  them and still loses chimes, the instructions are wrong.
- **Does the first run make sense to somebody who is not the author?**
  Setup asks five questions and then the day starts chiming.
- **Is the ramp right for a body that is not this one?** Everything about
  the program was tuned on one person.
- **What does an old Android do?** 12 and 13 are a quarter of phones
  between them.

## Choosing the first ten testers

Aim the invitations at phones, not just people. In order of what is
missing: **a Samsung** (most Android phones in the UK and US, and a
sleeping-apps list nobody here has seen), **a Pixel or a Motorola**
(stock Android, and the US tail), **an entry-tier phone on Android 13 or
14**, and — if the reach exists — **a Tecno or Infinix**. Everything
else is a bonus.

---

## After the beta — the feature backlog

Kept for the reasoning, and for whatever the beta says is missing.

**Built 21 Sep 2026: all three.** The disclaimer, the feedback route and
flaws are done; what follows is the plan they came from, kept for the
reasoning. Next after these was
[hardening.md](hardening.md) — six passes over everything this wave
added, because it was all built forward and almost none of it had been
verified failing. **Passes 1 to 5 are done (21–22 Sep), and 6 has its
numbers**; what is left of 6 is the always-on case, which only the phone
can answer.

### 1. The first-run disclaimer *(small, and it is a promise we made)*

The plan says a disclaimer on first run, once, in setup. It is not built.
The app tells strangers to do physical work; the store listing already
says it is not medical advice, and the app itself should say it once.

### 2. A feedback route that needs no account *(small)*

A tester who finds a bug has an export button and no way to send it.
Settings → Your data gains **Share**, and the issue templates get a line
asking for the file. Uses the picker plumbing that already exists.

### 3. Flaws *(medium — the agreed half of the perks question)*

`corrections` are already flaws in everything but name: real postural
faults the app already trains around, currently shown as a settings
checkbox. Naming them, giving each a card and a visible clearing
condition, is the best content-per-line-of-code available — it reuses
the info-card system entirely. See
[perks-traits-flaws.md](perks-traits-flaws.md). **No modifiers, ever.**

### 4. Symbols everywhere else *(medium)*

Nine surfaces got colour and symbols. The element pages, the info cards,
the practice list and the goals page are still mostly text. Same system,
more call sites.

### 5. The rest of the military tests *(medium, and a commitment)*

Army, Navy and Coast Guard are missing entirely; the app has three of
eight. As packs, one per service, with equipment events marked
trackable-not-trainable. Read
[military-tests.md](military-tests.md) first — the standards moved five
times in eighteen months, and a wrong table is worse than no table when
somebody is training to keep their job.

---

## Later — the things with no deadline

- **Languages.** Auto-detect from the phone, as units now do. Roughly 900
  strings; the hard part is not translation but pulling copy out of
  components that currently hold it inline.
- **F-Droid submission.** Audited and prepared; needs the repo public
  with tags, screenshots, and a GitLab account.
- **Marks** — achievements derived from the journal rather than stored,
  so they cannot drift from the truth. The safe half of "perks".
- **Choosing a flaw to work on** — the one real decision the character
  sheet could offer. Only worth doing after flaws exist.

---

## Still open, and only you can close them

From [public-beta.md](public-beta.md) §15:

*(Nothing — all four closed on 21 Sep 2026.)*

**Closed 21 Sep 2026:** the ten archetype names ship as they are (anyone
can be a raver); the Starcom mark ships, credited in the README as
provenance; the plan-versions question turned out to be stale — those
documents are personal context, not repo files, and the rule they
produced is now a contributor note; and stewardship is **light** —
issues read not triaged, PRs welcome but unhurried, no timelines, forking
encouraged. Said plainly in both the README and CONTRIBUTING so nobody
feels ignored by a slow reply.

**How the ecosystem got resolved (21 Sep 2026).** The question was how
much of EIN, Navcom, Arch Angel Agency and the Raver Angel Initiative
belongs in public copy. The answer turned out not to be a dial setting.

PLURL is near the top of the README because it explains the app's values
and needs no other knowledge to land. The Earth Intelligence Network
appears once, in the author's own account of using the app — as the job
they are doing while it chimes at them, not as a claim the app makes. That
is the right register for all of it: **provenance arrives through use,
not through an org chart.**

If the wider body of work ever wants a public page it should be its own
(`docs/ein.md`), linked in one line from the colophon, so the curious get
everything and nobody is gated by it. It only belongs above the fold if
it becomes load-bearing — a shared account, a Navcom integration — at
which point it is a feature rather than a lineage.

---

## What I would not do next

- **Perks with modifiers.** Covered at length elsewhere; it would make
  the character sheet a save file instead of a record.
- **A second UI for anything.** Setup is the settings panels. Packs own
  the curriculum. Every time two things have described one thing in this
  codebase, they have drifted.
- **More archetypes or packs before anyone uses the eleven and eight
  that exist.** There is no evidence yet about which ones people pick.
