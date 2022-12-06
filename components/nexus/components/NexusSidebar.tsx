import styled from '@emotion/styled';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { Box, IconButton } from '@mui/material';

import { headerHeight } from 'components/common/PageLayout/components/Header';
import Workspaces from 'components/common/PageLayout/components/Sidebar/Workspaces';

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.palette.sidebar.background};
  height: 100%;

  // hide scrollbar but allow scrolling
  overflow: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  ::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  &:hover {
    .sidebar-header {
      .MuiTypography-root {
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .MuiIconButton-root {
        opacity: 1;
      }
    }
  }
`;

interface SidebarProps {
  closeSidebar: () => void;
}

export default function Sidebar({ closeSidebar }: SidebarProps) {
  return (
    <SidebarContainer>
      <Box
        sx={{ height: headerHeight, display: { xs: 'flex', sm: 'none' } }}
        justifyContent='center'
        alignItems='center'
      >
        <IconButton onClick={closeSidebar} size='small'>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Box flexGrow={1}>
        <Workspaces />
      </Box>
    </SidebarContainer>
  );
}
