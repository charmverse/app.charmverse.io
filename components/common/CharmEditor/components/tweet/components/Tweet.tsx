import type { NodeViewProps } from '@bangle.dev/core';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import Script from 'next/script';
import { useRef } from 'react';

import log from 'lib/log';

import type { TweetNodeAttrs } from '../tweet';
import { extractTweetAttrs } from '../tweet';
import { twitterWidgetJs } from '../twitterJSUrl';

import { TweetInput } from './TweetInput';

type TweetOptions = {
  theme?: 'dark' | 'light';
}

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
`;

// embed Twitter
function render (tweetId: string, el: HTMLElement, options: TweetOptions) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!window.twttr) {
    log.error('Failure to load window.twttr, aborting load');
    return;
  }
  if (!window.twttr.widgets.createTweet) {
    log.error(
      'Method "createTweet" is not present anymore in twttr.widget api'
    );
    return;
  }
  window.twttr.widgets.createTweet(tweetId, el, options);
}

export function TweetComponent ({ readOnly, node, updateAttrs }: NodeViewProps & { readOnly: boolean }) {

  const ref = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const attrs = node.attrs as Partial<TweetNodeAttrs>;
  const autoOpen = node.marks.some(mark => mark.type.name === 'tooltip-marker');

  function onLoadScript () {
    if (ref.current && attrs.id) {
      render(attrs.id, ref.current, { theme: theme.palette.mode });
    }
  }

  // If there are no source for the node, return the image select component
  if (!attrs.id) {
    if (readOnly) {
      // hide the row completely
      return <div />;
    }
    else {
      return (
        <TweetInput
          autoOpen={autoOpen}
          isValid={(url) => extractTweetAttrs(url) !== null}
          onSubmit={(urlInput) => {
            const _attrs = extractTweetAttrs(urlInput);
            if (_attrs) {
              updateAttrs(_attrs);
            }
          }}
        />
      );
    }
  }

  return (
    <>
      <Script src={twitterWidgetJs} onReady={onLoadScript} />
      <StyledTweet ref={ref} />
    </>
  );
}
