import { ReactNode } from 'react';
import Box from '@mui/material/Box';
import { Avatar, InitialAvatarProps } from '.';

export type AvatarWithIconsProps = InitialAvatarProps & {
    icons?: ReactNode;
};

export function AvatarWithIcons (props: AvatarWithIconsProps) {
  const { icons } = props;

  return (
    <Box>
      <Avatar {...props} />
      {icons}
    </Box>
  );
}
