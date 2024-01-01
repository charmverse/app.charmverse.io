import type { ProposalFlowPermissionFlags } from '@charmverse/core/permissions';
import type { PageType, ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma';
import { KeyboardArrowDown } from '@mui/icons-material';
import type { Theme } from '@mui/material';
import { Box, Collapse, Divider, IconButton, Stack, Switch, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef, useState } from 'react';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import ModalWithButtons from 'components/common/Modal/ModalWithButtons';
import { ProposalRewards } from 'components/proposals/components/ProposalRewards/ProposalRewards';
import { CustomPropertiesAdapter } from 'components/proposals/ProposalPage/components/ProposalProperties/CustomPropertiesAdapter';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { CreateVoteModal } from 'components/votes/components/CreateVoteModal';
import { isProdEnv } from 'config/constants';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { ProposalFields, ProposalReviewerInput } from 'lib/proposal/interface';
import {
  getProposalStatuses,
  nextProposalStatusUpdateMessage,
  previousProposalStatusUpdateMessage
} from 'lib/proposal/proposalStatusTransition';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ProposalEvaluationValues } from '../EvaluationSettingsSidebar/components/EvaluationStepSettings';

export type ProposalPropertiesInput = {
  content?: PageContent | null;
  contentText?: string; // required to know if we can overwrite content when selecting a template
  authors: string[];
  reviewers: ProposalReviewerInput[];
  workflowId?: string | null;
  proposalTemplateId?: string | null;
  evaluationType: ProposalEvaluationType;
  evaluations: ProposalEvaluationValues[];
  publishToLens?: boolean;
  fields: ProposalFields | null;
  type: PageType;
};

type ProposalPropertiesProps = {
  isPublishingToLens?: boolean;
  proposalLensLink?: string;
  isAdmin?: boolean;
  isFromTemplate?: boolean;
  pageId?: string;
  proposalId?: string;
  proposalFlowFlags?: ProposalFlowPermissionFlags;
  proposalFormInputs: ProposalPropertiesInput;
  proposalStatus?: ProposalStatus;
  readOnlyAuthors?: boolean;
  setProposalFormInputs: (values: Partial<ProposalPropertiesInput>) => Promise<void> | void;
  snapshotProposalId?: string | null;
  updateProposalStatus?: (newStatus: ProposalStatus) => Promise<void>;
  readOnlyCustomProperties?: string[];
  isReviewer?: boolean;
  rewardIds?: string[] | null;
};

