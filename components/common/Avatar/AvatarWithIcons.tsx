import { ReactNode } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import { Avatar, InitialAvatarProps } from '.';

const StyledBox = styled(Box)`
    display: inline-block;
    position: relative;
`;

export type AvatarWithIconsProps = InitialAvatarProps & {
    icons?: ReactNode;
};

export function AvatarWithIcons (props: AvatarWithIconsProps) {
  const { icons } = props;

  return (
    <StyledBox>
      <Avatar {...props} />
      { icons }
    </StyledBox>
  );
}
