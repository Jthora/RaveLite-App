# Accounts and releasing

What only you can do, in the order that avoids painful mistakes, and what
is already automated.

Read the first section before doing anything else in this file.

---

## 0. The one irreversible thing

Release builds are **debug-signed** today. The debug key is a public key
that ships with Android — every developer has it — so a build signed with
it is not something to hand to testers.

The moment you sign with a real key, that build **cannot install over the
app on your phone.** Android refuses signature changes. The only way
through is uninstall, which deletes everything RaveLite knows about you.

So the order is fixed:

1. Open RaveLite → Settings → **Your data** → **Export**, and save the
   file somewhere that is not the phone.
2. `scripts/make-keystore.sh`
3. `scripts/build-release.sh`
4. `adb uninstall com.raveliteapp`
5. Install the new APK.
6. Settings → **Your data** → **Restore**, pick the file.

Do step 1 even if you plan to stop after step 2. Especially then.

---

## 1. GitHub — done, but stale

The repo is already public at **github.com/Jthora/RaveLite-App**, and
`gh` is logged in as `Jthora`.

Two things are out of date:

- **109 commits are unpushed.** Everything from the public-beta work is
  local only. Anyone who finds the repo today sees old code.
- **The description is stale.** The public copy was revised on 21 Sep
  2026 to lead with the identity everywhere — see "What it says it is"
  below — and the repo description has not caught up.

Both are one command each, and both are in your hands because pushing to
a public repo is not something to do on someone's behalf. See
"Ready to run" at the bottom.

### CI, once pushed

`.github/workflows/checks.yml` runs typecheck, lint and tests on every
pull request. Nothing to set up — it starts working when the workflow
file reaches `main`.

`.github/workflows/release.yml` attaches an APK to any `v*` tag. That APK
is debug-signed by CI, because the signing key never leaves your machine.
It exists so a tag has an inspectable artifact, not as how people get the
app.

---

## 2. The signing key

```
scripts/make-keystore.sh
```

It asks for a password twice, writes `~/.ravelite/release.keystore`, and
appends four properties to `~/.gradle/gradle.properties`. Neither is in
the repo, and the Gradle config only uses them if they exist — so a
stranger cloning this still gets a working debug-signed build.

**Back up both files somewhere off this laptop.** Lose them and you can
never update anyone who installed a signed build: not a bug you can fix,
not a support request you can answer, just a dead end.

---

## 3. Firebase App Distribution

This is the only part that needs a Google account.

1. **Create the project.** console.firebase.google.com → *Add project* →
   call it `ravelite`. Turn Google Analytics **off**; this app has no
   analytics and adding some through the back door would make the README
   a lie.
2. **Add an Android app.** Package name exactly `com.raveliteapp`.
   Nickname whatever you like. You do **not** need `google-services.json`
   — App Distribution uploads an APK, it does not link a library into the
   app, and the app stays free of Firebase code.
3. **Copy the App ID**, which looks like
   `1:123456789012:android:abc123def456`.
4. **Save it** where the script looks:

   ```
   mkdir -p ~/.ravelite
   echo "FIREBASE_APP_ID=1:123456789012:android:abc123def456" > ~/.ravelite/firebase.env
   ```

5. **Install the CLI and log in**, once:

   ```
   npm install -g firebase-tools
   firebase login
   ```

6. **Make a tester group** called `testers` in the App Distribution
   section, and add email addresses. Each tester gets an invite, installs
   the Firebase App Tester app, and updates arrive there.

Then every release is:

```
scripts/build-release.sh
scripts/distribute.sh "what changed"
```

`distribute.sh` refuses to upload a debug-signed APK, because doing so
would force every tester to uninstall — and lose their data — the first
time you signed properly.

---

## What it says it is

Revised 21 Sep 2026. The decision was to **lead with the rave identity on
every surface** rather than open with the mechanic and bury the framing.

The line that goes first, everywhere:

> **For Ravers and Super Heroes.** Fit for the floor, all night. Ready
> for intensive dancing. Able to defend yourself. Of balanced and
> positively energised spirit.

This is deliberately narrowing. It will turn away people the app would
serve — a shift nurse, a parent, somebody training for a USAF chart, all
of whom have an archetype waiting for them. That is the trade: an
unmistakable voice, and the people who stay are the ones it was built
for. The breadth is not hidden, it is just second — "Not only for the
dance floor" sits below the fold in the README and in the store listing.

Surfaces kept in step: `README.md`, `CONTRIBUTING.md`, the fastlane
`short_description` / `full_description` / changelog, and the GitHub
description above. If one changes, they all change.

## 4. F-Droid

See [f-droid.md](f-droid.md). It needs the repo public with tags,
screenshots, and a GitLab account for the merge request. The audit is
done and the app is clean; what remains is submission.

---

## Ready to run

These are written and tested but **not run**, because each one changes
something public or irreversible.

| What | Command |
|---|---|
| Publish the work so far | `git push -u origin today-home` then open a PR, or `git push origin today-home:main` to go straight in |
| Fix the repo description | `gh repo edit Jthora/RaveLite-App --description "For Ravers and Super Heroes: a five-element altar that trains you all day." --add-topic android --add-topic react-native --add-topic fitness --add-topic bodyweight --add-topic rave --add-topic privacy-friendly` |
| Make the signing key | `scripts/make-keystore.sh` |
| Build | `scripts/build-release.sh` |
| Send to testers | `scripts/distribute.sh "notes"` |
| Tag a release | `git tag v1.0.0 && git push origin v1.0.0` |
