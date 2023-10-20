import { useEffect, useRef, useState } from 'react';

import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { NewPageDocument } from 'components/common/PageDialog/components/NewPageDocument';
import { useNewPage } from 'components/common/PageDialog/hooks/useNewPage';

export function NewPageDialog({
  children,
  onClose,
  onSave,
  isSaving
}: {
  children: React.ReactNode;
  onClose?: VoidFunction;
  onSave: VoidFunction;
  isSaving?: boolean;
}) {
  const { newPageContext, clearNewPage, hasNewPage } = useNewPage();

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
    clearNewPage();
    setShowConfirmDialog(false);
  }

  if (!hasNewPage) {
    return null;
  }

  const { contentUpdated, disabledTooltip } = newPageContext;

  return (
    <Dialog
      onClose={() => {
        if (contentUpdated) {
          setShowConfirmDialog(true);
        } else {
          close();
        }
      }}
      footerActions={
        <Button
          disabled={Boolean(disabledTooltip) || !contentUpdated || isSaving}
          disabledTooltip={disabledTooltip}
          onClick={onSave}
          loading={isSaving}
          data-test='save-new-page-button'
        >
          Save
        </Button>
      }
    >
      <NewPageDocument>{children}</NewPageDocument>

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
