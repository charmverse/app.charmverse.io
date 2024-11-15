import { Box, Divider, Grid2, IconButton, Typography } from '@mui/material';
import Link from 'next/link';
import { MdLaunch } from 'react-icons/md';

import type { BuilderNFTContractData } from 'lib/contract/getContractData';

function ContractLink({
  address,
  linkType = 'address',
  title,
  subtitle
}: {
  address: string;
  linkType?: 'address' | 'token' | 'contract';
  title: string;
  subtitle?: string;
}) {
  return (
    <Box gap={1} display='flex' flexDirection='column'>
      <Typography variant='h6'>{title}</Typography>
      <Box sx={{ minHeight: '40px' }}>{subtitle && <Typography variant='body2'>{subtitle}</Typography>}</Box>
      <Link href={`https://optimism.blockscout.com/${linkType}/${address}`} target='_blank'>
        {address}
        <IconButton size='small' color='primary'>
          <MdLaunch size='16px' />
        </IconButton>
      </Link>
    </Box>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Typography variant='h5' fontWeight='bold'>
      {title}
    </Typography>
  );
}

function GridDivider() {
  return (
    <Grid2 size={12}>
      <Divider />
    </Grid2>
  );
}

export function SeasonOneView(data: BuilderNFTContractData) {
  const itemSizeTwoColumnMd = { xs: 12, md: 6 };
  const itemSizeThreeColumnMd = { xs: 12, md: 4 };

  return (
    <Grid2 container spacing={2}>
      <Grid2 size={12}>
        <SectionTitle title='Contract Addresses' />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.contractAddress}
          title='Proxy address'
          linkType='token'
          subtitle='Season-long contract holding the data about the minted NFTs, which delegates minting to an implementation contract.'
        />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.currentImplementation}
          title='Current Implementation'
          subtitle='This contract is called by the proxy and handles the minting logic. We upgrade to a new implementation multiple times over the season.'
        />
      </Grid2>
      <GridDivider />
      <Grid2 size={12}>
        <SectionTitle title='Data' />
      </Grid2>
      <Grid2 size={itemSizeThreeColumnMd}>
        <Typography variant='h6'>Registered builder NFTs</Typography>
        <Typography variant='body1' fontWeight='bold'>
          {data.totalSupply.toString()}
        </Typography>
      </Grid2>
      <Grid2 size={itemSizeThreeColumnMd}>
        {/* Currently, this is the balance of the proceeds receiver wallet. Once we start moving funds, we should look at logs instead */}
        <Typography variant='h6'>Sales</Typography>
        <Typography variant='body1' fontWeight='bold'>
          {Number(data.receiverUsdcBalance).toLocaleString('en-US')} USD
        </Typography>
      </Grid2>
      <Grid2 size={itemSizeThreeColumnMd}>
        {/* Currently, this is the balance of the proceeds receiver wallet. Once we start moving funds, we should look at logs instead */}
        <Typography variant='h6'>Unique NFT holders</Typography>
        <Typography variant='body1' fontWeight='bold'>
          {Number(data.nftSalesData.uniqueHolders).toLocaleString('en-US')}
        </Typography>
      </Grid2>
      <Grid2 size={itemSizeThreeColumnMd}>
        {/* Currently, this is the balance of the proceeds receiver wallet. Once we start moving funds, we should look at logs instead */}
        <Typography variant='h6'>Total NFTs minted</Typography>
        <Typography variant='body1' fontWeight='bold'>
          {Number(data.nftSalesData.totalNftsSold).toLocaleString('en-US')}
        </Typography>
      </Grid2>
      <Grid2 size={itemSizeThreeColumnMd}>
        {/* Currently, this is the balance of the proceeds receiver wallet. Once we start moving funds, we should look at logs instead */}
        <Typography variant='h6'>NFTs paid with points</Typography>
        <Typography variant='body1' fontWeight='bold'>
          {Number(data.nftSalesData.nftsPaidWithPoints).toLocaleString('en-US')}
        </Typography>
      </Grid2>
      <Grid2 size={itemSizeThreeColumnMd}>
        {/* Currently, this is the balance of the proceeds receiver wallet. Once we start moving funds, we should look at logs instead */}
        <Typography variant='h6'>NFTs paid with crypto</Typography>
        <Typography variant='body1' fontWeight='bold'>
          {Number(data.nftSalesData.nftsPaidWithCrypto).toLocaleString('en-US')}
        </Typography>
      </Grid2>
      <GridDivider />
      <Grid2 size={12}>
        <SectionTitle title='Roles & Permissions' />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.currentAdmin}
          title='Admin'
          subtitle='Admin wallet can upgrade the contract, update the wallet that receives proceeds from NFT sales, modify pricing, register builders and mint tokens.'
        />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.currentMinter}
          title='Minter'
          subtitle='Minter wallet can register new builder nfts and mint tokens to any address.'
        />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.proceedsReceiver}
          title='Proceeds Receiver'
          subtitle='This is the wallet address that receives funds paid to mint builder NFTs.'
        />
      </Grid2>
    </Grid2>
  );
}
