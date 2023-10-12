import { log } from '@charmverse/core/log';
import type { Page } from '@charmverse/core/prisma';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { trackPageView } from 'charmClient/hooks/track';
import DocumentPage from 'components/[pageId]/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { FullPageActionsMenuButton } from 'components/common/PageActions/FullPageActionsMenuButton';
import { DocumentHeaderElements } from 'components/common/PageLayout/components/Header/components/DocumentHeaderElements';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePage } from 'hooks/usePage';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import debouncePromise from 'lib/utilities/debouncePromise';

import type { ProposalPageAndPropertiesInput } from './hooks/useProposalDialog';
import { NewProposalPage } from './NewProposalPage';

interface Props {
  pageId?: string;
  newProposal?: Partial<ProposalPageAndPropertiesInput>;
  onClose: () => void;
}

export function ProposalDialog({ pageId, newProposal, onClose }: Props) {
  const mounted = useRef(false);
  const router = useRouter();
  const { updatePage } = usePages();
  // This is needed so that the surrounding currentPage context provides the correct pageId
  const { setCurrentPageId } = useCurrentPage();
  const { editMode, resetPageProps, setPageProps } = useCharmEditor();

  const { space } = useCurrentSpace();
  const { user } = useUser();
  const { page, isLoading: isPageLoading, refreshPage } = usePage({ pageIdOrPath: pageId });
  const [formInputs, setFormInputs] = useState<ProposalPageAndPropertiesInput>(
    emptyState({ ...newProposal, userId: user?.id })
  );

  const [contentUpdated, setContentUpdated] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const isLoading = !!pageId && isPageLoading;
  const readOnly = page?.permissionFlags.edit_content === false;

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

  useEffect(() => {
    if (pageId) {
      setCurrentPageId(pageId);
    }
    return () => {
      setCurrentPageId('');
      resetPageProps();
    };
  }, [pageId]);

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

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    setFormInputs((prevState) => ({
      ...prevState,
      publishToLens: !!user?.publishToLensDefault
    }));
  }, [user?.id]);

  useEffect(() => {
    if (page?.id) {
      trackPageView({ spaceId: page.spaceId, pageId: page.id, type: page.type, spaceDomain: space?.domain });
    }
  }, [page?.id]);

  function close() {
    onClose();
    setFormInputs(emptyState());
    setContentUpdated(false);
    setShowConfirmDialog(false);
  }

  const relativePath = `/${router.query.domain}/${page?.path}`;

  return (
    <Dialog
      onClose={() => {
        if (contentUpdated) {
          setShowConfirmDialog(true);
        } else {
          close();
        }
      }}
      toolbar={
        pageId ? (
          <Box display='flex' justifyContent='space-between'>
            <Button
              data-test='open-as-page'
              size='small'
              color='secondary'
              href={relativePath}
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
        ) : (
          <div />
        )
      }
      toolsMenu={
        pageId ? (
          <Stack flexDirection='row' gap={1}>
            <FullPageActionsMenuButton pageId={pageId} onDelete={close} />
          </Stack>
        ) : null
      }
    >
      {isLoading ? (
        <LoadingComponent isLoading />
      ) : page ? (
        // Document page is used in a few places, so it is responsible for retrieving its own permissions
        <DocumentPage page={page} refreshPage={refreshPage} readOnly={readOnly} savePage={savePage} />
      ) : (
        <NewProposalPage
          formInputs={formInputs}
          setFormInputs={(_formInputs) => {
            setContentUpdated(true);
            setFormInputs((existingFormInputs) => ({ ...existingFormInputs, ..._formInputs }));
          }}
          contentUpdated={contentUpdated}
          setContentUpdated={setContentUpdated}
        />
      )}
      <ConfirmDeleteModal
        onClose={() => {
          setShowConfirmDialog(false);
        }}
        title='Unsaved changes'
        open={showConfirmDialog}
        buttonText='Discard'
        secondaryButtonText='Cancel'
        question='Are you sure you want to close this proposal? You have unsaved changes'
        onConfirm={close}
      />
    </Dialog>
  );
}

function emptyState({
  userId,
  ...inputs
}: Partial<ProposalPageAndPropertiesInput> & { userId?: string } = {}): ProposalPageAndPropertiesInput {
  return {
    categoryId: null,
    content: null,
    contentText: '',
    headerImage: null,
    icon: null,
    evaluationType: 'vote',
    proposalTemplateId: null,
    reviewers: [],
    rubricCriteria: [],
    title: '',
    publishToLens: false,
    fields: { properties: {} },
    ...inputs,
    authors: userId ? [userId] : []
  };
}
