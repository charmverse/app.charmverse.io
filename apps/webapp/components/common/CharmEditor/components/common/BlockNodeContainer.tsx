import type { SxProps, Theme } from '@mui/material';
import { ListItemButton } from '@mui/material';

import BlockAligner from '../BlockAligner';

export type EmptyContentProps = {
  onDelete: () => void;
  isSelected: boolean;
  readOnly?: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  onDragStart?: () => void;
};

export function BlockNodeContainer({
  readOnly,
  onDelete,
  isSelected,
  children,
  sx = {},
  onDragStart
}: EmptyContentProps) {
  return (
    <BlockAligner readOnly={readOnly} onDelete={onDelete} onDragStart={onDragStart}>
      <ListItemButton
        sx={{
          backgroundColor: isSelected ? 'var(--charmeditor-active)' : 'background.light',
          p: 2,
          display: 'flex',
          borderRadius: 0.5,
          my: 0.5,
          ...sx
        }}
      >
        {children}
      </ListItemButton>
    </BlockAligner>
  );
}
