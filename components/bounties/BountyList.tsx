import { Box, Grid, Typography } from '@mui/material';
import { BountyStatus } from '@prisma/client';
import Button from 'components/common/Button';
import CreatePageButton from 'components/common/Page/CreatePageButton';
import { FullWidthPageContent } from 'components/common/PageLayout/components/PageContent';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { BountyWithDetails } from 'models';
import { useMemo } from 'react';
import { CSVLink } from 'react-csv';
import { BountyCard } from './components/BountyCard';
import { BountyStatusChip } from './components/BountyStatusBadge';
import MultiPaymentModal from './components/MultiPaymentModal';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

/**
 *
 */
interface Props {
  publicMode?: boolean
  bountyCardClicked?: (bounty: BountyWithDetails) => void,
  bounties: BountyWithDetails[]
}

export default function BountyList ({ publicMode, bountyCardClicked = () => null, bounties }: Props) {
  // User can only suggest a bounty instead of creating it

  const sortedBounties = bounties ? sortArrayByObjectProperty(bounties, 'status', bountyStatuses) : [];

  const bountiesStatusRecord = useMemo(() => {
    const _bountiesStatusRecord: Record<BountyStatus, BountyWithDetails[]> = {
      complete: [],
      inProgress: [],
      open: [],
      paid: [],
      suggestion: []
    };

    sortedBounties.forEach(sortedBounty => {
      _bountiesStatusRecord[sortedBounty.status].push(sortedBounty);
    });
    return _bountiesStatusRecord;
  }, [sortedBounties]);

  const csvData = useMemo(() => {
    const completedBounties = sortedBounties.filter(bounty => bounty.status === BountyStatus.complete);
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
  }, [sortedBounties]);

  return (
    <FullWidthPageContent>

      <Grid container display='flex' justifyContent='space-between' alignContent='center' mb={3}>

        <Grid display='flex' justifyContent='space-between' item xs={12} mb={2}>
          <Box width='fit-content'>
            <Typography variant='h1' display='flex' alignItems='center' sx={{ height: '100%' }}>
              Bounties
            </Typography>
          </Box>

          {
          !publicMode && (
            <Box width='fit-content' display='flex' gap={1}>
              { !!csvData.length
              && (
                <CSVLink data={csvData} filename='Gnosis Safe Airdrop.csv' style={{ textDecoration: 'none' }}>
                  <Button color='secondary' variant='outlined'>
                    Export to CSV
                  </Button>
                </CSVLink>
              )}
              <MultiPaymentModal bounties={bounties} />
              <CreatePageButton type='bounty' />

            </Box>
          )
        }

        </Grid>

      </Grid>

      {/* Onboarding video when no bounties exist */}
      {
            bounties.length === 0 && (
              <div style={{ marginTop: '25px' }}>

                <Typography variant='h6'>
                  Getting started with bounties
                </Typography>

                <iframe
                  src='https://tiny.charmverse.io/bounties'
                  style={{ maxWidth: '100%', border: '0 none' }}
                  height='367px'
                  width='650px'
                  title='Bounties | Getting started with Charmverse'
                >
                </iframe>

              </div>
            )
          }

      {/* List of bounties based on current filter */}

      <Grid container>
        {
            bountyStatuses.map(bountyStatus => {
              return (
                <Grid container gap={1} item md={12 / 5} alignContent='flex-start' key={bountyStatus}>
                  <Grid item height='fit-content'>
                    <BountyStatusChip size='small' status={bountyStatus} />
                  </Grid>
                  {bountiesStatusRecord[bountyStatus].map(bounty => (
                    <Grid
                      key={bounty.id}
                      item
                      onClick={() => {
                        bountyCardClicked(bounty);
                      }}
                      width='100%'
                      marginRight={1}
                    >
                      <BountyCard truncate={false} key={bounty.id} bounty={bounty} />
                    </Grid>
                  ))}
                </Grid>
              );
            })
          }
      </Grid>
    </FullWidthPageContent>
  );
}
