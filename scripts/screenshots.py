#!/usr/bin/env python3
"""
Photograph the app without photographing anybody's training.

Turns on demo mode (ravelite://demo/on), which swaps a fictional life in
front of the real one without ever writing to it, walks the screens,
captures each, and turns it off again.

    scripts/screenshots.py                 # everything, to ./screenshots
    scripts/screenshots.py --list          # what it would take
    scripts/screenshots.py --only today    # one shot
    scripts/screenshots.py --keep-demo     # leave demo on to look around

Nothing here presses Done, +1, Log, Remove or any other button that
records something: the walk opens and closes, it does not train.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
import time
from pathlib import Path

PACKAGE = "com.raveliteapp"
ACTIVITY = f"{PACKAGE}/.MainActivity"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "screenshots"


def adb(*args: str, serial: str | None = None) -> str:
    cmd = ["adb"]
    if serial:
        cmd += ["-s", serial]
    return subprocess.run(cmd + list(args), capture_output=True, text=True).stdout


def devices() -> list[str]:
    out = subprocess.run(["adb", "devices"], capture_output=True, text=True).stdout
    return [
        line.split("\t")[0]
        for line in out.splitlines()[1:]
        if line.strip() and line.endswith("device")
    ]


class Phone:
    def __init__(self, serial: str) -> None:
        self.serial = serial

    def sh(self, *args: str) -> str:
        return adb(*args, serial=self.serial)

    def front(self) -> str:
        out = self.sh("shell", "dumpsys", "activity", "activities")
        m = re.search(r"topResumedActivity=ActivityRecord\{\S+ \S+ (\S+)", out)
        return m.group(1) if m else "?"

    def wait_for_app(self, secs: int = 15) -> bool:
        for _ in range(secs * 2):
            if PACKAGE in self.front():
                return True
            time.sleep(0.5)
        return False

    def dump(self) -> str:
        """The view tree. Racy — always re-read after acting."""
        self.sh("shell", "uiautomator", "dump", "/sdcard/ui.xml")
        return self.sh("shell", "cat", "/sdcard/ui.xml")

    def find(self, pattern: str, tries: int = 6) -> tuple[int, int] | None:
        """Centre of the first node matching, retrying past a stale dump."""
        for _ in range(tries):
            xml = self.dump()
            m = re.search(
                pattern + r'[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"', xml
            )
            if m:
                x1, y1, x2, y2 = map(int, m.groups())
                return (x1 + x2) // 2, (y1 + y2) // 2
            time.sleep(0.7)
        return None

    def tap(self, at: tuple[int, int]) -> None:
        self.sh("shell", "input", "tap", str(at[0]), str(at[1]))
        time.sleep(1.4)

    def back(self) -> None:
        self.sh("shell", "input", "keyevent", "KEYCODE_BACK")
        time.sleep(1.2)

    def scroll(self, times: int = 1, up: bool = False) -> None:
        for _ in range(times):
            if up:
                self.sh("shell", "input", "swipe", "360", "600", "360", "1300", "220")
            else:
                self.sh("shell", "input", "swipe", "360", "1200", "360", "600", "220")
            time.sleep(0.5)

    def shoot(self, name: str) -> Path:
        OUT.mkdir(parents=True, exist_ok=True)
        self.sh("shell", "screencap", "-p", "/sdcard/shot.png")
        path = OUT / f"{name}.png"
        subprocess.run(
            ["adb", "-s", self.serial, "pull", "/sdcard/shot.png", str(path)],
            capture_output=True,
        )
        return path

    def link(self, url: str) -> None:
        self.sh("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", url)
        time.sleep(2.5)


def by_id(rid: str) -> str:
    return f'resource-id="{rid}"'


def by_desc(text: str) -> str:
    return f'content-desc="{re.escape(text)}"'


def by_text(text: str) -> str:
    return f'text="{re.escape(text)}"'


# Each shot: a name, and what to do from a freshly launched Today.
def shot_today(p: Phone) -> None:
    pass


def shot_daily_sets(p: Phone) -> None:
    at = p.find(by_id("sets-open"))
    if not at:
        p.scroll(3)
        at = p.find(by_id("sets-open"))
    if at:
        p.tap(at)


def shot_character(p: Phone) -> None:
    shot_daily_sets(p)
    at = p.find(by_id("today-focus"))
    if at:
        p.tap(at)
        time.sleep(1.2)


def shot_goals(p: Phone) -> None:
    shot_daily_sets(p)
    at = p.find(by_id("goals-open"))
    if at:
        p.tap(at)


def shot_practice(p: Phone) -> None:
    p.scroll(12)
    at = p.find(by_desc("Practice")) or p.find(by_text("Practice"))
    if at:
        p.tap(at)


def shot_settings(p: Phone) -> None:
    p.scroll(12)
    at = p.find(by_desc("Settings"))
    if at:
        p.tap(at)


def shot_archetypes(p: Phone) -> None:
    shot_settings(p)
    for _ in range(8):
        if p.find(by_id("archetype-raver"), tries=1):
            return
        p.scroll(1)


def shot_packs(p: Phone) -> None:
    shot_settings(p)
    for _ in range(10):
        if p.find(by_id("pack-dance"), tries=1):
            return
        p.scroll(1)


def shot_data(p: Phone) -> None:
    shot_settings(p)
    p.scroll(16)


SHOTS = [
    ("today", "Today, the page the app lives on", shot_today),
    ("daily-sets", "Daily Sets: the day's tracks", shot_daily_sets),
    ("character", "The character sheet", shot_character),
    ("goals", "Goals and standards", shot_goals),
    ("practice", "Practice: the curriculum", shot_practice),
    ("settings", "Settings", shot_settings),
    ("archetypes", "What you're training for", shot_archetypes),
    ("packs", "What you're here to learn", shot_packs),
    ("your-data", "Export, restore, start over", shot_data),
]


def verify_demo(p: Phone) -> bool:
    """Is a fictional life actually on screen?

    The demo seeds eleven weeks, so Today always shows a streak and sets
    already done. The real app on a fresh morning shows neither. Checking
    is cheap; being wrong means publishing somebody's training.
    """
    for _ in range(6):
        xml = p.dump()
        if re.search(r'text="DAILY SETS [1-9]', xml) or re.search(
            r'text="[1-9]\d* ?/ ?8"', xml
        ):
            return True
        time.sleep(0.8)
    return False


def relaunch(p: Phone, demo: bool) -> None:
    """Back to a clean Today.

    Demo mode lives in the JS process and dies with it — deliberately, so
    that a crash can never strand somebody in a fake life. That makes it
    the automation's job to put it back after every restart, and the cost
    of forgetting is a folder of screenshots of the operator's real
    training. Which is exactly what happened the first time.
    """
    p.sh("shell", "am", "force-stop", PACKAGE)
    p.sh("shell", "am", "start", "-n", ACTIVITY)
    time.sleep(6)
    if demo:
        p.link("ravelite://demo/on")
        time.sleep(1.5)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--serial", help="adb device, if more than one")
    ap.add_argument("--only", action="append", help="just these shots")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--keep-demo", action="store_true")
    ap.add_argument("--no-demo", action="store_true",
                    help="shoot the real data (it will be in the pictures)")
    args = ap.parse_args()

    if args.list:
        for name, why, _ in SHOTS:
            print(f"  {name:<12} {why}")
        return 0

    found = devices()
    serial = args.serial or (found[0] if len(found) == 1 else None)
    if not serial:
        print("Need exactly one device, or --serial. Found:", found or "none")
        return 1

    p = Phone(serial)
    wanted = [s for s in SHOTS if not args.only or s[0] in args.only]
    if not wanted:
        print("No shots matched --only.")
        return 1

    demo = not args.no_demo
    relaunch(p, demo)
    if not p.wait_for_app():
        print("The app did not come up.")
        return 1

    if demo:
        if not verify_demo(p):
            print("Demo mode did not take. Refusing to photograph real data.")
            return 1
        print("Demo mode on — the real data is untouched behind it.")

    try:
        for name, why, walk in wanted:
            relaunch(p, demo)
            p.wait_for_app()
            if demo and not verify_demo(p):
                print(f"  {name:<12} SKIPPED: demo mode was not on.")
                continue
            walk(p)
            time.sleep(0.8)
            path = p.shoot(name)
            print(f"  {name:<12} {why}\n               {path}")
    finally:
        if args.no_demo:
            pass
        elif args.keep_demo:
            print("\nDemo mode left ON. Turn it off with:")
            print(f"  adb -s {serial} shell am start -a android.intent.action.VIEW"
                  " -d ravelite://demo/off")
        else:
            p.link("ravelite://demo/off")
            relaunch(p, demo=False)
            print("\nDemo mode off. Real data back, and it never left.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
