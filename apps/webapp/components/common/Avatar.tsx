import styled from '@emotion/styled';
import type { SxProps, Theme } from '@mui/material';
import MuiAvatar from '@mui/material/Avatar';
import { stringToColor } from '@packages/utils/strings';
import { replaceS3Domain } from '@packages/utils/url';
import React from 'react';

export type AvatarSize = 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge' | '2xLarge' | '3xLarge';
export type AvatarVariant = 'circular' | 'rounded' | 'square';

const sizeStyleMap: Record<AvatarSize, SxProps<Theme>> = {
  '3xLarge': {
    height: {
      xs: '300px',
      sm: '500px'
    },
    width: {
      xs: '300px',
      sm: '500px'
    },
    fontSize: '10rem'
  },
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

const sizeVariantStyleMap: Partial<Record<AvatarSize, Record<AvatarVariant, SxProps<Theme>>>> = {
  '3xLarge': {
    rounded: { borderRadius: '1.625rem' },
    circular: null,
    square: null
  },
  '2xLarge': {
    rounded: { borderRadius: '1.625rem' },
    circular: null,
    square: null
  },
  xLarge: {
    rounded: { borderRadius: '0.825rem' },
    circular: null,
    square: null
  },
  medium: {
    rounded: { borderRadius: '8px' },
    circular: null,
    square: null
  },
  small: {
    rounded: { borderRadius: '4px' },
    circular: null,
    square: null
  },
  xSmall: {
    rounded: { borderRadius: '4px' },
    circular: null,
    square: null
  }
};

function getAvatarCustomStyles(variant: AvatarVariant | undefined, size: AvatarSize) {
  const sizeStyles = sizeStyleMap[size];
  const variantStyles = (variant && sizeVariantStyleMap[size]?.[variant]) || {};

  return { ...sizeStyles, ...variantStyles };
}

const StyledAvatar = styled(MuiAvatar)`
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
  sx?: SxProps<Theme>;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  children?: React.ReactNode;
};

export default function InitialAvatar({
  avatar,
  className,
  name,
  variant,
  size = 'medium',
  isNft,
  onMouseEnter,
  sx = {},
  children
}: InitialAvatarProps) {
  const nameStr = (name || '').replace('0x', ''); // ignore the universal prefix of addresses
  const muiVariant = isNft ? 'square' : variant;
  const AvatarComponent = isNft ? HexagonAvatar : StyledAvatar;

  return (
    <AvatarComponent
      onMouseEnter={onMouseEnter}
      className={className}
      sx={{
        backgroundColor: avatar ? 'initial' : stringToColor(nameStr),
        ...getAvatarCustomStyles(variant, size),
        ...sx
      }}
      variant={muiVariant}
      src={replaceS3Domain(avatar ?? undefined)}
      imgProps={{ referrerPolicy: 'no-referrer' }}
      alt={name}
    >
      {children || nameStr.charAt(0).toUpperCase()}
    </AvatarComponent>
  );
}

export const Avatar = InitialAvatar;
