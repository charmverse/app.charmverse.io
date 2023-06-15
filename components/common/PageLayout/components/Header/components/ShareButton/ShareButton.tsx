import type { PageType } from '@charmverse/core/prisma';
import { IosShare } from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { Box, Divider, IconButton, Popover, Tooltip, useMediaQuery } from '@mui/material';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { memo } from 'react';

import Button from 'components/common/Button';
import Loader from 'components/common/Loader';
import { useIsPublicSpace } from 'hooks/useIsPublicSpace';
import { usePagePermissionsList } from 'hooks/usePagePermissionsList';

import PagePermissions from './components/PagePermissions';
import ShareToWeb from './components/PagePermissions/ShareToWeb';
import PublicPagePermissions from './components/PublicPagePermissions/PublicPagePermissions';
import PublicShareToWeb from './components/PublicPagePermissions/PublicShareToWeb';

type Props = {
  headerHeight: number;
  pageId: string;
  proposalId?: string | null;
  pageType: PageType;
};

function ShareButton({ headerHeight, pageId, pageType, proposalId }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const { isPublicSpace } = useIsPublicSpace();
  const { pagePermissions, refreshPermissions } = usePagePermissionsList({
    pageId: isPublicSpace ? null : pageId
  });
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
              refreshPermissions();
              popupState.open();
            }}
          >
            Share
          </Button>
        ) : (
          <IconButton
            data-test='toggle-page-permissions-dialog'
            onClick={() => {
              refreshPermissions();
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
        {isPublicSpace && (
          <>
            <PublicShareToWeb pageId={pageId} />
            <Divider />
            <PublicPagePermissions pageId={pageId} />
          </>
        )}
        {!isPublicSpace &&
          (!pagePermissions ? (
            <Box sx={{ height: 100 }}>
              <Loader size={20} sx={{ height: 600 }} />
            </Box>
          ) : (
            <>
              <ShareToWeb
                pageId={pageId}
                pagePermissions={pagePermissions ?? []}
                refreshPermissions={refreshPermissions}
              />
              <Divider />
              <PagePermissions
                pageId={pageId}
                refreshPermissions={refreshPermissions}
                pagePermissions={pagePermissions ?? []}
                pageType={pageType}
              />
            </>
          ))}
      </Popover>
    </>
  );
}

export default memo(ShareButton);
