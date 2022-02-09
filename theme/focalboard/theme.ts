
import {
  Theme,
  darkTheme as originalDarkTheme,
  lightTheme as originalLightTheme
} from 'components/databases/focalboard/src/theme';

export const darkTheme: Theme = {
  ...originalDarkTheme,
  propGray: '#7A6677',
  propBrown: '#79632A',
  propOrange: '#CC4B00',
  propYellow: '#B89F00',
  propGreen: '#007A5C',
  propBlue: '#007C8F',
  propPurple: '#5F396A',
  propPink: '#D11046',
  propRed: '#970C0C'
};

export const lightTheme: Theme = {
  ...originalLightTheme,
  propGray: '#C4D0D4',
  propBrown: '#E6C39E',
  propOrange: '#FFAC47',
  propYellow: '#FDFD9B',
  propGreen: '#A8F0DD',
  propBlue: '#ADF4FF',
  propPurple: '#B7AFD4',
  propPink: '#EB82ED',
  propRed: '#E37898'
};
