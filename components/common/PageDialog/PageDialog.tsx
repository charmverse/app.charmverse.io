import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box } from '@mui/material';
import type { Page } from '@prisma/client';
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
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import type { BountyWithDetails } from 'lib/bounties';
import log from 'lib/log';
import type { PageMeta, PageUpdates } from 'lib/pages';
import debouncePromise from 'lib/utilities/debouncePromise';

import { PageActions } from '../PageActions';
import { BountyActions } from '../PageLayout/components/Header/components/BountyActions';

interface Props {
  page?: PageMeta | null;
  onClose: () => void;
  readOnly?: boolean;
  bounty?: BountyWithDetails | null;
  toolbar?: ReactNode;
  hideToolsMenu?: boolean;
}

export default function PageDialog(props: Props) {
  const { hideToolsMenu = false, page, bounty, toolbar, readOnly } = props;
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'page-dialog' });
  const router = useRouter();
  const { setBounties, refreshBounty } = useBounties();
  const { setCurrentPageId } = useCurrentPage();

  const { updatePage, deletePage } = usePages();
  const { permissions: pagePermissions } = usePagePermissions({
    pageIdOrPath: page?.id as string,
    isNewPage: !page?.id
  });
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
      if (page.type === 'card') {
        await charmClient.deleteBlock(page.id, () => {});
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
          <PageActions
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
            {bounty && <BountyActions bountyId={bounty.id} />}
          </PageActions>
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
      {page && <DocumentPage insideModal page={page} setPage={savePage} readOnly={readOnlyPage} />}
    </Dialog>
  );
}
