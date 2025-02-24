import styled from '@emotion/styled';
import { Box, Typography } from '@mui/material';
import { hasNftAvatar } from '@packages/users/hasNftAvatar';

import Avatar from 'components/common/Avatar';
import type { Member } from 'lib/members/interfaces';

import { MemberActions } from './MemberActions';

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
  readOnly: boolean;
  memberRoleId?: string;
}

export function MemberRow({ member, readOnly, memberRoleId }: Props) {
  return (
    <StyledRow py={2} data-test={`member-row-${member.id}`}>
      <Box display='flex' alignItems='center'>
        <Avatar name={member.username} avatar={member?.avatar} size='small' isNft={hasNftAvatar(member)} />
        <Box pl={2}>
          <Typography variant='body1'>{member.username}</Typography>
        </Box>
      </Box>
      {!readOnly && <MemberActions member={member} memberRoleId={memberRoleId} readOnly={readOnly} />}
    </StyledRow>
  );
}
