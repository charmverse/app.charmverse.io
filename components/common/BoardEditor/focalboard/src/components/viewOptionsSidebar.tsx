import { Box, Collapse, Divider, IconButton, ListItemIcon,ListItemText, MenuItem, Typography } from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview';
import ArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import BackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import styled from '@emotion/styled';
import { useEffect, useState } from 'react';
import ViewLayoutOptions from './viewLayoutOptions';
import { Board } from '../blocks/board';
import { BoardView } from '../blocks/boardView';

interface Props {
  board: Board;
  view: BoardView;
  closeSidebar: () => void;
  isOpen: boolean;
}

const StyledSidebar = styled.div`
  background-color: ${({ theme }) => theme.palette.background.paper};
  border-left: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
  display: flex;
  flex-direction: column;
  height: 300px;
  min-height: 100%;
  width: 100%;
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 250px;
  }
`;

export default function ViewOptionsSidebar (props: Props) {

  const [sidebarView, setSidebarView] = useState<'viewOptions' | 'layout'>('viewOptions');

  function viewOptions() {
    setSidebarView('viewOptions');
  }

  function viewLayout () {
    setSidebarView('layout');
  }
  console.log('sidebar View', sidebarView);

  useEffect(() => {
    // reset state on close
    if (!props.isOpen) {
      setSidebarView('viewOptions');
    }
  }, [props.isOpen])

  return (
    <>
      <Collapse in={props.isOpen} orientation='horizontal' sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, zIndex: 1000 }}>
        <StyledSidebar>
          {sidebarView === 'viewOptions' && (<>
            <SidebarHeader title='View options' closeSidebar={props.closeSidebar} />
            <MenuItem dense onClick={viewLayout}>
              <ListItemIcon>
                <PreviewIcon color='secondary' />
              </ListItemIcon>
              <ListItemText>
                Layout
              </ListItemText>
              <ArrowRightIcon color='secondary' />
            </MenuItem>
          </>)}
          {sidebarView === 'layout' && (<>
            <SidebarHeader goBack={viewOptions} title='Layout' closeSidebar={props.closeSidebar} />
            <ViewLayoutOptions board={props.board} view={props.view} />
          </>)}
        </StyledSidebar>
      </Collapse>
    </>
  );
}

function SidebarHeader ({ closeSidebar, goBack, title }: { closeSidebar : () => void, goBack?: () => void, title: string }) {

  return (
    <Box px={2} pt={1} pb={1} display='flex' justifyContent='space-between' alignItems='center'>
      <Box display='flex' alignItems='center' gap={1}>
        {goBack && (
          <IconButton size='small' onClick={goBack}>
            <BackIcon fontSize='small' color='secondary' />
          </IconButton>
        )}
        <Typography fontWeight='bold'>{title}</Typography>
      </Box>
      <IconButton onClick={closeSidebar} size='small'>
        <CloseIcon fontSize='small' />
      </IconButton>
    </Box>
  );
}