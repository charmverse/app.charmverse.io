import BookmarkIcon from '@mui/icons-material/Bookmark';
import { Box, Card, CardActionArea, Typography } from '@mui/material';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
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
  const { data, error, isLoading } = useSWRImmutable(url ? `iframely/${encodeURIComponent(url)}` : null, () =>
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

  const html = data?.html;

  if (html) {
    return (
      <Box my={2}>
        <BlockAligner onDelete={deleteNode}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </BlockAligner>
      </Box>
    );
  } else if (data?.meta) {
    const title = data.meta.title ?? new URL(data.meta.canonical).hostname;
    return (
      <Card variant='outlined'>
        <CardActionArea
          component={Link}
          color='inherit'
          sx={{ px: 2, py: 1.5 }}
          href={data.meta.canonical}
          target='_blank'
        >
          <Typography variant='body2' textOverflow='ellipsis' overflow='hidden' whiteSpace='nowrap'>
            <strong>{title}</strong>
          </Typography>
          <Typography color='secondary' variant='body2' lineHeight='1.3em !important'>
            {data.meta.description}
          </Typography>
          <Box display='flex' alignItems='center' gap={1} mt={1}>
            {data.links.icon?.[0] && <img src={data.links.icon[0].href} />}
            <Typography component='span' variant='body2' textOverflow='ellipsis' overflow='hidden' whiteSpace='nowrap'>
              {data.meta.canonical}
            </Typography>
          </Box>
        </CardActionArea>
      </Card>
    );
  }

  return null;
}
