
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Avatar from 'components/common/Avatar';
import { Contributor } from 'models';
import getDisplayName from 'lib/users/getDisplayName';
import useENSName from 'hooks/useENSName';

const StyledRow = styled(Box)`
  border-bottom: 1px solid #ddd;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

type Props = { contributor: Contributor };

export default function ContributorRow ({ contributor }: Props) {
  const ensName = useENSName(contributor.addresses[0]);
  return (
    <StyledRow pb={2} mb={2}>
      <Box display='flex' alignItems='center'>
        <Avatar name={ensName || getDisplayName(contributor)} />
        <Box pl={2}>
          <Typography variant='body1'><strong>{ensName || getDisplayName(contributor)}</strong></Typography>
          {ensName && <Typography variant='body2'>{getDisplayName(contributor)}</Typography>}
        </Box>
      </Box>
      <Typography color='secondary' variant='body2' sx={{ px: 3 }}>
        {contributor.role}
      </Typography>
    </StyledRow>
  );
}
