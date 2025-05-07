import type { SupportedColor } from 'theme/colors';
import { focalboardColorsMap } from 'theme/colors';

export function mapMUIColorToProperty(colorName: SupportedColor) {
  let color = 'default';

  const colorEntry = Object.entries(focalboardColorsMap).find(([, value]) => value === colorName);
  if (colorEntry) {
    color = colorEntry[0];
  }

  return color;
}