export function ProposalPropertiesBase({
  proposalLensLink,
  isAdmin = false,
  isFromTemplate,
  proposalFormInputs,
  pageId,
  proposalId,
  proposalFlowFlags,
  proposalStatus,
  readOnlyAuthors,
  setProposalFormInputs,
  snapshotProposalId,
  updateProposalStatus,
  isPublishingToLens,
  readOnlyCustomProperties,
  isReviewer,
  rewardIds
}: ProposalPropertiesProps) {
  const { user } = useUser();
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(proposalStatus === 'draft');
  const { lensProfile } = useLensProfile();
  const { account } = useWeb3Account();
  const previousConfirmationPopup = usePopupState({
    variant: 'popover',
    popupId: 'previous-proposal-status-change-confirmation'
  });
  const nextConfirmationPopup = usePopupState({
    variant: 'popover',
    popupId: 'next-proposal-status-change-confirmation'
  });

  const statuses = getProposalStatuses(proposalFormInputs.evaluationType);
  const currentStatusIndex = proposalStatus ? statuses.indexOf(proposalStatus) : -1;
  const nextStatus = statuses[currentStatusIndex + 1];
  const previousStatus = statuses[currentStatusIndex - 1];
  const previousConfirmationMessage = previousProposalStatusUpdateMessage(previousStatus);
  const nextConfirmationMessage = nextProposalStatusUpdateMessage(nextStatus);

  async function handleProposalStatusUpdate(newStatus: ProposalStatus) {
    switch (newStatus) {
      case 'draft':
      case 'discussion':
      case 'review':
      case 'vote_active':
      case 'evaluation_active':
      case 'evaluation_closed':
      case 'reviewed':
        if (newStatus === previousStatus) {
          previousConfirmationPopup.open();
        } else if (newStatus === nextStatus) {
          nextConfirmationPopup.open();
        }
        break;
      default:
        await updateProposalStatus?.(newStatus);
        break;
    }
  }

  const isAuthor = proposalFormInputs.authors.includes(user?.id ?? '');
  const proposalAuthorIds = proposalFormInputs.authors;
  const proposalReviewers = proposalFormInputs.reviewers;
  const isNewProposal = !pageId;
  const voteProposal = proposalId && proposalStatus ? { id: proposalId, status: proposalStatus } : undefined;
  const pendingRewards = proposalFormInputs.fields?.pendingRewards || [];

  function openVoteModal() {
    setIsVoteModalOpen(true);
  }

  useEffect(() => {
    setDetailsExpanded(proposalStatus === 'draft');
  }, [setDetailsExpanded, proposalStatus]);

  let lensProposalPropertyState: 'hide' | 'show_link' | 'show_toggle' = 'hide';
  if (proposalLensLink) {
    lensProposalPropertyState = 'show_link';
  } else {
    lensProposalPropertyState = lensProfile && account ? 'show_toggle' : 'hide';
  }

  return (
    <>
      {!isNewProposal && (
        <Stack
          direction='row'
          gap={1}
          alignItems='center'
          sx={{ cursor: 'pointer' }}
          onClick={() => setDetailsExpanded((v) => !v)}
        >
          <Typography fontWeight='bold'>Details</Typography>
          <IconButton size='small'>
            <KeyboardArrowDown
              fontSize='small'
              sx={{ transform: `rotate(${detailsExpanded ? 180 : 0}deg)`, transition: 'all 0.2s ease' }}
            />
          </IconButton>
        </Stack>
      )}
      <Collapse in={detailsExpanded} timeout='auto' unmountOnExit>
        {/* Select authors */}
        <Box justifyContent='space-between' gap={2} alignItems='center'>
          <div
            className='octo-propertyrow'
            style={{
              display: 'flex',
              height: 'fit-content',
              flexGrow: 1
            }}
          >
            <PropertyLabel readOnly required={isNewProposal} highlighted>
              Author
            </PropertyLabel>
            <Box display='flex' flex={1}>
              <UserSelect
                memberIds={proposalAuthorIds}
                readOnly={readOnlyAuthors}
                onChange={(authors) => {
                  setProposalFormInputs({
                    authors
                  });
                }}
                wrapColumn
                showEmptyPlaceholder
              />
            </Box>
          </div>
        </Box>

        {lensProposalPropertyState !== 'hide' && (
          <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
            <Box
              display='flex'
              height='fit-content'
              flex={1}
              className='octo-propertyrow'
              // override align-items flex-start with inline style
              style={{
                alignItems: 'center'
              }}
            >
              {lensProposalPropertyState === 'show_link' ? (
                <>
                  <PropertyLabel readOnly highlighted>
                    Lens Post
                  </PropertyLabel>
                  <Link
                    href={`https://${!isProdEnv ? 'testnet.' : ''}hey.xyz/posts/${proposalLensLink}`}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <Typography variant='body2' color='primary'>
                      View on lens
                    </Typography>
                  </Link>
                </>
              ) : (
                <>
                  <PropertyLabel readOnly highlighted>
                    Publish to Lens
                  </PropertyLabel>
                  {isPublishingToLens ? (
                    <LoadingIcon size={16} />
                  ) : (
                    <Switch
                      disabled={proposalStatus !== 'draft'}
                      checked={proposalFormInputs.publishToLens ?? false}
                      onChange={(e) => {
                        setProposalFormInputs({
                          publishToLens: e.target.checked
                        });
                      }}
                    />
                  )}
                  {proposalFormInputs.publishToLens && proposalStatus !== 'draft' && !isPublishingToLens && (
                    <Typography variant='body2' color='error'>
                      Failed publishing to Lens
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        )}
        <CustomPropertiesAdapter
          readOnly={readOnlyAuthors}
          readOnlyProperties={readOnlyCustomProperties}
          proposal={proposalFormInputs}
          onChange={(properties: ProposalFields['properties']) => {
            setProposalFormInputs({
              fields: { ...proposalFormInputs.fields, properties: properties ? { ...properties } : {} }
            });
          }}
        />
        <ProposalRewards
          pendingRewards={pendingRewards}
          reviewers={proposalReviewers}
          assignedSubmitters={proposalAuthorIds}
          rewardIds={rewardIds || []}
          readOnly={!isReviewer && !isAuthor}
          onSave={(pendingReward) => {
            const isExisting = pendingRewards.find((reward) => reward.draftId === pendingReward.draftId);
            if (!isExisting) {
              setProposalFormInputs({
                fields: {
                  ...proposalFormInputs.fields,
                  pendingRewards: [...(proposalFormInputs.fields?.pendingRewards || []), pendingReward]
                }
              });

              return;
            }

            setProposalFormInputs({
              fields: {
                ...proposalFormInputs.fields,
                pendingRewards: [...(proposalFormInputs.fields?.pendingRewards || [])].map((draft) => {
                  if (draft.draftId === pendingReward.draftId) {
                    return pendingReward;
                  }
                  return draft;
                })
              }
            });
          }}
          onDelete={(draftId: string) => {
            setProposalFormInputs({
              fields: {
                ...proposalFormInputs.fields,
                pendingRewards: [...(proposalFormInputs.fields?.pendingRewards || [])].filter(
                  (draft) => draft.draftId !== draftId
                )
              }
            });
          }}
        />
      </Collapse>
      <Divider
        sx={{
          my: 2
        }}
      />
      <CreateVoteModal
        proposalFlowFlags={proposalFlowFlags}
        proposal={voteProposal}
        pageId={pageId}
        snapshotProposalId={snapshotProposalId || null}
        open={isVoteModalOpen}
        onCreateVote={() => {
          setIsVoteModalOpen(false);
          updateProposalStatus?.('vote_active');
        }}
        onPublishToSnapshot={() => {
          setIsVoteModalOpen(false);
          updateProposalStatus?.('vote_active');
        }}
        onClose={() => {
          setIsVoteModalOpen?.(false);
        }}
      />
      <ModalWithButtons
        open={previousConfirmationPopup.isOpen && !!previousConfirmationMessage}
        buttonText='Continue'
        onClose={previousConfirmationPopup.close}
        onConfirm={() => updateProposalStatus?.(previousStatus)}
      >
        <Typography>{previousConfirmationMessage}</Typography>
      </ModalWithButtons>
      <ModalWithButtons
        open={nextConfirmationPopup.isOpen && !!nextConfirmationMessage}
        onClose={nextConfirmationPopup.close}
        buttonText='Continue'
        onConfirm={() => {
          if (nextStatus === 'vote_active') {
            openVoteModal?.();
          } else {
            updateProposalStatus?.(nextStatus);
          }
        }}
      >
        <Typography>{nextConfirmationMessage}</Typography>
      </ModalWithButtons>
    </>
  );
}

function templateTooltip(fieldName: string, isAdmin: boolean) {
  return isAdmin
    ? `Only admins can override ${fieldName} when using a template`
    : `Cannot change ${fieldName} when using template`;
}
