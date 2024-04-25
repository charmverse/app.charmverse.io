import { ProposalSystemRole } from '@charmverse/core/prisma';
import { type BountyStatus } from '@charmverse/core/prisma-client';
import { Box, Collapse, Divider, Stack } from '@mui/material';
import clsx from 'clsx';
import { useCallback, useState } from 'react';

import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { StyledPropertyTextInput } from 'components/common/DatabaseEditor/components/properties/TextInput';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/DatabaseEditor/components/properties/UserSelect';
import { TemplateSelect } from 'components/proposals/ProposalPage/components/TemplateSelect';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import {
  allReviewersSystemRole,
  authorSystemRole
} from 'components/settings/proposals/components/EvaluationPermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { RewardPropertiesField } from 'lib/rewards/blocks/interfaces';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { Reward, RewardReviewer, RewardTokenDetails, RewardType, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { isTruthy } from 'lib/utils/types';

import type { UpdateableRewardFieldsWithType } from '../../hooks/useNewReward';
import type { BoardReward } from '../../hooks/useRewardsBoardAdapter';

import { RewardPropertiesHeader } from './components/RewardPropertiesHeader';
import { RewardTokenProperty } from './components/RewardTokenProperty';
import { RewardTypeSelect } from './components/RewardTypeSelect';
import { CustomPropertiesAdapter } from './CustomPropertiesAdapter';

