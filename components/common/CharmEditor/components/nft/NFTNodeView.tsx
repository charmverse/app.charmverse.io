import styled from '@emotion/styled';
import { Alert, Box, Card, CardMedia, CardContent, CardActionArea, Typography } from '@mui/material';
import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import OpenSeaIcon from 'public/images/opensea_logo.svg';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { MediaUrlInput } from '../common/MediaUrlInput';
import { EmbedIcon } from '../iframe/components/EmbedIcon';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

import type { NodeAttrs } from './nft.specs';
import { extractAttrsFromUrl } from './utils';

const StyledCard = styled(Card)`
  a {
    // override text decoration from charm editor
    text-decoration: none !important;
  }
`;

export function NFTNodeView({ deleteNode, readOnly, node, selected, updateAttrs }: CharmNodeViewProps) {
  const attrs = node.attrs as Partial<NodeAttrs>;

  const { data: nftData, isLoading } = useSWRImmutable(`nft/${attrs.chain}/${attrs.contract}/${attrs.token}`, () => {
    if (!attrs.chain || !attrs.contract || !attrs.token) return null;
    return charmClient.blockchain.getNFT({
      chainId: attrs.chain as any,
      address: attrs.contract,
      tokenId: attrs.token
    });
  });

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
          isSelected={selected}
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

  if (isLoading) {
    return (
      <Card variant='outlined'>
        <Box p={3}>
          <LoadingComponent />
        </Box>
      </Card>
    );
  }

  if (!nftData) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          <Typography color='secondary'>NFT not found</Typography>
        </Box>
        <Alert severity='warning'>There was an error</Alert>
      </Card>
    );
  }

  return (
    <BlockAligner readOnly={readOnly} onDelete={deleteNode}>
      <StyledCard variant='outlined'>
        <CardActionArea href={nftData.link} target='_blank'>
          <CardMedia component='img' image={nftData.image} />
          <CardContent>
            <Box display='flex' justifyContent='space-between'>
              <Typography component='span' variant='body2' color='text.secondary' align='left'>
                {nftData.title}
              </Typography>
              <Button href={nftData.link} target='_blank' size='small' color='secondary' variant='outlined'>
                View
              </Button>
            </Box>
          </CardContent>
        </CardActionArea>
      </StyledCard>
    </BlockAligner>
  );
}
