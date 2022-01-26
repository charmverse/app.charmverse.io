
import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import { stringToColor } from 'lib/strings';

const StyledAvatar = styled(Avatar)`
  font-size: 75px;
  font-weight: 500;
  width: 150px;
  height: 150px;
  ${({ variant }) => variant === 'rounded' && 'border-radius: 25px'};
`;

export default function ({ name = '', variant }: { name: string, variant?: 'circular' | 'rounded' | 'square' }) {
  return (
    <StyledAvatar sx={{ bgcolor: stringToColor(name) }} variant={variant}>
      {name.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
