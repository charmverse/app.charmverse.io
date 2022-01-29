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
export const sidebarBackgroundColor = lightGreyColor;
export const settingsHeaderBackgroundColor = lighten(sidebarBackgroundColor, 0.4);
export const scrollBarTrackBackgroundColor = darken(sidebarBackgroundColor, 0.1);
export const scrollBarThumbBackgroundColor = lighten(scrollBarTrackBackgroundColor, 0.5);

// dark mode
export const primaryTextColorDarkMode = 'rgba(255, 255, 255, 0.9)';
export const backgroundColorDarkMode = '#2f3437';
export const sidebarBackgroundColorDarkMode = '#373c3f';
export const settingsHeaderBackgroundColorDarkMode = darken(sidebarBackgroundColorDarkMode, 0.3);
export const scrollBarTrackBackgroundColorDarkMode = darken(sidebarBackgroundColorDarkMode, 0.2);
export const scrollBarThumbBackgroundColorDarkMode = lighten(scrollBarTrackBackgroundColorDarkMode, 0.1);
