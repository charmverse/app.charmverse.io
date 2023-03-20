import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Avatar from 'components/common/Avatar';
import ElementDeleteIcon from 'components/common/form/ElementDeleteIcon';
import type { Member } from 'lib/members/interfaces';
import { hasNftAvatar } from 'lib/users/hasNftAvatar';

export const StyledRow = styled(Box)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    .row-actions {
      opacity: 0;
    }
    &:hover {
      .row-actions {
        opacity: 1;
      }
    }
  }
`;

interface Props {
  member: Member;
  isEditable: boolean;
  onRemove: (id: string) => void;
}

export function RoleMemberRow({ member, isEditable, onRemove }: Props) {
  function removeMember() {
    onRemove(member.id);
  }

  return (
    <StyledRow py={2}>
      <Box display='flex' alignItems='center'>
        <Avatar name={member.username} avatar={member?.avatar} size='small' isNft={hasNftAvatar(member)} />
        <Box pl={2}>
          <Typography variant='body1'>{member.username}</Typography>
        </Box>
      </Box>
      {isEditable && <ElementDeleteIcon onClick={removeMember} tooltip='Remove member' />}
    </StyledRow>
  );
}
