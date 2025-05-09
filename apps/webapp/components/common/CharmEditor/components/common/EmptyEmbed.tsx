import { Typography } from '@mui/material';

import { BlockNodeContainer } from './BlockNodeContainer';

export type EmptyContentProps = {
  onDelete: () => void;
  isSelected: boolean;
  buttonText: string;
  icon: JSX.Element;
  readOnly?: boolean;
};

export function EmptyEmbed({ buttonText, icon, ...containerProps }: EmptyContentProps) {
  return (
    <BlockNodeContainer {...containerProps}>
      <Typography color='secondary' display='flex' gap={1.5} width='100%' alignItems='center'>
        {icon}
        <span>{buttonText}</span>
      </Typography>
    </BlockNodeContainer>
  );
}
