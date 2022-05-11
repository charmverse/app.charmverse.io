import { ReactNode } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { Avatar, InitialAvatarProps } from '.';

const StyledStack = styled(Stack)`
    position: absolute;
    top: 10px;
    right: 20px;
    z-index: 1000;
    background-color: black;
    opacity: 80%;
    border-radius: 10%;

    & > svg {
      color: white;
      cursor: pointer;
    }
`;

const StyledBox = styled(Box)`
    display: inline-block;
    position: relative;
`;

export type AvatarWithIconsProps = InitialAvatarProps & {
    icons?: ReactNode;
    isHovered: boolean;
};

export function AvatarWithIcons (props: AvatarWithIconsProps) {
  const { icons, isHovered } = props;

  return (
    <StyledBox>
      { isHovered && <StyledStack direction='row' spacing={2} p={0.5}>{ icons }</StyledStack> }
      <Avatar {...props} />
    </StyledBox>
  );
}
