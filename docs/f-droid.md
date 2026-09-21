# Getting into F-Droid

F-Droid builds from source on their own machines and signs with their own
key. That is the point of it, and it means the work is mostly proving the
app can be built by somebody who is not you.

## Where this stands

**Audited 20 Sep 2026, and the app is close.**

| Check | State |
|---|---|
| Licence | Apache-2.0, `LICENSE` + `NOTICE` in the repo |
| Proprietary dependencies | None. No Google Play Services, no Firebase in the build, no closed SDKs |
| Dependency licences | All Apache-2.0 or MIT; `@notifee/react-native` is Apache-2.0 |
| Anti-features | None to declare: no ads, no tracking, no analytics, no accounts |
| Network use | Open-Meteo only, for forecast and place lookup, with a location rounded to ~10 km |
| Permissions | `INTERNET`, `ACCESS_COARSE_LOCATION`, `POST_NOTIFICATIONS`, `VIBRATE`, `FOREGROUND_SERVICE_SPECIAL_USE`, `USE_EXACT_ALARM` — all AOSP, all used |
| Flipper in release | Not shipped. RN 0.73's release variant is a no-op stub; checked by unzipping the APK, not assumed |
| Store metadata | `RaveLiteApp/fastlane/metadata/android/en-US/` |

## What is still needed, and who can do it

**Only you can do these.** They need accounts, a public repo, or consent
to publish something of yours.

1. **A public git remote with version tags.** F-Droid builds a tag, so
   releases need tagging (`v1.0.0`) and `versionCode` incrementing.
2. **Screenshots.** They go in
   `fastlane/metadata/android/en-US/images/phoneScreenshots/`. Every
   screenshot of this app shows real training data, so these are yours to
   take and yours to approve.
3. **A launcher icon and feature graphic** in `images/` — the launcher
   icon already exists in the app; F-Droid wants a copy here.
4. **The merge request** to
   [fdroiddata](https://gitlab.com/fdroid/fdroiddata) adding a build
   recipe. It needs a GitLab account.

## The build recipe, when you get there

F-Droid needs to build the JS bundle as well as the APK, so the recipe
runs `yarn` before Gradle. Roughly:

```yaml
Categories:
  - Sports & Health
License: Apache-2.0
SourceCode: https://github.com/<you>/RaveLite-App
IssueTracker: https://github.com/<you>/RaveLite-App/issues

RepoType: git
Repo: https://github.com/<you>/RaveLite-App.git

Builds:
  - versionName: 1.0.0
    versionCode: 1
    commit: v1.0.0
    subdir: RaveLiteApp/android/app
    sudo:
      - apt-get update
      - apt-get install -y npm
    init: cd $$SRCDIR/../.. && npm ci
    gradle:
      - release

AutoUpdateMode: Version
UpdateCheckMode: Tags
CurrentVersion: 1.0.0
CurrentVersionCode: 1
```

Treat that as a starting point; F-Droid's reviewers will say what is
wrong with it, and they are generally good about it.

## One thing worth deciding first

The release APK is **24 MB**, and about half of that is native libraries
for four ABIs — including `x86` and `x86_64`, which on phones only matter
to emulators. Per-ABI splits would roughly halve what a tester downloads.

F-Droid handles this itself, so it does not block submission. It matters
for the Firebase App Distribution beta, where testers download the whole
thing every update. It is a build-system change that needs each split
installed and checked, so it has not been made yet.

## Signing

F-Droid signs with its own key, so an F-Droid install is a different app
from a sideloaded one — they cannot update each other. That is normal and
worth saying in the README once both exist, so nobody installs over their
own training log and loses it.

Until then: **release builds are still debug-signed.** The first properly
signed build cannot install over an existing one. Export first
(Settings → Your data), then uninstall, install, and restore.
