import { Box, Grid, Typography } from '@mui/material';
import { BountyStatus } from '@prisma/client';
import { useEffect, useMemo } from 'react';
import { CSVLink } from 'react-csv';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { BountyWithDetails } from 'lib/bounties';
import { sortArrayByObjectProperty } from 'lib/utilities/array';

import BountiesEmptyState from './components/BountiesEmptyState';
import BountiesKanbanView from './components/BountiesKanbanView';
import MultiPaymentModal from './components/MultiPaymentModal';
import NewBountyButton from './components/NewBountyButton';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  publicMode?: boolean;
  bounties: BountyWithDetails[];
}

// Gnosis Safe Airdrop compatible format
// receiver: Ethereum address of transfer receiver.
// token_address: Ethereum address of ERC20 token to be transferred.
// amount: the amount of token to be transferred.
// More information: https://github.com/bh2smith/safe-airdrop

const csvHeaders = ['receiver', 'token_address', 'amount', 'chainId'] as const;
type CSVRow = Record<typeof csvHeaders[number], string | number>;

export default function BountiesPage ({ publicMode = false, bounties }: Props) {
  const [space] = useCurrentSpace();

  useEffect(() => {
    charmClient.track.trackAction('page_view', { spaceId: space?.id, type: 'bounties_list' });
  }, []);

  const bountiesSorted = bounties ? sortArrayByObjectProperty(bounties, 'status', bountyStatuses) : [];
  const completedBounties = bountiesSorted.filter(bounty => bounty.status === BountyStatus.complete);

  function getCSVData (): CSVRow[] {
    return completedBounties.map((bounty): CSVRow => ({
      receiver: bounty.rewardToken.startsWith('0x') ? bounty.rewardToken : '', // for native token it should be empty
      token_address: bounty.applications.find(application => application.status === 'complete')?.walletAddress || '',
      amount: bounty.rewardAmount,
      chainId: bounty.chainId
    }));
  }

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
                  {Boolean(completedBounties.length)
                    && (
                      <CSVLink headers={csvHeaders.slice()} data={getCSVData} filename='Gnosis Safe Airdrop.csv' style={{ textDecoration: 'none' }}>
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
              <BountiesEmptyState />
            ) : (
              <BountiesKanbanView publicMode={publicMode} bounties={bounties} />
            )}
        </div>
      </div>
    </div>
  );
}
