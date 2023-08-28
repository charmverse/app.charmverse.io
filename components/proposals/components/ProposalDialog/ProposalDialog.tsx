import { log } from '@charmverse/core/log';
import type { Page } from '@charmverse/core/prisma';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';

import DocumentPage from 'components/[pageId]/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { FullPageActionsMenuButton } from 'components/common/PageActions/FullPageActionsMenuButton';
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
            >
              Open as Page
            </Button>
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
    ...inputs,
    authors: userId ? [userId] : []
  };
}
