import { ReactNode } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar, { InitialAvatarProps } from './Avatar';

const StyledStack = styled(Stack)`
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1000;
  opacity: 80%;
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
};

export default function AvatarWithIcons (props: AvatarWithIconsProps) {
  const { icons } = props;

  return (
    <StyledBox>
      <StyledStack direction='row' spacing={2} p={0.5} className='icons-stack'>{ icons }</StyledStack>
      <Avatar {...props} />
    </StyledBox>
  );
}
