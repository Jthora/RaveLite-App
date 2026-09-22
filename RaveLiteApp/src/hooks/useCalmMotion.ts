import {useEffect, useState} from 'react';

import {getMotionMode, subscribeAlive} from '../lib/aliveClock';

/**
 * Whether motion should be held still: Android's "Remove animations", the
 * app's Still setting, night or a pause (see `resolveMotionMode`). For
 * screens with their own animation, like the circuit, which used to pulse
 * and flash whatever either setting said.
 */
export function useCalmMotion(): boolean {
  const calm = () => {
    const mode = getMotionMode();
    return mode === 'off' || mode === 'still';
  };
  const [value, setValue] = useState(calm);
  useEffect(() => subscribeAlive(() => setValue(calm())), []);
  return value;
}
