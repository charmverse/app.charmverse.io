import Popover from '@mui/material/Popover';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';

import { Button } from 'components/common/Button';

import ShareProposals from './ShareProposals';

export default function ProposalsShareButton({ headerHeight }: { headerHeight: number }) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'share-menu' });

  return (
    <>
      <Button color='secondary' variant='text' size='small' onClick={popupState.open}>
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
        <ShareProposals />
      </Popover>
    </>
  );
}
