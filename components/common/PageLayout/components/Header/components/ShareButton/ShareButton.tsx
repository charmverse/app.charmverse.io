
import { Box, Divider, Popover, Tooltip } from '@mui/material';
import type { PageType } from '@prisma/client';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Loader from 'components/common/Loader';
import { usePages } from 'hooks/usePages';
import { findParentOfType } from 'lib/pages/findParentOfType';
import type { IPagePermissionWithAssignee } from 'lib/permissions/pages/page-permission-interfaces';

import PagePermissions from './components/PagePermissions';
import ShareToWeb from './components/ShareToWeb';

export default function ShareButton ({ headerHeight, pageId }: { headerHeight: number, pageId: string }) {

  const { refreshPage, pages } = usePages();
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const [pagePermissions, setPagePermissions] = useState<IPagePermissionWithAssignee[] | null>(null);

  async function refreshPageAndPermissions () {
    charmClient.listPagePermissions(pageId)
      .then(permissions => {
        setPagePermissions(permissions);
        refreshPage(pageId);
      });
  }

  const proposalParentId = findParentOfType({ pageId, pageType: 'proposal', pageMap: pages });

  // watch changes to the page in case permissions get updated
  useEffect(() => {
    refreshPageAndPermissions();
  }, [pageId, popupState.isOpen]);

  return (
    <>
      <Tooltip arrow title='Share or publish to the web'>
        <Button
          data-test='toggle-page-permissions-dialog'
          color='secondary'
          variant='text'
          size='small'
          onClick={() => {
            refreshPageAndPermissions();
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
                  refreshPermissions={refreshPageAndPermissions}
                  proposalParentId={proposalParentId}
                />
                <Divider />
                <PagePermissions
                  pageId={pageId}
                  refreshPermissions={refreshPageAndPermissions}
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
