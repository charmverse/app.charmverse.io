import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Stack } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { EditorPage } from 'components/[pageId]/EditorPage/EditorPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { FullPageActionsMenuButton } from 'components/common/PageActions/FullPageActionsMenuButton';
import { useUser } from 'hooks/useUser';
import type { PageWithContent } from 'lib/pages';

import type { ProposalPageAndPropertiesInput } from './NewProposalPage';
import { NewProposalPage } from './NewProposalPage';

interface Props {
  isLoading: boolean;
  onClose: () => void;
  page?: PageWithContent | null;
}

export function ProposalDialog({ page, isLoading, onClose }: Props) {
  const mounted = useRef(false);
  const router = useRouter();
  const { user } = useUser();
  const [formInputs, setFormInputs] = useState<ProposalPageAndPropertiesInput>(emptyState({ userId: user?.id }));

  const [contentUpdated, setContentUpdated] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

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
        page ? (
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
        page ? (
          <Stack flexDirection='row' gap={1}>
            <FullPageActionsMenuButton page={page} onDelete={close} />
          </Stack>
        ) : null
      }
    >
      {isLoading ? (
        <LoadingComponent isLoading />
      ) : page ? (
        <EditorPage pageId={page.id} />
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

function emptyState({ userId }: { userId?: string } = {}): ProposalPageAndPropertiesInput {
  return {
    authors: userId ? [userId] : [],
    categoryId: null,
    content: null,
    contentText: '',
    headerImage: null,
    icon: null,
    evaluationType: 'vote',
    proposalTemplateId: null,
    reviewers: [],
    rubricCriteria: [],
    title: ''
  };
}
