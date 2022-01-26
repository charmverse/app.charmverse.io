import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import { stringToColor } from 'lib/strings';

const StyledAvatar = styled(Avatar)`
  color: white;
  font-weight: 500;
`;

export default function ({ className, name = '', variant }: { className?: string, active?: boolean, name: string, variant?: 'circular' | 'rounded' | 'square' }) {
  return (
    <StyledAvatar className={className} sx={{ backgroundColor: stringToColor(name) }} variant={variant}>
      {name.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
