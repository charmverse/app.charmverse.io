import { Box, Grid, Typography } from '@mui/material';
import { BountyStatus, Page } from '@prisma/client';
import Button from 'components/common/Button';
import PageDialog from 'components/common/Page/PageDialog';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { BountyWithDetails } from 'models';
import { useMemo, useState } from 'react';
import { CSVLink } from 'react-csv';
import { usePages } from 'hooks/usePages';
import BountyCard from './components/BountyCard';
import { BountyStatusChip } from './components/BountyStatusBadge';
import MultiPaymentModal from './components/MultiPaymentModal';
import NewBountyButton from './components/NewBountyButton';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  publicMode?: boolean
  bountyCardClicked?: (bounty: BountyWithDetails) => void,
  bounties: BountyWithDetails[]
}

export default function BountyList ({ publicMode, bountyCardClicked = () => null, bounties }: Props) {

  const [activeBountyPage, setBountyPage] = useState<Page | null>(null);
  const { pages } = usePages();

  const bountiesSorted = bounties ? sortArrayByObjectProperty(bounties, 'status', bountyStatuses) : [];

  const bountiesGroupedByStatus = bountiesSorted.reduce<Record<BountyStatus, BountyWithDetails[]>>((record, sortedBounty) => {
    record[sortedBounty.status].push(sortedBounty);
    return record;
  }, {
    complete: [],
    inProgress: [],
    open: [],
    paid: [],
    suggestion: []
  });

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
    <div className='focalboard-body'>
      <div className='BoardComponent'>

        <div className='top-head'>
          <Grid container display='flex' justifyContent='space-between' alignContent='center' mb={3} mt={10}>

            <Grid display='flex' justifyContent='space-between' item xs={12} mb={2}>
              <Typography variant='h1' display='flex' alignItems='center' sx={{ height: '100%' }}>
                Bounties
              </Typography>

              {!publicMode && (
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
                  <NewBountyButton />
                </Box>
              )}

            </Grid>

          </Grid>
        </div>

        <div className='container-container'>

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
          <div className='Kanban'>
            <div className='octo-board-header'>
              {bountyStatuses.map(bountyStatus => (
                <div className='octo-board-header-cell' key={bountyStatus}>
                  <BountyStatusChip status={bountyStatus} />
                </div>
              ))}
            </div>
            <div className='octo-board-body'>
              {bountyStatuses.map(bountyStatus => (
                <div className='octo-board-column' key={bountyStatus}>
                  {bountiesGroupedByStatus[bountyStatus].filter(bounty => Boolean(pages[bounty.page?.id])).map(bounty => (
                    <BountyCard
                      key={bounty.id}
                      bounty={bounty}
                      page={pages[bounty.page.id] as Page}
                      onClick={() => {
                        bountyCardClicked(bounty);
                        const bountyPage = pages[bounty.page?.id] as Page;
                        setBountyPage(bountyPage);
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {activeBountyPage && <PageDialog page={activeBountyPage} onClose={() => setBountyPage(null)} />}
          </div>
        </div>
      </div>
    </div>
  );
}
