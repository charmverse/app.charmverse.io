import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Page } from '@prisma/client';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { usePopupState } from 'material-ui-popup-state/hooks';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import DocumentPage from 'components/[pageId]/DocumentPage';
import Button from 'components/common/Button';
import { usePages } from 'hooks/usePages';

interface Props {
  page?: Page | null;
  onClose: () => void;
  readOnly?: boolean;
}

export default function ProposalDialog (props: Props) {

  const popupState = usePopupState({ variant: 'popover', popupId: 'proposal-dialog' });
  const router = useRouter();
  const { setCurrentPageId } = usePages();

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

  useEffect(() => {
    if (props.page?.id) {
      setCurrentPageId(props.page?.id);
    }
    return () => {
      setCurrentPageId('');
    };
  }, [props.page?.id]);

  function updatePage (input: Partial<Page>) {
    // console.log('update page', input);
  }

  return (
    <RootPortal>
      {popupState.isOpen && (
        <Dialog
          toolbar={(
            <Button
              size='small'
              color='secondary'
              href={`/${router.query.domain}/${props.page!.path}`}
              variant='text'
              startIcon={<OpenInFullIcon fontSize='small' />}
            >
              Open as Page
            </Button>
          )}
          onClose={onClose}
        >
          <DocumentPage page={props.page!} setPage={updatePage} readOnly={props.readOnly} />
        </Dialog>
      )}
    </RootPortal>
  );
}
