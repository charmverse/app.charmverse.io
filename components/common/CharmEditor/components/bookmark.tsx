import type { BaseRawNodeSpec } from '@bangle.dev/core';
import type { DOMOutputSpec, Node } from '@bangle.dev/pm';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { Box } from '@mui/material';
import { memo } from 'react';

import fetch from 'adapters/http/fetch.server';

import BlockAligner from './BlockAligner';
import { MediaSelectionPopup } from './common/MediaSelectionPopup';
import { MediaUrlInput } from './common/MediaUrlInput';
import type { CharmNodeViewProps } from './nodeView/nodeView';

export function bookmarkSpec() {
  const spec: BaseRawNodeSpec = {
    name: 'bookmark',
    type: 'node',
    schema: {
      attrs: {
        url: {
          default: null
        },
        html: {
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
  html: string;
};

function Bookmark({
  readOnly = false,
  node,
  updateAttrs,
  selected,
  deleteNode
}: CharmNodeViewProps & { readOnly?: boolean }) {
  const { url, html } = node.attrs as BookmarkViewerProps;

  async function updateNode(bookmarkUrl: string) {
    try {
      const iframelyResponse = await fetch<{ html: string; error?: string }>(
        `https://cdn.iframe.ly/api/iframely?url=${encodeURIComponent(bookmarkUrl)}&key=${
          process.env.NEXT_PUBLIC_IFRAMELY_API_KEY
        }&iframe=1&omit_script=1&media=0`
      );
      if (iframelyResponse.html) {
        updateAttrs({
          url: bookmarkUrl,
          html: iframelyResponse.html
        });
      }
    } catch (err) {
      //
    }
  }

  if (!url || !html) {
    if (readOnly) {
      return <div />;
    }
    return (
      <MediaSelectionPopup
        icon={<BookmarkIcon fontSize='small' />}
        isSelected={selected}
        buttonText='Add a bookmark'
        node={node}
        onDelete={deleteNode}
      >
        <Box py={3}>
          <MediaUrlInput onSubmit={updateNode} placeholder='https://dune.com/skateordao/Gnars' />
        </Box>
      </MediaSelectionPopup>
    );
  }
  return (
    <BlockAligner onDelete={deleteNode}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </BlockAligner>
  );
}

export default memo(Bookmark);
