
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Avatar from 'components/common/Avatar';
import { Contributor } from 'models';

const StyledRow = styled(Box)`
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export default function ContributorRow ({ contributor, spaceId }: { contributor: Contributor, spaceId: string }) {
  const role = contributor.spaceRoles.find(r => r.spaceId === spaceId);
  return (
    <StyledRow pb={2} mb={2}>
      <Box display='flex' alignItems='center'>
        <Avatar name={contributor.username} />
        <Box pl={2}>
          <Typography variant='body1'><strong>{contributor.username}</strong></Typography>
          <Typography color='secondary' variant='body2'>{contributor.address}</Typography>
        </Box>
      </Box>
      <Typography color='secondary' variant='body2' sx={{ px: 3 }}>
        {role?.type}
      </Typography>
    </StyledRow>
  )
}