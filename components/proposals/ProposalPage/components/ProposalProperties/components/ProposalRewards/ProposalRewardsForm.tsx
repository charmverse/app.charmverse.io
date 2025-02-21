import { ProposalSystemRole } from '@charmverse/core/prisma';
import { type BountyStatus } from '@charmverse/core/prisma-client';
import { Box, Collapse, Divider, Stack } from '@mui/material';
import { isTruthy } from '@packages/lib/utils/types';
import clsx from 'clsx';
import { DateTime } from 'luxon';
import { useCallback, useState } from 'react';

import { useGetRewardTemplate } from 'charmClient/hooks/rewards';
import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { StyledPropertyTextInput } from 'components/common/DatabaseEditor/components/properties/TextInput';
import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/DatabaseEditor/components/properties/UserSelect';
import { DateTimePicker } from 'components/common/DateTimePicker';
import { RewardTokenProperty } from 'components/proposals/ProposalPage/components/ProposalProperties/components/ProposalRewards/RewardTokenProperty';
import { RewardTypeSelect } from 'components/rewards/components/RewardEvaluations/components/Settings/components/PaymentStepSettings/components/RewardTypeSelect';
import { RewardPropertiesHeader } from 'components/rewards/components/RewardProperties/components/RewardPropertiesHeader';
import { CustomPropertiesAdapter } from 'components/rewards/components/RewardProperties/CustomPropertiesAdapter';
import { TemplateSelect } from 'components/rewards/components/TemplateSelect';
import type { UpdateableRewardFieldsWithType } from 'components/rewards/hooks/useNewReward';
import type { BoardReward } from 'components/rewards/hooks/useRewardsBoardAdapter';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { allReviewersSystemRole } from 'components/settings/proposals/components/EvaluationPermissions';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { RewardPropertiesField } from 'lib/rewards/blocks/interfaces';
import type { RewardCreationData } from 'lib/rewards/createReward';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplate';
import type { Reward, RewardTokenDetails, RewardType, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

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
};
export function ProposalRewardsForm({
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
  rewardStatus
}: Props) {
  const isAdmin = useIsAdmin();
  const { getFeatureTitle } = useSpaceFeatures();
  const [isExpanded, setIsExpanded] = useState(!!expandedByDefault);
  const { data: template } = useGetRewardTemplate(templateId);
  const readOnlyType = !isAdmin && (readOnly || !!template?.rewardType);
  const readOnlyDueDate = !isAdmin && (readOnly || !!template?.dueDate);
  const readOnlyToken = !isAdmin && (readOnly || !!template?.rewardToken);
  const readOnlyTokenAmount = !isAdmin && (readOnly || !!template?.rewardAmount);
  const readOnlyCustomReward = !isAdmin && (readOnly || !!template?.customReward);

  const { templates: nonDraftRewardTemplates = [] } = useRewardTemplates();

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

  const updateAssignedSubmitters = useCallback((submitters: string[]) => {
    applyUpdates({
      assignedSubmitters: submitters,
      approveSubmitters: false,
      allowMultipleApplications: false
    });
  }, []);

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

  const updateRewardDueDate = useCallback((date: DateTime | null) => {
    applyUpdates({
      dueDate: date?.toJSDate() || undefined
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
                  <PropertyLabel readOnly highlighted>
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
              <UserAndRoleSelect
                readOnly
                value={[{ group: 'system_role', id: ProposalSystemRole.all_reviewers }]}
                systemRoles={[allReviewersSystemRole]}
                onChange={() => {}}
              />
            </Box>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Due date
              </PropertyLabel>

              <DateTimePicker
                variant='card_property'
                minDate={DateTime.fromMillis(Date.now())}
                value={values?.dueDate ? DateTime.fromISO(values.dueDate.toString()) : null}
                disabled={readOnlyDueDate}
                disablePast
                onAccept={async (value) => {
                  updateRewardDueDate(value);
                }}
                onChange={(value) => {
                  updateRewardDueDate(value);
                }}
              />
            </Box>

            {/* Select authors */}
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly required={!isTemplate && !readOnly} highlighted>
                Assigned applicants
              </PropertyLabel>
              <Box display='flex' flex={1}>
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
              </Box>
            </Box>

            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Type
              </PropertyLabel>
              <RewardTypeSelect readOnly={readOnlyType} value={values.rewardType} onChange={setRewardType} />
            </Box>

            {values.rewardType === 'token' && (
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted required={isNewReward && !isTemplate}>
                  Token
                </PropertyLabel>
                <RewardTokenProperty
                  readOnlyTokenAmount={readOnlyTokenAmount}
                  readOnlyToken={readOnlyToken}
                  requireTokenAmount
                  onChange={onRewardTokenUpdate}
                  currentReward={values as (RewardCreationData & RewardWithUsers) | null}
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
                    className: clsx('Editable octo-propertyvalue', { readonly: readOnlyCustomReward })
                  }}
                  sx={{
                    width: '100%'
                  }}
                  disabled={readOnlyCustomReward}
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
