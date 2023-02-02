import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { Box, Card, CardActionArea, Typography } from '@mui/material';
import Script from 'next/script';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Image from 'components/common/Image';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

import type { BookmarkNodeAttrs } from './bookmarkSpec';

const iframelyWidgetJs = 'https://cdn.iframe.ly/embed.js';

const PreviewImage = styled.img`
  object-fit: cover;
  width: 100%;
`;

declare global {
  interface Window {
    iframely: {
      load: VoidFunction;
    };
  }
}

export function BookmarkNodeView({
  readOnly = false,
  node,
  updateAttrs,
  selected,
  deleteNode
}: CharmNodeViewProps & { readOnly?: boolean }) {
  const { url } = node.attrs as BookmarkNodeAttrs;

  const theme = useTheme();

  const { data, error, isLoading } = useSWRImmutable(
    url ? `iframely/${encodeURIComponent(url)}?theme=${theme.palette.mode}` : null,
    () => charmClient.iframely.get(url, theme.palette.mode)
  );

  async function updateNode(bookmarkUrl: string) {
    updateAttrs({
      url: bookmarkUrl
    });
  }

  function onLoadScript() {
    if (typeof window === 'undefined') {
      return;
    }

    if (window.iframely) {
      window.iframely.load();
    }
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
        <Script src={iframelyWidgetJs} onReady={onLoadScript} />
        <BlockAligner onDelete={deleteNode}>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </BlockAligner>
      </Box>
    );
  } else if (data?.meta) {
    const title = data.meta.title ?? new URL(data.meta.canonical).hostname;

    return (
      <BlockAligner onDelete={deleteNode}>
        <Card variant='outlined'>
          <CardActionArea
            component={Link}
            color='inherit'
            sx={{ p: 0, m: 0 }}
            href={data.meta.canonical}
            target='_blank'
          >
            <Typography color='secondary' variant='body2' lineHeight='1.3em !important'>
              {data.meta.description}
            </Typography>
            <Box display='flex' alignItems='center' gap={2}>
              <Box display='flex' maxWidth='160px' maxHeight='140px' overflow='hidden'>
                {data.links.icon?.[0] && <PreviewImage src={data.links.icon[0].href} />}
              </Box>
              <Box display='flex' flexDirection='column' alignSelf='flex-start' gap={2} py={2}>
                <Typography
                  component='span'
                  textOverflow='ellipsis'
                  overflow='hidden'
                  whiteSpace='nowrap'
                  textAlign='left'
                  fontWeight='bold'
                >
                  {title}
                </Typography>
                <Typography
                  component='span'
                  variant='body2'
                  textOverflow='ellipsis'
                  overflow='hidden'
                  whiteSpace='nowrap'
                >
                  {data.meta.canonical}
                </Typography>
              </Box>
            </Box>
          </CardActionArea>
        </Card>
      </BlockAligner>
    );
  }

  return null;
}
