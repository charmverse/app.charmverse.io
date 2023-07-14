import styled from '@emotion/styled';
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
import { useForm } from 'react-hook-form';
import { RiNftLine } from 'react-icons/ri';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { InputSearchBlockchain } from 'components/common/form/InputSearchBlockchain';
import LoadingComponent from 'components/common/LoadingComponent';

import BlockAligner from '../BlockAligner';
import { MediaSelectionPopup } from '../common/MediaSelectionPopup';
import { EmbedIcon } from '../iframe/components/EmbedIcon';
import type { CharmNodeViewProps } from '../nodeView/nodeView';

import type { NodeAttrs } from './nft.specs';

const StyledCard = styled(Card)`
  a {
    // override text decoration from charm editor
    text-decoration: none !important;
  }
`;

const blockchains = [1, 10, 137, 42161];

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

  function submitForm(values: NodeAttrs) {
    updateAttrs(values);
  }

  // If there are no source for the node, return the image select component
  if (!attrs.contract) {
    if (readOnly) {
      // hide the row completely
      return <div />;
    } else {
      return (
        <MediaSelectionPopup
          node={node}
          icon={<EmbedIcon icon={RiNftLine} size='large' />}
          buttonText='Embed an NFT'
          isSelected={selected}
          onDelete={deleteNode}
        >
          <NFTForm onSubmit={submitForm} />
        </MediaSelectionPopup>
      );
    }
  }

  if (!nftData) {
    return (
      <Card variant='outlined'>
        <Box p={6}>{isLoading ? <LoadingComponent /> : <Typography color='secondary'>NFT not found</Typography>}</Box>
      </Card>
    );
  }

  return (
    <BlockAligner readOnly={readOnly} onDelete={deleteNode}>
      <NFTView nft={nftData} />
    </BlockAligner>
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
            <Typography component='span' variant='body2' color='text.secondary' align='left'>
              {nft.title}
            </Typography>
            <Button href={nft.link} target='_blank' size='small' color='secondary' variant='outlined'>
              View
            </Button>
          </Box>
        </CardContent>
      </CardActionArea>
    </StyledCard>
  );
}

function NFTForm({ onSubmit }: { onSubmit: (values: NodeAttrs) => void }) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { isValid }
  } = useForm<NodeAttrs>();

  function setChain(chain: number) {
    setValue('chain', chain as NodeAttrs['chain']);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Box py={2.5} mx='auto' maxWidth={400} display='flex' flexDirection='column' alignItems='center' gap={2}>
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
            <InputSearchBlockchain chains={blockchains} chainId={1} sx={{ width: '100%' }} onChange={setChain} />
          </Box>
          <Button
            disabled={!isValid}
            sx={{
              width: 250
            }}
            type='submit'
          >
            Submit
          </Button>
        </Box>
      </div>
    </form>
  );
}
