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

import type { NodeAttrs } from './nftSpec';
import { extractAttrsFromUrl } from './nftUtils';

// OpenSea embed plugin: https://github.com/ProjectOpenSea/embeddable-nfts
export const widgetJS = 'https://unpkg.com/embeddable-nfts/dist/nft-card.min.js';

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

const StyledContainer = styled.div`
  nft-card > div,
  nft-card-front > div {
    background: transparent !important;
  }
`;

export function NFTNodeView({ deleteNode, readOnly, node, updateAttrs }: CharmNodeViewProps) {
  const attrs = node.attrs as Partial<NodeAttrs>;

  // If there are no source for the node, return the image select component
  if (!attrs.contract) {
    if (readOnly) {
      // hide the row completely
      return <div />;
    } else {
      return (
        <MediaSelectionPopup
          node={node}
          icon={<TwitterIcon fontSize='small' />}
          buttonText='Embed a Tweet'
          onDelete={deleteNode}
        >
          <Box py={3}>
            <MediaUrlInput
              helperText='Works with links to Tweets'
              isValid={(url) => extractAttrsFromUrl(url) !== null}
              onSubmit={(url) => {
                const _attrs = extractAttrsFromUrl(url);
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

  // override css to support dark mode
  function setCSSOverrides() {
    try {
      // main card
      adjustShadowRootStyles(['nft-card'], '.card { background: var(--background-paper); width: 100% !important; }');
      // card contents
      adjustShadowRootStyles(
        ['nft-card', 'nft-card-front'],
        '.card-front { background: var(--background-paper); } .asset-link { color: var(--primary-text); } info-button { display: none; } .asset-image-container { border-color: var(--bg-gray); }'
      );
      // status pill
      adjustShadowRootStyles(
        ['nft-card', 'nft-card-front', 'pill-element'],
        '.pill { border-color: var(--bg-gray) !important; }'
      );
    } catch (error) {
      // silently fail
    }
  }

  function initStyles() {
    setTimeout(setCSSOverrides, 20);
    setTimeout(setCSSOverrides, 100);
    setTimeout(setCSSOverrides, 500);
    setTimeout(setCSSOverrides, 1000);
  }

  return (
    <>
      <Script src={widgetJS} onReady={initStyles} />
      <BlockAligner onDelete={deleteNode}>
        <StyledContainer>
          {/* @ts-ignore nft-card element is from OpenSea */}
          <nft-card contractAddress={attrs.contract} tokenId={attrs.token}></nft-card>
        </StyledContainer>
      </BlockAligner>
    </>
  );
}

// main function - https://stackoverflow.com/questions/47625017/override-styles-in-a-shadow-root-element
function adjustShadowRootStyles(hostsSelectorList: readonly string[], styles: string): void {
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(styles);

  const shadowRoot = queryShadowRootDeep(hostsSelectorList);
  shadowRoot.adoptedStyleSheets = [...shadowRoot.adoptedStyleSheets, sheet];
}

// A helper function
function queryShadowRootDeep(hostsSelectorList: readonly string[]): ShadowRoot | never {
  let element: ShadowRoot | null | undefined;

  hostsSelectorList.forEach((selector: string) => {
    const root = element ?? document;
    element = root.querySelector(selector)?.shadowRoot;
    if (!element)
      throw new Error(
        `Cannot find a shadowRoot element with selector "${selector}". The selectors chain is: ${hostsSelectorList.join(
          ', '
        )}`
      );
  });

  if (!element) throw new Error(`Cannot find a shadowRoot of this chain: ${hostsSelectorList.join(', ')}`);
  return element;
}
