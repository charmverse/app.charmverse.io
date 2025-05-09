import styled from '@emotion/styled';

export const StyledSidebar = styled.div`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-left: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
  display: flex;
  flex-direction: column;
  height: 300px;
  min-height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 275px;
  }
`;
