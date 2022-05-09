import { darken, lighten } from '@mui/system';

export const blackColor = '#111';
export const yellowColor = '#EAD637';

export const blueColor = '#009Fb7';
export const darkBlueColor = darken(blueColor, 0.1);
export const whiteColor = '#fff';
export const lightGreyColor = '#eff1f3';
export const greyColor2 = '#aaa';
export const darkGreyColor = '#696773';
export const greyColor = '#525252';

// main theme colors - inspired by Notion

// light mode
export const primaryTextColor = 'rgb(55, 53, 47)';
export const backgroundColor = '#fff';
export const backgroundLightColor = lightGreyColor;
export const backgroundDarkColor = darken(backgroundColor, 0.1);
export const settingsHeaderBackgroundColor = lighten(backgroundLightColor, 0.4);
export const scrollBarTrackBackgroundColor = darken(backgroundLightColor, 0.1);
export const scrollBarThumbBackgroundColor = lighten(scrollBarTrackBackgroundColor, 0.5);
export const inputBackground = 'rgba(242, 241, 238, 0.6)';
export const inputBorder = 'rgba(15, 15, 15, 0.1)';

// dark mode
export const primaryTextColorDarkMode = '#ededed';
export const backgroundColorDarkMode = '#191919';
export const backgroundLightColorDarkMode = '#202020';
export const backgroundDarkColorDarkMode = darken(backgroundColorDarkMode, 0.3);
export const settingsHeaderBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.3);
export const scrollBarTrackBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.2);
export const scrollBarThumbBackgroundColorDarkMode = lighten(scrollBarTrackBackgroundColorDarkMode, 0.1);
export const inputBackgroundDarkMode = 'rgba(255, 255, 255, 0.055)';
export const inputBorderDarkMode = 'rgba(15, 15, 15, 0.2)';

export type BrandColor = 'gray' | 'cyanBlue' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'

export type BrandColorScheme = Record<BrandColor, string>

export const darkModeColors: BrandColorScheme = {
  gray: '#91918D', // Philippine Gray
  cyanBlue: '#5681C8', // Silver Lake Blue
  orange: '#F79064', // Atomic Tangerine
  yellow: '#EFDF6C', // Arylide Yellow
  green: '#009FB7', // Bondi Blue
  blue: '#1FBFFF', // Spiro Disco Ball
  purple: '#985CFF', // Lavender Indigo
  pink: '#E36396', // Pale Red-Violet
  red: '#A073AB' // Purple Mountain Majesty
};

export const lightModeColors: BrandColorScheme = {
  gray: '#E1E1E0', // Chinese White
  cyanBlue: '#D1DDF0', // Azureish White
  orange: '#FDE3D8', // Antique White
  yellow: '#FBF7DA', // Cornsilk
  green: '#D6FAFF', // Water
  blue: '#C2EEFF', // Diamond
  purple: '#E5D6FF', // Pale Lavender
  pink: '#F9DDE8', // Piggy Pink
  red: '#E5D9E8' // Platinum
};
