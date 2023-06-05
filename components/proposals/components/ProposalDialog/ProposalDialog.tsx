import { useEffect, useRef, useState } from 'react';

import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useUser } from 'hooks/useUser';

import type { ProposalFormInputs } from '../interfaces';

import { ProposalPage } from './ProposalPage';

interface Props {
  isLoading: boolean;
  onClose: () => void;
}

export function ProposalDialog({ isLoading, onClose }: Props) {
  const mounted = useRef(false);
  const { user } = useUser();
  const [formInputs, setFormInputs] = useState<ProposalFormInputs>({
    title: '',
    content: null,
    contentText: '',
    categoryId: null,
    authors: user ? [user.id] : [],
    reviewers: [],
    proposalTemplateId: null
  });
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
    setFormInputs({
      title: '',
      content: null,
      contentText: '',
      categoryId: null,
      authors: [],
      reviewers: [],
      proposalTemplateId: null
    });
    setContentUpdated(false);
    setShowConfirmDialog(false);
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
    >
      {!isLoading && (
        <ProposalPage
          formInputs={formInputs}
          setFormInputs={(_formInputs) => {
            setContentUpdated(true);
            setFormInputs((__formInputs) => ({ ...__formInputs, ..._formInputs }));
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
        secondaryButtonText='Go back'
        question='Are you sure you want to close this proposal? You have unsaved changes'
        onConfirm={close}
      />
    </Dialog>
  );
}
