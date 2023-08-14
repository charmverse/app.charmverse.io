import styled from '@emotion/styled';
import OpenInFullIcon from '@mui/icons-material/Launch';
import { useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Container } from 'components/[pageId]/DocumentPage/DocumentPage';
import Dialog from 'components/common/BoardEditor/focalboard/src/components/dialog';
import { Button } from 'components/common/Button';
import { PublicProfile } from 'components/u/PublicProfile';
import type { Member } from 'lib/members/interfaces';

const ContentContainer = styled(Container)`
  width: 100%;
`;

export function MemberProfile({
  member,
  space,
  onClose
}: {
  member: Member;
  space?: null | { id: string; name: string };
  onClose: VoidFunction;
}) {
  const theme = useTheme();
  const fullWidth = useMediaQuery(theme.breakpoints.down('md'));

  if (!space) {
    return null;
  }

  return (
    <Dialog
      onClose={onClose}
      fullWidth={fullWidth}
      toolbar={
        <Button
          size='small'
          color='secondary'
          href={`/u/${member.path}`}
          variant='text'
          target='_blank'
          startIcon={<OpenInFullIcon fontSize='small' />}
        >
          View full profile
        </Button>
      }
    >
      <ContentContainer top={20}>
        <PublicProfile user={member} readOnly />
      </ContentContainer>
    </Dialog>
  );
}
