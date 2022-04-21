import { css } from '@emotion/react';
import * as colors from './colors';

const globalCSS = css`
  :root {
    // background colors: --bg-red, etc.
    ${Object.entries(colors.lightModeBackgroundColors).map(([key, value]) => `--bg-${key}: ${value};`).join('\n')}
    --input-bg: ${colors.inputBackground};
    --input-border: ${colors.inputBorder};
  }

  /* dark theme */
  [data-theme='dark'] {
    ${Object.entries(colors.darkModeBackgroundColors).map(([key, value]) => `--bg-${key}: ${value};`).join('\n')}
    --input-bg: ${colors.inputBackgroundDarkMode};
    --input-border: ${colors.inputBorderDarkMode};
  }


`;

export default globalCSS;
