import type { BrandColor, SupportedColor } from 'theme/colors';
import { propertyColorsMap, brandColorNames } from 'theme/colors';

export function getThemeColorFromString (color: string): SupportedColor {
  if (brandColorNames.find((name) => name === color)) {
    return color as BrandColor;
  }

  const propColor = propertyColorsMap[color];
  if (propColor) {
    return propColor;
  }

  return 'default';
}
