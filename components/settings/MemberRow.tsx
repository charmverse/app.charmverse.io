
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Avatar from 'components/common/Avatar';

export interface Member {
  address: string;
  role: string;
  username: string;
}

const StyledRow = styled(Box)`
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export default function MemberRow ({ member }: { member: Member }) {
  return (
    <StyledRow pb={2} mb={2}>
      <Box display='flex' alignItems='center'>
        <Avatar name={member.username} />
        <Box pl={2}>
          <Typography variant='body1'><strong>{member.username}</strong></Typography>
          <Typography color='secondary' variant='body2'>{member.address}</Typography>
        </Box>
      </Box>
      <Typography color='secondary' variant='body2' sx={{ px: 3 }}>
        {member.role}
      </Typography>
    </StyledRow>
  )
}