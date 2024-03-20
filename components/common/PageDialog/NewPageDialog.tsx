import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { Button } from 'components/common/Button';
import Dialog from 'components/common/DatabaseEditor/components/dialog';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { usePreventReload } from 'hooks/usePreventReload';

export function NewPageDialog({
  children,
  contentUpdated,
  onClose,
  onSave,
  onCancel,
  isSaving,
  isOpen,
  disabledTooltip,
  toolbar
}: {
  children: React.ReactNode;
  contentUpdated: boolean;
  onClose?: VoidFunction;
  onCancel?: VoidFunction;
  onSave: VoidFunction;
  isSaving?: boolean;
  disabledTooltip?: string;
  isOpen: boolean;
  toolbar?: ReactNode;
}) {
  const mounted = useRef(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // keep track if charmeditor is mounted. There is a bug that it calls the update method on closing the modal, but content is empty
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      onClose?.();
    };
  }, []);

  function close() {
    onClose?.();
    setShowConfirmDialog(false);
  }

  usePreventReload(contentUpdated);

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
      toolbar={toolbar}
      footerActions={
        <Box display='flex' gap={1}>
          {!!onCancel && (
            <Button color='secondary' variant='outlined' onClick={onCancel} data-test='cancel-new-page-button'>
              Cancel
            </Button>
          )}
          <Button
            disabled={Boolean(disabledTooltip) || !contentUpdated || isSaving}
            disabledTooltip={disabledTooltip}
            onClick={onSave}
            loading={isSaving}
            data-test='save-new-page-button'
          >
            Save
          </Button>
        </Box>
      }
    >
      {children}

      <ConfirmDeleteModal
        onClose={() => {
          setShowConfirmDialog(false);
        }}
        title='Unsaved changes'
        open={showConfirmDialog}
        buttonText='Discard'
        secondaryButtonText='Cancel'
        question='Are you sure you want to close this form? You have unsaved changes'
        onConfirm={close}
      />
    </Dialog>
  );
}
