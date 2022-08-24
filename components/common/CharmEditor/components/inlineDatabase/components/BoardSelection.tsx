import { Box, Collapse, Divider, IconButton, ListItemIcon, MenuItem, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import Button from 'components/common/Button';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Page } from '@prisma/client';
import styled from '@emotion/styled';
import PagesList from '../../PageList';

interface Props {
  onCreate?: () => void;
  pages: Page[];
  onSelect: (boardId: string) => void;
}

const StyledSidebar = styled.div`
  border-left: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
  display: flex;
  flex-direction: column;
  height: 300px;
  width: 100%;
  ${({ theme }) => theme.breakpoints.up('md')} {
    width: 250px;
  }
`;

const SidebarContent = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  border-bottom: 1px solid rgb(var(--center-channel-color-rgb), 0.12);
`;

export default function BoardSelection (props: Props) {

  const [sidebarState, setSidebarState] = useState<'select-source' | null>('select-source');

  function openSidebar () {
    setSidebarState(!sidebarState ? 'select-source' : null);
  }

  function closeSidebar () {
    setSidebarState(null);
  }

  return (
    <>
      <Divider light />
      <Box display='flex'>
        <Box flexGrow={1} display='flex' justifyContent='center' alignItems='center'>
          <Stack alignItems='center' spacing={0}>
            <HelpOutlineIcon color='secondary' fontSize='large' />
            <Typography color='secondary'><strong>No data source</strong></Typography>
            <Typography display='flex' alignItems='center' color='secondary' variant='body2'>
              <Button
                color='secondary'
                component='span'
                onClick={openSidebar}
                variant='text'
                sx={{ fontSize: 'inherit', textDecoration: 'underline' }}
              >
                Select a data source
              </Button>to continue
            </Typography>
          </Stack>
        </Box>
        <Collapse in={Boolean(sidebarState)} orientation='horizontal'>
          <StyledSidebar>
            <Box px={2} pt={1} pb={1} display='flex' justifyContent='space-between' alignItems='center'>
              <Typography fontWeight='bold'>Select data source</Typography>
              <IconButton onClick={closeSidebar} size='small'>
                <CloseIcon fontSize='small' />
              </IconButton>
            </Box>
            <SidebarContent>
              <PagesList pages={props.pages} onSelectPage={page => props.onSelect(page.id)} />
            </SidebarContent>
            <MenuItem onClick={props.onCreate}>
              <ListItemIcon><AddIcon color='secondary' /></ListItemIcon>
              <Typography variant='body2' color='secondary'>
                New database
              </Typography>
            </MenuItem>
          </StyledSidebar>
        </Collapse>
      </Box>
    </>
  );
}
