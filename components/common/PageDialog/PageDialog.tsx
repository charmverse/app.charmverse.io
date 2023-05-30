import { log } from '@charmverse/core/log';
import { AvailablePagePermissions } from '@charmverse/core/permissions/flags';
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
import { useCurrentPage } from 'hooks/useCurrentPage';
import { usePage } from 'hooks/usePage';
import { usePages } from 'hooks/usePages';
import debouncePromise from 'lib/utilities/debouncePromise';

import { FullPageActionsMenuButton } from '../PageActions/FullPageActionsMenuButton';

interface Props {
  pageId?: string;
  onClose: () => void;
  readOnly?: boolean;
  toolbar?: ReactNode;
  hideToolsMenu?: boolean;
}

export function PageDialog(props: Props) {
  const { hideToolsMenu = false, pageId, toolbar, readOnly } = props;
  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'page-dialog' });
  const router = useRouter();
  const { setCurrentPageId } = useCurrentPage();

  const { updatePage } = usePages();
  const { page, refreshPage } = usePage({ pageIdOrPath: pageId });
  const pagePermissions = page?.permissionFlags || new AvailablePagePermissions().full;
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

  function close() {
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
        !hideToolsMenu && !readOnly && page && <FullPageActionsMenuButton insideModal page={page} onDelete={close} />
      }
      toolbar={
        <Box display='flex' justifyContent='space-between'>
          <Button
            data-test='open-as-page'
            size='small'
            color='secondary'
            href={fullPageUrl}
            onClick={close}
            variant='text'
            startIcon={<OpenInFullIcon fontSize='small' />}
          >
            Open as Page
          </Button>
          {toolbar}
        </Box>
      }
      onClose={close}
    >
      {page && (
        <DocumentPage insideModal page={page} savePage={savePage} refreshPage={refreshPage} readOnly={readOnlyPage} />
      )}
    </Dialog>
  );
}
