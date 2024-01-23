import styled from '@emotion/styled';

export const PrimaryColumn = styled.div<{
  showPageActionSidebar: boolean;
}>(
  ({ showPageActionSidebar, theme }) => `
  display: flex;
  height: 100%;
  position: relative;
  flex-direction: row;
  transition: width ease-in 0.25s;
  ${theme.breakpoints.up('md')} {
    width: ${showPageActionSidebar ? 'calc(100% - 430px)' : '100%'};
  }
`
);
