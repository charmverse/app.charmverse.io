import { Box, Grid, Typography } from '@mui/material';
import { BountyStatus } from '@prisma/client';
import Button from 'components/common/Button';
import { BountiesContext } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { useContext, useMemo, useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import { BountyWithDetails } from 'models';
import { FullWidthPageContent } from 'components/common/PageLayout/components/PageContent';

import { BountyCard } from './components/BountyCard';
import BountyModal from './components/BountyModal';
import InputBountyStatus from './components/InputBountyStatus';
import MultiPaymentModal from './components/MultiPaymentModal';

const bountyOrder: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

function filterBounties (bounties: BountyWithDetails[], statuses: BountyStatus[]): BountyWithDetails[] {
  return bounties?.filter(bounty => statuses.indexOf(bounty.status) > -1) ?? [];
}

function sortSelected (bountyStatuses: BountyStatus[]): BountyStatus[] {
  return bountyStatuses.sort((first, second) => {
    if (first === second) {
      return 0;
    }
    else if (bountyOrder.indexOf(first) < bountyOrder.indexOf(second)) {
      return -1;
    }
    else {
      return 1;
    }
  });
}

/**
 *
 */
interface Props {
  publicMode?: boolean
  bountyCardClicked?: (bounty: BountyWithDetails) => void,
  bounties: BountyWithDetails[]
}

export default function BountyList ({ publicMode, bountyCardClicked = () => null, bounties }: Props) {
  const [displayBountyDialog, setDisplayBountyDialog] = useState(false);

  const [space] = useCurrentSpace();
  const [currentUserPermissions] = useCurrentSpacePermissions();

  const [savedBountyFilters, setSavedBountyFilters] = useLocalStorage<BountyStatus[]>(`${space?.id}-bounty-filters`, ['open', 'inProgress']);

  // Filter out the old bounty filters
  useEffect(() => {
    setSavedBountyFilters(savedBountyFilters.filter(status => BountyStatus[status] !== undefined));
  }, []);

  // User can only suggest a bounty instead of creating it
  const suggestBounties = currentUserPermissions?.createBounty === false;

  const filteredBounties = filterBounties(bounties.slice(), savedBountyFilters);

  const sortedBounties = bounties ? sortArrayByObjectProperty(filteredBounties, 'status', bountyOrder) : [];

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
        bounty.applications.find(application => application.status === 'complete')?.walletAddress,
        bounty.rewardAmount,
        bounty.chainId
      ])
    ];
  }, [sortedBounties]);

  function bountyCreated () {
    setDisplayBountyDialog(false);
  }

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
            <Box width='fit-content'>
              { !!csvData.length
              && (
                <CSVLink data={csvData} filename='Gnosis Safe Airdrop.csv' style={{ textDecoration: 'none' }}>
                  <Button color='secondary' variant='outlined'>
                    Export to CSV
                  </Button>
                </CSVLink>
              )}
              <MultiPaymentModal bounties={bounties} />

              {
                currentUserPermissions && (
                  <Button
                    sx={{ ml: 1, height: '35px' }}
                    onClick={() => {
                      setDisplayBountyDialog(true);
                    }}
                  >
                    {suggestBounties ? 'Suggest' : 'Create'} Bounty
                  </Button>
                )
              }

            </Box>
          )
        }

        </Grid>

        {
          bounties.length > 0 && (
            <Grid item xs={12}>
              {/* Filters for the bounties */}
              <InputBountyStatus
                onChange={(statuses) => {
                  setSavedBountyFilters(sortSelected(statuses));
                }}
                renderSelectedInValue={true}
                renderSelectedInOption={true}
                defaultValues={savedBountyFilters}
              />
            </Grid>
          )

            }

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

      {/* Current filter status doesn't have any matching bounties */}
      {
            bounties.length > 0 && sortedBounties.length === 0 && (
            <Typography paragraph={true}>
              {
                savedBountyFilters.length === 0 ? 'Select one or multiple bounty statuses.' : 'No bounties matching the current filter status.'
              }
            </Typography>
            )
        }

      {/* List of bounties based on current filter */}
      {
            sortedBounties.length > 0 && (
              <Grid container spacing={1}>
                {sortedBounties.map(bounty => {
                  return (
                    <Grid
                      key={bounty.id}
                      item
                      onClick={() => {
                        bountyCardClicked(bounty);
                      }}
                    >
                      <BountyCard truncate={false} key={bounty.id} bounty={bounty} publicMode={publicMode} />
                    </Grid>
                  );
                })}
              </Grid>
            )
          }

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
              mode={suggestBounties ? 'suggest' : 'create'}
            />
          )
        }
    </FullWidthPageContent>
  );
}
