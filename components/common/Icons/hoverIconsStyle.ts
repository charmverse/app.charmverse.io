import type { Theme } from '@emotion/react';
import { css } from '@emotion/react';

import { isTouchScreen } from 'lib/utils/browser';

export const hoverIconsStyle =
  ({
    absolutePositioning = false,
    marginForIcons = true
  }: { absolutePositioning?: boolean; marginForIcons?: boolean } = {}) =>
  ({ theme }: { theme: Theme }) => css`
    position: relative;

    &:hover .icons {
      opacity: 1;
      transition: ${theme.transitions.create('opacity', {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.enteringScreen
      })};
    }

    & .icons {
      opacity: ${isTouchScreen() ? 1 : 0};
      transition: ${theme.transitions.create('opacity', {
        easing: theme.transitions.easing.easeInOut,
        duration: theme.transitions.duration.leavingScreen
      })};
      ${absolutePositioning &&
      `
    position: absolute;
    top: 0;
    right: 0;
    margin: ${marginForIcons ? theme.spacing(1) : 0};
    z-index: 1;
  `}
    }
  `;
