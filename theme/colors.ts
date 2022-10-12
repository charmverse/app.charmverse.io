import { darken, lighten } from '@mui/system';

export const blackColor = '#111';
export const yellowColor = '#EAD637';

export const blueColor = '#009Fb7';
export const blueColorRGB = '0, 159, 183';
export const darkBlueColor = darken(blueColor, 0.1);
export const whiteColor = '#fff';
export const lightGreyColor = '#edf2f4';
export const greyColor2 = '#aaa';
export const darkGreyColor = '#696773';
export const greyColor = '#525252';

// main theme colors - inspired by Notion

// light mode
export const primaryTextColor = '#37352f';
export const backgroundColor = '#fff';
export const backgroundLightColor = lightGreyColor;
export const backgroundDarkColor = darken(backgroundColor, 0.1);
export const settingsHeaderBackgroundColor = lighten(backgroundLightColor, 0.4);
export const scrollBarTrackBackgroundColor = darken(backgroundLightColor, 0.1);
export const scrollBarThumbBackgroundColor = lighten(scrollBarTrackBackgroundColor, 0.5);
export const inputBackground = 'rgb(245, 246, 247)';
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

export type BrandColor = 'gray' | 'turquoise' | 'orange' | 'yellow' | 'teal' | 'blue' | 'purple' | 'pink' | 'red'

export type BrandColorScheme = Record<BrandColor, string>

export const darkModeColors: BrandColorScheme = {
  gray: '#757570', // Dark Gray
  turquoise: '#4273C2', // Dark Turquoise
  orange: '#C44F1C', // Dark Orange
  yellow: '#81730E', // Dark Yellow
  teal: '#007C8F', // Dark Teal
  blue: '#007CAD', // Dark Blue
  purple: '#8742FF', // Dark Purple
  red: '#D53474', // Dark Red
  pink: '#925E9C' // Dark Pink
};

export const lightModeColors: BrandColorScheme = {
  gray: '#E7E7E6', // Light Gray
  turquoise: '#C2DCF2', // Light Turquoise
  orange: '#F4D8D0', // Light Orange
  yellow: '#EFE9CB', // Light Yellow
  teal: '#D0F4F1', // Light Teal
  blue: '#C1E7F4', // Light Blue
  purple: '#D7D3F4', // Light Purple
  red: '#F2CCD6', // Light Red
  pink: '#E8D3ED' // Light Pink
};

export const brandColorNames = Object.keys(darkModeColors) as BrandColor[];
