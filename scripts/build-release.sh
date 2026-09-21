#!/usr/bin/env bash
#
# Build a release APK, on a laptop that cannot spare much memory.
#
# Every setting here exists because the default ate 8 GB and froze the
# editor: no daemon, two workers, a 2 GB heap, and Kotlin compiled in
# process rather than in a second JVM.
#
set -euo pipefail

cd "$(dirname "$0")/.."
APP="RaveLiteApp"
APK="$APP/android/app/build/outputs/apk/release/app-release.apk"

export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
export ANDROID_HOME="${ANDROID_HOME:-/opt/homebrew/share/android-commandlinetools}"

( cd "$APP/android" && ./gradlew assembleRelease \
    --no-daemon --max-workers=2 \
    -Dorg.gradle.jvmargs="-Xmx2g -XX:MaxMetaspaceSize=512m" \
    -Pkotlin.compiler.execution.strategy=in-process \
    -q )

echo
echo "APK: $APK"
ls -lh "$APK" | awk '{print "     " $5}'

# Which key signed it, so a surprise is never silent.
if command -v apksigner >/dev/null 2>&1; then
  SIGNER=$(apksigner verify --print-certs "$APK" 2>/dev/null | grep -m1 "Subject" || true)
  echo "     ${SIGNER:-signature unknown}"
elif keytool -printcert -jarfile "$APK" >/dev/null 2>&1; then
  keytool -printcert -jarfile "$APK" 2>/dev/null | grep -m1 "Owner:" | sed 's/^/     /'
fi

case "$(keytool -printcert -jarfile "$APK" 2>/dev/null | grep -m1 'Owner:' || true)" in
  *Android\ Debug*)
    echo
    echo "NOTE: this is debug-signed. Fine for your own phone; not for"
    echo "testers. Run scripts/make-keystore.sh when you are ready."
    ;;
esac
