import { css } from '@emotion/react';

import * as colors from './colors';

const globalCSS = css`
  :root {
    ${Object.entries(colors.lightModeColors).map(([key, value]) => `--bg-${key}: ${value};`).join('\n')}
    --input-bg: ${colors.inputBackground};
    --input-border: ${colors.inputBorder};
    --input-border-hover: #37352f;
    --primary-color: ${colors.blueColor};
    --primary-text: ${colors.primaryTextColor};

    /* copied from https://mui.com/material-ui/customization/z-index/#main-content */
    --z-index-mobileStepper: 1000;
    --z-index-fab: 1050;
    --z-index-speedDial: 1050;
    --z-index-appBar: 1100;
    --z-index-drawer: 1200;
    --z-index-modal: 1300;
    --z-index-snackbar: 1400;
    --z-index-tooltip: 1500;

    --prop-default: #fff;
    --prop-gray: #E7E7E6;
    --prop-turquoise: #C2DCF2;
    --prop-orange: #F4D8D0;
    --prop-yellow: #EFE9CB;
    --prop-teal: #D0F4F1;
    --prop-blue: #C1E7F4;
    --prop-purple: #D7D3F4;
    --prop-red: #F2CCD6;
    --prop-pink: #E8D3ED;

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

    --charmeditor-active: rgba(46, 170, 220, 0.2);

    --page-layout-pb: 180px;
  }

  /* lit protocol */
  .lsm-light-theme {
    --lsm-accent-color: ${colors.blueColor};
  }

  /* dark theme */
  [data-theme='dark'] {
    ${Object.entries(colors.darkModeColors).map(([key, value]) => `--bg-${key}: ${value};`).join('\n')}
    --input-bg: ${colors.inputBackgroundDarkMode};
    --input-border: ${colors.inputBorderDarkMode};
    --input-border-hover: #ededed;

    --primary-text: ${colors.primaryTextColorDarkMode};

    --background-default: ${colors.backgroundColorDarkMode};
    --background-paper: ${colors.backgroundLightColorDarkMode};
    --background-dark: ${colors.backgroundDarkColorDarkMode};
    --background-light: ${colors.backgroundLightColorDarkMode};

  }

`;

export default globalCSS;
