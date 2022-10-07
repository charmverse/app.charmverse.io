import styled from '@emotion/styled';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { memo } from 'react';

import Legend from 'components/settings/Legend';

const StyledList = styled(List)`
  list-style-type: disc;
  padding-inline-start: 40px;
`;

const StyledListItemText = styled(ListItemText)`
  display: list-item;
`;

function InviteIntro () {
  return (
    <Legend noBorder variant='inherit' variantMapping={{ inherit: 'div' }} whiteSpace='normal'>
      <Typography variant='h2' fontSize='inherit' fontWeight={700} marginBottom='24px'>Invite Members to this Workspace</Typography>
      <Typography variant='body1' gutterBottom>
        There are 2 ways admins can invite users to this Workspace:
      </Typography>
      <StyledList>
        <StyledListItemText>Private Invite Links: Anyone with this link can join your workspace.</StyledListItemText>
        <StyledListItemText>Token Gates: Control access to your workspace automatically with tokens/NFTs.</StyledListItemText>
      </StyledList>
    </Legend>
  );
}

export default memo(InviteIntro);
