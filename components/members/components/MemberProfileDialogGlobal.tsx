import styled from '@emotion/styled';
import { Edit as EditIcon } from '@mui/icons-material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import { Button } from 'components/common/Button';
import Dialog from 'components/common/DatabaseEditor/components/dialog';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import ProfileSettings from 'components/settings/profile/ProfileSettings';
import { MemberActions } from 'components/settings/roles/components/MemberActions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';

import { useMemberProfileDialog } from '../hooks/useMemberProfileDialog';

import { ProfileTabs } from './MemberProfile/components/ProfileTabs';
import { UserDetailsReadonly } from './MemberProfile/components/UserDetailsReadonly';

const ContentContainer = styled(PageEditorContainer)`
  width: 100%;
  margin-bottom: 100px;
`;

export function MemberProfileDialogGlobal() {
  const { hideUserProfile, memberId } = useMemberProfileDialog();
  const { space } = useCurrentSpace();
  const { getMemberById } = useMembers();
  const member = memberId ? getMemberById(memberId) : null;
  const { user } = useUser();
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));
  const isAdmin = useIsAdmin();
  const { openEditProfile, isEditProfileOpen, closeEditProfile, showUserProfile } = useMemberProfileDialog();
  const confirmExitPopupState = usePopupState({ variant: 'popover', popupId: 'confirm-exit' });
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Show the selected member profile
  if (!user || !space || (!member && !isEditProfileOpen)) {
    return null;
  }

  function onClickEdit() {
    hideUserProfile();
    openEditProfile();
  }

  function handleCloseProfileEditModal() {
    if (unsavedChanges) {
      confirmExitPopupState.open();
    } else {
      closeEditProfile();
    }
  }

  function handleViewProfile() {
    if (unsavedChanges) {
      confirmExitPopupState.open();
    } else if (user) {
      showUserProfile(user.id);
    }
  }

  return (
    <Dialog
      onClose={isEditProfileOpen ? handleCloseProfileEditModal : hideUserProfile}
      fullWidth={fullWidth}
      toolbar={
        member ? (
          <Stack flexDirection='row' justifyContent='space-between'>
            {memberId === user.id ? (
              <Box display='flex' justifyContent='space-between'>
                <Button
                  data-test='open-post-as-page'
                  size='small'
                  color='secondary'
                  variant='text'
                  startIcon={<EditIcon fontSize='small' />}
                  onClick={onClickEdit}
                >
                  Edit Profile
                </Button>
              </Box>
            ) : (
              <div />
            )}
            {isAdmin ? <MemberActions member={member} /> : null}
          </Stack>
        ) : isEditProfileOpen ? (
          <Stack flexDirection='row' justifyContent='space-between'>
            <Box display='flex' justifyContent='space-between'>
              <Button
                size='small'
                color='secondary'
                variant='text'
                startIcon={<VisibilityIcon fontSize='small' />}
                onClick={handleViewProfile}
              >
                View Profile
              </Button>
            </Box>
          </Stack>
        ) : null
      }
    >
      <ContentContainer top={20}>
        {member ? (
          <Stack spacing={2}>
            <UserDetailsReadonly user={member} />
            <ProfileTabs user={member} readOnly />
          </Stack>
        ) : (
          <>
            <ProfileSettings setUnsavedChanges={setUnsavedChanges} />
            <ConfirmDeleteModal
              onClose={() => {
                confirmExitPopupState.close();
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
        )}
      </ContentContainer>
    </Dialog>
  );
}
