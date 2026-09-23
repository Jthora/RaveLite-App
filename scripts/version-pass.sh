#!/usr/bin/env bash
#
# One Android version's worth of checking, on an emulator.
#
# Usage: scripts/version-pass.sh <serial> <apk>
#
# Set an emulator up like the phone this was built on — 720x1600 at 320
# dpi, which is 360 dp wide, the width most Android phones are:
#
#   sdkmanager --install "emulator" "system-images;android-35;default;arm64-v8a"
#   avdmanager create avd -n rl35 -k "system-images;android-35;default;arm64-v8a"
#   # then in ~/.android/avd/rl35.avd/config.ini:
#   #   hw.lcd.width=720  hw.lcd.height=1600  hw.lcd.density=320  hw.ramSize=2048
#   emulator -avd rl35 -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect
#
# It skips setup (the Skip in its top corner), which lands on the base
# program and is written to disk. Demo mode would be quicker but lives in
# memory, so the app would come back from a reboot looking like an install
# nobody had ever set up — which is exactly what it did the first time.
#
# What it answers, in order:
#   1. does it install and open
#   2. does the foreground service run
#   3. are chimes scheduled with the OS
#   4. are exact alarms allowed (the answer differs on Android 12)
#   5. does it come back by itself after a reboot
#   6. does a force-stop take the chimes, and does opening it bring them back
set -uo pipefail

ADB="${ADB:-/opt/homebrew/share/android-commandlinetools/platform-tools/adb}"
S="${1:?serial}"
APK="${2:?apk path}"
PKG=com.raveliteapp
OUT="${OUT:-$(dirname "$0")}"

say() { printf '%-34s %s\n' "$1" "$2"; }
adb_() { "$ADB" -s "$S" "$@"; }
services() { adb_ shell dumpsys activity services $PKG 2>/dev/null | grep -c ForegroundService; }
alarms() { adb_ shell dumpsys alarm 2>/dev/null | grep -c "$PKG"; }

api=$(adb_ shell getprop ro.build.version.sdk | tr -d '\r')
rel=$(adb_ shell getprop ro.build.version.release | tr -d '\r')
echo
echo "=== Android $rel (API $api) on $S"

adb_ install -r -g "$APK" >/dev/null 2>&1 && say "install" "ok" || { say "install" "FAILED"; exit 1; }

adb_ shell am start -n $PKG/.MainActivity >/dev/null 2>&1
sleep 14
# Skip setup: it lands on the base program at a beginner's level, and
# unlike demo mode it is written to disk — which the reboot check needs.
adb_ shell input tap 655 114
sleep 10

say "opens" "$(adb_ shell dumpsys activity activities | grep -c "topResumedActivity.*$PKG")"
say "foreground services" "$(services)"
say "alarms held by the OS" "$(alarms)"

# The authoritative answer: window=0 is exact, and exactAllowReason says
# why the OS allowed it.
why=$(adb_ shell dumpsys alarm 2>/dev/null | grep -A2 "$PKG" | grep -oE "window=[0-9]+ exactAllowReason=[a-z]+" | head -1)
say "exact alarms" "${why:-none scheduled yet}"
if [ "$api" -ge 33 ]; then
  post=$(adb_ shell dumpsys package $PKG | grep -c "POST_NOTIFICATIONS: granted=true")
  say "notifications granted" "$post"
fi
say "posted notifications" "$(adb_ shell dumpsys notification --noredact 2>/dev/null | grep -c "pkg=$PKG")"

adb_ exec-out screencap -p > "$OUT/today-api$api.png" 2>/dev/null && say "screenshot" "today-api$api.png"

# 5. Reboot: does it come back with nobody opening it?
say "rebooting" "…"
adb_ reboot
adb_ wait-for-device >/dev/null 2>&1
for _ in $(seq 1 60); do
  [ "$(adb_ shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ] && break
  sleep 5
done
sleep 45
say "services after reboot" "$(services)"
say "alarms after reboot" "$(alarms)"
boot=$(adb_ logcat -d 2>/dev/null | grep -c "com.raveliteapp.boot.BootReceiver")
say "boot receiver fired" "$boot"

# 6. Force-stop: the chimes go with it, and come back when it is opened.
adb_ shell am force-stop $PKG
sleep 4
say "alarms after force-stop" "$(alarms)"
adb_ shell am start -n $PKG/.MainActivity >/dev/null 2>&1
sleep 15
say "alarms after reopening" "$(alarms)"
say "services after reopening" "$(services)"
echo
