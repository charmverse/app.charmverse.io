import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, List, ListItemButton, ListItemText } from '@mui/material';
import type { Page } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useMemo } from 'react';

import charmClient from 'charmClient';
import DocumentPage from 'components/[pageId]/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import RootPortal from 'components/common/BoardEditor/focalboard/src/components/rootPortal';
import { Utils } from 'components/common/BoardEditor/focalboard/src/utils';
import Button from 'components/common/Button';
import { useBounties } from 'hooks/useBounties';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import type { BountyWithDetails } from 'lib/bounties';
import log from 'lib/log';
import type { PageMeta, PageUpdates } from 'lib/pages';
import { findParentOfType } from 'lib/pages/findParentOfType';
import debouncePromise from 'lib/utilities/debouncePromise';

interface Props {
  page?: PageMeta | null;
  onClose: () => void;
  readOnly?: boolean;
  bounty?: BountyWithDetails | null;
  toolbar?: ReactNode;
  hideToolsMenu?: boolean;
}

export default function PageDialog (props: Props) {
  const { hideToolsMenu = false, page, bounty, toolbar, readOnly } = props;
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'page-dialog' });
  const router = useRouter();
  const { refreshBounty } = useBounties();
  const { currentPageId, setCurrentPageId, updatePage, getPagePermissions, deletePage, pages } = usePages();
  const pagePermission = page ? getPagePermissions(page.id) : null;
  const { showMessage } = useSnackbar();
  // extract domain from shared pages: /share/<domain>/<page_path>
  const domain = router.query.domain || /^\/share\/(.*)\//.exec(router.asPath)?.[1];
  const fullPageUrl = router.route.startsWith('/share') ? `/share/${domain}/${page?.path}` : `/${domain}/${page?.path}`;

  const ogCurrentPageId = useMemo(() => currentPageId, []);

  const parentProposalId = findParentOfType({ pageId: ogCurrentPageId, pageType: 'proposal', pageMap: pages });

  const readOnlyPage = readOnly || !pagePermission?.edit_content;

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

  useEffect(() => {
    if (page?.id) {
      charmClient.track.trackAction('page_view', { spaceId: page.spaceId, pageId: page.id, type: page.type });
    }
  }, [page?.id]);

  async function onClickDelete () {
    if (page) {
      await deletePage({ pageId: page.id });
      onClose();
    }
  }

  function onClose () {
    popupState.close();
    props.onClose();
  }

  useEffect(() => {
    if (page?.id) {
      setCurrentPageId(page?.id);
    }
    return () => {
      // kind of a hack for focalboards that are embedded inside CharmEditor. TODO: use localized currentPageId and dont import from usePages
      setCurrentPageId(ogCurrentPageId);
    };
  }, [page?.id]);

  const debouncedPageUpdate = debouncePromise(async (updates: PageUpdates) => {
    await updatePage(updates);
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

  async function closeBounty (bountyId: string) {
    await charmClient.bounties.closeBounty(bountyId);
    if (refreshBounty) {
      refreshBounty(bountyId);
    }
  }

  return (
    <RootPortal>
      {popupState.isOpen && (
        <Dialog
          hideCloseButton
          toolsMenu={!hideToolsMenu && !readOnly && (
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
              <ListItemButton
                onClick={() => {
                  Utils.copyTextToClipboard(window.location.origin + fullPageUrl);
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
              {bounty && (
                <ListItemButton disabled={bounty.status === 'complete' || (bounty.status !== 'inProgress' && bounty.status !== 'open')} onClick={() => closeBounty(bounty.id)}>
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
          toolbar={(
            <Box display='flex' justifyContent='space-between'>
              <Button
                size='small'
                color='secondary'
                href={fullPageUrl}
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
          {page && <DocumentPage insideModal page={page} setPage={setPage} readOnly={readOnlyPage} parentProposalId={parentProposalId} />}
        </Dialog>

      )}
    </RootPortal>
  );
}
