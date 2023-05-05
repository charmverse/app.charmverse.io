import { log } from '@charmverse/core/log';
import type { Page } from '@charmverse/core/prisma';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef } from 'react';

import charmClient from 'charmClient';
import DocumentPage from 'components/[pageId]/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import Button from 'components/common/Button';
import { useBounties } from 'hooks/useBounties';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { usePage } from 'hooks/usePage';
import { usePages } from 'hooks/usePages';
import type { BountyWithDetails } from 'lib/bounties';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';
import debouncePromise from 'lib/utilities/debouncePromise';

import { BountyActions } from '../PageActions/components/BountyActions';
import { ExportToPDFAction } from '../PageActions/components/ExportToPDFAction';
import { KanbanPageActions } from '../PageActions/KanbanPageActions';

interface Props {
  pageId?: string;
  onClose: () => void;
  readOnly?: boolean;
  bounty?: BountyWithDetails | null;
  toolbar?: ReactNode;
  hideToolsMenu?: boolean;
}

export default function PageDialog(props: Props) {
  const { hideToolsMenu = false, pageId, bounty, toolbar, readOnly } = props;
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'page-dialog' });
  const router = useRouter();
  const { setBounties, refreshBounty } = useBounties();
  const { setCurrentPageId } = useCurrentPage();

  const { updatePage, deletePage } = usePages();
  const { page, refreshPage } = usePage({ pageIdOrPath: pageId });
  const pagePermissions = page?.permissionFlags || new AllowedPagePermissions().full;
  const domain = router.query.domain as string;
  const fullPageUrl = `/${domain}/${page?.path}`;

  const readOnlyPage = readOnly || !pagePermissions?.edit_content;

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

  async function onClickDelete() {
    if (page) {
      if (page.type === 'card' || page.type === 'card_synced') {
        await charmClient.deleteBlock(page.id, () => null);
      } else if (page.type === 'bounty') {
        setBounties((bounties) => bounties.filter((_bounty) => _bounty.id !== page.id));
      }
      await deletePage({ pageId: page.id });
      onClose();
    }
  }

  function onClose() {
    popupState.close();
    props.onClose();
  }

  useEffect(() => {
    if (page?.id) {
      setCurrentPageId(page?.id);
    }
    return () => {
      setCurrentPageId('');
    };
  }, [page?.id]);

  const savePage = useCallback(
    debouncePromise(async (updates: Partial<Page>) => {
      if (!page || !mounted.current) {
        return;
      }
      updatePage({ id: page.id, ...updates }).catch((err: any) => {
        log.error('Error saving page', err);
      });
    }, 500),
    [page]
  );

  if (!popupState.isOpen) {
    return null;
  }

  return (
    <Dialog
      toolsMenu={
        !hideToolsMenu &&
        !readOnly &&
        page && (
          <KanbanPageActions
            page={page}
            onClickDelete={() => {
              onClickDelete();
              onClose();
            }}
            onDuplicate={(pageDuplicateResponse) => {
              if (bounty) {
                refreshBounty(pageDuplicateResponse.rootPageId);
              }
            }}
          >
            <ExportToPDFAction pdfTitle={page.title} />
            {bounty && <BountyActions bountyId={bounty.id} />}
          </KanbanPageActions>
        )
      }
      toolbar={
        <Box display='flex' justifyContent='space-between'>
          <Button
            data-test='open-as-page'
            size='small'
            color='secondary'
            href={fullPageUrl}
            onClick={onClose}
            variant='text'
            startIcon={<OpenInFullIcon fontSize='small' />}
          >
            Open as Page
          </Button>
          {toolbar}
        </Box>
      }
      onClose={onClose}
    >
      {page && (
        <DocumentPage insideModal page={page} savePage={savePage} refreshPage={refreshPage} readOnly={readOnlyPage} />
      )}
    </Dialog>
  );
}
