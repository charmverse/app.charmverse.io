import type { NodeViewProps } from '@bangle.dev/core';
import { Box, ListItem, Typography } from '@mui/material';

import PopperPopup from 'components/common/PopperPopup';

interface InputProps {
  node: NodeViewProps['node'];
  embedText: string;
  children: React.ReactNode;
  embedIcon: JSX.Element;
}

export function EmbeddedInputPopup(props: InputProps) {
  const autoOpen = props.node.marks.some((mark) => mark.type.name === 'tooltip-marker');
  return (
    <PopperPopup autoOpen={autoOpen} popupContent={<Box width={750}>{props.children}</Box>}>
      <ListItem
        button
        sx={{
          backgroundColor: 'background.light',
          p: 2,
          display: 'flex',
          borderRadius: 0.5,
          my: 0.5
        }}
      >
        <Typography color='secondary' display='flex' gap={1.5} width='100%' alignItems='center'>
          {props.embedIcon}
          <Typography>{props.embedText}</Typography>
        </Typography>
      </ListItem>
    </PopperPopup>
  );
}
