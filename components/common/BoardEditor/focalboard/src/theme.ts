
import type { CSSObject } from '@emotion/serialize';
import color from 'color';
import isEqual from 'lodash/isEqual';

import * as colors from 'theme/colors';

import { UserSettings } from './userSettings';
import { Utils } from './utils';

let activeThemeName: string;

export type Theme = {
    mainBg: string;
    mainFg: string;
    buttonBg: string;
    buttonFg: string;
    sidebarBg: string;
    sidebarFg: string;
    sidebarTextActiveBorder: string;
    sidebarWhiteLogo: string;

    link: string;
    linkVisited: string;

    propDefault: string;
    propGray: string;
    propTurquoise: string;
    propOrange: string;
    propYellow: string;
    propTeal: string;
    propBlue: string;
    propPurple: string;
    propPink: string;
    propRed: string;
}

export const systemThemeName = 'system-theme';

export const defaultThemeName = 'default-theme';

export const defaultTheme = {
  mainBg: '255, 255, 255',
  mainFg: colors.inputBackground, // '63, 67, 80',
  buttonBg: colors.blueColorRGB, // '80, 170, 221',
  buttonFg: '255, 255, 255',
  sidebarBg: '30, 50, 92',
  sidebarFg: '255, 255, 255',
  sidebarTextActiveBorder: '93, 137, 243',
  sidebarWhiteLogo: 'true',

  link: colors.darkBlueColor,
  linkVisited: '#551a8b',

  propDefault: '#fff',
  propGray: '#757570',
  propTurquoise: '#4273C2',
  propOrange: '#C44F1C',
  propYellow: '#81730E',
  propTeal: '#007C8F',
  propBlue: '#007CAD',
  propPurple: '#8742FF',
  propRed: '#D53474',
  propPink: '#925E9C'
};

export const darkThemeName = 'dark-theme';

export const darkTheme = {
  ...defaultTheme,

  mainBg: '47, 52, 55',
  mainFg: '220, 220, 220',
  sidebarBg: '75, 73, 67',
  sidebarFg: '255, 255, 255',
  sidebarTextActiveBorder: '102, 185, 167',
  sidebarWhiteLogo: 'true',

  link: colors.darkBlueColor,
  linkVisited: 'hsla(270, 68%, 70%, 1.0)',

  propDefault: 'hsla(0, 100%, 100%, 0.08)',
  propGray: 'hsla(60, 2%, 45%, 0.4)',
  propTurquoise: 'hsla(217, 51%, 51%, 0.4)',
  propOrange: 'hsla(18, 75%, 44%, 0.4)',
  propYellow: 'hsla(53, 80%, 28%, 0.4)',
  propTeal: 'hsla(188, 100%, 28%, 0.4)',
  propBlue: 'hsla(197, 100%, 34%, 0.4)',
  propPurple: 'hsla(262, 100%, 63%, 0.4)',
  propRed: 'hsla(337, 66%, 52%, 0.4)',
  propPink: 'hsla(290, 25%, 49%, 0.4)'
};

export const lightThemeName = 'light-theme';

export const lightTheme = {
  ...defaultTheme,

  mainBg: '255, 255, 255',
  mainFg: '55, 53, 47',
  sidebarBg: '247, 246, 243',
  sidebarFg: '55, 53, 47',
  sidebarTextActiveBorder: '87, 158, 255',
  sidebarWhiteLogo: 'false'
};

