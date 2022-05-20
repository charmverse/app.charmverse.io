import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import { stringToColor } from 'lib/utilities/strings';
import React from 'react';

const SizeStyleMap: Record<'small' | 'medium' | 'large', React.CSSProperties> = {
  large: {
    height: 54,
    width: 54,
    fontSize: '1.5rem'
  },
  medium: {
    height: 40,
    width: 40,
    fontSize: '1.25rem'
  },
  small: {
    height: 24,
    width: 24,
    fontSize: '1rem !important'
  }
};

const StyledAvatar = styled(Avatar)`
  color: white !important; // override CSS from Chip avatar
  font-weight: 500;
`;

export type InitialAvatarProps = {
  avatar: string | null | undefined;
  className?: string;
  name?: string;
  variant?: 'circular' | 'rounded' | 'square';
  size?: 'small' | 'medium' | 'large';
};

export default function InitialAvatar ({ avatar, className, name, variant, size = 'medium' }: InitialAvatarProps) {
  const nameStr = (name || '').replace('0x', ''); // ignore the universal prefix of addresses
  return (
    <StyledAvatar
      className={className}
      sx={{ backgroundColor: avatar ? 'initial' : stringToColor(nameStr), ...SizeStyleMap[size] }}
      variant={variant}
      src={avatar ?? undefined}
    >
      {nameStr.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
