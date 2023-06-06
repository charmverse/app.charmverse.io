import type { ProposalCategory } from '@charmverse/core/prisma-client';
import Chip from '@mui/material/Chip';

import type { BrandColor } from 'theme/colors';
import { brandColorNames } from 'theme/colors';

export function ProposalCategoryChip({
  color,
  title,
  size
}: Pick<ProposalCategory, 'color' | 'title'> & { size?: 'small' | 'medium' }) {
  return (
    <Chip
      sx={{ cursor: 'pointer', minWidth: '100px' }}
      // This will stop a proposal page with chip blowing up if for some reason, the color is not a brand color
      color={brandColorNames.includes(color as BrandColor) ? (color as BrandColor) : undefined}
      label={title}
      size={size}
    />
  );
}
