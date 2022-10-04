
import type {
  Theme
} from 'components/common/BoardEditor/focalboard/src/theme';
import {
  darkTheme as originalDarkTheme,
  lightTheme as originalLightTheme
} from 'components/common/BoardEditor/focalboard/src/theme';
import type { BrandColorScheme } from 'theme/colors';
import { darkModeColors, lightModeColors } from 'theme/colors';

/**
 * Automatically generate property names that are in sync with our brand colours
 */
function renameColorsForFocalboard (colorScheme: BrandColorScheme): Record<string, string> {
  return Object.entries(colorScheme).reduce((computedColorScheme, color) => {

    const propName = color[0];
    const capitalisedPropName = `prop${propName.slice(0, 1).toUpperCase()}${propName.slice(1)}`;

    // eslint-disable-next-line prefer-destructuring
    computedColorScheme[capitalisedPropName] = color[1];

    return computedColorScheme;
  }, <any>{});
}

const darkFocalboardBrandColors = renameColorsForFocalboard(darkModeColors);

export const darkTheme: Theme = {
  ...originalDarkTheme,
  mainBg: '25, 25, 25',
  ...darkFocalboardBrandColors
};

const lightFocalboardBrandColors = renameColorsForFocalboard(lightModeColors);

export const lightTheme: Theme = {
  ...originalLightTheme,
  ...lightFocalboardBrandColors

};
