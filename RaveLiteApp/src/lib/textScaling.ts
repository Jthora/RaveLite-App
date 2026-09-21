/**
 * How far the OS font setting may stretch this app.
 *
 * Nothing here capped text scaling, which means it was uncapped: a phone
 * set to its largest font could push every line in the app up by roughly
 * double. On a 720 dp screen that breaks the rows this design is built
 * around — the conditions line that must stay on one line, the Daily Sets
 * meters, the bottom links — and a broken layout is worse for the person
 * who needed the large text than slightly smaller text would have been.
 *
 * So text still grows, up to a point. The cap is a compromise and should
 * be honest about that: somebody who needs more than this is better
 * served by the system zoom than by an app that folds in half.
 *
 * `defaultProps` on Text is the only way RN 0.73 offers to say this once
 * rather than 559 times. It is deprecated for components; on the Text
 * host component it is still the documented approach.
 */
import {Text, TextInput} from 'react-native';

/** 1.0 is the OS default; Android's largest setting asks for about 2.0. */
export const MAX_FONT_SCALE = 1.35;

type Scalable = {
  defaultProps?: {maxFontSizeMultiplier?: number; allowFontScaling?: boolean};
};

export function capTextScaling(max: number = MAX_FONT_SCALE): void {
  for (const component of [Text, TextInput] as unknown as Scalable[]) {
    component.defaultProps = {
      ...(component.defaultProps ?? {}),
      maxFontSizeMultiplier: max,
    };
  }
}

/** What text will actually render at, given what the OS asked for. */
export function cappedScale(
  osScale: number,
  max: number = MAX_FONT_SCALE,
): number {
  return Math.min(osScale, max);
}
