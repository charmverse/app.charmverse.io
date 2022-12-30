import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Box } from '@mui/material';
import Script from 'next/script';
import { useRef } from 'react';

import log from 'lib/log';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

import type { TweetNodeAttrs } from './tweetSpec';
import { extractTweetAttrs } from './tweetSpec';

export const twitterWidgetJs = 'https://platform.twitter.com/widgets.js';

type TweetOptions = {
  theme?: 'dark' | 'light';
};

declare global {
  interface Window {
    twttr: {
      widgets: {
        // @ref https://developer.twitter.com/en/docs/twitter-for-websites/embedded-tweets/guides/embedded-tweet-parameter-reference
        createTweet: (id: string, el: HTMLElement, options: TweetOptions) => void;
        // createTimeline - we might want this in the future?
      };
    };
  }
}

const StyledTweet = styled.div`
  // fix for twitter iframe which has color-scheme: auto, and otherwise makes the background white in dark mode
  // @ref: https://bugs.chromium.org/p/chromium/issues/detail?id=1150352
  iframe {
    color-scheme: light;
  }
  .twitter-tweet {
    margin: 0 !important;
  }
`;

// embed Twitter
function render(tweetId: string, el: HTMLElement, options: TweetOptions) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!window.twttr) {
    log.error('Failure to load window.twttr, aborting load');
    return;
  }
  if (!window.twttr.widgets.createTweet) {
    log.error('Method "createTweet" is not present anymore in twttr.widget api');
    return;
  }
  window.twttr.widgets.createTweet(tweetId, el, options);
}

export function TweetNodeView({ deleteNode, readOnly, node, selected, updateAttrs }: CharmNodeViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const attrs = node.attrs as Partial<TweetNodeAttrs>;

  function onLoadScript() {
    if (ref.current && attrs.id) {
      render(attrs.id, ref.current, { theme: theme.palette.mode });
    }
  }

  // If there are no source for the node, return the image select component
  if (!attrs.id) {
    if (readOnly) {
      // hide the row completely
      return <div />;
    } else {
      return (
        <MediaSelectionPopup
          node={node}
          icon={<TwitterIcon fontSize='small' />}
          isSelected={selected}
          buttonText='Embed a Tweet'
          onDelete={deleteNode}
        >
          <Box py={3}>
            <MediaUrlInput
              helperText='Works with links to Tweets'
              isValid={(url) => extractTweetAttrs(url) !== null}
              onSubmit={(url) => {
                const _attrs = extractTweetAttrs(url);
                if (_attrs) {
                  updateAttrs(_attrs);
                }
              }}
              placeholder='https://twitter.com...'
            />
          </Box>
        </MediaSelectionPopup>
      );
    }
  }

  return (
    <>
      <Script src={twitterWidgetJs} onReady={onLoadScript} />
      <BlockAligner onDelete={deleteNode}>
        <StyledTweet ref={ref} />
      </BlockAligner>
    </>
  );
}
