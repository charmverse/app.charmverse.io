import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import { stringToColor } from 'lib/strings';
import { lightGreyColor } from 'theme/colors';

const StyledAvatar = styled(Avatar)`
  font-weight: 500;
  ${({ variant }) => variant === 'rounded' && `border-radius: 8px; border: 2px solid ${lightGreyColor};`}
  ${({ variant }) => variant === 'rounded' && `
    &:hover {
      box-shadow: 0 0 0 3px #ccc;
    }
  `}
`;


export default function ({ name = '', variant }: { name: string, variant?: 'circular' | 'rounded' | 'square' }) {
  return (
    <StyledAvatar sx={{ bgcolor: stringToColor(name) }} variant={variant}>
      {name.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
