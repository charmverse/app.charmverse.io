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

// dark mode
export const primaryTextColorDarkMode = '#ededed';
export const backgroundColorDarkMode = '#191919';
export const backgroundLightColorDarkMode = '#202020';
export const backgroundDarkColorDarkMode = darken(backgroundColorDarkMode, 0.3);
export const settingsHeaderBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.3);
export const scrollBarTrackBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.2);
export const scrollBarThumbBackgroundColorDarkMode = lighten(scrollBarTrackBackgroundColorDarkMode, 0.1);

export type BrandColors = 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red'

export type BrandColorScheme = Record<BrandColors, string>

export const darkModeColors: BrandColorScheme = {
  gray: '#7A6677',
  brown: '#79632A',
  orange: '#CC4B00',
  yellow: '#B89F00',
  green: '#007A5C',
  blue: '#007C8F',
  purple: '#5F396A',
  pink: '#D11046',
  red: '#970C0C'
};

export const lightModeColors: BrandColorScheme = {
  gray: '#C4D0D4',
  brown: '#E6C39E',
  orange: '#FFAC47',
  yellow: '#FDFD9B',
  green: '#A8F0DD',
  blue: '#ADF4FF',
  purple: '#B7AFD4',
  pink: '#EB82ED',
  red: '#E37898'
};
