import type { PageType, ProposalStatus } from '@charmverse/core/prisma';
import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, Collapse, Divider, IconButton, Stack, Typography } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import type { ProposalFields } from '@packages/lib/proposals/interfaces';
import { useEffect, useState } from 'react';

import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { UserSelect } from 'components/common/DatabaseEditor/components/properties/UserSelect';
import { CustomPropertiesAdapter } from 'components/proposals/ProposalPage/components/ProposalProperties/components/CustomPropertiesAdapter';
import { ProposalRewards } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/ProposalRewards';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

import type { ProposalEvaluationValues } from '../ProposalEvaluations/components/Settings/components/EvaluationStepSettings';

export type ProposalPropertiesInput = {
  createdAt: string; // this is necessary for Created Time custom property
  content?: PageContent | null;
  contentText?: string; // required to know if we can overwrite content when selecting a template
  authors: string[];
  workflowId?: string | null;
  proposalTemplateId?: string | null;
  evaluations: ProposalEvaluationValues[];
  fields: ProposalFields | null;
  type: PageType;
  selectedCredentialTemplates?: string[];
  archived?: boolean;
  sourcePageId?: string;
  sourcePostId?: string;
  makeRewardsPublic?: boolean | null;
};

type ProposalPropertiesProps = {
  pageId?: string;
  proposalFormInputs: ProposalPropertiesInput;
  proposalStatus?: ProposalStatus;
  readOnlyAuthors?: boolean;
  readOnlyRewards?: boolean;
  setProposalFormInputs: (values: Partial<ProposalPropertiesInput>) => Promise<void> | void;
  readOnlyCustomProperties?: string[];
  rewardIds?: string[] | null;
  proposalId?: string;
  isStructuredProposal: boolean;
  isProposalTemplate: boolean;
};

export function ProposalPropertiesBase({
  proposalFormInputs,
  pageId,
  proposalStatus,
  readOnlyAuthors,
  setProposalFormInputs,
  readOnlyCustomProperties,
  readOnlyRewards,
  rewardIds,
  proposalId,
  isStructuredProposal,
  isProposalTemplate
}: ProposalPropertiesProps) {
  const { mappedFeatures } = useSpaceFeatures();
  const [detailsExpanded, setDetailsExpanded] = useState(proposalStatus === 'draft');

  const proposalAuthorIds = proposalFormInputs.authors;
  const proposalReviewers = proposalFormInputs.evaluations.map((e) => e.reviewers.filter((r) => !r.systemRole)).flat();
  const isNewProposal = !pageId;
  const pendingRewards = proposalFormInputs.fields?.pendingRewards || [];
  useEffect(() => {
    setDetailsExpanded(proposalStatus === 'draft');
  }, [setDetailsExpanded, proposalStatus]);

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
            <PropertyLabel
              readOnly
              required={isNewProposal && proposalFormInputs.type !== 'proposal_template'}
              highlighted
            >
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

        <CustomPropertiesAdapter
          readOnly={readOnlyAuthors}
          readOnlyProperties={readOnlyCustomProperties}
          proposalForm={proposalFormInputs}
          proposalId={proposalId}
          onChange={(properties: ProposalFields['properties']) => {
            setProposalFormInputs({
              fields: { ...proposalFormInputs.fields, properties: properties ? { ...properties } : {} }
            });
          }}
        />
        {!isStructuredProposal && (
          <Stack flexDirection='row' alignItems='center' height='fit-content' flex={1} className='octo-propertyrow'>
            {(rewardIds && rewardIds.length > 0) ||
              (pendingRewards.length > 0 && (
                <PropertyLabel readOnly highlighted>
                  {mappedFeatures.rewards.title}
                </PropertyLabel>
              ))}
            <ProposalRewards
              pendingRewards={pendingRewards}
              requiredTemplateId={proposalFormInputs.fields?.rewardsTemplateId}
              reviewers={proposalReviewers}
              assignedSubmitters={proposalAuthorIds}
              rewardIds={rewardIds || []}
              readOnly={readOnlyRewards}
              isProposalTemplate={isProposalTemplate}
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
          </Stack>
        )}
      </Collapse>
      <Divider
        sx={{
          my: 2
        }}
      />
    </>
  );
}
