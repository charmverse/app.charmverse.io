import { ProposalSystemRole } from '@charmverse/core/prisma';
import { type BountyStatus } from '@charmverse/core/prisma-client';
import { Box, Collapse, Divider, Stack, Tooltip } from '@mui/material';
import clsx from 'clsx';
import { DateTime } from 'luxon';
import type { ChangeEvent } from 'react';
import { useCallback, useState } from 'react';

import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { PropertyLabel } from 'components/common/BoardEditor/components/properties/PropertyLabel';
import { StyledFocalboardTextInput } from 'components/common/BoardEditor/components/properties/TextInput';
import type { RoleOption } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserAndRoleSelect } from 'components/common/BoardEditor/components/properties/UserAndRoleSelect';
import { UserSelect } from 'components/common/BoardEditor/components/properties/UserSelect';
import Checkbox from 'components/common/BoardEditor/focalboard/src/widgets/checkbox';
import { DateTimePicker } from 'components/common/DateTimePicker';
import { CredentialSelect } from 'components/credentials/CredentialsSelect';
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
import type { RewardApplicationType } from 'lib/rewards/getApplicationType';
import { getApplicationType } from 'lib/rewards/getApplicationType';
import type { RewardTemplate } from 'lib/rewards/getRewardTemplates';
import { getRewardType } from 'lib/rewards/getRewardType';
import type { Reward, RewardReviewer, RewardTokenDetails, RewardType, RewardWithUsers } from 'lib/rewards/interfaces';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';
import { isTruthy } from 'lib/utils/types';

import type { UpdateableRewardFieldsWithType } from '../../hooks/useNewReward';
import type { BoardReward } from '../../hooks/useRewardsBoardAdapter';

