import { ListItem } from '@mui/material';

import BlockAligner from '../BlockAligner';

export type EmptyContentProps = {
  onDelete: () => void;
  isSelected: boolean;
  readOnly?: boolean;
  children: React.ReactNode;
};

export function BlockNodeContainer({ readOnly, onDelete, isSelected, children }: EmptyContentProps) {
  return (
    <BlockAligner readOnly={readOnly} onDelete={onDelete}>
      <ListItem
        button
        sx={{
          backgroundColor: isSelected ? 'var(--charmeditor-active)' : 'background.light',
          p: 2,
          display: 'flex',
          borderRadius: 0.5,
          my: 0.5
        }}
      >
        {children}
      </ListItem>
    </BlockAligner>
  );
}
