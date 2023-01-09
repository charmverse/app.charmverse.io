import BookmarkIcon from '@mui/icons-material/Bookmark';
import { Box } from '@mui/material';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

import type { BookmarkNodeAttrs } from './bookmarkSpec';

export function BookmarkNodeView({
  readOnly = false,
  node,
  updateAttrs,
  selected,
  deleteNode
}: CharmNodeViewProps & { readOnly?: boolean }) {
  const { url } = node.attrs as BookmarkNodeAttrs;
  const { data, isLoading } = useSWRImmutable(url ? `iframely/${encodeURIComponent(url)}` : null, () =>
    charmClient.iframely.get(url)
  );

  async function updateNode(bookmarkUrl: string) {
    updateAttrs({
      url: bookmarkUrl
    });
  }

  if (isLoading) {
    return (
      <Box my={5}>
        <LoadingComponent isLoading />
      </Box>
    );
  }

  if (!url) {
    if (readOnly) {
      return <div />;
    }
    return (
      <Box my={2}>
        <MediaSelectionPopup
          icon={<BookmarkIcon fontSize='small' />}
          isSelected={selected}
          buttonText='Add a bookmark'
          node={node}
          onDelete={deleteNode}
        >
          <Box py={3}>
            <MediaUrlInput onSubmit={updateNode} placeholder='https://...' />
          </Box>
        </MediaSelectionPopup>
      </Box>
    );
  }

  if (data?.html) {
    return (
      <Box my={2}>
        <BlockAligner onDelete={deleteNode}>
          <div dangerouslySetInnerHTML={{ __html: data.html }} />
        </BlockAligner>
      </Box>
    );
  }

  return null;
}
