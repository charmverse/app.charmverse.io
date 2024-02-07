import styled from '@emotion/styled';

/**
 * Components for a document page layout with sidebars. Example:
 *
 * <ColumnContainer>
 *  <DocumentColumn>
 *   <DocumentPage />
 *  </DocumentColumn>
 *  <SidebarColumn>
 *   <PageSidebar />
 *  <ProposalSidebar />
 *  </SidebarColumn>
 * </ColumnContainer>
 */

export const DocumentColumnLayout = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
`;

// overflow-x: hidden is required to shrink the main content less than the 860px width of charm editor
export const DocumentColumn = styled.div`
  flex-grow: 1;
  overflow-x: hidden;
`;

export const SidebarColumn = styled('div', {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'minWidth' && prop !== 'width'
})<{ open: boolean; minWidth?: number; width: number }>(
  ({ open, width, minWidth = 0, theme }) => `
  background: ${theme.palette.background.default};
  border-left: 1px solid var(--input-border);
  height: 100%;
  max-width: ${open ? width : minWidth}px;
  transition: max-width ease-in 0.25s;
  overflow-x: hidden;
  width: 100%;
`
);
