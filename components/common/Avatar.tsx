import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import type { SxProps } from '@mui/system';
import React from 'react';

import { stringToColor } from 'lib/utilities/strings';

export type AvatarSize = 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge' | '2xLarge';
export type AvatarVariant = 'circular' | 'rounded' | 'square';

const sizeStyleMap: Record<AvatarSize, React.CSSProperties> = {
  '2xLarge': {
    height: 150,
    width: 150,
    fontSize: '5.625rem'
  },
  xLarge: {
    height: 96,
    width: 96,
    fontSize: '1.5rem'
  },
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
  },
  xSmall: {
    height: 20,
    width: 20,
    fontSize: '.9rem !important'
  }
};

const sizeVariantStyleMap: Partial<Record<AvatarSize, Record<AvatarVariant, React.CSSProperties | null>>> = {
  '2xLarge': {
    rounded: { borderRadius: '1.625rem' },
    circular: null,
    square: null
  },
  xLarge: {
    rounded: { borderRadius: '0.825rem' },
    circular: null,
    square: null
  }
};

function getAvatarCustomStyles (variant: AvatarVariant | undefined, size: AvatarSize) {
  const sizeStyles = sizeStyleMap[size];
  const variantStyles = (variant && sizeVariantStyleMap[size]?.[variant]) || {};

  return { ...sizeStyles, ...variantStyles };
}

const StyledAvatar = styled(Avatar)`
  color: white !important; // override CSS from Chip avatar
  font-weight: 500;
`;

export const HexagonAvatar = styled(StyledAvatar)`
  clip-path: url(#hexagon-avatar);
  overflow: hidden;
`;

export type InitialAvatarProps = {
  avatar: string | null | undefined;
  className?: string;
  name?: string;
  variant?: AvatarVariant;
  size?: AvatarSize;
  isNft?: boolean;
  sx?: SxProps;
};

export default function InitialAvatar ({ avatar, className, name, variant, size = 'medium', isNft, sx = {} }: InitialAvatarProps) {
  const nameStr = (name || '').replace('0x', ''); // ignore the universal prefix of addresses
  const muiVariant = isNft ? 'square' : variant;
  const AvatarComponent = isNft ? HexagonAvatar : StyledAvatar;

  return (
    <AvatarComponent
      className={className}
      sx={{ backgroundColor: avatar ? 'initial' : stringToColor(nameStr), ...getAvatarCustomStyles(variant, size), ...sx }}
      variant={muiVariant}
      src={avatar ?? undefined}
    >
      {nameStr.charAt(0).toUpperCase()}
    </AvatarComponent>
  );
}
