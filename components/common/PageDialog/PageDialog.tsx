import { log } from '@charmverse/core/log';
import { AvailablePagePermissions } from '@charmverse/core/permissions/flags';
import type { Page } from '@charmverse/core/prisma';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { trackPageView } from 'charmClient/hooks/track';
import DocumentPage from 'components/[pageId]/DocumentPage';
import { DocumentPageProviders } from 'components/[pageId]/DocumentPage/DocumentPageProviders';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import type { PageDialogContext } from 'components/common/PageDialog/hooks/usePageDialog';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { usePage } from 'hooks/usePage';
import { usePages } from 'hooks/usePages';
import debouncePromise from 'lib/utilities/debouncePromise';

import { FullPageActionsMenuButton } from '../PageActions/FullPageActionsMenuButton';
import { DocumentHeaderElements } from '../PageLayout/components/Header/components/DocumentHeaderElements';

const RewardApplicationPage = dynamic(
  () =>
    import('../../rewards/components/RewardApplicationPage/RewardApplicationPage').then(
      (mod) => mod.RewardApplicationPage
    ),
  { ssr: false }
);

type ContentViewType = 'page' | 'application';

interface Props {
  pageId?: string;
  onClose: () => void;
  readOnly?: boolean;
  hideToolsMenu?: boolean;
  pageDialogContext?: PageDialogContext;
}

function PageDialogBase(props: Props) {
  const { hideToolsMenu = false, pageId, readOnly, pageDialogContext } = props;

  const mounted = useRef(false);
  const popupState = usePopupState({ variant: 'popover', popupId: 'page-dialog' });
  const router = useRouter();
  const { setCurrentPageId } = useCurrentPage();
  const { editMode, resetPageProps, setPageProps } = useCharmEditor();

  const { updatePage } = usePages();
  const { page, refreshPage } = usePage({ pageIdOrPath: pageId });
  const pagePermissions = page?.permissionFlags || new AvailablePagePermissions().full;
  const domain = router.query.domain as string;
  const fullPageUrl = page?.path ? `/${domain}/${page?.path}` : null;

  const readOnlyPage = readOnly || !pagePermissions?.edit_content;

  const contentType: ContentViewType | null = useMemo(() => {
    if (pageDialogContext?.applicationId || (pageDialogContext?.isNewApplication && pageDialogContext?.pageId)) {
      return 'application';
    }

    return pageId ? 'page' : null;
  }, [pageDialogContext?.applicationId, pageDialogContext?.isNewApplication, pageDialogContext?.pageId, pageId]);
  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // open modal when page is set
  useEffect(() => {
    if (contentType) {
      popupState.open();
    }
  }, [!!contentType]);

  useEffect(() => {
    if (page?.id) {
      trackPageView({ spaceId: page.spaceId, pageId: page.id, type: page.type, spaceDomain: domain });
    }
  }, [page?.id]);

  function close() {
    popupState.close();
    props.onClose();
  }

  useEffect(() => {
    if (contentType === null && popupState.isOpen) {
      close();
    }
  }, [contentType, popupState.isOpen]);

  useEffect(() => {
    if (page?.id) {
      setCurrentPageId(page?.id);
    }
    return () => {
      setCurrentPageId('');
      resetPageProps();
    };
  }, [page?.id]);

  // set page attributes of the primary charm editor
  useEffect(() => {
    if (!page) {
      // wait for pages loaded for permissions to be correct
      return;
    }
    if (!editMode) {
      if (page.permissionFlags.edit_content) {
        setPageProps({ permissions: page.permissionFlags, editMode: 'editing' });
      } else {
        setPageProps({ permissions: page.permissionFlags, editMode: 'viewing' });
      }
    } else {
      // pass editMode thru to fix hot-reloading which resets the prop
      setPageProps({ permissions: page.permissionFlags, editMode });
    }
  }, [page?.permissionFlags.edit_content]);

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
        contentType === 'page' &&
        !hideToolsMenu &&
        !readOnly &&
        page && <FullPageActionsMenuButton page={page} onDelete={close} />
      }
      toolbar={
        contentType === 'page' && (
          <Box display='flex' justifyContent='space-between'>
            <Button
              data-test='open-as-page'
              size='small'
              color='secondary'
              href={fullPageUrl}
              onClick={close}
              variant='text'
              startIcon={<OpenInFullIcon fontSize='small' />}
              sx={{ px: 1.5 }}
            >
              Open as Page
            </Button>
            {page && (
              <Box display='flex' alignItems='center' gap={0.5}>
                <DocumentHeaderElements headerHeight={0} page={page} />
              </Box>
            )}
          </Box>
        )
      }
      onClose={close}
    >
      {page && contentType === 'page' && (
        <DocumentPage page={page} savePage={savePage} refreshPage={refreshPage} readOnly={readOnlyPage} close={close} />
      )}
      {contentType === 'application' && pageDialogContext && (
        <RewardApplicationPage
          applicationId={pageDialogContext.applicationId || null}
          rewardId={pageDialogContext.pageId || null}
          closeDialog={close}
        />
      )}
    </Dialog>
  );
}

// PageDialogBase must be wrapped by DocumentPageProviders so that it can control context about the page
export function PageDialog(props: Props): JSX.Element | null {
  return (
    <DocumentPageProviders isInsideDialog={true}>
      <PageDialogBase {...props} />
    </DocumentPageProviders>
  );
}
