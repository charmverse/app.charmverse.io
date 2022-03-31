
import Button from 'components/common/Button';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Loader from 'components/common/Loader';
import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import { IPagePermissionFlags } from 'lib/permissions/pages/page-permission-interfaces';
import { useUser } from 'hooks/useUser';
import PagePermissions from './components/PagePermissions';
import ShareToWeb from './components/ShareToWeb';

export default function ShareButton ({ headerHeight }: { headerHeight: number }) {

  const { currentPageId } = usePages();
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const [pagePermissions, setPagePermissions] = useState<null | IPagePermissionFlags>(null);
  const [user] = useUser();

  function retrievePermissions () {
    if (!user) {
      throw new Error('User is not defined');
    }
    setPagePermissions(null);
    charmClient.computeUserPagePermissions({
      pageId: currentPageId,
      userId: user.id
    }).then(permissions => {
      setPagePermissions(permissions);
    });
  }

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
          !pagePermissions
            ? (<Box sx={{ height: 100 }}><Loader size={20} sx={{ height: 600 }} /></Box>)
            : (
              <>
                <ShareToWeb pagePermissions={pagePermissions} />
                {currentPageId && <PagePermissions pageId={currentPageId} />}
              </>
            )
        }
      </Popover>
    </>
  );
}
