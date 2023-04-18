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

export const darkTheme = renameColorsForFocalboard('dark');

export const lightTheme = renameColorsForFocalboard('light');
