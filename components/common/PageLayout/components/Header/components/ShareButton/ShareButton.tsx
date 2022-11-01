
import { Box, Divider, Popover, Tooltip } from '@mui/material';
import type { PageType } from '@prisma/client';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { memo, useEffect } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Loader from 'components/common/Loader';
import { usePages } from 'hooks/usePages';
import { findParentOfType } from 'lib/pages/findParentOfType';

import PagePermissions from './components/PagePermissions';
import ShareToWeb from './components/ShareToWeb';

function ShareButton ({ headerHeight, pageId }: { headerHeight: number, pageId: string }) {

  const { refreshPage, pages } = usePages();
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const { data: pagePermissions, mutate: refreshPermissions } = useSWRImmutable(pageId ? `/api/pages/${pageId}/permissions` : null, () => charmClient.listPagePermissions(pageId));

  const proposalParentId = findParentOfType({ pageId, pageType: 'proposal', pageMap: pages });

  // watch changes to the page in case permissions get updated
  useEffect(() => {
    if (pageId) {
      refreshPage(pageId);
    }
  }, [pageId, pagePermissions]);

  return (
    <>
      <Tooltip arrow title='Share or publish to the web'>
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
        {
          !pagePermissions
            ? (<Box sx={{ height: 100 }}><Loader size={20} sx={{ height: 600 }} /></Box>)
            : (
              <>
                <ShareToWeb
                  pageId={pageId}
                  pagePermissions={pagePermissions}
                  refreshPermissions={refreshPermissions}
                  proposalParentId={proposalParentId}
                />
                <Divider />
                <PagePermissions
                  pageId={pageId}
                  refreshPermissions={refreshPermissions}
                  pagePermissions={pagePermissions}
                  pageType={pages[pageId]?.type as PageType}
                  proposalParentId={proposalParentId}
                />
              </>
            )
        }
      </Popover>
    </>
  );
}

export default memo(ShareButton);
