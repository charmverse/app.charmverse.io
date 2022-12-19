import styled from '@emotion/styled';
import { Box } from '@mui/material';
import Script from 'next/script';
import { useEffect, useRef } from 'react';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import { EmbedIcon } from '../iframe/components/EmbedIcon';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

import { OpenSeaIcon } from './config';
import type { NodeAttrs } from './nftSpec';
import { extractAttrsFromUrl } from './nftUtils';
import { setCSSOverrides } from './styles';

// OpenSea embed plugin: https://github.com/ProjectOpenSea/embeddable-nfts
export const widgetJS = 'https://unpkg.com/embeddable-nfts/dist/nft-card.min.js';

const StyledContainer = styled.div`
  nft-card > div,
  nft-card-front > div {
    background: transparent !important;
  }
`;

export function NFTNodeView({ deleteNode, readOnly, node, updateAttrs }: CharmNodeViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const attrs = node.attrs as Partial<NodeAttrs>;

  useEffect(() => {
    if (ref.current) {
      setCSSOverrides(ref.current);
    }
  }, [ref.current]);

  // If there are no source for the node, return the image select component
  if (!attrs.contract) {
    if (readOnly) {
      // hide the row completely
      return <div />;
    } else {
      return (
        <MediaSelectionPopup
          node={node}
          icon={<EmbedIcon icon={OpenSeaIcon} size='large' />}
          buttonText='Embed an NFT'
          onDelete={deleteNode}
        >
          <Box py={3}>
            <MediaUrlInput
              helperText='Works with NFTs on Ethereum mainnet'
              isValid={(url) => extractAttrsFromUrl(url) !== null}
              onSubmit={(url) => {
                const _attrs = extractAttrsFromUrl(url);
                if (_attrs) {
                  updateAttrs(_attrs);
                }
              }}
              placeholder='https://opensea.io/assets/ethereum/0x...'
            />
          </Box>
        </MediaSelectionPopup>
      );
    }
  }

  return (
    <>
      <Script id='opensea-script' src={widgetJS} />
      <BlockAligner onDelete={deleteNode}>
        <StyledContainer ref={ref}>
          {/* @ts-ignore nft-card element is from OpenSea */}
          <nft-card contractAddress={attrs.contract} tokenId={attrs.token} width='100%'></nft-card>
        </StyledContainer>
      </BlockAligner>
    </>
  );
}
