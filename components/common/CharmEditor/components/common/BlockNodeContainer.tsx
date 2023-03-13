import type { SxProps, Theme } from '@mui/material';
import { ListItem } from '@mui/material';

import BlockAligner from '../BlockAligner';

export type EmptyContentProps = {
  onDelete: () => void;
  isSelected: boolean;
  readOnly?: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
};

export function BlockNodeContainer({ readOnly, onDelete, isSelected, children, sx = {} }: EmptyContentProps) {
  return (
    <BlockAligner readOnly={readOnly} onDelete={onDelete}>
      <ListItem
        button
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
      </ListItem>
    </BlockAligner>
  );
}
