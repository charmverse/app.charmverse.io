import styled from '@emotion/styled';

export const AlertContainer = styled.div(
  ({ theme }) => `
  transition: width ease-in 0.25s;
  ${theme.breakpoints.up('lg')} {
    position: sticky;
    left: 0;
    top: 0;
    z-index: var(--z-index-pageBar);
  }
`
);
