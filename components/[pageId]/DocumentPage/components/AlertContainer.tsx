import styled from '@emotion/styled';

export const AlertContainer = styled.div<{ showPageActionSidebar: boolean }>(
  ({ showPageActionSidebar, theme }) => `
  transition: width ease-in 0.25s;
  ${theme.breakpoints.up('lg')} {
    width: ${showPageActionSidebar ? 'calc(100% - 430px)' : '100%'};
    position: sticky;
    left: 0;
    top: 0;
    z-index: var(--z-index-pageBar);
  }
`
);
