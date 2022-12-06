import type { BrandColor, SupportedColor } from 'theme/colors';
import { focalboardColorsMap, brandColorNames } from 'theme/colors';

export function convertFocalboardToMUIColor(color: string): SupportedColor {
  if (brandColorNames.find((name) => name === color)) {
    return color as BrandColor;
  }

  const propColor = focalboardColorsMap[color];
  if (propColor) {
    return propColor;
  }

  return 'default';
}
