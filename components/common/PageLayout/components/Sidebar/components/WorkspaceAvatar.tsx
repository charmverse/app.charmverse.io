import styled from '@emotion/styled';

import Avatar from 'components/common/Avatar';

const StyledAvatar = styled(Avatar)<{ active: boolean }>`
  border-radius: 8px;

  ${({ active, theme }) => active && `box-shadow: 0 0 0 3px ${theme.palette.sidebar.avatarHighlight};`}
`;

type WorkspaceAvatarProps = {
  active?: boolean;
  name: string;
  image: string | null;
};

export default function WorkspaceAvatar({ active = false, name = '', image = '' }: WorkspaceAvatarProps) {
  return <StyledAvatar active={active} avatar={image} name={name} variant='rounded' />;
}
