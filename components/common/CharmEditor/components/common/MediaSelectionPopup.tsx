import type { NodeViewProps } from '@bangle.dev/core';
import { Box } from '@mui/material';

import PopperPopup from 'components/common/PopperPopup';

import type { EmptyContentProps } from './EmptyEmbed';
import { EmptyEmbed } from './EmptyEmbed';
import { selectorPopupSizeConfig } from './selectorPopupSizeConfig';

type InputProps = EmptyContentProps & {
  node: NodeViewProps['node'];
  children: React.ReactNode;
};

export function MediaSelectionPopup(props: InputProps) {
  const autoOpen = props.node.marks.some((mark) => mark.type.name === 'tooltip-marker');

  return (
    <PopperPopup paperSx={selectorPopupSizeConfig} autoOpen={autoOpen} popupContent={<Box>{props.children}</Box>}>
      <EmptyEmbed {...props} />
    </PopperPopup>
  );
}
