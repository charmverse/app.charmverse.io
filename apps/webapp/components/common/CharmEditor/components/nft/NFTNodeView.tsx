import { styled } from '@mui/material';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Grid,
  InputLabel,
  TextField,
  Typography
} from '@mui/material';
import { MIN_IMAGE_WIDTH } from '@packages/bangleeditor/components/image/constants';
import type { NodeAttrs } from '@packages/bangleeditor/components/nft/nft.specs';
import { supportedMainnets as supportedMainnetsByAlchemy } from '@packages/lib/blockchain/provider/alchemy/config';
import { supportedChainIds as supportedMainnetsByAnkr } from '@packages/lib/blockchain/provider/ankr/config';
import { supportedNetworks as supportedNetworksByZora } from '@packages/lib/blockchain/provider/zora/config';
import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { RiNftLine } from 'react-icons/ri';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useGetNFT } from 'charmClient/hooks/blockchain';
import { Button } from 'components/common/Button';
import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import LoadingComponent from 'components/common/LoadingComponent';

import { enableDragAndDrop } from '../../utils';
import { EmptyEmbed } from '../common/EmptyEmbed';
import { MediaSelectionPopupNoButton } from '../common/MediaSelectionPopup';
import { EmbedIcon } from '../iframe/components/EmbedIcon';
import type { CharmNodeViewProps } from '../nodeView/nodeView';
import Resizable from '../Resizable/Resizable';

const StyledCard = styled(Card)`
  a {
    // override text decoration from charm editor
    text-decoration: none !important;
  }
`;

const blockchains = [...supportedMainnetsByAlchemy, ...supportedMainnetsByAnkr, ...supportedNetworksByZora];

export function NFTNodeView({ deleteNode, readOnly, node, selected, updateAttrs, view, getPos }: CharmNodeViewProps) {
  const attrs = node.attrs as Partial<NodeAttrs>;
  const autoOpen = node.marks.some((mark) => mark.type.name === 'tooltip-marker');
  const [showEditPopup, setShowEditPopup] = useState(false);
  const { data: nftData, isLoading } = useGetNFT({
    chainId: attrs.chain as any,
    address: attrs.contract,
    tokenId: attrs.token
  });

  function submitForm(values: NodeAttrs) {
    updateAttrs(values);
    setShowEditPopup(false);
  }

  function openPopup() {
    setShowEditPopup(true);
  }

  function closePopup() {
    setShowEditPopup(false);
  }

  useEffect(() => {
    if (autoOpen) {
      openPopup();
    }
  }, [autoOpen]);

  const popup = useMemo(
    () => (
      <MediaSelectionPopupNoButton
        open={showEditPopup}
        icon={<EmbedIcon icon={RiNftLine} size='large' />}
        buttonText='Embed an NFT'
        isSelected={selected}
        onDelete={deleteNode}
        onClose={closePopup}
        width={{}}
      >
        <NFTForm defaultValues={node.attrs as NodeAttrs} onSubmit={submitForm} />
      </MediaSelectionPopupNoButton>
    ),
    [node, showEditPopup, selected]
  );

  // If there are no source for the node, return the image select component
  if (!attrs.contract) {
    if (readOnly) {
      // hide the row completely
      return <div />;
    } else {
      return (
        <>
          <div onClick={openPopup}>
            <EmptyEmbed
              isSelected={selected}
              icon={<EmbedIcon icon={RiNftLine} size='large' />}
              buttonText='Embed an NFT'
              onDelete={deleteNode}
            />
          </div>
          {popup}
        </>
      );
    }
  }

  if (!nftData) {
    return (
      <Resizable
        onDragStart={() => {
          enableDragAndDrop(view, getPos());
        }}
        readOnly={readOnly}
        initialSize={node.attrs.size}
        minWidth={MIN_IMAGE_WIDTH}
        updateAttrs={updateAttrs}
        defaultFullWidth
        onEdit={openPopup}
        onDelete={deleteNode}
      >
        <Card variant='outlined'>
          <Box p={6}>{isLoading ? <LoadingComponent /> : <Typography color='secondary'>NFT not found</Typography>}</Box>
        </Card>
        {popup}
      </Resizable>
    );
  }

  return (
    <Resizable
      onDragStart={() => {
        enableDragAndDrop(view, getPos());
      }}
      readOnly={readOnly}
      initialSize={node.attrs.size}
      minWidth={MIN_IMAGE_WIDTH}
      updateAttrs={updateAttrs}
      onEdit={openPopup}
      onDelete={deleteNode}
    >
      <NFTView nft={nftData} />
      {popup}
    </Resizable>
  );
}