import { RewardApplicationTypeSelect } from './components/RewardApplicationTypeSelect';
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
  forcedApplicationType?: RewardApplicationType;
  rewardStatus?: BountyStatus | null;
  isProposalTemplate?: boolean;
};
export function RewardPropertiesForm({
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
  forcedApplicationType,
  rewardStatus,
  isProposalTemplate
}: Props) {
  const [rewardApplicationType, setRewardApplicationTypeRaw] = useState<RewardApplicationType>(() =>
    getApplicationType(values, forcedApplicationType)
  );

  const { getFeatureTitle } = useSpaceFeatures();
  const isAdmin = useIsAdmin();
  const [isExpanded, setIsExpanded] = useState(!!expandedByDefault);
  const { rewardCredentialTemplates } = useGetCredentialTemplates();

  const allowedSubmittersValue: RoleOption[] = (values.allowedSubmitterRoles ?? []).map((id) => ({
    id,
    group: 'role'
  }));
  const isAssignedReward = rewardApplicationType === 'assigned';
  const { templates: rewardTemplates = [] } = useRewardTemplates();
  const template = rewardTemplates?.find((tpl) => tpl.page.id === templateId);
  const readOnlyReviewers = !isAdmin && (readOnly || !!template?.reward.reviewers?.length);
  const readOnlyDueDate = !isAdmin && (readOnly || !!template?.reward.dueDate);
  const readOnlyApplicationType =
    !!forcedApplicationType || (!isAdmin && (readOnly || !!template)) || !!isProposalTemplate;
  const readOnlyProperties = !isAdmin && (readOnly || !!template);
  const readOnlyNumberAvailable = !isAdmin && (readOnly || typeof template?.reward.maxSubmissions === 'number');
  const readOnlyApplicantRoles = !isAdmin && (readOnly || !!template?.reward.allowedSubmitterRoles?.length);
  const readOnlySelectedCredentials = !isAdmin && (readOnly || !!template?.reward.selectedCredentialTemplates?.length);

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
      rewardType
    });
  }

  const setRewardApplicationType = useCallback((updatedType: RewardApplicationType) => {
    if (updatedType === 'direct_submission') {
      applyUpdates({
        approveSubmitters: false,
        assignedSubmitters: null
      });
    }

    if (updatedType === 'application_required') {
      applyUpdates({
        approveSubmitters: true,
        assignedSubmitters: null
      });
    }

    setRewardApplicationTypeRaw(updatedType);
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

  const updateAssignedSubmitters = useCallback((submitters: string[]) => {
    applyUpdates({
      assignedSubmitters: submitters,
      approveSubmitters: false,
      allowMultipleApplications: false
    });
  }, []);

  const updateRewardMaxSubmissions = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const updatedValue = Number(e.target.value);

    applyUpdates({
      maxSubmissions: updatedValue <= 0 ? null : updatedValue
    });
  }, []);

  const updateRewardDueDate = useCallback((date: DateTime | null) => {
    applyUpdates({
      dueDate: date?.toJSDate() || undefined
    });
  }, []);

  const updateSelectedCredentialTemplates = useCallback((credentialTemplateIds: string[]) => {
    applyUpdates({
      selectedCredentialTemplates: credentialTemplateIds
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
                      options={rewardTemplates.map((rewardTemplate) => rewardTemplate.page)}
                      disabled={readOnlyTemplate || readOnly}
                      value={templateId ? { id: templateId } : null}
                      onChange={(templatePage) => {
                        if (!templatePage) {
                          selectTemplate(null);
                        }
                        const selected = rewardTemplates.find((_template) => _template.page.id === templatePage?.id);
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
            <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Application Type
              </PropertyLabel>
              <RewardApplicationTypeSelect
                readOnly={readOnlyApplicationType}
                value={rewardApplicationType}
                onChange={setRewardApplicationType}
              />
            </Box>

            {/* <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
              <PropertyLabel readOnly highlighted>
                Application required
              </PropertyLabel>

              <Checkbox
                isOn={Boolean(values?.approveSubmitters)}
                onChanged={(isOn) => {
                  applyUpdates({
                    approveSubmitters: !!isOn
                  });
                }}
                disabled={readOnly}
                readOnly={readOnly}
              />
            </Box> */}

            {!isAssignedReward && (
              <>
                <Tooltip placement='left' title='Allow the same user to participate in this reward more than once'>
                  <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                    <PropertyLabel readOnly highlighted>
                      Allow multiple entries
                    </PropertyLabel>

                    <Checkbox
                      isOn={Boolean(values?.allowMultipleApplications)}
                      onChanged={(isOn) => {
                        applyUpdates({
                          allowMultipleApplications: !!isOn
                        });
                      }}
                      disabled={readOnlyProperties}
                      readOnly={readOnlyProperties}
                    />
                  </Box>
                </Tooltip>

                <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                  <PropertyLabel readOnly highlighted>
                    Applicant Roles
                  </PropertyLabel>
                  <UserAndRoleSelect
                    type='role'
                    readOnly={readOnlyApplicantRoles}
                    value={allowedSubmittersValue}
                    onChange={async (options) => {
                      const roleIds = options.filter((option) => option.group === 'role').map((option) => option.id);

                      await applyUpdates({
                        allowedSubmitterRoles: roleIds
                      });
                    }}
                  />
                </Box>

                <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                  <PropertyLabel readOnly highlighted>
                    # Available
                  </PropertyLabel>
                  <StyledFocalboardTextInput
                    onChange={updateRewardMaxSubmissions}
                    required
                    defaultValue={values?.maxSubmissions}
                    type='number'
                    size='small'
                    inputProps={{
                      step: 1,
                      min: 1,
                      style: { height: 'auto' },
                      className: clsx('Editable octo-propertyvalue', { readonly: readOnly })
                    }}
                    sx={{
                      width: '100%'
                    }}
                    disabled={readOnlyNumberAvailable}
                    placeholder='Unlimited'
                  />
                </Box>
              </>
            )}

            {!!rewardCredentialTemplates?.length && (
              <Box display='flex' height='fit-content' flex={1} className='octo-propertyrow'>
                <PropertyLabel readOnly highlighted>
                  Credentials
                </PropertyLabel>
                <Box display='flex' flex={1}>
                  <CredentialSelect
                    templateType='reward'
                    onChange={updateSelectedCredentialTemplates}
                    readOnly={readOnlySelectedCredentials}
                    selectedCredentialTemplates={values.selectedCredentialTemplates}
                  />
                </Box>
              </Box>
            )}

            {/* Select authors */}
            {isAssignedReward && (
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
            )}

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

                <StyledFocalboardTextInput
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
