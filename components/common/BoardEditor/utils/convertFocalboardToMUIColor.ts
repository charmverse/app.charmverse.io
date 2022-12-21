import type { BrandColor, SupportedColor } from 'theme/colors';
import { focalboardColorsMap, colors } from 'theme/colors';

export function convertFocalboardToMUIColor(color: string): SupportedColor {
  if (colors[color as BrandColor]) {
    return color as BrandColor;
  }

  const propColor = focalboardColorsMap[color];
  if (propColor) {
    return propColor;
  }

  return 'default';
}
