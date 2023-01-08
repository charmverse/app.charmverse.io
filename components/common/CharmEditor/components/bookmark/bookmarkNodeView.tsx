import BookmarkIcon from '@mui/icons-material/Bookmark';
import { Box } from '@mui/material';

import fetch from 'adapters/http/fetch.server';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

type BookmarkViewerProps = {
  url: string;
  html: string;
};

export function Bookmark({
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
