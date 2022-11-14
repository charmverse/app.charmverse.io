import { Box, Grid, Typography } from '@mui/material';
import { BountyStatus } from '@prisma/client';
import { useEffect, useMemo } from 'react';
import { CSVLink } from 'react-csv';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { BountyWithDetails } from 'lib/bounties';
import { sortArrayByObjectProperty } from 'lib/utilities/array';

import BountiesKanbanView from './components/BountiesKanbanView';
import MultiPaymentModal from './components/MultiPaymentModal';
import NewBountyButton from './components/NewBountyButton';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  publicMode?: boolean;
  bounties: BountyWithDetails[];
}

export default function BountiesPage ({ publicMode = false, bounties }: Props) {
  const space = useCurrentSpace();

  useEffect(() => {
    charmClient.track.trackAction('page_view', { spaceId: space?.id, type: 'bounties_list' });
  }, []);

  const bountiesSorted = bounties ? sortArrayByObjectProperty(bounties, 'status', bountyStatuses) : [];

  const csvData = useMemo(() => {
    const completedBounties = bountiesSorted.filter(bounty => bounty.status === BountyStatus.complete);
    if (!completedBounties.length) {
      return [];
    }

    // Gnosis Safe Airdrop compatible format
    // receiver: Ethereum address of transfer receiver.
    // token_address: Ethereum address of ERC20 token to be transferred.
    // amount: the amount of token to be transferred.
    // More information: https://github.com/bh2smith/safe-airdrop
    return [
      ['token_address', 'receiver', 'amount', 'chainId'],
      ...completedBounties.map((bounty) => [
        bounty.rewardToken.startsWith('0x') ? bounty.rewardToken : '', // for native token it should be empty
        bounty.applications.find(application => application.status === 'complete')?.walletAddress,
        bounty.rewardAmount,
        bounty.chainId
      ])
    ];
  }, [bountiesSorted]);

  return (
    <div
      className='focalboard-body full-page'
    >
      <div className='BoardComponent'>
        <div className='top-head'>
          <Grid container display='flex' justifyContent='space-between' alignContent='center' mb={3} mt={10}>

            <Grid display='flex' justifyContent='space-between' item xs={12} mb={2}>
              <Typography variant='h1' display='flex' alignItems='center' sx={{ height: '100%' }}>
                Bounties
              </Typography>

              {!publicMode && (
                <Box width='fit-content' display='flex' gap={1}>
                  {!!csvData.length
                    && (
                      <CSVLink data={csvData} filename='Gnosis Safe Airdrop.csv' style={{ textDecoration: 'none' }}>
                        <Button color='secondary' variant='outlined'>
                          Export to CSV
                        </Button>
                      </CSVLink>
                    )}
                  <MultiPaymentModal bounties={bounties} />
                  <NewBountyButton />
                </Box>
              )}
            </Grid>

          </Grid>
        </div>
        <div className='container-container'>
          {bounties.length === 0
            ? (
              <EmptyStateVideo
                description='Getting started with bounties'
                videoTitle='Bounties | Getting started with Charmverse'
                videoUrl='https://tiny.charmverse.io/bounties'
              />
            ) : (
              <BountiesKanbanView publicMode={publicMode} bounties={bounties} />
            )}
        </div>
      </div>
    </div>
  );
}
