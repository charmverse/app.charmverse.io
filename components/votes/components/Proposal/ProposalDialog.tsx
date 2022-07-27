import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { Page, Prisma } from '@prisma/client';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { usePopupState } from 'material-ui-popup-state/hooks';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import DocumentPage from 'components/[pageId]/DocumentPage';
import Button from 'components/common/Button';
import debouncePromise from 'lib/utilities/debouncePromise';
import { usePages } from 'hooks/usePages';
import charmClient from 'charmClient';
import log from 'lib/log';

interface Props {
  page?: Page | null;
  onClose: () => void;
  readOnly?: boolean;
}

export default function ProposalDialog (props: Props) {

  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'proposal-dialog' });
  const router = useRouter();
  const { setCurrentPageId, setPages } = usePages();

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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

  const debouncedPageUpdate = debouncePromise(async (updates: Partial<Page>) => {
    const updatedPage = await charmClient.updatePage(updates);
    setPages((_pages) => ({
      ..._pages,
      [updatedPage.id]: updatedPage
    }));
  }, 500);

  const setPage = useCallback(async (updates: Partial<Page>) => {
    if (!props.page || !mounted.current) {
      return;
    }
    debouncedPageUpdate({ id: props.page.id, ...updates } as Partial<Page>)
      .catch((err: any) => {
        log.error('Error saving page', err);
      });
  }, [props.page]);

  return (
    <RootPortal>
      {popupState.isOpen && (
        <Dialog
          hideCloseButton={true}
          toolbar={(
            <Button
              size='small'
              color='secondary'
              href={`/${router.query.domain}/${props.page?.path}`}
              variant='text'
              startIcon={<OpenInFullIcon fontSize='small' />}
            >
              Open as Page
            </Button>
          )}
          onClose={onClose}
        >
          {props.page && <DocumentPage insideModal page={props.page} setPage={setPage} readOnly={props.readOnly} />}
        </Dialog>
      )}
    </RootPortal>
  );
}
