import { useEffect } from 'react';
import { Page } from '@prisma/client';
import { usePopupState, bindTrigger, bindPopover } from 'material-ui-popup-state/hooks';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import DocumentPage from 'components/[pageId]/DocumentPage';

interface Props {
  page?: Page | null;
  onClose: () => void;
  readOnly?: boolean;
}

export default function ProposalDialog (props: Props) {

  const popupState = usePopupState({ variant: 'popover', popupId: 'proposal-dialog' });

  // open modal when page is set
  useEffect(() => {
    if (props.page) {
      popupState.open();
    }
  }, [!!props.page]);

  function onClose () {
    props.onClose();
    popupState.close();
  }

  function updatePage (input: Partial<Page>) {
    // console.log('update page', input);
  }

  return (
    <RootPortal>
      {popupState.isOpen && (
        <Dialog onClose={onClose}>
          <DocumentPage page={props.page!} setPage={updatePage} readOnly={props.readOnly} />
        </Dialog>
      )}
    </RootPortal>
  );
}
