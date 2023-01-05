import { ListItem, Typography } from '@mui/material';

import BlockAligner from '../BlockAligner';

export type EmptyContentProps = {
  onDelete: () => void;
  isSelected: boolean;
  buttonText: string;
  icon: JSX.Element;
};

export function EmptyEmbed(props: EmptyContentProps) {
  return (
    <BlockAligner onDelete={props.onDelete}>
      <ListItem
        button
        sx={{
          backgroundColor: props.isSelected ? 'var(--charmeditor-active)' : 'background.light',
          p: 2,
          display: 'flex',
          borderRadius: 0.5,
          my: 0.5
        }}
      >
        <Typography color='secondary' display='flex' gap={1.5} width='100%' alignItems='center'>
          {props.icon}
          <span>{props.buttonText}</span>
        </Typography>
      </ListItem>
    </BlockAligner>
  );
}
