import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, List, ListItemButton, ListItemText } from '@mui/material';
import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import Button from 'components/common/Button';
import DocumentPage from 'components/[pageId]/DocumentPage';
import { usePages } from 'hooks/usePages';
import log from 'lib/log';
import debouncePromise from 'lib/utilities/debouncePromise';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { ReactNode, useCallback, useEffect, useRef } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { BountyWithDetails } from 'models';
import { useSnackbar } from 'hooks/useSnackbar';
import IntlProvider from 'components/common/IntlProvider';
import { Utils } from '../BoardEditor/focalboard/src/utils';

interface Props {
  page?: Page | null;
  onClose: () => void;
  readOnly?: boolean;
  onClickDelete?: () => void
  bounty?: BountyWithDetails | null
  onMarkCompleted?: (bountyId: string) => void
  toolbar?: ReactNode
  hideToolsMenu?: boolean
}

export default function PageDialog (props: Props) {
  const { hideToolsMenu = false, page, bounty, onMarkCompleted, toolbar, readOnly, onClickDelete } = props;
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'page-dialog' });
  const router = useRouter();
  const { setCurrentPageId, setPages, getPagePermissions } = usePages();
  const pagePermission = page ? getPagePermissions(page.id) : null;
  const { showMessage } = useSnackbar();
  const isSharedPage = router.route.startsWith('/share');

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // open modal when page is set
  useEffect(() => {
    if (page) {
      popupState.open();
    }
  }, [!!page]);

  function onClose () {
    props.onClose();
    popupState.close();
  }

  useEffect(() => {
    if (page?.id) {
      setCurrentPageId(page?.id);
    }
    return () => {
      setCurrentPageId('');
    };
  }, [page?.id]);

  const debouncedPageUpdate = debouncePromise(async (updates: Partial<Page>) => {
    const updatedPage = await charmClient.updatePage(updates);
    setPages((_pages) => ({
      ..._pages,
      [updatedPage.id]: updatedPage
    }));
  }, 500);

  const setPage = useCallback(async (updates: Partial<Page>) => {
    if (!page || !mounted.current) {
      return;
    }
    debouncedPageUpdate({ id: page.id, ...updates } as Partial<Page>)
      .catch((err: any) => {
        log.error('Error saving page', err);
      });
  }, [page]);

  return (
    <RootPortal>
      {popupState.isOpen && (
        <IntlProvider>
          <Dialog
            hideCloseButton
            toolsMenu={!hideToolsMenu && !readOnly
            && (
              <List dense>
                {onClickDelete && (
                <ListItemButton
                  disabled={!pagePermission?.delete}
                  onClick={async () => {
                    onClickDelete();
                    onClose();
                  }}
                >
                  <DeleteIcon
                    sx={{
                      mr: 1
                    }}
                    fontSize='small'
                  />
                  <ListItemText primary='Delete' />
                </ListItemButton>
                )}
                <ListItemButton onClick={() => {
                  Utils.copyTextToClipboard(window.location.href);
                  showMessage('Copied card link to clipboard', 'success');
                }}
                >
                  <InsertLinkIcon
                    sx={{
                      mr: 1
                    }}
                    fontSize='small'
                  />
                  <ListItemText primary='Copy link' />
                </ListItemButton>
                {bounty && onMarkCompleted && (
                <ListItemButton disabled={bounty.status === 'complete'} onClick={() => onMarkCompleted(bounty.id)}>
                  <CheckCircleIcon
                    sx={{
                      mr: 1
                    }}
                    fontSize='small'
                  />
                  <ListItemText primary='Mark complete' />
                </ListItemButton>
                )}
              </List>
            )}
            toolbar={!isSharedPage && (
              <Box display='flex' justifyContent='space-between'>
                <Button
                  size='small'
                  color='secondary'
                  href={`/${router.query.domain}/${page?.path}`}
                  variant='text'
                  startIcon={<OpenInFullIcon fontSize='small' />}
                >
                  Open as Page
                </Button>
                {toolbar}
              </Box>
            )}
            onClose={onClose}
          >
            {page && <DocumentPage insideModal page={page} setPage={setPage} readOnly={props.readOnly} />}
          </Dialog>
        </IntlProvider>
      )}
    </RootPortal>
  );
}
