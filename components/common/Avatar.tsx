import styled from '@emotion/styled';
import Avatar from '@mui/material/Avatar';
import { stringToColor } from 'lib/utilities/strings';
import React from 'react';

const SizeStyleMap: Record<'small' | 'medium', React.CSSProperties> = {
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

export default function InitialAvatar ({ className, name, variant, size = 'medium' }: { className?: string, name?: string | null, variant?: 'circular' | 'rounded' | 'square', size?: 'small' | 'medium' }) {
  const nameStr = (name || '').replace('0x', ''); // ignore the universal prefix of addresses
  return (
    <StyledAvatar
      className={className}
      sx={{ backgroundColor: stringToColor(nameStr), ...SizeStyleMap[size] }}
      variant={variant}
    >
      {nameStr.charAt(0).toUpperCase()}
    </StyledAvatar>
  );
}
