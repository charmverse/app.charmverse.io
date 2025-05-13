import styled from '@emotion/styled';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import Dialog from 'components/common/DatabaseEditor/components/dialog';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import ProfileSettings from 'components/settings/profile/ProfileSettings';

import { useMemberProfileDialog } from '../hooks/useMemberProfileDialog';

const ContentContainer = styled(PageEditorContainer)`
  width: 100%;
  margin-bottom: 100px;
`;

export function EditMemberProfileDialogGlobal() {
  const { isEditProfileOpen, closeEditProfile } = useMemberProfileDialog();

  const confirmExitPopupState = usePopupState({ variant: 'popover', popupId: 'confirm-exit' });
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  const handleCloseProfileEditModal = () => {
    if (unsavedChanges) {
      confirmExitPopupState.open();
    } else {
      closeEditProfile();
    }
  };

  if (isEditProfileOpen) {
    return (
      <>
        <Dialog onClose={handleCloseProfileEditModal}>
          <ContentContainer top={20}>
            <ProfileSettings setUnsavedChanges={setUnsavedChanges} />
          </ContentContainer>
        </Dialog>
        <ConfirmDeleteModal
          onClose={() => {
            confirmExitPopupState.close();
            closeEditProfile();
          }}
          title='Unsaved changes'
          open={confirmExitPopupState.isOpen}
          buttonText='Discard'
          secondaryButtonText='Cancel'
          question='Are you sure you want to close this window? You have unsaved changes.'
          onConfirm={() => {
            confirmExitPopupState.close();
            closeEditProfile();
          }}
        />
      </>
    );
  }

  return null;
}
