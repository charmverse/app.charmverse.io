import { BountyStatus } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import ModeStandbyOutlinedIcon from '@mui/icons-material/ModeStandbyOutlined';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import { Box, Card, Grid, Tab, Tabs, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { CSVLink } from 'react-csv';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import Link from 'components/common/Link';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { BountyWithDetails } from 'lib/bounties';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { isTruthy } from 'lib/utilities/types';

import { BountiesKanbanView } from './components/BountiesKanbanView';
import { BountiesGalleryView } from './components/BountyGalleryView';
import { MultiPaymentModal } from './components/MultiPaymentModal';
import { NewBountyButton } from './components/NewBountyButton';

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
  { label: 'Open', view: 'gallery' },
  { label: 'All', view: 'board' }
];

export default function BountiesPage({ publicMode = false, bounties }: Props) {
  const space = useCurrentSpace();
  const router = useRouter();

  const currentView = views.find((view) => view.view === router.query.view) ?? views[0];

  useEffect(() => {
    charmClient.track.trackAction('page_view', { spaceId: space?.id, type: 'bounties_list' });
  }, []);

  const bountiesSorted = bounties ? sortArrayByObjectProperty(bounties, 'status', bountyStatuses) : [];

  const csvData = useMemo(() => {
    const completedBounties = bountiesSorted.filter(
      (bounty) =>
        bounty.status === BountyStatus.complete &&
        isTruthy(bounty.rewardAmount) &&
        isTruthy(bounty.rewardToken) &&
        isTruthy(bounty.chainId)
    );

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
        bounty.rewardToken?.startsWith('0x') ? bounty.rewardToken : '', // for native token it should be empty
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
            {bounties.length !== 0 && (
              <Box className='ViewHeader' alignItems='flex-start'>
                <Tabs
                  textColor='primary'
                  indicatorColor='secondary'
                  value={currentView.view}
                  sx={{ minHeight: 0, mb: '-6px' }}
                >
                  {views.map(({ label, view }) => (
                    <Tab
                      component='div'
                      disableRipple
                      key={label}
                      label={
                        <StyledButton
                          startIcon={
                            view === 'board' ? (
                              <BountyIcon fontSize='small' />
                            ) : (
                              <ModeStandbyOutlinedIcon fontSize='small' />
                            )
                          }
                          onClick={() => {
                            router.push(`/${space?.domain}/bounties?view=${view}`);
                          }}
                          variant='text'
                          size='small'
                          sx={{ p: 0, mb: '5px', width: '100%' }}
                          color={currentView.label === label ? 'textPrimary' : 'secondary'}
                        >
                          {label[0].toUpperCase() + label.slice(1)}
                        </StyledButton>
                      }
                      sx={{ p: 0 }}
                      value={view}
                    />
                  ))}
                </Tabs>
              </Box>
            )}
          </div>
          {bounties.length === 0 ? (
            <EmptyStateVideo
              description='Getting started with bounties'
              videoTitle='Bounties | Getting started with Charmverse'
              videoUrl='https://tiny.charmverse.io/bounties'
            />
          ) : currentView.view === 'gallery' && bounties.filter((bounty) => bounty.status === 'open').length === 0 ? (
            <Card variant='outlined' sx={{ margin: '0 auto', my: 2, width: 'fit-content' }}>
              <Box p={3} textAlign='center'>
                <Typography color='secondary'>
                  There are no open bounties, click <Link href={`/${space?.domain}/bounties?view=board`}>here</Link> to
                  see all of your existing bounties
                </Typography>
              </Box>
            </Card>
          ) : currentView.view === 'gallery' ? (
            <BountiesGalleryView bounties={bounties} publicMode={publicMode} />
          ) : (
            <div className='container-container'>
              <BountiesKanbanView publicMode={publicMode} bounties={bounties} />
            </div>
          )}
        </div>
      </div>
      <PageDialogGlobal />
    </PageDialogProvider>
  );
}
