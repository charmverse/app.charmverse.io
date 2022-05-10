import { ReactNode } from 'react';
import styled from '@emotion/styled';
import { AvatarWithIcons } from 'components/common/Avatar';

const StyledAvatar = styled(AvatarWithIcons)`
  font-size: 90px;
  width: 150px;
  height: 150px;
  ${({ variant }) => variant === 'rounded' && 'border-radius: 25px'};
`;

type LargeAvatarProps = {
  name: string;
  variant?: 'circular' | 'rounded' | 'square';
  icons?: ReactNode;
};

export default function LargeAvatar (props: LargeAvatarProps) {
  const { name = '' } = props;

  return (
    <StyledAvatar {...props}>
      {name.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
