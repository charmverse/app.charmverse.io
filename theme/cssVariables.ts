import { css } from '@emotion/react';
import * as colors from './colors';

const globalCSS = css`
  :root {
    // background colors: --bg-red, etc.
    ${Object.entries(colors.lightModeBackgroundColors).map(([key, value]) => `--bg-${key}: ${value};`).join('\n')}
  }

  /* dark theme */
  [data-theme='dark'] {
    ${Object.entries(colors.darkModeBackgroundColors).map(([key, value]) => `--bg-${key}: ${value};`).join('\n')}
  }

`;

export default globalCSS;
