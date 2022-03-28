
import styled from '@emotion/styled';
import Avatar from 'components/common/Avatar';

const StyledAvatar = styled(Avatar)`
  font-size: 90px;
  width: 150px;
  height: 150px;
  ${({ variant }) => variant === 'rounded' && 'border-radius: 25px'};
`;

export default function LargeAvatar ({ name = '', variant }: { name: string, variant?: 'circular' | 'rounded' | 'square' }) {
  return (
    <StyledAvatar name={name} variant={variant}>
      {name.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
