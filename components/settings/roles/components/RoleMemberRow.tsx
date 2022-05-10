import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ElementDeleteIcon from 'components/common/form/ElementDeleteIcon';
import { Avatar } from 'components/common/Avatar';
import { User } from 'models';
import getDisplayName from 'lib/users/getDisplayName';
import useENSName from 'hooks/useENSName';

export const StyledRow = styled(Box)`
  border-bottom: 1px solid ${({ theme }) => theme.palette.divider};
  display: flex;
  align-items: center;
  justify-content: space-between;
  .row-actions {
    opacity: 0;
  }
  &:hover {
    .row-actions {
      opacity: 1;
    }
  }
`;

interface Props {
  contributor: User;
  isEditable: boolean;
  onRemove: (id: string) => void;
}

export default function ContributorRow ({ contributor, isEditable, onRemove }: Props) {
  const ensName = useENSName(contributor.addresses[0]);

  function removeMember () {
    onRemove(contributor.id);
  }

  return (
    <StyledRow py={2}>
      <Box display='flex' alignItems='center'>
        <Avatar name={ensName || getDisplayName(contributor)} avatar={contributor?.avatar} size='small' />
        <Box pl={2}>
          <Typography variant='body1'>{ensName || getDisplayName(contributor)}</Typography>
        </Box>
      </Box>
      {isEditable && <ElementDeleteIcon onClick={removeMember} tooltip='Remove member' />}
    </StyledRow>
  );
}
