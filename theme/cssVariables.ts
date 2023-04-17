import { css } from '@emotion/react';

import * as colors from './colors';

function rgbFromHex(hex: string) {
  return hex
    .replace('#', '')
    .split(/(..)/)
    .filter((c) => c)
    .map((c) => parseInt(c, 16));
}

const globalCSS = css`
  :root {
    ${Object.entries(colors.colors).map(
      ([key, value]) => `
      --bg-${key}: ${value.light};
      --bg-${key}-rgb: ${rgbFromHex(value.light)};
      --text-${key}: ${value.dark};`
    )}
    --input-bg: ${colors.inputBackground};
    --input-border: ${colors.inputBorder};
    --input-border-hover: #37352f;
    --button-text-hover: var(--input-bg);
    --primary-color: ${colors.blueColor};
    --primary-text: ${colors.primaryTextColor};
    --secondary-text: ${colors.secondaryTextColor};
    --danger-text: ${colors.dangerColor};

    /* copied from https://mui.com/material-ui/customization/z-index/#main-content */
    --z-index-mobileStepper: 1000;
    --z-index-fab: 1050;
    --z-index-speedDial: 1050;
    --z-index-appBar: 1100;
    --z-index-drawer: 1200;
    --z-index-modal: 1300;
    --z-index-snackbar: 1400;
    --z-index-tooltip: 1500;

    --elevation-1: 0 2px 3px 0 rgba(0, 0, 0, 0.08);
    --elevation-2: 0 4px 6px 0 rgba(0, 0, 0, 0.12);
    --elevation-3: 0 6px 14px 0 rgba(0, 0, 0, 0.12);
    --elevation-4: 0 8px 24px 0 rgba(0, 0, 0, 0.12);
    --elevation-5: 0 12px 32px 0 rgba(0, 0, 0, 0.12);
    --elevation-6: 0 20px 32px 0 rgba(0, 0, 0, 0.12);

    --default-rad: 4px;
    --modal-rad: 8px;

    --background-default: ${colors.backgroundColor};
    --background-paper: ${colors.backgroundColor};
    --background-dark: ${colors.backgroundDarkColor};
    --background-light: ${colors.backgroundLightColor};

    --link-underline: ${colors.linkUnderlineColor};

    --charmeditor-active: rgba(46, 170, 220, 0.2);

    /* fullcalendar styles */
    --fc-event-text-color: var(--text-primary) !important;

    --page-layout-pb: 180px;

    /* focalboard */
    --center-channel-bg-rgb: 255, 255, 255;
    --center-channel-color-rgb: 63, 67, 80;
    --sidebar-bg-rgb: 30, 50, 92;
    --sidebar-text-rgb: 255, 255, 255;
    --button-color-rgb: 255, 255, 255;
    --button-bg-rgb: 28, 88, 217;
    --button-danger-color-rgb: 255, 255, 255;
    --button-danger-bg-rgb: 210, 75, 78;
  }

  /* lit protocol */
  .lsm-light-theme {
    --lsm-accent-color: ${colors.blueColor};
  }

  /* dark theme */
  [data-theme='dark'] {
    ${Object.entries(colors.colors).map(
      ([key, value]) => `
      --bg-${key}: ${value.dark};
      --bg-${key}-rgb: ${rgbFromHex(value.dark)};
      --text-${key}: ${value.dark};`
    )}
    --input-bg: ${colors.inputBackgroundDarkMode};
    --input-border: ${colors.inputBorderDarkMode};
    --input-border-hover: #ededed;

    --primary-text: ${colors.primaryTextColorDarkMode};
    --secondary-text: ${colors.secondaryTextColorDarkMode};

    --background-default: ${colors.backgroundColorDarkMode};
    --background-paper: ${colors.backgroundLightColorDarkMode};
    --background-dark: ${colors.backgroundDarkColorDarkMode};
    --background-light: ${colors.backgroundLightColorDarkMode};
    --link-underline: ${colors.linkUnderlineColorDarkMode};
  }
`;

export default globalCSS;
