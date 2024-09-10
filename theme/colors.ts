import { darken, lighten } from '@mui/material/styles';
import { charmBlue } from '@root/config/colors';

export const blackColor = '#111';
export const yellowColor = '#EAD637';

export const blueColor = charmBlue;
export const darkBlueColor = darken(blueColor, 0.1);
export const whiteColor = '#fff';
export const lightGreyColor = '#edf2f4';
export const greyColor2 = '#aaa';
export const darkGreyColor = '#696773';
// export const greyColor = '#525252';

// light mode
export const primaryTextColor = '#37352f';
export const secondaryTextColor = '#888';
export const backgroundColor = '#fff';
export const backgroundLightColor = lightGreyColor;
export const backgroundDarkColor = darken(backgroundColor, 0.1);
export const settingsHeaderBackgroundColor = lighten(backgroundLightColor, 0.4);
export const scrollBarTrackBackgroundColor = darken(backgroundLightColor, 0.1);
export const scrollBarThumbBackgroundColor = lighten(scrollBarTrackBackgroundColor, 0.5);
export const inputBackground = 'rgb(245, 246, 247)';
export const inputBorder = 'rgba(15, 15, 15, 0.1)';
export const linkUnderlineColor = 'rgba(55,53,47,0.25)';

// dark mode
export const primaryTextColorDarkMode = '#ededed';
export const secondaryTextColorDarkMode = '#999';
export const backgroundColorDarkMode = '#191919';
export const backgroundLightColorDarkMode = '#262626';
export const backgroundDarkColorDarkMode = '#171717';
export const settingsHeaderBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.3);
export const scrollBarTrackBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.2);
export const scrollBarThumbBackgroundColorDarkMode = lighten(scrollBarTrackBackgroundColorDarkMode, 0.1);
export const inputBackgroundDarkMode = 'rgba(255, 255, 255, 0.055)';
export const inputBorderDarkMode = 'rgba(255, 255, 255, 0.055)';
export const linkUnderlineColorDarkMode = 'rgba(55, 55, 55, 1)';

export const colors = {
  gray: {
    dark: '#757570',
    light: '#E7E7E6'
  },
  orange: {
    dark: '#C44F1C',
    light: '#F4D8D0'
  },
  yellow: {
    dark: '#81730E',
    light: '#EFE9CB'
  },
  green: {
    dark: '#1D7324',
    light: '#D0EFD6'
  },
  teal: {
    dark: '#007C8F',
    light: '#D0F4F1'
  },
  blue: {
    dark: '#007CAD',
    light: '#C1E7F4'
  },
  turquoise: {
    dark: '#4273C2',
    light: '#C2DCF2'
  },
  purple: {
    dark: '#8742FF',
    light: '#D7D3F4'
  },
  pink: {
    dark: '#925E9C',
    light: '#E8D3ED'
  },
  red: {
    dark: '#D53474',
    light: '#F2CCD6'
  }
};

export type BrandColor = keyof typeof colors;
export type SupportedColor = BrandColor | 'default';

export const brandColorNames = Object.keys(colors) as BrandColor[];

export const focalboardColorsMap: { [key: string]: SupportedColor } = {
  propColorDefault: 'default',
  propColorGray: 'gray',
  propColorTurquoise: 'turquoise',
  propColorGreen: 'green',
  propColorOrange: 'orange',
  propColorYellow: 'yellow',
  propColorTeal: 'teal',
  propColorBlue: 'blue',
  propColorPurple: 'purple',
  propColorRed: 'red',
  propColorPink: 'pink'
};

export const dangerColor = '#d32f2f'; // taken from MUI
