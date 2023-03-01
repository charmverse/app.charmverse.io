import { IosShare } from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { Box, Divider, IconButton, Popover, Tooltip, useMediaQuery } from '@mui/material';
import type { PageType } from '@prisma/client';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { memo, useEffect } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Loader from 'components/common/Loader';
import { usePages } from 'hooks/usePages';

import PagePermissions from './components/PagePermissions';
import { ProposalPagePermissions } from './components/PagePermissions/ProposalPagePermissions';
import ShareToWeb from './components/ShareToWeb';

function ShareButton({ headerHeight, pageId }: { headerHeight: number; pageId: string }) {
  const { refreshPage, pages } = usePages();
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const { data: pagePermissions, mutate: refreshPermissions } = useSWRImmutable(
    pageId ? `/api/pages/${pageId}/permissions` : null,
    () => charmClient.listPagePermissions(pageId)
  );
  const isLargeScreen = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  const isProposal = pages[pageId]?.type === 'proposal';

  // watch changes to the page in case permissions get updated
  useEffect(() => {
    if (pageId) {
      refreshPage(pageId);
    }
  }, [pageId, pagePermissions]);

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
        {!pagePermissions ? (
          <Box sx={{ height: 100 }}>
            <Loader size={20} sx={{ height: 600 }} />
          </Box>
        ) : (
          <>
            <ShareToWeb pageId={pageId} pagePermissions={pagePermissions} refreshPermissions={refreshPermissions} />
            <Divider />
            {pages[pageId]?.type === 'proposal' && (
              <ProposalPagePermissions proposalId={pages[pageId]?.proposalId as string} />
            )}
            {pages[pageId]?.type !== 'proposal' && (
              <PagePermissions
                pageId={pageId}
                refreshPermissions={refreshPermissions}
                pagePermissions={pagePermissions}
                pageType={pages[pageId]?.type as PageType}
              />
            )}
          </>
        )}
      </Popover>
    </>
  );
}

export default memo(ShareButton);
