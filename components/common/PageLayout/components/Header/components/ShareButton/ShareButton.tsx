import type { PageType } from '@charmverse/core/prisma';
import { IosShare } from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { IconButton, Popover, Tooltip, useMediaQuery } from '@mui/material';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { memo } from 'react';

import Button from 'components/common/Button';
import { useIsFreeSpace } from 'hooks/useIsFreeSpace';

import { FreePagePermissionsContainer } from './components/FreePagePermissions/FreePagePermissionsContainer';
import { PaidPagePermissionsContainer } from './components/PaidPagePermissions/PaidPagePermissionsContainer';

type Props = {
  headerHeight: number;
  pageId: string;
};

function ShareButton({ headerHeight, pageId }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const { isFreeSpace } = useIsFreeSpace();

  const isLargeScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  return (
    <>
      <Tooltip arrow title='Share or publish to the web'>
        {isLargeScreen ? (
          <Button
            data-test='toggle-page-permissions-dialog'
            color='secondary'
            variant='text'
            size='small'
            onClick={() => {
              popupState.open();
            }}
          >
            Share
          </Button>
        ) : (
          <IconButton
            data-test='toggle-page-permissions-dialog'
            onClick={() => {
              popupState.open();
            }}
          >
            <IosShare color='secondary' fontSize='small' />
          </IconButton>
        )}
      </Tooltip>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom'
        }}
        anchorReference='none'
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
        PaperProps={{
          sx: {
            width: 400,
            top: headerHeight,
            right: 0
          }
        }}
      >
        {isFreeSpace ? (
          <FreePagePermissionsContainer pageId={pageId} />
        ) : (
          <PaidPagePermissionsContainer pageId={pageId} />
        )}
      </Popover>
    </>
  );
}

export default memo(ShareButton);