export function setTheme (theme: Theme | null): Theme {
  let consolidatedTheme = defaultTheme;
  if (theme) {
    consolidatedTheme = { ...defaultTheme, ...theme };
    UserSettings.theme = JSON.stringify(consolidatedTheme);
  }
  else {
    UserSettings.theme = '';
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
    if (darkThemeMq.matches) {
      consolidatedTheme = { ...defaultTheme, ...darkTheme };
    }
  }

  setActiveThemeName(consolidatedTheme, theme);

  if (!Utils.isFocalboardPlugin()) {
    document.documentElement.style.setProperty('--center-channel-bg-rgb', consolidatedTheme.mainBg);
    document.documentElement.style.setProperty('--center-channel-color-rgb', consolidatedTheme.mainFg);
    document.documentElement.style.setProperty('--button-bg-rgb', consolidatedTheme.buttonBg);
    document.documentElement.style.setProperty('--button-color-rgb', consolidatedTheme.buttonFg);
    document.documentElement.style.setProperty('--sidebar-bg-rgb', consolidatedTheme.sidebarBg);
    document.documentElement.style.setProperty('--sidebar-text-rgb', consolidatedTheme.sidebarFg);
    document.documentElement.style.setProperty('--link-color-rgb', consolidatedTheme.link);
    document.documentElement.style.setProperty('--sidebar-text-active-border-rgb', consolidatedTheme.sidebarTextActiveBorder);
  }

  document.documentElement.style.setProperty('--sidebar-white-logo', consolidatedTheme.sidebarWhiteLogo);
  document.documentElement.style.setProperty('--link-visited-color-rgb', consolidatedTheme.linkVisited);

  const mainBgColor = color(`rgb(${getComputedStyle(document.documentElement).getPropertyValue('--center-channel-bg-rgb')})`);

  if (Utils.isFocalboardPlugin()) {
    let fixedTheme = lightTheme;
    if (mainBgColor.isDark()) {
      fixedTheme = darkTheme;
    }
    consolidatedTheme.propDefault = fixedTheme.propDefault;
    consolidatedTheme.propGray = fixedTheme.propGray;
    consolidatedTheme.propTurquoise = fixedTheme.propTurquoise;
    consolidatedTheme.propOrange = fixedTheme.propOrange;
    consolidatedTheme.propYellow = fixedTheme.propYellow;
    consolidatedTheme.propTeal = fixedTheme.propTeal;
    consolidatedTheme.propBlue = fixedTheme.propBlue;
    consolidatedTheme.propPurple = fixedTheme.propPurple;
    consolidatedTheme.propPink = fixedTheme.propPink;
    consolidatedTheme.propRed = fixedTheme.propRed;
  }

  document.documentElement.style.setProperty('--prop-default', consolidatedTheme.propDefault);
  document.documentElement.style.setProperty('--prop-gray', consolidatedTheme.propGray);
  document.documentElement.style.setProperty('--prop-turquoise', consolidatedTheme.propTurquoise);
  document.documentElement.style.setProperty('--prop-orange', consolidatedTheme.propOrange);
  document.documentElement.style.setProperty('--prop-yellow', consolidatedTheme.propYellow);
  document.documentElement.style.setProperty('--prop-teal', consolidatedTheme.propTeal);
  document.documentElement.style.setProperty('--prop-blue', consolidatedTheme.propBlue);
  document.documentElement.style.setProperty('--prop-purple', consolidatedTheme.propPurple);
  document.documentElement.style.setProperty('--prop-pink', consolidatedTheme.propPink);
  document.documentElement.style.setProperty('--prop-red', consolidatedTheme.propRed);

  return consolidatedTheme;
}

function setActiveThemeName (consolidatedTheme: Theme, theme: Theme | null) {
  if (theme === null) {
    activeThemeName = systemThemeName;
  }
  else if (isEqual(consolidatedTheme, darkTheme)) {
    activeThemeName = darkThemeName;
  }
  else if (isEqual(consolidatedTheme, lightTheme)) {
    activeThemeName = lightThemeName;
  }
  else {
    activeThemeName = defaultThemeName;
  }
}

export function loadTheme (): Theme {
  const themeStr = UserSettings.theme;
  if (themeStr) {
    try {
      const theme = JSON.parse(themeStr);
      const consolidatedTheme = setTheme(theme);
      setActiveThemeName(consolidatedTheme, theme);
      return consolidatedTheme;
    }
    catch (e) {
      return setTheme(null);
    }
  }
  else {
    return setTheme(null);
  }
}

export function getSelectBaseStyle () {
  return {
    dropdownIndicator: (provided: CSSObject): CSSObject => ({
      ...provided,
      display: 'none !important'
    }),
    indicatorSeparator: (provided: CSSObject): CSSObject => ({
      ...provided,
      display: 'none'
    }),
    loadingIndicator: (provided: CSSObject): CSSObject => ({
      ...provided,
      display: 'none'
    }),
    clearIndicator: (provided: CSSObject): CSSObject => ({
      ...provided,
      display: 'none'
    }),
    menu: (provided: CSSObject): CSSObject => ({
      ...provided,
      width: 'unset',
      background: 'rgb(var(--center-channel-bg-rgb))'
    }),
    option: (provided: CSSObject, state: { isFocused: boolean }): CSSObject => ({
      ...provided,
      background: state.isFocused ? 'rgba(var(--center-channel-color-rgb), 0.1)' : 'rgb(var(--center-channel-bg-rgb))',
      color: state.isFocused ? 'rgb(var(--center-channel-color-rgb))' : 'rgb(var(--center-channel-color-rgb))',
      padding: '2px 8px'
    }),
    control: (): CSSObject => ({
      border: 0,
      width: '100%',
      margin: '4px 0 0 0'

      // display: 'flex',
      // marginTop: 0,
    }),
    valueContainer: (provided: CSSObject): CSSObject => ({
      ...provided,
      padding: '0 5px',
      overflow: 'unset'
    }),
    singleValue: (provided: CSSObject): CSSObject => ({
      ...provided,
      color: 'rgb(var(--center-channel-color-rgb))',
      overflow: 'unset',
      maxWidth: 'calc(100% - 20px)'
    }),
    input: (provided: CSSObject): CSSObject => ({
      ...provided,
      paddingBottom: 0,
      paddingTop: 0,
      marginBottom: 0,
      marginTop: 0
    }),
    menuList: (provided: CSSObject): CSSObject => ({
      ...provided,
      overflowY: 'auto',
      overflowX: 'hidden'
    })
  };
}
