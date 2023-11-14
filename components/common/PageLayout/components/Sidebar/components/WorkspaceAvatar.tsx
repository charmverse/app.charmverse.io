import styled from '@emotion/styled';
import type { SxProps, Theme } from '@mui/material/styles';

import type { AvatarSize } from 'components/common/Avatar';
import Avatar from 'components/common/Avatar';

const StyledAvatar = styled(Avatar)<{ active: boolean }>`
  ${({ active, theme }) => active && `box-shadow: 0 0 0 3px ${theme.palette.sidebar.avatarHighlight};`}
`;

type WorkspaceAvatarProps = {
  active?: boolean;
  name: string;
  image: string | null;
  size?: AvatarSize;
  sx?: SxProps<Theme>;
};

export default function WorkspaceAvatar({
  active = false,
  name = '',
  image = '',
  size = 'medium',
  sx = {}
}: WorkspaceAvatarProps) {
  return <StyledAvatar active={active} avatar={image} name={name} size={size} variant='rounded' sx={sx} />;
}
