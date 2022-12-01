import type { NodeViewProps } from '@bangle.dev/core';
import { Box, ListItem, Typography } from '@mui/material';

import PopperPopup from 'components/common/PopperPopup';

interface InputProps {
  node: NodeViewProps['node'];
  buttonText: string;
  children: React.ReactNode;
  icon: JSX.Element;
}

export function MediaSelectionPopup(props: InputProps) {
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
          {props.icon}
          <Typography>{props.buttonText}</Typography>
        </Typography>
      </ListItem>
    </PopperPopup>
  );
}
