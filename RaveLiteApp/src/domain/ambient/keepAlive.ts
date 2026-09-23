/**
 * What this particular phone needs, in its own words.
 *
 * Stay alive can read the standard Android settings — battery
 * optimisation, exact alarms, notifications, the standby bucket — and
 * those are not the ones that kill this app. Every large phone maker
 * adds its own gates on top: an autostart list, a sleeping-apps list, a
 * startup manager. **None of them can be read by an app**, on any
 * version of Android. There is no API and there never has been.
 *
 * So the app cannot check these, and must not claim to. What it can do
 * is name them, exactly, for the phone in the person's hand — and only
 * once something has actually gone wrong, because a phone that is
 * behaving needs no lecture.
 *
 * Paths were current in September 2026 and move between versions. Each
 * one is written so it still reads as a hint if the menu has been
 * renamed.
 */

export interface KeepAlive {
  /** The maker, as a person would say it. */
  maker: string;
  steps: string[];
}

/** Said at the end of every list, because it is the honest part. */
export const NOT_OURS =
  'These are the phone’s own settings. RaveLite cannot read them or change them.';

const XIAOMI: string[] = [
  'Settings → Apps → Manage apps → RaveLite → Autostart: on.',
  'Same screen → Battery saver: No restrictions.',
  'Open recent apps, pull the RaveLite card down, tap the padlock.',
  'A system update can switch these off again. If chimes stop, check them first.',
];

const SAMSUNG: string[] = [
  'Settings → Battery → Background usage limits → Never sleeping apps: add RaveLite.',
  'Same screen: turn off “Put unused apps to sleep”.',
  'Settings → Apps → RaveLite → Battery: Unrestricted.',
  'An app left unopened for three days sleeps anyway, and for sixteen days stops entirely.',
];

const COLOR_OS: string[] = [
  'Settings → Battery → App battery management → RaveLite: allow auto-launch, background activity and foreground activity.',
  'Settings → Battery → turn off Sleep standby optimisation.',
  'Lock RaveLite in recent apps.',
];

const REALME = [
  ...COLOR_OS,
  'Settings → Apps → Special access → Display pop-up windows: allow RaveLite, or chimes never surface.',
];

const VIVO: string[] = [
  'Settings → More settings → Applications → Autostart: on for RaveLite.',
  'Settings → Battery → Background power consumption management: allow RaveLite.',
  'Settings → Battery → High background power consumption: allow RaveLite.',
  'Lock RaveLite in recent apps.',
];

const HUAWEI: string[] = [
  'Settings → Battery → App launch → RaveLite: switch to Manage manually, then turn on all three — auto-launch, secondary launch, run in background.',
  'Settings → Battery → Battery optimisation → RaveLite: Don’t allow.',
  'Without the first one, this phone force-stops background apps after about an hour.',
];

const TRANSSION: string[] = [
  'Settings → Battery Lab → Battery saving settings: turn off Power saving management.',
  'Phone Master → Auto-start management: allow RaveLite.',
  'Settings → Battery → Battery optimisation → RaveLite: Don’t optimise.',
  'Lock RaveLite in recent apps.',
];

const MOTOROLA: string[] = [
  'Settings → Battery → turn off “Improve battery while inactive”.',
  'Settings → Apps → RaveLite → Battery: Unrestricted.',
];

const SONY: string[] = [
  'Turn STAMINA mode off, or add RaveLite to its exceptions.',
  'Settings → Apps → RaveLite → Battery: Unrestricted.',
];

const STOCK: string[] = [
  'Settings → Apps → RaveLite → Battery: Unrestricted.',
  'If chimes still stop, tell us — on this phone that should be enough.',
];

/** Makers that share a skin, and the names they ship under. */
const BY_MAKER: ReadonlyArray<
  [names: string[], maker: string, steps: string[]]
> = [
  [['xiaomi', 'redmi', 'poco'], 'Xiaomi', XIAOMI],
  [['samsung'], 'Samsung', SAMSUNG],
  [['realme'], 'realme', REALME],
  [['oppo', 'oneplus'], 'Oppo and OnePlus', COLOR_OS],
  [['vivo', 'iqoo'], 'vivo', VIVO],
  [['huawei', 'honor'], 'Huawei and Honor', HUAWEI],
  [
    ['tecno', 'infinix', 'itel', 'transsion'],
    'Tecno, Infinix and itel',
    TRANSSION,
  ],
  [['motorola', 'lenovo'], 'Motorola', MOTOROLA],
  [['sony'], 'Sony', SONY],
];

/**
 * The steps for a maker, or the plain ones for a phone that does not
 * fight its own apps (Pixel, Nothing, and anything unknown).
 */
export function keepAliveSteps(manufacturer: string | undefined): KeepAlive {
  const name = (manufacturer ?? '').toLowerCase();
  const found = BY_MAKER.find(([names]) => names.some(n => name.includes(n)));
  return found
    ? {maker: found[1], steps: found[2]}
    : {maker: manufacturer?.trim() || 'This phone', steps: STOCK};
}

/** Whether this maker is known to stop apps like this one. */
export function fightsBackgroundApps(
  manufacturer: string | undefined,
): boolean {
  const name = (manufacturer ?? '').toLowerCase();
  return BY_MAKER.some(
    ([names, maker]) => maker !== 'Sony' && names.some(n => name.includes(n)),
  );
}
