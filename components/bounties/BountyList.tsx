import { useMemo, useContext, useState } from 'react';
import { CSVLink, CSVDownload } from 'react-csv';
import { Box, Button, Grid, Typography } from '@mui/material';
import { BountyStatus } from '@prisma/client';
import BountyModal from 'components/bounties/BountyModal';
import { BountiesContext } from 'hooks/useBounties';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { BountyCard } from './BountyCard';
import MultiPaymentModal from './MultiPaymentModal';

const safeAddress = '0xE7faB335A404a09ACcE83Ae5F08723d8e5c69b58';

const bountyOrder: BountyStatus[] = ['open', 'assigned', 'review', 'complete'];

export function BountyList () {
  const [displayBountyDialog, setDisplayBountyDialog] = useState(false);
  const { bounties, setBounties } = useContext(BountiesContext);

  let sortedBounties = bounties ? sortArrayByObjectProperty(bounties.slice(), 'status', bountyOrder) : [];
  sortedBounties = sortedBounties.filter(bounty => {
    return bounty.status !== 'paid';
  });

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
      ...completedBounties.map((bounty, _index) => [
        bounty.rewardToken.startsWith('0x') ? bounty.rewardToken : '', // for native token it should be empty
        bounty.applications.find(application => application.createdBy === bounty.assignee)?.walletAddress,
        bounty.rewardAmount,
        bounty.chainId
      ])
    ];
  }, [sortedBounties]);

  function bountyCreated () {
    setDisplayBountyDialog(false);
  }

  return (
    <>

      <Box display='flex' justifyContent='space-between' mb={3}>
        <Typography variant='h1'>Bounty list</Typography>
        <Box display='flex' justifyContent='flex-end'>
          { !!csvData.length
          && (
            <CSVLink data={csvData} filename='Gnosis Safe Airdrop.csv'>
              <Button>
                Export to CSV
              </Button>
            </CSVLink>
          )}
          <MultiPaymentModal />
          <Button
            sx={{ ml: 1 }}
            variant='outlined'
            onClick={() => {
              setDisplayBountyDialog(true);
            }}
          >
            Create Bounty
          </Button>
        </Box>
      </Box>

      <Grid container sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {
          bounties.length === 0
            ? <Typography paragraph={true}>No bounties were found</Typography>
            : sortedBounties.map(bounty => {
              return <BountyCard truncate={false} key={bounty.id} bounty={bounty} />;
            })
        }
      </Grid>
      {
        /**
         * Remove later to its own popup modal
         */
        displayBountyDialog === true && (
          <BountyModal
            onSubmit={bountyCreated}
            open={displayBountyDialog}
            onClose={() => {
              setDisplayBountyDialog(false);
            }}
          />
        )
      }
    </>
  );
}
