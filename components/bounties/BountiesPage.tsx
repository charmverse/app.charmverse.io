import { Box, Grid, Typography } from '@mui/material';
import { BountyStatus } from '@prisma/client';
import Button from 'components/common/Button';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { BountyWithDetails } from 'models';
import { useMemo } from 'react';
import { CSVLink } from 'react-csv';
import MultiPaymentModal from './components/MultiPaymentModal';
import NewBountyButton from './components/NewBountyButton';
import BountiesEmptyState from './components/BountiesEmptyState';
import BountiesKanbanView from './components/BountiesKanbanView';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  publicMode?: boolean;
  bounties: BountyWithDetails[];
  refreshBounty?: (bountyId: string) => void
}

export default function BountiesPage ({ refreshBounty, publicMode = false, bounties }: Props) {

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
          {/* include ViewHEader to include the horizontal line */}
          <div className='ViewHeader' />
        </div>
        <div className='container-container'>
          {bounties.length === 0
            ? (
              <BountiesEmptyState />
            ) : (
              <BountiesKanbanView bounties={bounties} refreshBounty={refreshBounty} />
            )}
        </div>
      </div>
    </div>
  );
}
