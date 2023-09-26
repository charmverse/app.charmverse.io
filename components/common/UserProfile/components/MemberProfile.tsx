import styled from '@emotion/styled';
import { Edit as EditIcon } from '@mui/icons-material';
import { Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import { PublicProfile } from 'components/u/PublicProfile';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import type { Member } from 'lib/members/interfaces';

const ContentContainer = styled(Container)`
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

  const { onClick: openSettings } = useSettingsDialog();
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
        isMine ? (
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
        )
      }
    >
      <ContentContainer top={20}>
        <PublicProfile user={member} readOnly />
      </ContentContainer>
    </Dialog>
  );
}
