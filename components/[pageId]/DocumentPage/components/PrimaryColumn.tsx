import styled from '@emotion/styled';

export const PrimaryColumn = styled.div<{
  showPageActionSidebar: boolean;
}>(
  ({ showPageActionSidebar, theme }) => `
  display: flex;
  height: 100%;
  flex-direction: column;
  transition: width ease-in 0.25s;
  ${theme.breakpoints.up('md')} {
    width: ${showPageActionSidebar ? 'calc(100% - 430px)' : '100%'};
  }

  // main content
  & > :first-child {
    flex-grow: 1;
    min-height: 1px;
    overflow: auto;
    // overflow: ${showPageActionSidebar ? 'auto' : 'inherit'};
  }
`
);
