import styled from '@emotion/styled';
import { Edit as EditIcon } from '@mui/icons-material';
import { Box, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { PageEditorContainer } from 'components/[pageId]/DocumentPage/components/PageEditorContainer';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import { MemberActions } from 'components/settings/roles/components/MemberActions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import type { Member } from 'lib/members/interfaces';

import { ProfileTabs } from './components/ProfileTabs';
import { UserDetailsReadonly } from './components/UserDetailsReadonly';

const ContentContainer = styled(PageEditorContainer)`
  width: 100%;
  margin-bottom: 100px;
`;

export function MemberProfile({
  isMine,
  member,
  space,
  onClose
}: {
  isMine: boolean;
  member: Member;
  space?: null | { id: string; name: string };
  onClose: VoidFunction;
}) {
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));
  const isAdmin = useIsAdmin();
  const { openSettings } = useSettingsDialog();
  if (!space) {
    return null;
  }

  function onClickEdit() {
    onClose();
    openSettings('profile');
  }

  return (
    <Dialog
      onClose={onClose}
      fullWidth={fullWidth}
      toolbar={
        <Stack flexDirection='row' justifyContent='space-between'>
          {isMine ? (
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
      }
    >
      <ContentContainer top={20}>
        <Stack spacing={2}>
          <UserDetailsReadonly user={member} />
          <ProfileTabs user={member} readOnly />
        </Stack>
      </ContentContainer>
    </Dialog>
  );
}
