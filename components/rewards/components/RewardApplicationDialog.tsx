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
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { usePage } from 'hooks/usePage';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import debouncePromise from 'lib/utilities/debouncePromise';

import { useApplicationDialog, type ApplicationPropertiesInput } from '../hooks/useApplicationDialog';

import { NewApplication } from './RewardApplicationPage/NewApplication';
import { RewardApplicationPageComponent } from './RewardApplicationPage/RewardApplicationPage';

export function ApplicationDialog() {
  const mounted = useRef(false);
  const router = useRouter();
  const { isOpen, showApplication, hideApplication, currentApplicationId } = useApplicationDialog();

  const { application, isLoading } = useApplication({ applicationId: currentApplicationId as string });

  const { user } = useUser();
  // const [formInputs, setFormInputs] = useState<ApplicationPageAndPropertiesInput>(
  //   emptyState({ ...newApplication, userId: user?.id })
  // );

  const [contentUpdated, setContentUpdated] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // useEffect(() => {
  // //  setFormInputs((prevState) => ({
  //     ...prevState,
  //     publishToLens: !!user?.publishToLensDefault
  //   }));
  // }, [user?.id]);

  // useEffect(() => {
  //   if (page?.id) {
  //     trackPageView({ spaceId: page.spaceId, pageId: page.id, type: page.type });
  //   }
  // }, [page?.id]);

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
      ) : (
        <NewApplication
          formInputs={{}}
          setFormInputs={(_formInputs) => {
            setContentUpdated(true);
            // setFormInputs((existingFormInputs) => ({ ...existingFormInputs, ..._formInputs }));
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
        question='Are you sure you want to close this application? You have unsaved changes'
        onConfirm={close}
      />
    </Dialog>
  );
}
