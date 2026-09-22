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

## APK size: split by architecture

*Done 22 Sep 2026.* The release build makes one APK per ABI plus a
universal one:

| APK | Size |
|---|---|
| `app-armeabi-v7a-release.apk` | 11.8 MB |
| `app-arm64-v8a-release.apk` | 12.7 MB |
| `app-x86_64-release.apk` | 13.0 MB |
| `app-universal-release.apk` | about 25 MB |

Before this there was one 25 MB APK carrying all four ABIs. Setting
`reactNativeArchitectures` never shrank it, because React Native's
prebuilt libraries ship for every ABI whatever that says.

Pick by the phone, not the chip. The Redmi A3 has a 64-bit chip but runs
32-bit Android (`adb shell getprop ro.product.cpu.abilist` gives
`armeabi-v7a,armeabi`), so the arm64 APK will not install on it. Budget
phones do this often. `scripts/distribute.sh` sends the universal APK
for that reason.

Every APK shares one `versionCode`, so any of them can replace any other.
F-Droid builds its own APKs and does not use these.

## Signing

F-Droid signs with its own key, so an F-Droid install is a different app
from a sideloaded one — they cannot update each other. That is normal and
worth saying in the README once both exist, so nobody installs over their
own training log and loses it.

Until then: **release builds are still debug-signed.** The first properly
signed build cannot install over an existing one. Export first
(Settings → Your data), then uninstall, install, and restore.