type Props = {
  onChange: (values: Partial<UpdateableRewardFieldsWithType>) => void;
  values: UpdateableRewardFieldsWithType;
  readOnly?: boolean;
  pageId?: string;
  isNewReward?: boolean;
  isTemplate?: boolean;
  expandedByDefault?: boolean;
  selectTemplate: (template: RewardTemplate | null) => void;
  templateId?: string;
  readOnlyTemplate?: boolean;
  rewardStatus?: BountyStatus | null;
  isProposalTemplate?: boolean;
};
export function MilestonePropertiesForm({
  onChange,
  values,
  readOnly,
  isNewReward = false,
  isTemplate,
  pageId,
  expandedByDefault,
  selectTemplate,
  templateId,
  readOnlyTemplate,
  rewardStatus,
  isProposalTemplate
}: Props) {
  const { getFeatureTitle } = useSpaceFeatures();
  const isAdmin = useIsAdmin();
  const [isExpanded, setIsExpanded] = useState(!!expandedByDefault);
  const { templates: rewardTemplates = [] } = useRewardTemplates();
  const nonDraftRewardTemplates = rewardTemplates.filter((tpl) => tpl.reward.status !== 'draft');
  const template = nonDraftRewardTemplates?.find((tpl) => tpl.page.id === templateId);
  const readOnlyProperties = !isAdmin && (readOnly || !!template);
  const readOnlyReviewers = !isAdmin && (readOnly || !!template?.reward.reviewers?.length);

  async function applyUpdates(updates: Partial<UpdateableRewardFields>) {
    if ('customReward' in updates) {
      const customReward = updates.customReward;
      if (isTruthy(customReward)) {
        updates.rewardAmount = null;
        updates.chainId = null;
        updates.rewardToken = null;
      }
    }

    onChange(updates);
  }

  function setRewardType(rewardType: RewardType) {
    if (rewardType === 'none' && rewardStatus !== 'paid') {
      applyUpdates({
        rewardAmount: null,
        chainId: null,
        rewardToken: null,
        customReward: null
      });
    }

    onChange({
      rewardType,
      customReward: rewardType === 'custom' ? values.customReward : undefined,
      rewardAmount: rewardType === 'token' ? values.rewardAmount : undefined,
      rewardToken: rewardType === 'token' ? values.rewardToken : undefined,
      chainId: rewardType === 'token' ? values.chainId : undefined
    });
  }

  async function onRewardTokenUpdate(rewardToken: RewardTokenDetails | null) {
    if (rewardToken) {
      await applyUpdates({
        chainId: rewardToken.chainId,
        rewardToken: rewardToken.rewardToken,
        rewardAmount: Number(rewardToken.rewardAmount),
        customReward: null
      });
    }
  }

  const updateRewardCustomReward = useCallback((e: any) => {
    applyUpdates({
      customReward: e.target.value
    });
  }, []);

  const updateAssignedSubmitters = useCallback((submitters: string[]) => {
    applyUpdates({
      assignedSubmitters: submitters,
      approveSubmitters: false,
      allowMultipleApplications: false
    });
  }, []);

  if (!values) {
    return null;
  }

  return (
    <Box
      className='CardDetail content'
      sx={{
        '.octo-propertyname .Button': {
          paddingLeft: '0 !important'
        },
        display: 'flex',
        flex: 1,
        mt: 0
      }}
      mt={2}
    >
      <Stack className='octo-propertylist' mt={2} flex={1}>
        <Divider />

        <RewardPropertiesHeader
          reward={values}
          pageId={pageId || ''}
          isExpanded={isExpanded}
          toggleExpanded={() => setIsExpanded((v) => !v)}
          readOnly={readOnly || !pageId}
        />

        <Collapse in={isExpanded} timeout='auto' unmountOnExit>
          <>
            {!isTemplate && isNewReward && (
              <Box justifyContent='space-between' gap={2} alignItems='center' mb='6px'>
                <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                  <PropertyLabel readOnly highlighted required>
                    Template
                  </PropertyLabel>
                  <Box display='flex' flex={1}>
                    <TemplateSelect
                      options={nonDraftRewardTemplates.map((rewardTemplate) => rewardTemplate.page)}
                      disabled={readOnlyTemplate || readOnly}
                      value={templateId}
                      onChange={(templatePage) => {
                        if (!templatePage) {
                          selectTemplate(null);
                        }
                        const selected = nonDraftRewardTemplates.find(
                          (_template) => _template.page.id === templatePage?.id
                        );
                        if (selected && selectTemplate) {
                          selectTemplate(selected);
                        }
                        setRewardType(getRewardType(selected?.reward || values, isNewReward, !!templatePage));
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            )}

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted required={isNewReward && !isTemplate}>
                Reviewers
              </PropertyLabel>
              {isProposalTemplate ? (
                <UserAndRoleSelect
                  readOnly
                  value={[{ group: 'system_role', id: ProposalSystemRole.all_reviewers }]}
                  systemRoles={[allReviewersSystemRole]}
                  onChange={() => {}}
                />
              ) : (
                <UserAndRoleSelect
                  readOnly={readOnlyReviewers}
                  value={values.reviewers ?? []}
                  onChange={async (options) => {
                    const reviewerOptions = options.filter(
                      (option) => option.group === 'role' || option.group === 'user'
                    ) as RewardReviewer[];
                    await applyUpdates({
                      reviewers: reviewerOptions.map((option) => ({ group: option.group, id: option.id }))
                    });
                  }}
                />
              )}
            </Box>

            {/* Select authors */}
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly required={!isTemplate && !readOnly} highlighted>
                Assigned applicants
              </PropertyLabel>
              <Box display='flex' flex={1}>
                {isProposalTemplate ? (
                  <UserAndRoleSelect
                    readOnly
                    wrapColumn
                    value={[{ group: 'system_role', id: ProposalSystemRole.author }]}
                    systemRoles={[authorSystemRole]}
                    onChange={() => {}}
                  />
                ) : (
                  <UserSelect
                    memberIds={values.assignedSubmitters ?? []}
                    readOnly={readOnly}
                    onChange={updateAssignedSubmitters}
                    wrapColumn
                    showEmptyPlaceholder
                    error={
                      !isNewReward && !values.assignedSubmitters?.length && !readOnly
                        ? 'Requires at least one assignee'
                        : undefined
                    }
                  />
                )}
              </Box>
            </Box>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Type
              </PropertyLabel>
              <RewardTypeSelect readOnly={readOnlyProperties} value={values.rewardType} onChange={setRewardType} />
            </Box>

            {values.rewardType === 'token' && (
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted required={isNewReward && !isTemplate}>
                  Token
                </PropertyLabel>
                <RewardTokenProperty
                  onChange={onRewardTokenUpdate}
                  currentReward={values as (RewardCreationData & RewardWithUsers) | null}
                  readOnly={readOnlyProperties}
                />
              </Box>
            )}

            {values.rewardType === 'custom' && (
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted required={isNewReward && !isTemplate}>
                  Custom {getFeatureTitle('Reward')}
                </PropertyLabel>

                <StyledPropertyTextInput
                  onChange={updateRewardCustomReward}
                  value={values?.customReward ?? ''}
                  required
                  size='small'
                  inputProps={{
                    style: { height: 'auto' },
                    className: clsx('Editable octo-propertyvalue', { readonly: readOnly })
                  }}
                  sx={{
                    width: '100%'
                  }}
                  disabled={readOnlyProperties}
                  placeholder='T-shirt'
                  autoFocus
                  rows={1}
                  type='text'
                />
              </Box>
            )}

            <CustomPropertiesAdapter
              readOnly={readOnly}
              reward={values as unknown as BoardReward}
              onChange={(properties: RewardPropertiesField) => {
                applyUpdates({
                  fields: { properties: properties ? { ...properties } : {} } as Reward['fields']
                });
              }}
            />
          </>
        </Collapse>
      </Stack>
    </Box>
  );
}
