import type { AvatarProps, SxProps, Theme } from '@mui/material';
import MuiAvatar from '@mui/material/Avatar';
import { stringToColor } from '@root/lib/utils/strings';
import { replaceS3Domain } from '@root/lib/utils/url';
import React from 'react';

export type AvatarSize = 'xSmall' | 'small' | 'medium' | 'large' | 'xLarge' | '2xLarge' | '3xLarge';
export type AvatarVariant = AvatarProps['variant'];

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

const sizeVariantStyleMap: Partial<Record<AvatarSize, Record<NonNullable<AvatarVariant>, SxProps<Theme>>>> = {
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

function getAvatarCustomStyles(variant: AvatarVariant, size: AvatarSize) {
  const sizeStyles = sizeStyleMap[size];
  const variantStyles = (variant && sizeVariantStyleMap[size]?.[variant]) || {};

  return { ...sizeStyles, ...variantStyles };
}

type InitialAvatarProps = Omit<AvatarProps, 'src'> & {
  name?: string;
  src?: string | null;
  size?: AvatarSize;
};

export function Avatar({ name, variant, src, size = 'medium', sx = {}, children, ...restProps }: InitialAvatarProps) {
  const nameStr = (name || '').replace('0x', ''); // ignore the universal prefix of addresses

  return (
    <MuiAvatar
      sx={{
        backgroundColor: stringToColor(nameStr),
        ...getAvatarCustomStyles(variant, size),
        ...sx
      }}
      variant={variant}
      slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
      {...restProps}
      src={replaceS3Domain(src ?? undefined)}
    >
      {children || nameStr.charAt(0).toUpperCase()}
    </MuiAvatar>
  );
}
