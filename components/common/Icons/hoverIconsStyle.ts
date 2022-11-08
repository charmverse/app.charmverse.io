import type { Theme } from '@emotion/react';
import { css } from '@emotion/react';

export const hoverIconsStyle = ({ theme, isTouchScreen }: { theme: Theme, isTouchScreen: boolean }) => css`
  &:hover .icons {
    opacity: 1;
    transition: ${theme.transitions.create('opacity', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.enteringScreen
  })}
  }

  & .icons {
    opacity: ${isTouchScreen ? 1 : 0};
    transition: ${theme.transitions.create('opacity', {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.leavingScreen
  })}
  }
`;
