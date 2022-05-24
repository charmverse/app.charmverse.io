
import Button from 'components/common/Button';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Loader from 'components/common/Loader';
import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useState, useEffect } from 'react';
import { IPagePermissionFlags, IPagePermissionWithAssignee } from 'lib/permissions/pages/page-permission-interfaces';
import { useUser } from 'hooks/useUser';
import PagePermissions from './components/PagePermissions';
import ShareToWeb from './components/ShareToWeb';

export default function ShareButton ({ headerHeight }: { headerHeight: number }) {

  const { currentPageId, refreshPage } = usePages();
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const [pagePermissions, setPagePermissions] = useState<null | IPagePermissionFlags>(null);
  const [pagePermissions2, setPagePermissions2] = useState<IPagePermissionWithAssignee[] | null>(null);
  const [user] = useUser();

  async function retrievePermissions () {
    if (!user) {
      throw new Error('User is not defined');
    }
    setPagePermissions(null);
    await Promise.all([
      charmClient.computeUserPagePermissions({
        pageId: currentPageId,
        userId: user.id
      }).then(permissions => {
        setPagePermissions(permissions);
      }),
      refreshPermissions()
    ]);
  }

  function refreshPermissions () {

    charmClient.listPagePermissions(currentPageId)
      .then(permissions => {
        setPagePermissions2(permissions);
      });
  }

  useEffect(() => {
    if (currentPageId && popupState.isOpen) {
      refreshPage(currentPageId);
    }
  }, [currentPageId, popupState.isOpen]);

  return (
    <>
      <Button
        color='secondary'
        variant='text'
        size='small'
        onClick={() => {
          retrievePermissions();
          popupState.open();
        }}
      >
        Share
      </Button>
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
          !(pagePermissions && pagePermissions2)
            ? (<Box sx={{ height: 100 }}><Loader size={20} sx={{ height: 600 }} /></Box>)
            : (
              <>
                <ShareToWeb pagePermissions={pagePermissions} />
                <Divider />
                <PagePermissions
                  pageId={currentPageId}
                  refreshPermissions={refreshPermissions}
                  pagePermissions={pagePermissions2}
                />
              </>
            )
        }
      </Popover>
    </>
  );
}
