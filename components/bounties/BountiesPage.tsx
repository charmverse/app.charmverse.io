import styled from '@emotion/styled';
import { Box, Grid, Stack, Tab, Tabs, Typography } from '@mui/material';
import { BountyStatus } from '@prisma/client';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { CSVLink } from 'react-csv';

import charmClient from 'charmClient';
import { iconForViewType } from 'components/common/BoardEditor/focalboard/src/components/viewMenu';
import Button from 'components/common/Button';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import PageDialogGlobalModal from 'components/common/PageDialog/PageDialogGlobal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { BountyWithDetails } from 'lib/bounties';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { setUrlWithoutRerender } from 'lib/utilities/browser';

import BountiesKanbanView from './components/BountiesKanbanView';
import BountiesGalleryView from './components/BountyGalleryView';
import MultiPaymentModal from './components/MultiPaymentModal';
import NewBountyButton from './components/NewBountyButton';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  publicMode?: boolean;
  bounties: BountyWithDetails[];
}

const StyledButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing(0.5, 1)};

  .Icon {
    width: 20px;
    height: 20px;
  }
`;

const views: { label: string; view: 'gallery' | 'board' }[] = [
  { label: 'Ongoing', view: 'gallery' },
  { label: 'All', view: 'board' }
];

export default function BountiesPage({ publicMode = false, bounties }: Props) {
  const space = useCurrentSpace();
  const router = useRouter();
  const [currentView, setCurrentView] = useState<(typeof views)[0]>(views[0]);

  useEffect(() => {
    charmClient.track.trackAction('page_view', { spaceId: space?.id, type: 'bounties_list' });
  }, []);

  const bountiesSorted = bounties ? sortArrayByObjectProperty(bounties, 'status', bountyStatuses) : [];

  const csvData = useMemo(() => {
    const completedBounties = bountiesSorted.filter((bounty) => bounty.status === BountyStatus.complete);
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
        bounty.applications.find((application) => application.status === 'complete')?.walletAddress,
        bounty.rewardAmount,
        bounty.chainId
      ])
    ];
  }, [bountiesSorted]);

  function recordExportEvent() {
    if (space) {
      charmClient.track.trackAction('export_bounties_csv', { spaceId: space.id });
    }
  }

  return (
    <PageDialogProvider>
      <div className='focalboard-body full-page'>
        <div className='BoardComponent'>
          <div className='top-head'>
            <Grid container display='flex' justifyContent='space-between' alignContent='center' mb={3} mt={10}>
              <Grid display='flex' justifyContent='space-between' item xs={12} mb={2}>
                <Typography variant='h1' display='flex' alignItems='center' sx={{ height: '100%' }}>
                  Bounties
                </Typography>

                {!publicMode && (
                  <Box width='fit-content' display='flex' gap={1}>
                    {!!csvData.length && (
                      <CSVLink
                        data={csvData}
                        onClick={recordExportEvent}
                        filename='Gnosis Safe Airdrop.csv'
                        style={{ textDecoration: 'none' }}
                      >
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
            <Stack flexDirection='row' justifyContent='space-between' mb={1}>
              <Tabs
                textColor='primary'
                indicatorColor='secondary'
                value={currentView}
                sx={{ minHeight: 0, height: 'fit-content' }}
              >
                {views.map(({ label, view }) => (
                  <Tab
                    component='div'
                    disableRipple
                    key={label}
                    label={
                      <StyledButton
                        startIcon={iconForViewType(view)}
                        onClick={() => {
                          setCurrentView({ label, view });
                          setUrlWithoutRerender(router.pathname, { view });
                        }}
                        variant='text'
                        size='small'
                        color={currentView.label === label ? 'textPrimary' : 'secondary'}
                      >
                        {label[0].toUpperCase() + label.slice(1)}
                      </StyledButton>
                    }
                    sx={{ p: 0, mb: '5px' }}
                    value={view}
                  />
                ))}
              </Tabs>
            </Stack>
          </div>
          <div className='container-container'>
            {bounties.length === 0 ? (
              <EmptyStateVideo
                description='Getting started with bounties'
                videoTitle='Bounties | Getting started with Charmverse'
                videoUrl='https://tiny.charmverse.io/bounties'
              />
            ) : currentView.view === 'gallery' ? (
              <BountiesGalleryView bounties={bounties} publicMode={publicMode} />
            ) : (
              <BountiesKanbanView publicMode={publicMode} bounties={bounties} />
            )}
          </div>
        </div>
      </div>
      <PageDialogGlobalModal />
    </PageDialogProvider>
  );
}
