
import {
  Theme,
  darkTheme as originalDarkTheme,
  lightTheme as originalLightTheme
} from 'components/databases/focalboard/src/theme';

import { darkModeColors, lightModeColors, BrandColorScheme } from 'theme/colors';

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
  ...darkFocalboardBrandColors
};

const lightFocalboardBrandColors = renameColorsForFocalboard(lightModeColors);

export const lightTheme: Theme = {
  ...originalLightTheme,
  ...lightFocalboardBrandColors

};
