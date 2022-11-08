import type { NodeViewProps } from '@bangle.dev/core';
import Script from 'next/script';
import { useRef } from 'react';

import log from 'lib/log';

import type { TweetNodeAttrs } from '../tweet';
import { extractTweetId } from '../tweet';
import { twitterWidgetJs } from '../twitterJSUrl';

import { TweetInput } from './TweetInput';

declare global {
  interface Window {
    twttr: {
      widgets: {
        createTweet: (id: string, el: HTMLElement, options: { conversation?: 'none' | 'all' }) => void;
        // createTimeline - we might want this in the future?
      };
    };
  }
}

// embed Twitter
function render (el: HTMLElement, tweetId: string) {
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
  window.twttr.widgets.createTweet(tweetId, el, {});
}

export function TweetComponent ({ readOnly, node, updateAttrs }: NodeViewProps & { readOnly: boolean }) {

  const ref = useRef<HTMLDivElement | null>(null);
  const attrs = node.attrs as Partial<TweetNodeAttrs>;

  function onLoadScript () {
    if (ref.current && attrs.id) {
      render(ref.current, attrs.id);
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
          isValid={(url) => extractTweetId(url) !== null}
          onSubmit={(urlInput) => {
            const props = extractTweetId(urlInput);
            if (props) {
              updateAttrs(props);
            }
          }}
        />
      );
    }
  }

  return (
    <>
      <Script src={twitterWidgetJs} onReady={onLoadScript} />
      <div ref={ref} />
    </>
  );
}
