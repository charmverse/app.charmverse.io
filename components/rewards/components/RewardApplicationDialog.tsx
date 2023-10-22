import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useUser } from 'hooks/useUser';

import { useApplicationDialog } from '../hooks/useApplicationDialog';

import { RewardApplicationPageComponent } from './RewardApplicationPage/RewardApplicationPage';

export function ApplicationDialog() {
  const mounted = useRef(false);
  const router = useRouter();
  const { isOpen, hideApplication, currentApplicationId } = useApplicationDialog();

  const { isLoading } = useApplication({ applicationId: currentApplicationId as string });
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
    //    setFormInputs(emptyState());
    setContentUpdated(false);
    setShowConfirmDialog(false);
    hideApplication();
  }

  const relativePath = currentApplicationId
    ? `/${router.query.domain}/rewards/applications/${currentApplicationId}`
    : null;

  if (!isOpen) {
    return null;
  }

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
        currentApplicationId ? (
          <Box display='flex' justifyContent='space-between'>
            <Button
              onClick={hideApplication}
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
          </Box>
        ) : (
          <div />
        )
      }
      toolsMenu={null}
    >
      {isLoading ? (
        <LoadingComponent isLoading />
      ) : currentApplicationId ? (
        // Document page is used in a few places, so it is responsible for retrieving its own permissions
        <RewardApplicationPageComponent applicationId={currentApplicationId} />
      ) : null}
      <ConfirmDeleteModal
        onClose={() => {
          setShowConfirmDialog(false);
        }}
        title='Unsaved changes'
        open={showConfirmDialog}
        buttonText='Discard'
        secondaryButtonText='Cancel'
        question='Are you sure you want to close this application? You have unsaved changes'
        onConfirm={close}
      />
    </Dialog>
  );
}
