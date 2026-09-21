#!/usr/bin/env bash
#
# Send the current release APK to testers through Firebase App
# Distribution.
#
# Needs, once:
#   npm install -g firebase-tools
#   firebase login
#   a Firebase project with an Android app for com.raveliteapp
#
# Then put the app id in ~/.ravelite/firebase.env:
#   FIREBASE_APP_ID=1:123456789:android:abcdef
#
set -euo pipefail

cd "$(dirname "$0")/.."
APK="RaveLiteApp/android/app/build/outputs/apk/release/app-release.apk"
ENV_FILE="${RAVELITE_FIREBASE_ENV:-$HOME/.ravelite/firebase.env}"
NOTES="${1:-}"

if ! command -v firebase >/dev/null 2>&1; then
  echo "firebase-tools is not installed. Run:"
  echo "  npm install -g firebase-tools && firebase login"
  exit 1
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "No $ENV_FILE. Create it with one line:"
  echo "  FIREBASE_APP_ID=1:123456789:android:abcdef"
  exit 1
fi
# shellcheck disable=SC1090
. "$ENV_FILE"
if [ -z "${FIREBASE_APP_ID:-}" ]; then
  echo "$ENV_FILE has no FIREBASE_APP_ID."
  exit 1
fi
if [ ! -f "$APK" ]; then
  echo "No APK yet. Run scripts/build-release.sh first."
  exit 1
fi

OWNER=$(keytool -printcert -jarfile "$APK" 2>/dev/null | grep -m1 'Owner:' || true)
case "$OWNER" in
  *Android\ Debug*)
    echo "This APK is debug-signed, so every tester would have to uninstall"
    echo "again the moment you sign it properly. Run scripts/make-keystore.sh"
    echo "first — it is the whole reason export/restore exists."
    exit 1
    ;;
esac

if [ -z "$NOTES" ]; then
  NOTES="$(git log -1 --pretty=%s)"
fi

echo "Sending $APK"
echo "Notes: $NOTES"
firebase appdistribution:distribute "$APK" \
  --app "$FIREBASE_APP_ID" \
  --release-notes "$NOTES" \
  --groups "testers"
