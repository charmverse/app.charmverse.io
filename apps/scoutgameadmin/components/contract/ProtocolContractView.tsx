import { contributionSchemaDefinition, scoutGameUserProfileSchemaDefinition } from '@charmverse/core/protocol';
import { Box, Button, Divider, Grid2, IconButton, Typography } from '@mui/material';
import { ProtocolImplementationClient } from '@packages/scoutgame/protocol/clients/ProtocolImplementationClient';
import { scoutGameAttestationChain } from '@packages/scoutgameattestations/constants';
import Link from 'next/link';
import { MdLaunch } from 'react-icons/md';
import { useSendTransaction, useWalletClient } from 'wagmi';

import type { ProtocolData } from 'lib/contract/aggregateProtocolData';

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

function EASSchemaLink({ schemaId, title, subtitle }: { schemaId: string; title: string; subtitle?: string }) {
  return (
    <Box gap={1} display='flex' flexDirection='column'>
      <Typography variant='h6'>{title}</Typography>
      <Box sx={{ minHeight: '40px' }}>{subtitle && <Typography variant='body2'>{subtitle}</Typography>}</Box>
      <Link href={`https://base-sepolia.easscan.org/schema/view/${schemaId}`} target='_blank'>
        {schemaId}
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

export function ProtocolContractView(data: ProtocolData) {
  const itemSizeTwoColumnMd = { xs: 12, md: 6 };
  const itemSizeThreeColumnMd = { xs: 12, md: 4 };

  // const { sendTransactionAsync } = useSendTransaction();

  const { data: walletClient } = useWalletClient();

  async function claimTokens(claimData: ProtocolData['merkleRoots'][number]) {
    if (!claimData.testClaim || !walletClient) {
      return;
    }

    const client = new ProtocolImplementationClient({
      contractAddress: data.proxy,
      walletClient: walletClient as any,
      chain: scoutGameAttestationChain
    });

    await client.claim({
      args: {
        week: claimData.week,
        amount: BigInt(claimData.testClaim.claim.amount),
        proofs: claimData.testClaim.proofs
      }
    });
  }

  return (
    <Grid2 container spacing={2}>
      <Grid2 size={12}>
        <SectionTitle title='Protocol Contract Addresses' />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.proxy}
          title='Proxy address'
          linkType='token'
          subtitle='Long term contract for interacting with the protocol'
        />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.implementation}
          title='Current Implementation'
          subtitle='This contract is called by the proxy and contains the main protocol logic'
        />
      </Grid2>
      <GridDivider />
      <Grid2 size={12}>
        <SectionTitle title='Data' />
      </Grid2>
      {data.merkleRoots.map((root) => (
        <Grid2 size={itemSizeThreeColumnMd} key={root.week}>
          <Typography variant='h6'>Merkle Root for week {root.week}</Typography>
          {!root.root && <Typography>Week not processed</Typography>}
          {root.root &&
            (root.publishedOnchain ? (
              <Typography>Published onchain</Typography>
            ) : (
              <Typography>Awaiting publication</Typography>
            ))}

          {root.testClaim && (
            <Button onClick={() => claimTokens(root)}>
              Claim {root.testClaim.claim.amount} $SCOUT with {root.testClaim.claim.address.slice(0, 5)}..
              {root.testClaim.claim.address.slice(root.testClaim.claim.address.length - 3)}
            </Button>
          )}
        </Grid2>
      ))}
      <GridDivider />
      {/* <Grid2 size={12}>
        <SectionTitle title='Governance' />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <Typography variant='h6'>Upgrade contract</Typography>
        <Button>Upgrade contract</Button>
      </Grid2>
      <GridDivider /> */}
      <Grid2 size={12}>
        <SectionTitle title='Attestations' />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <EASSchemaLink
          schemaId={data.easSchemas.profile}
          title={scoutGameUserProfileSchemaDefinition.name}
          subtitle='Onchain profiles for ScoutGame participants'
        />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <EASSchemaLink
          schemaId={data.easSchemas.contributions}
          title={contributionSchemaDefinition.name}
          subtitle='Onchain receipts for Github Activity'
        />
      </Grid2>
      <GridDivider />
      <Grid2 size={12}>
        <SectionTitle title='Roles & Permissions' />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.admin}
          title='Admin'
          subtitle='Admin wallet can upgrade the contract, update the wallet that receives proceeds from NFT sales, modify pricing, register builders and mint tokens.'
        />
      </Grid2>
      <Grid2 size={itemSizeTwoColumnMd}>
        <ContractLink
          address={data.claimsManager}
          title='Claims Manager'
          subtitle='The wallet that can register weekly merkle roots'
        />
      </Grid2>
    </Grid2>
  );
}
