
import Button from 'components/common/Button';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Loader from 'components/common/Loader';
import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useState, useEffect } from 'react';
import { IPagePermissionWithAssignee } from 'lib/permissions/pages/page-permission-interfaces';
import ShareBountyBoard from './ShareBountyBoard';

export default function BountyShareButton ({ headerHeight }: { headerHeight: number }) {

  const { currentPageId, pages } = usePages();
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });
  const [pagePermissions, setPagePermissions] = useState<IPagePermissionWithAssignee[] | null>(null);

  async function refreshPermissions () {
    charmClient.listPagePermissions(currentPageId)
      .then(permissions => {
        setPagePermissions(permissions);
      });
  }

  // watch changes to the page in case permissions get updated
  useEffect(() => {
    if (popupState.isOpen) {
      refreshPermissions();
    }
  }, [pages[currentPageId], popupState.isOpen]);

  return (
    <>
      <Button
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

              <ShareBountyBoard />

            )
        }
      </Popover>
    </>
  );
}
