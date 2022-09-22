import styled from '@emotion/styled';
import { Box, Slide, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import PageActionToggle from 'components/[pageId]/DocumentPage/components/PageActionToggle';

const PageActionListBox = styled.div`
  position: fixed;
  right: 0px;
  width: 416px;
  max-width: 100%;
  top: 56px; // height of MUI Toolbar
  z-index: var(--z-index-drawer);
  height: calc(100% - 80px);
  overflow: auto;
  padding: 0 ${({ theme }) => theme.spacing(1)};
  background: ${({ theme }) => theme.palette.background.default};
`;

export default function SidebarDrawer ({ children, id, open, title }: { children: ReactNode, id: string, open: boolean, title: string }) {
  return (
    <Slide
      direction='left'
      in={open}
      style={{
        transformOrigin: 'left top'
      }}
      easing={{
        enter: 'ease-in',
        exit: 'ease-out'
      }}
      timeout={250}
    >
      <PageActionListBox id={id}>
        <Box sx={{
          height: 'calc(100%)',
          gap: 1,
          display: 'flex',
          flexDirection: 'column'
        }}
        >
          <Box display='flex' gap={1}>
            <PageActionToggle />
            <Typography fontWeight={600} fontSize={20}>{title}</Typography>
          </Box>
          {children}
        </Box>
      </PageActionListBox>
    </Slide>
  );
}
