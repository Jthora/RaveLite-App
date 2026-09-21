# What happens next

Written 21 Sep 2026, after Phases 0–4 of [public-beta.md](public-beta.md)
closed. That plan was about making a one-person app usable by strangers.
It worked, and it is done. This one is about getting it in front of them.

Four things are true and shape everything below:

- **The app is ready and nobody has it.** 651 tests, no typecheck errors,
  every phase verified on hardware — and 109 commits that exist only on
  one laptop.
- **Release builds are still debug-signed.** Fixing that costs an
  uninstall, which is why export/restore exists.
- **The positioning is now decided**: lead with the rave identity
  everywhere, keep the name.
- **The remaining blockers are accounts, not code.**

---

## Now — getting it out (a day, mostly yours)

Nothing here needs more building. It needs somebody with the passwords.

1. **Push.** 109 commits, and the public repo currently shows stale
   `main`. `git push origin today-home:main`, or open a PR first.
2. **Set the repo description and topics.** Command in
   [releasing.md](releasing.md).
3. **Make the signing key.** `scripts/make-keystore.sh`. Export your data
   first — the first signed build cannot install over the one on your
   phone.
4. **Take the screenshots.** `scripts/screenshots.py` does it from demo
   mode, so nothing of yours is photographed. Drop the good ones into
   `RaveLiteApp/fastlane/metadata/android/en-US/images/phoneScreenshots/`
   and the README.
5. **Firebase, if you want testers before F-Droid.** Steps in
   [releasing.md](releasing.md); the scripts handle the rest.

**Done when:** somebody who is not you has it on their phone.

---

## Next — what the first testers will hit

In the order they will hit it, not the order it is fun to build.

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
- **Per-ABI APK splits.** 24 MB, about half of it native libraries for
  four ABIs including x86 emulator builds. Would roughly halve a tester's
  download. A build change that needs each split installed and checked.
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
he is doing while it chimes at him, not as a claim the app makes. That
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
- **More archetypes or packs before anyone uses the ten and seven that
  exist.** There is no evidence yet about which ones people pick.
