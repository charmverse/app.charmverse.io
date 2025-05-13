import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect } from 'react';

import { Button } from 'components/common/Button';
import { MobileDialog } from 'components/common/MobileDialog/MobileDialog';
import { useSmallScreen } from 'hooks/useMediaScreens';
import type { Board } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';

import { StyledSidebar } from './viewSidebar/styledSidebar';
import { ViewSourceOptions } from './viewSidebar/viewSourceOptions/viewSourceOptions';

/**
 * @rootDatabaseId The top level board within which this sidebar is being displayed
 */
type Props = {
  rootBoard: Board;
  view?: BoardView; // Used for Rewards, when creating/updating a new view
  views: BoardView[];
  showView: (viewId: string) => void;
  isReward?: boolean;
};

export function CreateLinkedView(props: Props) {
  const sourcePopup = usePopupState({ variant: 'popover', popupId: 'select-source' });
  const isSmallScreen = useSmallScreen();

  useEffect(() => {
    sourcePopup.open();
  }, []);

  return (
    <Box display='flex' data-test='create-linked-view'>
      <Box flexGrow={1} display='flex' justifyContent='center' alignItems='center'>
        <Stack alignItems='center' spacing={0} mt={{ xs: 3, md: 0 }}>
          <HelpOutlineIcon color='secondary' fontSize='large' />
          <Typography color='secondary'>
            <strong>No data source</strong>
          </Typography>
          <Typography display='flex' alignItems='center' color='secondary' variant='body2'>
            <Button
              color='secondary'
              component='span'
              onClick={sourcePopup.open}
              variant='text'
              sx={{ fontSize: 'inherit', textDecoration: 'underline' }}
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
          onClose={() => sourcePopup.close()}
          open={sourcePopup.isOpen}
          contentSx={{ pr: 0, pb: 0, pl: 1 }}
        >
          <ViewSourceOptions {...props} closeSidebar={sourcePopup.close} />
        </MobileDialog>
      ) : (
        <Collapse in={sourcePopup.isOpen} orientation='horizontal'>
          <StyledSidebar
            style={{
              height: 'fit-content'
            }}
          >
            <ViewSourceOptions {...props} title='Select data source' closeSidebar={sourcePopup.close} />
          </StyledSidebar>
        </Collapse>
      )}
    </Box>
  );
}
