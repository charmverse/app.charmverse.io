import { css } from '@emotion/react';
import * as colors from './colors';

const globalCSS = css`
  :root {
    // background colors: --bg-red, etc.
    ${Object.entries(colors.lightModeColors).map(([key, value]) => `--bg-${key}: ${value};`).join('\n')}
    --input-bg: ${colors.inputBackground};
    --input-border: ${colors.inputBorder};

    // copied from https://mui.com/material-ui/customization/z-index/#main-content
    --z-index-mobileStepper: 1000;
    --z-index-fab: 1050;
    --z-index-speedDial: 1050;
    --z-index-appBar: 1100;
    --z-index-drawer: 1200;
    --z-index-modal: 1300;
    --z-index-snackbar: 1400;
    --z-index-tooltip: 1500;
  }

  /* dark theme */
  [data-theme='dark'] {
    ${Object.entries(colors.darkModeColors).map(([key, value]) => `--bg-${key}: ${value};`).join('\n')}
    --input-bg: ${colors.inputBackgroundDarkMode};
    --input-border: ${colors.inputBorderDarkMode};
  }


`;

export default globalCSS;
