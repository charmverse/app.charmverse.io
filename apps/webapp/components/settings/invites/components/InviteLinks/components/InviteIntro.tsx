import styled from '@emotion/styled';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { memo } from 'react';

import Legend from 'components/settings/components/Legend';

const StyledList = styled(List)`
  list-style-type: disc;
  padding-inline-start: 40px;
`;

const StyledListItemText = styled(ListItemText)`
  display: list-item;
`;

function InviteIntro() {
  return (
    <>
      <Legend variantMapping={{ inherit: 'div' }} whiteSpace='normal'>
        Invite Members to this Space
      </Legend>
      <Typography variant='body1' gutterBottom>
        There are 2 ways admins can invite users to this Space:
      </Typography>
      <StyledList>
        <StyledListItemText>Private Invite Links: Anyone with this link can join your space.</StyledListItemText>
        <StyledListItemText>
          Token Gated Link: Control access to your space automatically with tokens/NFTs.
        </StyledListItemText>
      </StyledList>
    </>
  );
}

export default memo(InviteIntro);
