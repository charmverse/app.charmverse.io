import type { ApplicationStatus } from '@charmverse/core/prisma-client';
import { KeyboardArrowDown } from '@mui/icons-material';
import LaunchIcon from '@mui/icons-material/Launch';
import { Collapse, Divider, FormLabel, IconButton, Stack, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { getChainExplorerLink } from 'connectors/index';
import { useRouter } from 'next/router';
import { useState } from 'react';

import charmClient from 'charmClient';
import { useGetReward } from 'charmClient/hooks/rewards';
import { PageTitleInput } from 'components/[pageId]/DocumentPage/components/PageTitleInput';
import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import Link from 'components/common/Link';
import { ScrollableWindow } from 'components/common/PageLayout';
import UserDisplay from 'components/common/UserDisplay';
import { RewardProperties } from 'components/rewards/components/RewardProperties/RewardProperties';
import { useApplication } from 'components/rewards/hooks/useApplication';
import { useApplicationDialog } from 'components/rewards/hooks/useApplicationDialog';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { usePage } from 'hooks/usePage';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { PageContent } from 'lib/prosemirror/interfaces';

import { RewardPaymentButton } from '../RewardProperties/components/RewardApplicantsTable/RewardPaymentButton';

import { ApplicationComments } from './ApplicationComments';
import ApplicationInput from './RewardApplicationInput';
import RewardReview from './RewardReview';
import { RewardSubmissionInput } from './RewardSubmissionInput';

type Props = {
  applicationId: string;
};

export function RewardApplicationPageComponent({ applicationId }: Props) {
  const { application, refreshApplication, applicationRewardPermissions, updateApplication, reviewApplication } =
    useApplication({
      applicationId
    });
  const router = useRouter();
  const { data: reward } = useGetReward({ rewardId: application?.bountyId });

  const { hideApplication } = useApplicationDialog();

  const { page: rewardPageContent } = usePage({ pageIdOrPath: reward?.id });

  const { space } = useCurrentSpace();

  const { permissions: rewardPagePermissions } = usePagePermissions({ pageIdOrPath: reward?.id as string });

  const { members } = useMembers();
  const { user } = useUser();
  const { showMessage } = useSnackbar();

  const [showProperties, setShowProperties] = useState(false);

  async function recordTransaction(transactionId: string, chainId: number) {
    try {
      await charmClient.rewards.recordTransaction({
        applicationId,
        chainId: chainId.toString(),
        transactionId
      });
      await charmClient.rewards.markSubmissionAsPaid(applicationId);
      refreshApplication();
    } catch (err: any) {
      showMessage(err.message || err, 'error');
    }
  }

  if (!application || !reward) {
    return null;
  }

  function goToReward() {
    if (space && rewardPageContent) {
      hideApplication();
      router.push(`/${space.domain}/${rewardPageContent.path}`);
    }
  }

  const submitter = members.find((m) => m.id === application.createdBy);

  const readonlySubmission =
    user?.id !== application.createdBy ||
    (['complete', 'paid', 'processing', 'rejected'] as ApplicationStatus[]).includes(application.status);

  return (
    <ScrollableWindow>
      {/** TODO - Use more elegant layout */}
      <Grid container px='10%' gap={2}>
        <Grid item xs={12} display='flex' flexDirection='column' justifyContent='space-between' sx={{ mb: 1 }}>
          <PageTitleInput value={reward.page.title} readOnly onChange={() => null} />
          {space && rewardPageContent && (
            <Box onClick={goToReward}>
              <Typography variant='body2' display='flex' gap={1} color='secondary'>
                <LaunchIcon fontSize='small' sx={{ transform: 'rotate(270deg)' }} />
                <span>Back to reward</span>
              </Typography>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} className='focalboard-body' flexDirection='column'>
          <Stack
            direction='row'
            gap={1}
            alignItems='center'
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowProperties((v) => !v)}
          >
            <FormLabel sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Reward Details</FormLabel>
            <IconButton size='small'>
              <KeyboardArrowDown
                fontSize='small'
                sx={{ transform: `rotate(${showProperties ? 180 : 0}deg)`, transition: 'all 0.2s ease' }}
              />
            </IconButton>
          </Stack>
          <Collapse in={showProperties} timeout='auto' unmountOnExit>
            <Stack>
              <RewardProperties
                rewardId={reward.id}
                pageId={reward.page.id}
                pagePath={reward.page.path}
                readOnly={!rewardPagePermissions?.edit_content}
                hideApplications
              />
              {rewardPageContent && (
                <>
                  <CharmEditor
                    pageId={rewardPageContent.id}
                    readOnly
                    content={rewardPageContent.content as PageContent}
                  />
                  <Divider sx={{ mt: 2 }} />
                </>
              )}
            </Stack>
          </Collapse>
        </Grid>

        <Grid item xs={12} gap={2} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display='flex' gap={2}>
            <FormLabel sx={{ fontWeight: 'bold', cursor: 'pointer' }}>Applicant</FormLabel>
            <UserDisplay user={submitter} avatarSize='small' showMiniProfile />
          </Box>

          {/** This section contaisn all possible reviewer actions */}
          {application.status === 'applied' && (
            <RewardReview
              onConfirmReview={(decision) => reviewApplication({ decision })}
              reviewType='application'
              readOnly={!applicationRewardPermissions?.approve_applications}
            />
          )}
          {(application.status === 'review' || application.status === 'inProgress') && (
            <RewardReview
              onConfirmReview={(decision) => reviewApplication({ decision })}
              reviewType='submission'
              readOnly={!applicationRewardPermissions?.review}
            />
          )}
          {application.status === 'complete' && reward.rewardAmount && (
            <RewardPaymentButton
              amount={String(reward.rewardAmount)}
              chainIdToUse={reward.chainId as number}
              receiver={application.walletAddress as string}
              reward={reward}
              tokenSymbolOrAddress={reward.rewardToken as string}
              onSuccess={recordTransaction}
              onError={(message) => showMessage(message, 'warning')}
            />
          )}

          {application.status === 'paid' && application.transactions.length && (
            <Button
              variant='outlined'
              color='secondary'
              external
              target='_blank'
              href={getChainExplorerLink(
                application.transactions[0].chainId,
                application.transactions[0].transactionId
              )}
            >
              <LaunchIcon sx={{ mr: 1 }} />
              View transaction
            </Button>
          )}
        </Grid>

        {reward.approveSubmitters && application.status === 'applied' && (
          <Grid item xs={12}>
            <ApplicationInput
              application={application}
              rewardId={reward.id}
              expandedOnLoad
              readOnly={application.createdBy !== user?.id}
              onSubmit={(updatedApplication) =>
                updateApplication({
                  applicationId: application.id,
                  message: updatedApplication,
                  rewardId: reward.id
                })
              }
            />
          </Grid>
        )}

        {application.status !== 'applied' && (
          <Grid item xs={12}>
            <RewardSubmissionInput
              currentUserIsApplicant={!!user && user?.id === application.createdBy}
              submission={application}
              readOnly={readonlySubmission}
              expandedOnLoad
              refreshSubmission={refreshApplication}
              onSubmit={(submission) =>
                updateApplication({
                  rewardId: reward.id,
                  submissionNodes: submission.submissionNodes,
                  applicationId: application.id
                })
              }
              bountyId={application.bountyId}
              permissions={applicationRewardPermissions}
              hasCustomReward={!!reward.customReward}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <ApplicationComments applicationId={application.id} status={application.status} />
        </Grid>
      </Grid>
    </ScrollableWindow>
  );
}
