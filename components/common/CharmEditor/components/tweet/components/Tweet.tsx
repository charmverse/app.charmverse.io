import type { NodeViewProps } from '@bangle.dev/core';
import { useEffect, useRef } from 'react';

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

let twitterJsIsLoaded = false;

// embed Twitter
async function loadScript (scriptUrl: string) {
  if (twitterJsIsLoaded) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptUrl;
    document.head.appendChild(script);

    script.onload = function () {
      twitterJsIsLoaded = true;
      resolve(null);
    };
  });
}

function render (el: HTMLElement, tweetId: string) {
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
  // .then((element: any) => {
  //   setLoading(false);
  //   if (props.onLoad) {
  //     props.onLoad(element);
  //   }
  // });
}

export function TweetComponent ({ readOnly, node, updateAttrs }: NodeViewProps & { readOnly: boolean }) {

  const ref = useRef<HTMLDivElement | null>(null);
  const attrs = node.attrs as Partial<TweetNodeAttrs>;

  useEffect(() => {
    let isComponentMounted = true;
    if (!ref?.current || !attrs.id) {
      return;
    }
    loadScript(twitterWidgetJs).then(() => {
      if (ref?.current && isComponentMounted) {
        render(ref.current, node.attrs.id);
      }
    });

    return () => {
      isComponentMounted = false;
    };
  }, [ref, attrs.id]);

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

  return <div ref={ref} />;
}
