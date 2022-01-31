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
export const primaryTextColorDarkMode = 'rgba(255, 255, 255, 0.9)';
export const backgroundColorDarkMode = '#2f3437';
export const backgroundLightColorDarkMode = '#373c3f';
export const backgroundDarkColorDarkMode = darken(backgroundColorDarkMode, 0.2);
export const settingsHeaderBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.3);
export const scrollBarTrackBackgroundColorDarkMode = darken(backgroundLightColorDarkMode, 0.2);
export const scrollBarThumbBackgroundColorDarkMode = lighten(scrollBarTrackBackgroundColorDarkMode, 0.1);
