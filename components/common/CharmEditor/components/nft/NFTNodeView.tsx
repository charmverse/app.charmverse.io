import styled from '@emotion/styled';
import TwitterIcon from '@mui/icons-material/Twitter';
import { Box } from '@mui/material';
import Script from 'next/script';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

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
          buttonText='Embed an NFT'
          onDelete={deleteNode}
        >
          <Box py={3}>
            <MediaUrlInput
              helperText='Works with Ethereum network NFTs'
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
  function initStyles() {
    setCSSOverrides();
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
