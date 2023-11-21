import { BountyStatus } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import ModeStandbyOutlinedIcon from '@mui/icons-material/ModeStandbyOutlined';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import { Box, Card, Grid, Tab, Tabs, Typography } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { CSVLink } from 'react-csv';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { EmptyStateVideo } from 'components/common/EmptyStateVideo';
import Link from 'components/common/Link';
import { usePageDialog } from 'components/common/PageDialog/hooks/usePageDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { BountyWithDetails } from 'lib/bounties';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { getAbsolutePath } from 'lib/utilities/browser';
import { isTruthy } from 'lib/utilities/types';

import { BountiesKanbanView } from './components/BountiesKanbanView';
import { BountiesGalleryView } from './components/BountyGalleryView';
import { MultiPaymentModal } from './components/MultiPaymentModal';
import { NewBountyButton } from './components/NewBountyButton';
import { useOnBountyCardClose } from './hooks/useOnBountyCardClose';

const bountyStatuses: BountyStatus[] = ['open', 'inProgress', 'complete', 'paid', 'suggestion'];

interface Props {
  publicMode?: boolean;
  bounties: BountyWithDetails[];
  title: string;
}

const StyledButton = styled(Button)`
  padding: ${({ theme }) => theme.spacing(0.5, 1)};

  .Icon {
    width: 20px;
    height: 20px;
  }
`;

const views = [
  { icon: <BountyIcon fontSize='small' />, label: 'Open', type: 'open' },
  { icon: <ModeStandbyOutlinedIcon fontSize='small' />, label: 'All', type: 'all' }
] as const;

export function BountiesPage({ publicMode = false, bounties, title }: Props) {
  const { space } = useCurrentSpace();
  const { showPage } = usePageDialog();
  const { onClose } = useOnBountyCardClose();
  const router = useRouter();
  const viewFromUrl = router.query.view as (typeof views)[number]['type'];
  const currentView = views.find((v) => v.type === viewFromUrl) ?? views[0];
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

  useEffect(() => {
    if (typeof router.query.bountyId === 'string') {
      showPage({
        bountyId: router.query.bountyId,
        readOnly: publicMode,
        onClose
      });
    }
  }, [router.query.bountyId]);

  return (
    <div className='focalboard-body full-page'>
      <div className='BoardComponent'>
        <div className='top-head'>
          <Grid container display='flex' justifyContent='space-between' alignContent='center' mb={3} mt={10}>
            <Grid display='flex' justifyContent='space-between' item xs={12} mb={2}>
              <Typography variant='h1' display='flex' alignItems='center' sx={{ height: '100%' }}>
                {title}
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
                value={currentView.type}
                sx={{ minHeight: 0, mb: '-6px' }}
              >
                {views.map(({ icon, label, type }) => (
                  <Tab
                    data-test={`bounties-view-${type}`}
                    disableRipple
                    component={NextLink}
                    href={getAbsolutePath(`/bounties?view=${type}`, space?.domain)}
                    key={type}
                    value={type}
                    label={
                      <StyledButton
                        startIcon={icon}
                        variant='text'
                        size='small'
                        sx={{ p: 0, mb: '5px', width: '100%' }}
                        color={currentView.type === type ? 'textPrimary' : 'secondary'}
                      >
                        {label}
                      </StyledButton>
                    }
                    sx={{ p: 0 }}
                  />
                ))}
              </Tabs>
            </Box>
          )}
        </div>
        {bounties.length === 0 ? (
          <EmptyStateVideo
            description='Getting started with rewards'
            videoTitle='Rewards | Getting started with CharmVerse'
            videoUrl='https://tiny.charmverse.io/bounties'
          />
        ) : currentView.type === 'open' && bounties.filter((bounty) => bounty.status === 'open').length === 0 ? (
          <Card variant='outlined' sx={{ margin: '0 auto', my: 2, width: 'fit-content' }}>
            <Box p={3} textAlign='center'>
              <Typography color='secondary'>
                There are no open rewards, click <Link href={`/${space?.domain}/bounties?view=all`}>here</Link> to see
                all of your existing rewards
              </Typography>
            </Box>
          </Card>
        ) : currentView.type === 'open' ? (
          <BountiesGalleryView bounties={bounties} publicMode={publicMode} />
        ) : (
          <div className='container-container'>
            <BountiesKanbanView publicMode={publicMode} bounties={bounties} />
          </div>
        )}
      </div>
    </div>
  );
}
