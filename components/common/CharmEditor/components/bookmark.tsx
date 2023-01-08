import type { BaseRawNodeSpec } from '@bangle.dev/core';
import type { DOMOutputSpec, Node } from '@bangle.dev/pm';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { Box } from '@mui/material';
import type { HTMLAttributes } from 'react';
import { memo, useMemo } from 'react';

import { MediaSelectionPopup } from './common/MediaSelectionPopup';
import { MediaUrlInput } from './common/MediaUrlInput';
import { extractAttrsFromUrl } from './nft/nftUtils';
import type { CharmNodeViewProps } from './nodeView/nodeView';

function EmptyBookmarkContainer({
  isSelected,
  node,
  deleteNode,
  updateAttrs
}: HTMLAttributes<HTMLDivElement> & {
  updateAttrs: CharmNodeViewProps['updateAttrs'];
  deleteNode: () => void;
  isSelected?: boolean;
  node: Node;
}) {
  return (
    <MediaSelectionPopup
      icon={<BookmarkIcon fontSize='small' />}
      isSelected={!!isSelected}
      buttonText='Add a bookmark'
      node={node}
      onDelete={deleteNode}
    >
      <Box py={3}>
        <MediaUrlInput
          onSubmit={(url) => {
            const _attrs = extractAttrsFromUrl(url);
            if (_attrs) {
              updateAttrs(_attrs);
            }
          }}
          placeholder='https://dune.com/skateordao/Gnars'
        />
      </Box>
    </MediaSelectionPopup>
  );
}

export function bookmarkSpec() {
  const spec: BaseRawNodeSpec = {
    name: 'bookmark',
    type: 'node',
    schema: {
      attrs: {
        src: {
          default: null
        },
        track: {
          default: []
        }
      },
      group: 'block',
      draggable: false,
      parseDOM: [{ tag: 'div.charm-bookmark' }],
      toDOM: (): DOMOutputSpec => {
        return ['div.charm-bookmark'];
      }
    },
    markdown: {
      toMarkdown: () => null
    }
  };
  return spec;
}

type BookmarkViewerProps = {
  url: string;
};

function Bookmark({
  readOnly = false,
  node,
  updateAttrs,
  selected,
  deleteNode
}: CharmNodeViewProps & { readOnly?: boolean }) {
  const url: string = useMemo(() => node.attrs.src, [node.attrs.src]);
  const autoOpen = node.marks.some((mark) => mark.type.name === 'tooltip-marker');

  if (!url) {
    if (readOnly) {
      return <div />;
    }
    return (
      <EmptyBookmarkContainer node={node} updateAttrs={updateAttrs} deleteNode={deleteNode} isSelected={selected} />
    );
  }

  return <div>Hello World</div>;
}

export default memo(Bookmark);
