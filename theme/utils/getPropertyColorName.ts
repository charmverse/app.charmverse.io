import type { SupportedColor } from 'theme/colors';
import { propertyColorsMap } from 'theme/colors';

export function getPropertyColorName (colorName: SupportedColor) {
  let color = 'default';

  const colorEntry = Object.entries(propertyColorsMap).find(([, value]) => value === colorName);
  if (colorEntry) {
    color = colorEntry[0];
  }

  return color;
}
