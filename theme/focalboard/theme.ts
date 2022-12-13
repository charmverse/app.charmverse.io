import type { Theme } from 'components/common/BoardEditor/focalboard/src/theme';
import {
  darkTheme as originalDarkTheme,
  lightTheme as originalLightTheme
} from 'components/common/BoardEditor/focalboard/src/theme';
import { colors } from 'theme/colors';

/**
 * Automatically generate property names that are in sync with our brand colours
 */
function renameColorsForFocalboard(colorMode: 'light' | 'dark'): Record<string, string> {
  return Object.entries(colors).reduce((computedColorScheme, [color, value]) => {
    const capitalisedPropName = `prop${color.slice(0, 1).toUpperCase()}${color.slice(1)}`;

    computedColorScheme[capitalisedPropName] = value[colorMode];

    return computedColorScheme;
  }, <any>{});
}

const darkFocalboardBrandColors = renameColorsForFocalboard('dark');

export const darkTheme: Theme = {
  ...originalDarkTheme,
  mainBg: '25, 25, 25',
  ...darkFocalboardBrandColors
};

const lightFocalboardBrandColors = renameColorsForFocalboard('light');

export const lightTheme: Theme = {
  ...originalLightTheme,
  ...lightFocalboardBrandColors
};
