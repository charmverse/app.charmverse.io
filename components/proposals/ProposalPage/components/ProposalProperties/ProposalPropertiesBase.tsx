import type { PageType, ProposalEvaluationType, ProposalStatus } from '@charmverse/core/prisma';
import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, Collapse, Divider, IconButton, Stack, Switch, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import Link from 'components/common/Link';
import { LoadingIcon } from 'components/common/LoadingComponent';
import { ProposalRewards } from 'components/proposals/components/ProposalRewards/ProposalRewards';
import { CustomPropertiesAdapter } from 'components/proposals/ProposalPage/components/ProposalProperties/CustomPropertiesAdapter';
import { useLensProfile } from 'components/settings/account/hooks/useLensProfile';
import { isProdEnv } from 'config/constants';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { ProposalFields, ProposalReviewerInput } from 'lib/proposal/interface';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ProposalEvaluationValues } from '../EvaluationSettingsSidebar/components/EvaluationStepSettings';

export type ProposalPropertiesInput = {
  content?: PageContent | null;
  contentText?: string; // required to know if we can overwrite content when selecting a template
  authors: string[];
  reviewers: ProposalReviewerInput[];
  workflowId?: string | null;
  proposalTemplateId?: string | null;
  evaluations: ProposalEvaluationValues[];
  publishToLens?: boolean;
  fields: ProposalFields | null;
  type: PageType;
  archived?: boolean;
};

type ProposalPropertiesProps = {
  isPublishingToLens?: boolean;
  proposalLensLink?: string;
  pageId?: string;
  proposalFormInputs: ProposalPropertiesInput;
  proposalStatus?: ProposalStatus;
  readOnlyAuthors?: boolean;
  setProposalFormInputs: (values: Partial<ProposalPropertiesInput>) => Promise<void> | void;
  readOnlyCustomProperties?: string[];
  isReviewer?: boolean;
  rewardIds?: string[] | null;
  proposalId?: string;
};

export function ProposalPropertiesBase({
  proposalLensLink,
  proposalFormInputs,
  pageId,
  proposalStatus,
  readOnlyAuthors,
  setProposalFormInputs,
  isPublishingToLens,
  readOnlyCustomProperties,
  isReviewer,
  rewardIds,
  proposalId
}: ProposalPropertiesProps) {
  const { user } = useUser();
  const [detailsExpanded, setDetailsExpanded] = useState(proposalStatus === 'draft');
  const { lensProfile } = useLensProfile();
  const { account } = useWeb3Account();

  const isAuthor = proposalFormInputs.authors.includes(user?.id ?? '');
  const proposalAuthorIds = proposalFormInputs.authors;
  const proposalReviewers = proposalFormInputs.reviewers;
  const isNewProposal = !pageId;
  const pendingRewards = proposalFormInputs.fields?.pendingRewards || [];
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
          proposalId={proposalId}
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
          readOnly={(!isReviewer && !isAuthor) || !!proposalFormInputs?.archived}
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
    </>
  );
}

function templateTooltip(fieldName: string, isAdmin: boolean) {
  return isAdmin
    ? `Only admins can override ${fieldName} when using a template`
    : `Cannot change ${fieldName} when using template`;
}
