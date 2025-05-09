import type { PageType } from '@charmverse/core/prisma-client';
import { IosShare } from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { IconButton, Popover, Tooltip, useMediaQuery } from '@mui/material';
import { bindTrigger, bindPopover, usePopupState } from 'material-ui-popup-state/hooks';

import { Button } from 'components/common/Button';

import { ShareModal } from './components/ShareModal';

type Props = {
  headerHeight: number;
  pageId: string;
  pageType: PageType;
};

export function ShareButton({ headerHeight, pageId, pageType }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });

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
            {...bindTrigger(popupState)}
          >
            Share
          </Button>
        ) : (
          <IconButton data-test='toggle-page-permissions-dialog' {...bindTrigger(popupState)}>
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
        // anchorReference='none'
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
        <ShareModal pageType={pageType} pageId={pageId} closePopup={popupState.close} />
      </Popover>
    </>
  );
}
