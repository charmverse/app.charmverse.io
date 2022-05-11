import styled from '@emotion/styled';
import { Avatar } from 'components/common/Avatar';

const StyledAvatar = styled(Avatar)<{ active: boolean }>`
  border-radius: 8px;
  border: 2px solid ${({ theme }) => theme.palette.sidebar.background};
  &:hover {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.palette.sidebar.avatarHighlight};
  }
  ${({ active, theme }) => active && `box-shadow: 0 0 0 3px ${theme.palette.sidebar.avatarHighlight};`}
`;

type WorkspaceAvatarProps = {
  active?: boolean;
  name: string;
  spaceImage?: string;
};

export default function WorkspaceAvatar ({ active = false, name = '', spaceImage }: WorkspaceAvatarProps) {
  return (
    <StyledAvatar active={active} avatar={spaceImage} name={name} variant='rounded' />
  );
}
