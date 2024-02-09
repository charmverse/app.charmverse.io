import type { PageType, ProposalStatus } from '@charmverse/core/prisma';
import { KeyboardArrowDown } from '@mui/icons-material';
import { Box, Collapse, Divider, IconButton, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import { CredentialSelect } from 'components/credentials/CredentialsSelect';
import { CustomPropertiesAdapter } from 'components/proposals/ProposalPage/components/ProposalProperties/components/CustomPropertiesAdapter';
import { ProposalRewards } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/ProposalRewards';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { ProposalFields } from 'lib/proposal/interface';
import type { PageContent } from 'lib/prosemirror/interfaces';

import type { ProposalEvaluationValues } from '../ProposalEvaluations/components/Settings/components/EvaluationStepSettings';

export type ProposalPropertiesInput = {
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
};

type ProposalPropertiesProps = {
  pageId?: string;
  proposalFormInputs: ProposalPropertiesInput;
  proposalStatus?: ProposalStatus;
  readOnlyAuthors?: boolean;
  readOnlyRewards?: boolean;
  setProposalFormInputs: (values: Partial<ProposalPropertiesInput>) => Promise<void> | void;
  readOnlyCustomProperties?: string[];
  readOnlySelectedCredentialTemplates?: boolean;
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
  readOnlySelectedCredentialTemplates,
  readOnlyRewards,
  rewardIds,
  proposalId,
  isStructuredProposal,
  isProposalTemplate
}: ProposalPropertiesProps) {
  const { mappedFeatures } = useSpaceFeatures();
  const [detailsExpanded, setDetailsExpanded] = useState(proposalStatus === 'draft');
  const { space } = useCurrentSpace();

  const { data: credentialTemplates } = useGetCredentialTemplates({ spaceId: space?.id });

  const showCredentialSelect = !!credentialTemplates?.length;

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
              {showCredentialSelect && (
                <CredentialSelect
                  readOnly={readOnlySelectedCredentialTemplates}
                  selectedCredentialTemplates={proposalFormInputs.selectedCredentialTemplates}
                  onChange={(selectedCredentialTemplates) =>
                    setProposalFormInputs({
                      selectedCredentialTemplates
                    })
                  }
                />
              )}
            </Box>
          </div>
        </Box>

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
