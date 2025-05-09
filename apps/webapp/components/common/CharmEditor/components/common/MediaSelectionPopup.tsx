import { Box } from '@mui/material';

import type { NodeViewProps } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
import PopperPopup from 'components/common/PopperPopup';

import type { EmptyContentProps } from './EmptyEmbed';
import { EmptyEmbed } from './EmptyEmbed';
import { width } from './selectorPopupSizeConfig';

type InputProps = EmptyContentProps & {
  children: React.ReactNode;
  width?: any;
};

export function MediaSelectionPopup({ children, ...restProps }: InputProps & { node: NodeViewProps['node'] }) {
  const autoOpen = restProps.node.marks.some((mark) => mark.type.name === 'tooltip-marker');
  const sxWidth = restProps.width ?? width;

  return (
    <PopperPopup paperSx={{ width: sxWidth }} autoOpen={autoOpen} popupContent={<Box>{children}</Box>}>
      <EmptyEmbed {...restProps} />
    </PopperPopup>
  );
}

export function MediaSelectionPopupNoButton(props: InputProps & { open: boolean; onClose: VoidFunction }) {
  const sxWidth = props.width ?? width;

  return (
    <PopperPopup
      paperSx={{ width: sxWidth }}
      onClose={props.onClose}
      open={props.open}
      popupContent={<Box>{props.children}</Box>}
    />
  );
}
