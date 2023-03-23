import { useTheme } from '@emotion/react';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { useState } from 'react';

import Button from 'components/common/Button';
import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useSmallScreen } from 'hooks/useMediaScreens';

import { StyledSidebar } from './viewSidebar/viewSidebar';
import type { DatabaseSourceProps } from './viewSidebar/viewSourceOptions';
import { ViewSourceOptions } from './viewSidebar/viewSourceOptions';

type CreateLinkedViewProps = DatabaseSourceProps & { readOnly: boolean };

type SidebarState = 'select-source' | null;

export function CreateLinkedView(props: CreateLinkedViewProps) {
  const [sidebarState, setSidebarState] = useState<SidebarState>('select-source');
  const isSmallScreen = useSmallScreen();
  const theme = useTheme();

  function openSidebar() {
    setSidebarState(!sidebarState ? 'select-source' : null);
  }

  function closeSidebar() {
    setSidebarState(null);
  }

  return (
    <Box display='flex'>
      <Box flexGrow={1} display='flex' justifyContent='center' alignItems='center'>
        <Stack alignItems='center' spacing={0}>
          <HelpOutlineIcon color='secondary' fontSize='large' />
          <Typography color='secondary'>
            <strong>No data source</strong>
          </Typography>
          <Typography display='flex' alignItems='center' color='secondary' variant='body2'>
            <Button
              color='secondary'
              component='span'
              onClick={openSidebar}
              variant='text'
              sx={{ fontSize: 'inherit', textDecoration: 'underline' }}
              disabled={props.readOnly}
            >
              Select a data source
            </Button>
            to continue
          </Typography>
        </Stack>
      </Box>
      {isSmallScreen ? (
        <MobileDialog
          title='Select data source'
          onClose={closeSidebar}
          open={props.readOnly === true ? false : Boolean(sidebarState)}
          PaperProps={{ sx: { background: theme.palette.background.light } }}
          contentSx={{ pr: 0, pb: 0, pl: 1 }}
        >
          <ViewSourceOptions {...props} />
        </MobileDialog>
      ) : (
        <Collapse in={props.readOnly === true ? false : Boolean(sidebarState)} orientation='horizontal'>
          <StyledSidebar
            style={{
              height: 'fit-content'
            }}
          >
            <ViewSourceOptions {...props} title='Select data source' closeSidebar={closeSidebar} />
          </StyledSidebar>
        </Collapse>
      )}
    </Box>
  );
}
