
import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import { stringToColor } from 'lib/strings';

const StyledAvatar = styled(Avatar)`
  font-size: 75px;
  font-weight: 500;
  width: 150px;
  height: 150px;
`;

export default function ({ name = '' }: { name: string }) {
  return (
    <StyledAvatar sx={{ bgcolor: stringToColor(name) }}>
      {name.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