function NFTView({ nft }: { nft: { image: string; title: string; link: string } }) {
  return (
    <StyledCard variant='outlined'>
      <CardActionArea href={nft.link} target='_blank'>
        <CardMedia component='img' image={nft.image} />
        <CardContent>
          <Box
            display='flex'
            gap={1}
            flexDirection={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'center', md: 'flex-start' }}
            justifyContent='space-between'
          >
            <Typography
              component='span'
              variant='body2'
              color='text.secondary'
              align='left'
              sx={{ height: '3em', overflow: 'hidden', webkitLineClamp: 2 }}
            >
              {nft.title}
            </Typography>
            {nft.link && (
              <Button external href={nft.link} target='_blank' size='small' color='secondary' variant='outlined'>
                View
              </Button>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

function NFTForm({ defaultValues, onSubmit }: { defaultValues?: NodeAttrs; onSubmit: (values: NodeAttrs) => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isValid }
  } = useForm<NodeAttrs>({
    defaultValues
  });

  const input = watch();

  const { data: nftData, isLoading } = useSWRImmutable(`nft/${input.chain}/${input.contract}/${input.token}`, () => {
    if (!input.chain || !input.contract || !input.token) return null;
    return charmClient.blockchain.getNFT({
      chainId: input.chain as any,
      address: input.contract,
      tokenId: input.token
    });
  });

  function setChain(chain: number) {
    setValue('chain', chain as NodeAttrs['chain']);
  }

  const defaultChain = defaultValues?.chain || 1;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Box p={2.5} display='flex' flexDirection='column' alignItems='center' gap={2}>
          <Box display='flex' gap={4} alignItems='center' flexDirection={{ xs: 'column', md: 'row' }}>
            <Box maxWidth={400} flexDirection='column' alignItems='center' gap={2}>
              <Grid container spacing={2}>
                <Grid item xs={9}>
                  <InputLabel>Contract address</InputLabel>
                  <TextField
                    fullWidth
                    {...register('contract', {
                      required: true,
                      validate: { matchPattern: (v) => /^0x[a-fA-F0-9]{40}$/gm.test(v) }
                    })}
                    placeholder='0x...'
                  />
                </Grid>
                <Grid item xs={3}>
                  <InputLabel>Token id</InputLabel>
                  <TextField {...register('token', { required: true })} placeholder='1' />
                </Grid>
              </Grid>
              <Box width='100%'>
                <InputLabel>Blockchain</InputLabel>
                <InputSearchBlockchain
                  chains={blockchains}
                  chainId={defaultChain}
                  sx={{ width: '100%' }}
                  onChange={(chainId) => {
                    setChain(chainId as number);
                  }}
                />
              </Box>
            </Box>
            <Box
              display='flex'
              alignItems='center'
              justifyContent='center'
              height={124}
              width={124}
              bgcolor='sidebar.background'
              overflow='hidden'
            >
              {isLoading ? (
                <LoadingComponent />
              ) : !nftData ? (
                <Typography color='secondary'>{isValid ? 'NFT not found' : 'Preview'}</Typography>
              ) : (
                <img src={nftData.image} width='100%' height='auto' />
              )}
            </Box>
          </Box>
          <Button disabled={!isValid || !nftData} fullWidth type='submit'>
            Embed NFT
          </Button>
        </Box>
      </div>
    </form>
  );
}
