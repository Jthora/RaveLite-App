#!/usr/bin/env bash
#
# Make the release keystore, once, outside the repo.
#
# This key IS the app's identity on every store and every phone. Lose it
# and you cannot ship an update to anybody who installed the old one —
# they have to uninstall, which takes their training log with it. Back the
# file up somewhere that is not this laptop.
#
set -euo pipefail

KEYSTORE_DIR="${RAVELITE_KEYSTORE_DIR:-$HOME/.ravelite}"
KEYSTORE="$KEYSTORE_DIR/release.keystore"
ALIAS="ravelite"
PROPS="$HOME/.gradle/gradle.properties"

if [ -f "$KEYSTORE" ]; then
  echo "A keystore already exists at $KEYSTORE"
  echo "Refusing to overwrite it — that would orphan every install signed"
  echo "with the old one. Delete it by hand first if you really mean to."
  exit 1
fi

echo "This makes a 10000-day signing key at:"
echo "  $KEYSTORE"
echo
read -r -s -p "Choose a password for it: " PASSWORD; echo
read -r -s -p "Again, to be sure:        " CONFIRM; echo
if [ "$PASSWORD" != "$CONFIRM" ]; then
  echo "Those did not match. Nothing was written."
  exit 1
fi
if [ ${#PASSWORD} -lt 8 ]; then
  echo "Use at least 8 characters. Nothing was written."
  exit 1
fi

mkdir -p "$KEYSTORE_DIR"
chmod 700 "$KEYSTORE_DIR"

keytool -genkeypair -v \
  -keystore "$KEYSTORE" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass "$PASSWORD" -keypass "$PASSWORD" \
  -dname "CN=RaveLite, OU=RaveLite, O=RaveLite, L=, ST=, C=" >/dev/null

chmod 600 "$KEYSTORE"

mkdir -p "$(dirname "$PROPS")"
touch "$PROPS"
if grep -q "RAVELITE_STORE_FILE" "$PROPS" 2>/dev/null; then
  echo
  echo "$PROPS already mentions RAVELITE_STORE_FILE — leaving it alone."
  echo "Check it points at $KEYSTORE"
else
  {
    echo ""
    echo "# RaveLite release signing. Never commit these."
    echo "RAVELITE_STORE_FILE=$KEYSTORE"
    echo "RAVELITE_STORE_PASSWORD=$PASSWORD"
    echo "RAVELITE_KEY_ALIAS=$ALIAS"
    echo "RAVELITE_KEY_PASSWORD=$PASSWORD"
  } >> "$PROPS"
  chmod 600 "$PROPS"
fi

echo
echo "Done."
echo
echo "  Keystore:   $KEYSTORE"
echo "  Properties: $PROPS"
echo
echo "Back up BOTH somewhere off this machine. Without them there are no"
echo "more updates for anyone who installed a signed build."
echo
echo "Your next release build will be signed with this key. It cannot"
echo "install over the debug-signed app already on your phone:"
echo
echo "  1. Open RaveLite, Settings -> Your data -> Export, and keep the file."
echo "  2. adb uninstall com.raveliteapp"
echo "  3. Build and install the signed APK."
echo "  4. Settings -> Your data -> Restore, and pick the file."
