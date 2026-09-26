# Accounts and releasing

What only you can do, in the order that avoids painful mistakes, and what
is already automated.

Read the first section before doing anything else in this file.

---

## Start here

Each step is explained in full further down. Most of the one-time work is
done; what follows is what is left, and what comes round again.

### Done, once, and not again

Signing key made and backed up · repo public and current · description
and topics set · screenshots taken · v1.0.0 published · the author's
phone moved onto a signed build.

### Every release, in this order

| # | Step | Where |
|---|---|---|
| 1 | **Bump `versionCode`** in `android/app/build.gradle` | §2a |
| 2 | `scripts/build-release.sh` | §2a |
| 3 | `gh release create` — draft first, then publish | §3b |
| 4 | Check it downloads anonymously and the SHA matches | §3b |
| 5 | `scripts/distribute.sh "what changed"` — only if using Firebase | §3 |

### Still outstanding

| Step | Where |
|---|---|
| **Restore the author's data** onto the phone from the export | the phone |
| Add tester emails to the Firebase `testers` group | §3 |
| A 512×512 `icon.png` for the fastlane metadata | §4 |
| Submit to IzzyOnDroid, then F-Droid | §4 |

Nothing here is irreversible except the signing key, which is already
made — keep the backup and this whole document stays cheap.

---

## 0. The one irreversible thing

Release builds are **debug-signed** today. The debug key is a public key
that ships with Android — every developer has it — so a build signed with
it is not something to hand to testers.

The moment you sign with a real key, that build **cannot install over the
app on your phone.** Android refuses signature changes. The only way
through is uninstall, which deletes everything RaveLite knows about you.

So the order is fixed:

1. Open RaveLite → Settings → **The app** → **Your data** → **Export**,
   and save the file somewhere that is not the phone.
2. `scripts/make-keystore.sh`
3. `scripts/build-release.sh`
4. `adb uninstall com.raveliteapp`
5. Install the new APK.
6. Settings → **The app** → **Your data** → **Restore**, pick the file.

Do step 1 even if you plan to stop after step 2. Especially then.

---

## 1. GitHub — done

Public at **github.com/Jthora/RaveLite-App**, `main` current, `gh`
logged in as `Jthora`. Description and topics set 23 Sep 2026.

A large first push can fail with `RPC failed; HTTP 400` — that is a
buffer limit, not a rejection. Retry with
`git -c http.postBuffer=524288000 push`, then check `origin/main`
actually moved rather than trusting the exit code.

### CI: there isn't any

GitHub Actions on this account is billing locked. Jobs are refused before
they start, so nothing here is checked by a machine — run the three
commands in [CONTRIBUTING.md](../CONTRIBUTING.md) yourself.

`.github/workflows/checks.yml` is kept anyway, on pull requests only. It
costs nothing and starts working by itself the day the billing changes.
It used to run on pushes to `main` too, which painted a red mark on the
repo's front page every time, for work that never happened.

`release.yml` is **deleted**. It attached a *debug-signed* APK to any
`v*` tag — which, sitting in a release beside four properly signed ones,
is a trap: Android refuses to replace an app signed with one key by a
build signed with another, so anyone who took the wrong file would have
to uninstall, and lose their training log, to get back on the real
builds. Releases are published by hand (§3b) and that is the safer
arrangement regardless of billing.

Downloads are not affected by any of this. **Releases are file hosting,
not compute** — free and unmetered on a public repo, and verified working:
an anonymous download of the v1.0.0 universal APK returns the whole file
with a SHA-256 matching the local build.

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

## 2a. Bump the version, every single build

`android/app/build.gradle` holds `versionCode` and `versionName`, and
nothing bumps them automatically. **Raise `versionCode` by one before
every build you give to anybody.**

It is not paperwork. A beta ships many builds, and `versionCode` is the
only thing that tells them apart: Android refuses to install an older
one over a newer one, App Distribution uses it to decide what a tester
is offered, and F-Droid will not accept a tag whose code has not moved.
Ship two different APKs as "1.0 (1)" and no bug report can be tied to
the code that caused it.

`versionName` is what a person reads ("1.0", "1.1"); `versionCode` is
the integer that must only ever go up. Settings → The app → App status
reports both, so a tester's Copy says exactly which build they are on.

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

## 3b. Publishing a GitHub release — how people actually get it

This is the open beta: free, no store, no account, no invite. A public
repo's releases are file hosting rather than compute, so the Actions
billing lock does not touch them.

1. **Bump `versionCode`** (§2a) and build:

   ```sh
   scripts/build-release.sh
   ```

2. **Tag and publish**, attaching all four APKs:

   ```sh
   gh release create v1.0.1 \
     RaveLiteApp/android/app/build/outputs/apk/release/app-universal-release.apk \
     RaveLiteApp/android/app/build/outputs/apk/release/app-armeabi-v7a-release.apk \
     RaveLiteApp/android/app/build/outputs/apk/release/app-arm64-v8a-release.apk \
     RaveLiteApp/android/app/build/outputs/apk/release/app-x86_64-release.apk \
     --title "RaveLite 1.0.1" --notes-file notes.md --draft
   ```

   Use `--draft` first. Assets upload one at a time and a failure halfway
   leaves a half-published release that people can already see. Check
   them, then `gh release edit v1.0.1 --draft=false --latest`.

3. **Verify it from outside**, which is the only check that means
   anything:

   ```sh
   curl -sSL -o /tmp/x.apk -w '%{http_code} %{size_download}\n' \
     https://github.com/Jthora/RaveLite-App/releases/download/v1.0.1/app-universal-release.apk
   shasum -a 256 /tmp/x.apk
   ```

   Expect `200`, the full byte count, and a SHA-256 matching the local
   file. No auth header: that is the point.

The README's download button points at `/releases/latest`, so it follows
each new release without editing. The version and download-count badges
follow too.

## 4. F-Droid

See [f-droid.md](f-droid.md). It needs the repo public with tags,
screenshots, and a GitLab account for the merge request. The audit is
done, the app is clean, and four screenshots are in place; what remains
is tags and submission.

---

## The commands, in one place

Everything below has been run at least once and works. The first three
are the release loop; the rest are occasional.

| What | Command |
|---|---|
| Build | `scripts/build-release.sh` |
| Publish a release | `gh release create vX.Y.Z <the four APKs> --title "RaveLite X.Y.Z" --notes-file notes.md --draft` |
| Prove it downloads | `curl -sSL -o /tmp/x.apk -w '%{http_code}' <the release URL>` then `shasum -a 256 /tmp/x.apk` |
| Send to Firebase testers | `scripts/distribute.sh "notes"` |
| Re-take the screenshots | `scripts/screenshots.py` — demo mode, never touches real data |
| Check an Android version | `scripts/version-pass.sh <serial> <apk>` |
| Push, when the pack is large | `git -c http.postBuffer=524288000 push origin today-home:main` |

**The one that cannot be undone** is `scripts/make-keystore.sh`, and it
has already been run. The key is at `~/.ravelite/release.keystore` with a
copy on the Desktop; lose both and nobody who installed a signed build
can ever be updated again.
