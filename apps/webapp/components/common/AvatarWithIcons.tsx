import { styled } from '@mui/material';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { ReactNode } from 'react';

import type { InitialAvatarProps } from './Avatar';
import Avatar from './Avatar';

const StyledStack = styled(Stack)`
  position: absolute;
  top: 0;
  right: 0;
  z-index: var(--z-index-tooltip);
  display: none;

  & > svg {
    color: white;
    cursor: pointer;
  }
`;

const StyledBox = styled(Box)`
  position: relative;

  &:hover .icons-stack {
    display: flex;
  }
`;

export type AvatarWithIconsProps = InitialAvatarProps & {
  icons: ReactNode;
  alwaysShow?: boolean;
};

export default function AvatarWithIcons(props: AvatarWithIconsProps) {
  const { icons } = props;

  return (
    <StyledBox>
      <StyledStack
        direction='row'
        spacing={1}
        padding={1}
        className='icons-stack'
        style={{ display: props.alwaysShow ? 'flex' : undefined }}
      >
        {icons}
      </StyledStack>
      <Avatar {...props} />
    </StyledBox>
  );
}
