import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import { stringToColor } from 'lib/strings';

const StyledAvatar = styled(Avatar)`
  font-weight: 500;
`;

export default function ({ name = '', variant }: { active?: boolean, name: string, variant?: 'circular' | 'rounded' | 'square' }) {
  return (
    <StyledAvatar sx={{ bgcolor: stringToColor(name) }} variant={variant}>
      {name.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
